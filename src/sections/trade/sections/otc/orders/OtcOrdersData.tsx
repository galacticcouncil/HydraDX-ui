import BN from "bignumber.js"
import { MultipleAssetLogo } from "components/AssetIcon/AssetIcon"
import { Text } from "components/Typography/Text/Text"
import { useTranslation } from "react-i18next"
import { OfferingPair } from "./OtcOrdersData.utils"
import { useMedia } from "react-use"
import { theme } from "theme"
import { DisplayValue } from "components/DisplayValue/DisplayValue"
import { useAssets } from "providers/assets"

export const OrderPairColumn = (props: {
  offering: OfferingPair
  accepting: OfferingPair
  pol: boolean
}) => {
  const { getAsset } = useAssets()
  const offerAssetDetails = getAsset(props.offering.asset)
  const acceptAssetDetails = getAsset(props.accepting.asset)

  return (
    <div sx={{ flex: "row", gap: 6, align: "center" }}>
      <MultipleAssetLogo size={22} iconId={offerAssetDetails?.iconId} />

      <Text fs={[14, 16]} lh={[16, 16]} fw={500} color="white">
        {props.offering.symbol}
      </Text>

      <Text fs={[14, 16]} lh={[16, 16]} fw={500} color="white" sx={{ mx: 4 }}>
        /
      </Text>
      <MultipleAssetLogo size={22} iconId={acceptAssetDetails?.iconId} />

      <Text fs={[14, 16]} lh={[16, 16]} fw={500} color="white">
        {props.accepting.symbol}
      </Text>
    </div>
  )
}

export const OrderAssetColumn = (props: {
  pair: OfferingPair
  large?: boolean
}) => {
  const { t } = useTranslation()
  const { isBond, getAsset } = useAssets()

  const assetDetails = getAsset(props.pair.asset)

  return (
    <div sx={{ flex: "row", align: "center", gap: 8 }}>
      <MultipleAssetLogo size={22} iconId={assetDetails?.iconId} />

      <div
        sx={{
          display: "flex",
          gap: 8,
        }}
      >
        <Text fs={[14, 13]} lh={13} fw={500} color="white">
          {t("value.token", { value: props.pair.amount })} {props.pair.symbol}
        </Text>
        {assetDetails && isBond(assetDetails) && (
          <Text fs={13} lh={13} fw={500} color="white">
            {assetDetails.name.replace("HDX Bond ", "").slice(3)}
          </Text>
        )}
      </div>
    </div>
  )
}

export const OrderPriceColumn = (props: { pair: OfferingPair; price: BN }) => {
  const { t } = useTranslation()
  const isDesktop = useMedia(theme.viewport.gte.sm)

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isDesktop ? "center" : "flex-end",
        alignItems: "center",
        height: "100%",
        width: "100%",
        gap: 3,
      }}
    >
      {props?.price?.isNaN() ? (
        <Text fs={12} fw={400} color="basic400" tAlign={"center"} as="div">
          N / A
        </Text>
      ) : (
        <>
          <Text fs={[14, 13]} lh={13} fw={500} color="white">
            <DisplayValue value={props.price} compact />
          </Text>
          <Text fs={[14, 13]} lh={13} fw={500} color="whiteish500">
            (
            {t("otc.offers.table.header.perToken", {
              symbol: props.pair.symbol,
            })}
            )
          </Text>
        </>
      )}
    </div>
  )
}

export const OrderMarketPriceColumn = (props: {
  pair: OfferingPair
  price: BN
  percentage: number
}) => {
  const color =
    props.percentage > 0
      ? "green600"
      : props.percentage < 0
        ? "red400"
        : "whiteish500"

  const formatPercentage = (percent: number) => {
    if (percent) {
      if (percent > 9000) {
        return "> +9000%"
      }

      return percent > 0 ? `+${percent.toFixed(2)}%` : `${percent.toFixed(2)}%`
    }
  }

  return (
    <div
      sx={{
        flex: "column",
        justify: "center",
        align: ["flex-end", "flex-end", "center"],
        width: "100%",
      }}
      css={{ position: "relative" }}
    >
      {props.percentage ? (
        <Text fs={[14, 13]} lh={13} fw={500} color={color as any}>
          {formatPercentage(props.percentage)}
        </Text>
      ) : (
        <Text fs={12} fw={400} color="basic400" tAlign={"center"} as="div">
          N / A
        </Text>
      )}
    </div>
  )
}
