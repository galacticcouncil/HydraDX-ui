import { Button } from "components/Button/Button"
import { Icon } from "components/Icon/Icon"
import { GradientText } from "components/Typography/GradientText/GradientText"
import { useTranslation } from "react-i18next"
import {
  TPoolFullData,
  TXYKPoolFullData,
  useXYKSpotPrice,
} from "sections/pools/PoolsPage.utils"
import PlusIcon from "assets/icons/PlusIcon.svg?react"
import { Separator } from "components/Separator/Separator"
import { Text } from "components/Typography/Text/Text"
import { DisplayValue } from "components/DisplayValue/DisplayValue"
import { MultipleIcons } from "components/MultipleIcons/MultipleIcons"
import { AssetLogo } from "components/AssetIcon/AssetIcon"
import { useRpcProvider } from "providers/rpcProvider"
import { isXYKPoolType } from "sections/pools/PoolsPage.utils"
import { useState } from "react"
import { AddLiquidity } from "sections/pools/modals/AddLiquidity/AddLiquidity"
import { PoolCapacity } from "sections/pools/pool/capacity/PoolCapacity"
import { CurrencyReserves } from "sections/pools/stablepool/components/CurrencyReserves"
import {
  Page,
  TransferModal,
} from "sections/pools/stablepool/transfer/TransferModal"
import {
  SPoolDetailsContainer,
  SValue,
  SValuesContainer,
  SXYKRateContainer,
} from "sections/pools/pool/details/PoolDetails.styled"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { useOmnipoolFee } from "api/omnipool"
import Skeleton from "react-loading-skeleton"
import { useDisplayPrice } from "utils/displayAsset"
import { BN_1 } from "utils/constants"
import BN from "bignumber.js"
import { AvailableFarms } from "sections/pools/pool/availableFarms/AvailableFarms"

