import { Text } from "components/Typography/Text/Text"
import { Trans, useTranslation } from "react-i18next"
import { FarmingPosition } from "./position/FarmingPosition"
import { Icon } from "components/Icon/Icon"
import FPIcon from "assets/icons/PoolsAndFarms.svg?react"
import { ClaimRewardsCard } from "./components/claimableCard/ClaimRewardsCard"
import { Button } from "components/Button/Button"
import ExitIcon from "assets/icons/Exit.svg?react"
import { useFarmExitAllMutation } from "utils/farms/exit"
import { TOAST_MESSAGES } from "state/toasts"
import { ToastMessage } from "state/store"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { SPoolDetailsContainer } from "sections/pools/pool/details/PoolDetails.styled"
import { ReactElement, useMemo } from "react"
import { BN_0 } from "utils/constants"
import { useAllFarmDeposits } from "./position/FarmingPosition.utils"
import { Separator } from "components/Separator/Separator"
import { useFarms } from "api/farms"
import BN from "bignumber.js"
import { CollapsedPositionsList } from "sections/pools/pool/myPositions/MyPositions"
import { LrnaPositionTooltip } from "sections/pools/components/LrnaPositionTooltip"
import { usePoolData } from "sections/pools/pool/Pool"

export const FarmingPositionWrapper = () => {
  const { t } = useTranslation()
  const { account } = useAccount()
  const { pool, isXYK } = usePoolData()

  const farms = useFarms([pool.id])

  const { omnipool, xyk } = useAllFarmDeposits()

  const [omnipoolDeposits = [], xykDeposits = []] = useMemo(
    () => [omnipool[pool.id], xyk[pool.id]],
    [omnipool, pool.id, xyk],
  )

  const toast = TOAST_MESSAGES.reduce((memo, type) => {
    const msType = type === "onError" ? "onLoading" : type
    memo[type] = (
      <Trans t={t} i18nKey={`farms.exitAll.toast.${msType}`}>
        <span />
      </Trans>
    )
    return memo
  }, {} as ToastMessage)

  const positions = pool.miningPositions
  const exit = useFarmExitAllMutation(positions, pool.id, toast)

  const positionsNumber = positions.length

  const total = useMemo(
    () =>
      omnipoolDeposits.reduce(
        (acc, position) => {
          const newValues = {
            value: acc.value.plus(position.valueShifted),
            hub: acc.hub.plus(position.lrnaShifted),
            totalValue: acc.totalValue.plus(position.totalValueShifted),
            display: acc.display.plus(position.valueDisplay),
          }
          return newValues
        },
        { value: BN_0, totalValue: BN_0, hub: BN_0, display: BN_0 },
      ),
    [omnipoolDeposits],
  )

  const totalFarms = useMemo(
    () =>
      xykDeposits.reduce(
        (acc, position) => {
          const newValues = {
            valueA: acc.valueA.plus(position.assetA?.amount ?? 0),
            valueB: acc.valueB.plus(position.assetB?.amount ?? 0),
            display: acc.display.plus(position.amountUSD ?? 0),
            symbolA: position.assetA?.symbol ?? "",
            symbolB: position.assetB?.symbol ?? "",
          }
          return newValues
        },
        {
          valueA: BN_0,
          valueB: BN_0,
          display: BN_0,
          symbolA: "",
          symbolB: "",
        },
      ),

    [xykDeposits],
  )

  if (!positionsNumber) return null

  const withAnimation = positionsNumber > 1
  const isHubValue = total.hub.gt(0)

  const positionsData = positions.reduce<{
    positions: { element: ReactElement; moveTo: number; height: number }[]
    height: BN
  }>(
    (acc, position, i, array) => {
      const isLastElement = array.length === i + 1
      const availableYieldFarms =
        farms.data?.filter(
          (i) =>
            !position.data.yieldFarmEntries.some(
              (entry) =>
                entry.globalFarmId.eq(i.globalFarm.id) &&
                entry.yieldFarmId.eq(i.yieldFarm.id),
            ),
        ) ?? []

      const isXYK = position.isXyk
      const cardHeight = availableYieldFarms.length
        ? isXYK
          ? 346
          : 392
        : isXYK
          ? 270
          : 312

      const depositData = isXYK
        ? xykDeposits.find((xykDeposit) => xykDeposit.depositId === position.id)
        : omnipoolDeposits.find(
            (omnipoolDeposit) => omnipoolDeposit.depositId === position.id,
          )

      if (depositData) {
        acc.positions.push({
          element: (
            <FarmingPosition
              key={i}
              index={i + 1}
              depositNft={position}
              depositData={depositData}
              availableYieldFarms={availableYieldFarms}
            />
          ),
          moveTo: !acc.height.isZero()
            ? acc.height.minus(20 * i).toNumber()
            : acc.height.toNumber(),
          height: cardHeight,
        })

        acc.height = acc.height.plus(cardHeight + (isLastElement ? 0 : 16))
      }

      return acc
    },
    { positions: [], height: BN_0 },
  )

  return (
    <SPoolDetailsContainer
      css={{ background: "transparent" }}
      sx={{ pb: [0, 0] }}
    >
      <div sx={{ flex: "row", justify: "space-between" }}>
        <div sx={{ flex: "row", align: "center", gap: 8 }}>
          <Icon size={14} sx={{ color: "brightBlue300" }} icon={<FPIcon />} />
          <Text color="brightBlue300">{t("farms.positions.header.title")}</Text>
        </div>
        {withAnimation ? (
          <Button
            variant="error"
            size="compact"
            onClick={() => exit.mutate()}
            disabled={account?.isExternalWalletConnected}
          >
            <Icon size={12} icon={<ExitIcon />} />
            {t("liquidity.pool.farms.exitAll.btn")}
          </Button>
        ) : null}
      </div>

      <div
        sx={{ flex: "row", justify: "space-between", align: "center", py: 12 }}
      >
        <div sx={{ flex: "column", gap: 2 }}>
          <Text color="basic400" fs={[12, 13]} sx={{ mb: 2 }}>
            {t("liquidity.pool.positions.farming")}
          </Text>
          {isXYK ? (
            <Text fs={14}>
              {t("value.tokenWithSymbol", {
                value: totalFarms.valueA,
                symbol: totalFarms.symbolA,
              })}{" "}
              |{" "}
              {t("value.tokenWithSymbol", {
                value: totalFarms.valueB,
                symbol: totalFarms.symbolB,
              })}
            </Text>
          ) : (
            <div sx={{ flex: "row", align: "center", gap: 4 }}>
              <Text color="white" fs={[14, 16]}>
                {t("value.tokenWithSymbol", {
                  value: total.totalValue,
                  symbol: pool.symbol,
                })}
              </Text>
              {isHubValue && (
                <LrnaPositionTooltip
                  assetId={pool.id}
                  tokenPosition={total.value}
                  lrnaPosition={total.hub}
                />
              )}
            </div>
          )}
          <Text color="basic500" fs={12}>
            {t("value.usd", {
              amount: isXYK ? totalFarms.display : total.display,
            })}
          </Text>
        </div>

        <Separator
          orientation="vertical"
          color="white"
          opacity={0.06}
          sx={{ height: 45 }}
        />

        <div sx={{ flex: "column", gap: 2 }}>
          <Text color="basic400" fs={[12, 13]} sx={{ mb: 2 }}>
            {t("liquidity.pool.positions.farm.number")}
          </Text>
          <Text color="white" fs={[14, 16]}>
            {positionsNumber}
          </Text>
        </div>
      </div>

      <ClaimRewardsCard />

      <CollapsedPositionsList positions={positionsData.positions} />
    </SPoolDetailsContainer>
  )
}
