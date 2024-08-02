import { Icon } from "components/Icon/Icon"
import { Text } from "components/Typography/Text/Text"
import { theme } from "theme"
import { MultipleAssetLogo } from "components/AssetIcon/AssetIcon"
import { SSelectAssetButton } from "./AssetSelect.styled"
import ChevronDown from "assets/icons/ChevronDown.svg?react"
import { useMedia } from "react-use"
import { useTranslation } from "react-i18next"
import { useAssets } from "providers/assets"

type Props = {
  onClick?: () => void
  assetId: string
  className?: string
}

export const AssetSelectButton = ({ onClick, assetId, className }: Props) => {
  const { t } = useTranslation()
  const { getAsset } = useAssets()
  const asset = getAsset(assetId)
  const isTablet = useMedia(theme.viewport.gte.sm)

  const isAssetFound = !!asset?.id

  const symbol = asset?.symbol
  const name = asset?.name

  const isSelectable = !!onClick

  return (
    <SSelectAssetButton
      className={className}
      size="small"
      onClick={(e) => {
        e.preventDefault()
        onClick?.()
      }}
    >
      <MultipleAssetLogo iconId={asset?.iconId} />

      {isAssetFound && (
        <div sx={{ flex: "column", justify: "space-between", minWidth: 0 }}>
          <Text fw={700} font="GeistMedium" lh={16} color="white">
            {symbol}
          </Text>
          <Text
            fs={13}
            lh={13}
            css={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              color: `rgba(${theme.rgbColors.whiteish500}, 0.6)`,
              display: isTablet ? "block" : "none",
            }}
          >
            {name}
          </Text>
        </div>
      )}

      {!isAssetFound && isSelectable && (
        <Text fw={700} font="GeistMedium" lh={16} color="white">
          {t("wallet.assets.transfer.asset.label_mob")}
        </Text>
      )}

      {isSelectable && <Icon icon={<ChevronDown />} />}
    </SSelectAssetButton>
  )
}
