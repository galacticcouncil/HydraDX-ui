import { Icon } from "components/Icon/Icon"
import { Text } from "components/Typography/Text/Text"
import { useTranslation } from "react-i18next"
import LiquidityIcon from "assets/icons/WaterRippleIcon.svg?react"
import { MultipleIcons } from "components/MultipleIcons/MultipleIcons"
import { TXYKPool } from "sections/pools/PoolsPage.utils"
import { AssetLogo } from "components/AssetIcon/AssetIcon"
import { useRpcProvider } from "providers/rpcProvider"
import { TAsset } from "api/assetDetails"
import { DollarAssetValue } from "components/DollarAssetValue/DollarAssetValue"
import { DisplayValue } from "components/DisplayValue/DisplayValue"
import { Separator } from "components/Separator/Separator"
import { useMemo } from "react"
import { useTokenBalance, useTokensBalances } from "api/balances"
import { useDisplayPrices } from "utils/displayAsset"
import { LiquidityPositionRemoveLiquidity } from "sections/pools/pool/positions/LiquidityPosition"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { useMedia } from "react-use"
import { theme } from "theme"
import { JoinFarmsButton } from "sections/pools/farms/modals/join/JoinFarmsButton"
import { useQueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "utils/queryKeys"
import { useShareTokensByIds } from "api/xyk"
import { SPoolDetailsContainer } from "sections/pools/pool/details/PoolDetails.styled"
import { SPositionContainer } from "sections/pools/pool/myPositions/MyPositions.styled"

export const XYKPosition = ({ pool }: { pool: TXYKPool }) => {
  const { t } = useTranslation()
  const { account } = useAccount()
  const { assets } = useRpcProvider()
  const isDesktop = useMedia(theme.viewport.gte.sm)
  const queryClient = useQueryClient()
  const [shareToken] = useShareTokensByIds([pool.id]).data ?? []

  const shareTokensBalance = useTokenBalance(pool.id, account?.address)

  const assetsMeta = shareToken.assets

  const [assetMetaA, assetMetaB] = assetsMeta

  const [{ data: assetAReserve }, { data: assetBReserve }] = useTokensBalances(
    [assetMetaA.id, assetMetaB.id],
    pool.poolAddress,
  )
  const spotPrices = useDisplayPrices(assetsMeta.map((asset) => asset.id))

  const myBalance = useMemo(() => {
    if (
      pool.shareTokenIssuance?.myPoolShare &&
      pool.tvlDisplay &&
      assetAReserve &&
      assetBReserve &&
      spotPrices.data
    ) {
      const myBalanceA = pool.shareTokenIssuance.myPoolShare
        .times(assetAReserve.freeBalance)
        .div(100)
        .shiftedBy(-assetMetaA.decimals)

      const myBalanceB = pool.shareTokenIssuance.myPoolShare
        .times(assetBReserve.freeBalance)
        .div(100)
        .shiftedBy(-assetMetaB.decimals)

      const totalDisplay = pool.tvlDisplay
        .div(100)
        .times(pool.shareTokenIssuance?.myPoolShare ?? 1)

      return { myBalanceA, myBalanceB, totalDisplay }
    }
    return undefined
  }, [
    assetAReserve,
    assetBReserve,
    assetMetaA.decimals,
    assetMetaB.decimals,
    pool.shareTokenIssuance?.myPoolShare,
    pool.tvlDisplay,
    spotPrices.data,
  ])

  if (!pool.shareTokenIssuance || pool.shareTokenIssuance.myPoolShare?.isZero())
    return null

  const onSuccess = () => {
    queryClient.refetchQueries(
      QUERY_KEYS.tokenBalance(pool.id, account?.address),
    )
    queryClient.refetchQueries(QUERY_KEYS.accountNFTPositions(account?.address))
  }

  return (
    <SPoolDetailsContainer
      sx={{ height: ["auto", "auto"] }}
      css={{ background: "transparent" }}
    >
      <div sx={{ flex: "row", align: "center", gap: 8 }}>
        <Icon size={15} sx={{ color: "pink600" }} icon={<LiquidityIcon />} />
        <Text fs={[16, 16]} color="pink600" font="GeistMonoSemiBold">
          {t("liquidity.xyk.asset.positions.title")}
        </Text>
      </div>
      <SPositionContainer>
        <div sx={{ flex: "column", gap: 16 }} css={{ flex: 1 }}>
          <div sx={{ flex: "row", justify: "space-between" }}>
            <div sx={{ flex: "row", gap: 7, align: "center" }}>
              <MultipleIcons
                icons={assetsMeta.map((asset: TAsset) => {
                  const isBond = assets.isBond(asset)
                  const id = isBond ? asset.assetId : asset.id

                  return {
                    icon: <AssetLogo key={id} id={id} />,
                  }
                })}
              />

              <Text fs={[14, 18]} color={["white", "basic100"]}>
                {t("liquidity.xyk.asset.position.title", {
                  symbol: assetsMeta
                    .map((assetMeta) => assetMeta.symbol)
                    .join("/"),
                })}
              </Text>
            </div>
            <div sx={{ flex: "row", gap: 8 }}>
              <JoinFarmsButton poolId={pool.id} onSuccess={onSuccess} />
              <LiquidityPositionRemoveLiquidity
                pool={pool}
                onSuccess={onSuccess}
              />
            </div>
          </div>

          <Separator color="white" opacity={0.06} />

          <div
            sx={{
              flex: ["column", "row"],
              justify: "space-between",
              gap: [10, 0],
            }}
          >
            <div
              sx={{
                flex: ["row", "column"],
                gap: 6,
                justify: ["space-between", "initial"],
              }}
            >
              <Text fs={[13, 14]} color="whiteish500">
                {t("liquidity.xyk.asset.position.availableShares")}
              </Text>
              <div>
                <Text fs={[13, 16]}>
                  {t("value.token", {
                    value: shareTokensBalance.data?.balance,
                    fixedPointScale: shareToken.meta.decimals,
                  })}
                </Text>
              </div>
            </div>

            <Separator
              orientation={isDesktop ? "vertical" : "horizontal"}
              color="white"
              opacity={0.06}
            />

            {myBalance && (
              <div
                sx={{
                  flex: ["row", "column"],
                  gap: 6,
                  justify: "space-between",
                }}
              >
                <div sx={{ flex: ["row", "column"], gap: 6 }}>
                  <Text fs={[13, 14]} color="whiteish500">
                    {t("liquidity.asset.positions.position.currentValue")}
                  </Text>
                </div>
                <div sx={{ flex: "column", align: ["end", "start"] }}>
                  <Text
                    fs={[13, 16]}
                    lh={[13, 18]}
                    fw={500}
                    color="white"
                    tAlign="left"
                  >
                    {t("value.tokenWithSymbol", {
                      value: myBalance.myBalanceA,
                      symbol: assetMetaA.symbol,
                    })}{" "}
                    |{" "}
                    {t("value.tokenWithSymbol", {
                      value: myBalance.myBalanceB,
                      symbol: assetMetaB.symbol,
                    })}
                  </Text>
                  <DollarAssetValue
                    value={myBalance.totalDisplay}
                    wrapper={(children) => (
                      <Text fs={[11, 12]} lh={[14, 16]} color="whiteish500">
                        {children}
                      </Text>
                    )}
                  >
                    <DisplayValue value={myBalance.totalDisplay} />
                  </DollarAssetValue>
                </div>
              </div>
            )}
          </div>
        </div>
      </SPositionContainer>
    </SPoolDetailsContainer>
  )
}