export const PoolDetails = ({
  pool,
}: {
  pool: TPoolFullData | TXYKPoolFullData
}) => {
  const { t } = useTranslation()
  const { account } = useAccount()
  const { assets } = useRpcProvider()

  const [addLiquidityPool, setAddLiquidityPool] = useState<
    TPoolFullData | TXYKPoolFullData | undefined
  >(undefined)

  const [addLiquidityStablepool, setLiquidityStablepool] = useState<Page>()

  const omnipoolFee = useOmnipoolFee()

  const ixXYKPool = isXYKPoolType(pool)

  return (
    <>
      <SPoolDetailsContainer>
        <GradientText
          gradient="pinkLightBlue"
          font="GeistMonoSemiBold"
          fs={19}
          sx={{ width: "fit-content" }}
          tTransform="uppercase"
        >
          {ixXYKPool
            ? t("liquidity.pool.xyk.details.title")
            : t("liquidity.pool.details.title")}
        </GradientText>
        <div
          sx={{
            flex: ["column", "row"],
            justify: "space-between",
            gap: 20,
          }}
        >
          <div
            sx={{
              flex: ["column", "row"],
              justify: "space-between",
              align: ["start", "center"],
              gap: 12,
            }}
          >
            <div sx={{ flex: "row", gap: 4, align: "center" }}>
              {typeof asset.iconId === "string" ? (
                <Icon
                  size={26}
                  icon={<AssetLogo id={asset.iconId} />}
                  css={{ flex: "1 0 auto" }}
                />
              ) : (
                <MultipleIcons
                  size={26}
                  icons={asset.iconId.map((asset) => {
                    const meta = assets.getAsset(asset)
                    const isBond = assets.isBond(meta)
                    const id = isBond ? meta.assetId : asset
                    return {
                      icon: <AssetLogo key={id} id={id} />,
                    }
                  })}
                />
              )}
              <div sx={{ flex: "column", gap: 0 }}>
                <Text fs={16} lh={16} color="white" font="GeistMedium">
                  {asset.symbol}
                </Text>
                <Text fs={13} lh={16} color="whiteish500">
                  {asset.name}
                </Text>
              </div>
            </div>

            {ixXYKPool && <XYKRateWrapper shareTokenId={pool.id} />}
          </div>

          <Button
            size="small"
            variant="primary"
            sx={{ width: ["100%", "auto"] }}
            disabled={
              !pool.canAddLiquidity || account?.isExternalWalletConnected
            }
            onClick={() => {
              !ixXYKPool && pool.isStablePool
                ? setLiquidityStablepool(Page.OPTIONS)
                : setAddLiquidityPool(pool)
            }}
          >
            <div
              sx={{
                flex: "row",
                align: "center",
                justify: "center",
                width: 220,
              }}
            >
              <Icon icon={<PlusIcon />} sx={{ mr: 8, height: 16 }} />
              {t("liquidity.asset.actions.addLiquidity")}
            </div>
          </Button>
        </div>

        <div sx={{ flex: ["column-reverse", "column"], gap: 16 }}>
          {!ixXYKPool && (
            <>
              <Separator
                color="white"
                opacity={0.06}
                sx={{
                  mx: "-30px",
                  width: "calc(100% + 60px)",
                  display: ["none", "inherit"],
                }}
              />
              <PoolCapacity id={pool.id} />
            </>
          )}

          <div sx={{ flex: "column", gap: 20 }}>
            <Separator
              color="white"
              opacity={0.06}
              sx={{ mx: "-30px", width: "calc(100% + 60px)" }}
            />

            <SValuesContainer>
              <SValue sx={{ align: "start" }}>
                <Text color="basic400" fs={[12, 13]}>
                  {t("tvl")}
                </Text>
                <Text color="white" fs={[14, 16]} fw={600} font="GeistMedium">
                  <DisplayValue value={pool.tvlDisplay} />
                </Text>
              </SValue>

              <Separator orientation="vertical" color="white" opacity={0.06} />

              <SValue>
                <Text color="basic400" fs={[12, 13]}>
                  {t("24Volume")}
                </Text>
                <Text color="white" fs={[14, 16]} fw={600} font="GeistMedium">
                  <DisplayValue value={pool.volume} type="token" />
                </Text>
              </SValue>

              <Separator
                orientation="vertical"
                color="white"
                opacity={0.06}
                sx={{ display: ["none", "inherit"] }}
              />

              {!ixXYKPool && (
                <>
                  <SValue sx={{ align: "start" }}>
                    <Text color="basic400" fs={[12, 13]}>
                      {t("price")}
                    </Text>
                    <Text
                      color="white"
                      fs={[14, 16]}
                      fw={600}
                      font="GeistMedium"
                    >
                      <DisplayValue value={pool.spotPrice} type="token" />
                    </Text>
                  </SValue>

                  <Separator
                    orientation="vertical"
                    color="white"
                    opacity={0.06}
                  />
                </>
              )}
              <SValue
                sx={{ align: ixXYKPool ? "start" : "center" }}
                css={ixXYKPool ? { gridColumn: "1 / 4" } : undefined}
              >
                <Text color="basic400" fs={[12, 13]}>
                  {t("liquidity.pool.details.fee")}
                </Text>
                <Text color="white" fs={[14, 16]} fw={600} font="GeistMedium">
                  {ixXYKPool ? (
                    t("value.percentage", { value: pool.fee })
                  ) : pool.stablepoolFee ? (
                    t("value.percentage", {
                      value: pool.stablepoolFee.times(100),
                    })
                  ) : omnipoolFee.isLoading ? (
                    <Skeleton height={16} width={50} />
                  ) : (
                    t("value.percentage.range", {
                      from: omnipoolFee.data?.minFee.multipliedBy(100),
                      to: omnipoolFee.data?.maxFee.multipliedBy(100),
                    })
                  )}
                </Text>
              </SValue>
              {ixXYKPool && (
                <>
                  <Separator
                    orientation="vertical"
                    color="white"
                    opacity={0.06}
                    sx={{ display: ["none", "inherit"] }}
                  />
                  <XYKAssetPrices shareTokenId={pool.id} />
                </>
              )}
            </SValuesContainer>
          </div>
        </div>
        {!ixXYKPool && pool.isStablePool ? (
          <>
            <Separator
              color="white"
              opacity={0.06}
              sx={{ mx: "-30px", width: "calc(100% + 60px)" }}
            />

            <CurrencyReserves reserves={pool.reserves} />
          </>
        ) : null}

        <AvailableFarms pool={pool} />
      </SPoolDetailsContainer>
      {addLiquidityPool && (
        <AddLiquidity
          isOpen
          onClose={() => setAddLiquidityPool(undefined)}
          pool={addLiquidityPool}
        />
      )}
      {addLiquidityStablepool !== undefined && !ixXYKPool && (
        <TransferModal
          pool={pool}
          isOpen
          defaultPage={addLiquidityStablepool}
          onClose={() => setLiquidityStablepool(undefined)}
        />
      )}
    </>
  )
}

