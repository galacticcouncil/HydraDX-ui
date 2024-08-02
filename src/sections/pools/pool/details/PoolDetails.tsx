import { Button } from "components/Button/Button"
import { Icon } from "components/Icon/Icon"
import { GradientText } from "components/Typography/GradientText/GradientText"
import { useTranslation } from "react-i18next"
import {
  TXYKPoolFullData,
  useXYKSpotPrice,
} from "sections/pools/PoolsPage.utils"
import PlusIcon from "assets/icons/PlusIcon.svg?react"
import { Separator } from "components/Separator/Separator"
import { Text } from "components/Typography/Text/Text"
import { DisplayValue } from "components/DisplayValue/DisplayValue"
import { MultipleAssetLogo } from "components/AssetIcon/AssetIcon"
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
import { TAsset } from "providers/assets"
import { usePoolData } from "sections/pools/pool/Pool"

export const PoolDetails = () => {
  const { t } = useTranslation()
  const { account } = useAccount()
  const { pool } = usePoolData()
  const ixXYKPool = isXYKPoolType(pool)

  const [isOpen, setOpen] = useState(false)

  const meta = pool.meta
  const omnipoolFee = useOmnipoolFee()

  const modal = isOpen ? (
    pool.meta.isStableSwap ? (
      <TransferModal
        isOpen
        defaultPage={Page.OPTIONS}
        onClose={() => setOpen(false)}
      />
    ) : (
      <AddLiquidity isOpen onClose={() => setOpen(false)} />
    )
  ) : null

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
              <MultipleAssetLogo iconId={meta.iconId} size={26} />
              <div sx={{ flex: "column", gap: 0 }}>
                <Text fs={16} lh={16} color="white" font="GeistMedium">
                  {meta.symbol}
                </Text>
                <Text fs={13} lh={16} color="whiteish500">
                  {meta.name}
                </Text>
              </div>
            </div>

            {ixXYKPool && <XYKRateWrapper pool={pool} />}
          </div>

          <Button
            size="small"
            variant="primary"
            sx={{ width: ["100%", "auto"] }}
            disabled={
              !pool.canAddLiquidity || account?.isExternalWalletConnected
            }
            onClick={() => setOpen(true)}
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

        <AvailableFarms />
      </SPoolDetailsContainer>
      {modal}
    </>
  )
}

export const XYKAssetPrices = ({ shareTokenId }: { shareTokenId: string }) => {
  const { t } = useTranslation()

  const prices = useXYKSpotPrice(shareTokenId)

  const usdPriceA = useDisplayPrice(prices?.assetA.id)
  const usdPriceB = useDisplayPrice(prices?.assetB.id)

  if (!prices) return null

  const displayPriceA = prices.priceA.times(usdPriceA.data?.spotPrice ?? 1)
  const displayPriceB = prices.priceB.times(usdPriceB.data?.spotPrice ?? 1)

  return (
    <>
      <SValue sx={{ align: "start" }}>
        <div sx={{ flex: "row", gap: 4, align: "center" }}>
          <MultipleAssetLogo size={14} iconId={prices.assetA.iconId} />
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

      <SValue>
        <div sx={{ flex: "row", gap: 4, align: "center" }}>
          <MultipleAssetLogo size={14} iconId={prices.assetB.iconId} />
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

export const XYKRateWrapper = ({ pool }: { pool: TXYKPoolFullData }) => {
  const prices = useXYKSpotPrice(pool.id)

  if (!prices) return null

  return (
    <div sx={{ flex: "row", gap: 6, flexWrap: "wrap" }}>
      <XYKRate
        assetA={prices.assetA}
        assetB={prices.assetB}
        price={prices.priceA}
      />
      <XYKRate
        assetA={prices.assetB}
        assetB={prices.assetA}
        price={prices.priceB}
      />
    </div>
  )
}

export const XYKRate = ({
  assetA,
  assetB,
  price,
}: {
  assetA: TAsset
  assetB: TAsset
  price: BN
}) => {
  const { t } = useTranslation()

  return (
    <SXYKRateContainer>
      <MultipleAssetLogo size={12} iconId={assetA.iconId} />
      <Text fs={13} lh={13} color="white">
        {t("value.tokenWithSymbol", {
          value: BN_1,
          symbol: assetA.symbol,
        })}
      </Text>
      <Text fs={13} lh={13} color="white">
        =
      </Text>
      <Text fs={13} lh={13} color="white">
        {t("value.tokenWithSymbol", {
          value: price,
          symbol: assetB.symbol,
        })}
      </Text>
    </SXYKRateContainer>
  )
}
