import { useTranslation } from "react-i18next"
import { MultipleAssetLogo } from "components/AssetIcon/AssetIcon"
import { Text } from "components/Typography/Text/Text"
import { useExternalTokenMeta } from "sections/wallet/addToken/AddToken.utils"
import { useAssets } from "providers/assets"

export const AssetTableName = ({
  large,
  isPaymentFee,
  id,
}: {
  large?: boolean
  isPaymentFee?: boolean
  id: string
}) => {
  const { t } = useTranslation()
  const { getAsset } = useAssets()

  const asset = getAsset(id)
  const getExternalMeta = useExternalTokenMeta()
  const externalMeta = getExternalMeta(id)

  if (!asset) return null

  const iconIds = externalMeta?.id ?? asset?.iconId ?? ""

  return (
    <div sx={{ width: ["max-content", "inherit"] }}>
      <div
        sx={{ flex: "row", gap: 8, align: "center", width: "fit-content" }}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
      >
        <MultipleAssetLogo size={[large ? 28 : 26, 26]} iconId={iconIds} />

        <div sx={{ flex: "column", width: "100%", gap: [0, 2] }}>
          <Text
            fs={large ? 18 : 14}
            lh={large ? 16 : 14}
            font="GeistMedium"
            color="white"
          >
            {externalMeta?.symbol ?? asset.symbol}
          </Text>
          <Text
            fs={large ? 14 : 12}
            lh={large ? 17 : 12}
            sx={{ display: !large ? ["none", "block"] : undefined }}
            color="whiteish500"
          >
            {asset.name}
          </Text>
        </div>
      </div>
      {isPaymentFee && (
        <Text
          fs={10}
          sx={{
            mt: 4,
            ml: large ? 30 : [32, 34],
          }}
          color="brightBlue300"
          tTransform="uppercase"
        >
          {t("wallet.assets.table.details.feePaymentAsset")}
        </Text>
      )}
    </div>
  )
}