export const XYKAssetPrices = ({ shareTokenId }: { shareTokenId: string }) => {
  const { t } = useTranslation()

  const prices = useXYKSpotPrice(shareTokenId)

  const usdPriceA = useDisplayPrice(prices?.idB)
  const usdPriceB = useDisplayPrice(prices?.idA)

  if (!prices) return null

  const displayPriceA = prices.priceA.times(usdPriceA.data?.spotPrice ?? 1)
  const displayPriceB = prices.priceB.times(usdPriceB.data?.spotPrice ?? 1)

  return (
    <>
      <SValue sx={{ align: "start" }}>
        <div sx={{ flex: "row", gap: 4, align: "center" }}>
          <Icon size={14} icon={<AssetLogo id={prices.idA} />} />
          <Text color="basic400" fs={[12, 13]}>
            {t("liquidity.pool.details.price", { symbol: "" })}
          </Text>
        </div>
        <Text color="white" fs={[14, 16]} fw={600} font="GeistMedium">
          {usdPriceA.isLoading ? (
            <Skeleton width={60} height={14} />
          ) : (
            <DisplayValue value={displayPriceA} type="token" />
          )}
        </Text>
      </SValue>
      <Separator orientation="vertical" color="white" opacity={0.06} />
      <SValue sx={{ align: "start" }}>
        <div sx={{ flex: "row", gap: 4, align: "center" }}>
          <Icon size={14} icon={<AssetLogo id={prices.idB} />} />
          <Text color="basic400" fs={[12, 13]}>
            {t("liquidity.pool.details.price", { symbol: "" })}
          </Text>
        </div>
        <Text color="white" fs={[14, 16]} fw={600} font="GeistMedium">
          {usdPriceB.isLoading ? (
            <Skeleton width={60} height={14} />
          ) : (
            <DisplayValue value={displayPriceB} type="token" />
          )}
        </Text>
      </SValue>
    </>
  )
}

export const XYKRateWrapper = ({ shareTokenId }: { shareTokenId: string }) => {
  const prices = useXYKSpotPrice(shareTokenId)

  if (!prices) return null

  return (
    <div sx={{ flex: "row", gap: 6, flexWrap: "wrap" }}>
      <XYKRate assetA={prices.idA} assetB={prices.idB} price={prices.priceA} />
      <XYKRate assetA={prices.idB} assetB={prices.idA} price={prices.priceB} />
    </div>
  )
}

export const XYKRate = ({
  assetA,
  assetB,
  price,
}: {
  assetA: string
  assetB: string
  price: BN
}) => {
  const { t } = useTranslation()
  const { assets } = useRpcProvider()

  const assetAMeta = assets.getAsset(assetA)
  const assetBMeta = assets.getAsset(assetB)

  return (
    <SXYKRateContainer>
      <Icon size={12} icon={<AssetLogo id={assetA} />} />
      <Text fs={13} lh={13} color="white">
        {t("value.tokenWithSymbol", {
          value: BN_1,
          symbol: assetAMeta.symbol,
        })}
      </Text>
      <Text fs={13} lh={13} color="white">
        =
      </Text>
      <Text fs={13} lh={13} color="white">
        {t("value.tokenWithSymbol", {
          value: price,
          symbol: assetBMeta.symbol,
        })}
      </Text>
    </SXYKRateContainer>
  )
}
