import { useAssets } from "providers/assets"
import BigNumber from "bignumber.js"
import { MultipleAssetLogo } from "components/AssetIcon/AssetIcon"
import { DisplayValue } from "components/DisplayValue/DisplayValue"
import { Text } from "components/Typography/Text/Text"
import { m as motion } from "framer-motion"
import { useTranslation } from "react-i18next"

type SliceLabelProps = {
  symbol: string
  percentage: number
  value: BigNumber
  id: string
}

export const SliceLabel = ({
  symbol,
  percentage,
  value,
  id,
}: SliceLabelProps) => {
  const { t } = useTranslation()

  const { getAsset } = useAssets()

  const meta = getAsset(id)

  return (
    <motion.div
      sx={{ flex: "column", align: "center", gap: 6 }}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <MultipleAssetLogo size={[20, 36]} iconId={meta?.iconId} />
      <Text color="basic100" fs={[20, 34]}>
        {t("value.percentage", { value: percentage })}
      </Text>
      <Text color="basic100" fs={[10, 20]}>
        <DisplayValue value={value} isUSD />
      </Text>
      <Text color="basic100" fs={[10, 20]}>
        {symbol}
      </Text>
    </motion.div>
  )
}
