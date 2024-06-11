import { useTokenBalance } from "api/balances"
import { SSeparator } from "components/Separator/Separator.styled"
import { Text } from "components/Typography/Text/Text"
import { useRpcProvider } from "providers/rpcProvider"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
  TPoolFullData,
  TXYKPoolFullData,
  useRefetchPositions,
} from "sections/pools/PoolsPage.utils"
import { FarmingPositionWrapper } from "sections/pools/farms/FarmingPositionWrapper"
import { useAllOmnipoolDeposits } from "sections/pools/farms/position/FarmingPosition.utils"
import { LiquidityPositionWrapper } from "sections/pools/pool/positions/LiquidityPositionWrapper"
import { XYKPosition } from "sections/pools/pool/xykPosition/XYKPosition"
import { StablepoolPosition } from "sections/pools/stablepool/positions/StablepoolPosition"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { BN_0 } from "utils/constants"

export const MyPositions = ({ pool }: { pool: TPoolFullData }) => {
  const { assets } = useRpcProvider()
  const { account } = useAccount()
  const { t } = useTranslation()
  const refetch = useRefetchPositions()

  const meta = assets.getAsset(pool.id)

  const miningPositions = useAllOmnipoolDeposits()

  const stablepoolBalance = useTokenBalance(
    pool.isStablePool ? pool.id : undefined,
    account?.address,
  )

  const spotPrice = pool.spotPrice
  const stablepoolAmount = stablepoolBalance.data?.freeBalance ?? BN_0
  const stablepoolAmountPrice = spotPrice
    ? stablepoolAmount.multipliedBy(spotPrice).shiftedBy(-meta.decimals)
    : BN_0

  const totalOmnipool = useMemo(() => {
    if (pool.omnipoolNftPositions) {
      return pool.omnipoolNftPositions.reduce(
        (acc, position) => acc.plus(position.valueDisplay),
        BN_0,
      )
    }
    return BN_0
  }, [pool.omnipoolNftPositions])

  const totalFarms = useMemo(() => {
    if (!miningPositions.data[pool.id]) return BN_0
    return miningPositions.data[pool.id].reduce((memo, share) => {
      return memo.plus(share.valueDisplay)
    }, BN_0)
  }, [miningPositions.data, pool.id])

  if (
    !pool.miningNftPositions.length &&
    !pool.omnipoolNftPositions.length &&
    !stablepoolBalance.data?.freeBalance
  )
    return null

  const totalStableAndOmni = totalOmnipool.plus(stablepoolAmountPrice)

  return (
    <div sx={{ flex: "column", gap: 12, p: ["30px 12px", 30], bg: "gray" }}>
      <Text fs={15} font="GeistMonoSemiBold">
        {t("liquidity.pool.positions.title")}
      </Text>

      <div
        sx={{
          flex: "row",
          gap: [24, 104],
          py: 16,
          justify: ["space-between", "initial"],
        }}
      >
        <div sx={{ flex: "column", gap: 6 }}>
          <Text color="basic400" fs={[12, 13]}>
            {t("liquidity.pool.positions.omnipool")}
          </Text>
          <Text color="white" fs={[14, 16]} fw={600}>
            {t("value.usd", { amount: totalStableAndOmni })}
          </Text>
        </div>
        {!totalFarms.isZero() && (
          <>
            <SSeparator color="white" opacity={0.06} orientation="vertical" />
            <div sx={{ flex: "column", gap: 6 }}>
              <Text color="basic400" fs={[12, 13]}>
                {t("liquidity.pool.positions.farming")}
              </Text>
              <Text color="white" fs={[14, 16]} fw={600}>
                {t("value.usd", { amount: totalFarms })}
              </Text>
            </div>
          </>
        )}
      </div>

      <SSeparator color="darkBlue401" />

      {pool.isStablePool && (
        <StablepoolPosition
          pool={pool}
          amount={stablepoolAmount}
          amountPrice={stablepoolAmountPrice}
          refetchPositions={refetch}
        />
      )}

      <LiquidityPositionWrapper
        pool={pool}
        positions={pool.omnipoolNftPositions}
        refetchPositions={refetch}
      />
      <FarmingPositionWrapper pool={pool} positions={pool.miningNftPositions} />
    </div>
  )
}

export const MyXYKPositions = ({ pool }: { pool: TXYKPoolFullData }) => {
  const { t } = useTranslation()

  const totalFarms = useMemo(() => {
    return pool.miningPositions.reduce((memo, share) => {
      return memo.plus(share.amountUSD ?? 0)
    }, BN_0)
  }, [pool.miningPositions])

  return (
    <div sx={{ flex: "column", gap: 12, p: ["30px 12px", 30], bg: "gray" }}>
      <Text fs={15} font="GeistMono">
        {t("liquidity.pool.positions.title")}
      </Text>
      {!totalFarms.isZero() && (
        <>
          <SSeparator color="white" opacity={0.06} orientation="vertical" />
          <div sx={{ flex: "column", gap: 6 }}>
            <Text color="basic400" fs={[12, 13]}>
              {t("liquidity.pool.positions.farming")}
            </Text>
            <Text color="white" fs={[14, 16]} fw={600}>
              {t("value.usd", { amount: totalFarms })}
            </Text>
          </div>
          <SSeparator color="darkBlue401" sx={{ my: 16 }} />
        </>
      )}
      <XYKPosition pool={pool} />
      <FarmingPositionWrapper pool={pool} positions={pool.miningNftPositions} />
    </div>
  )
}
