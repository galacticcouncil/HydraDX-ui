import { Icon } from "components/Icon/Icon"
import { Text } from "components/Typography/Text/Text"
import { theme } from "theme"
import { AssetLogo } from "components/AssetIcon/AssetIcon"
import { SSelectAssetButton } from "./AssetSelect.styled"
import ChevronDown from "assets/icons/ChevronDown.svg?react"
import { useRpcProvider } from "providers/rpcProvider"
import { MultipleIcons } from "components/MultipleIcons/MultipleIcons"
import { useMedia } from "react-use"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

type Props = {
  onClick?: () => void
  assetId: string
}

export const AssetSelectButton = ({ onClick, assetId }: Props) => {
  const { t } = useTranslation()
  const { assets } = useRpcProvider()
  const asset = assets.getAsset(assetId)
  const isTablet = useMedia(theme.viewport.gte.sm)

  const isAssetFound = !!asset?.id

  const symbol = asset?.symbol
  const name = asset?.name

  const iconIds = useMemo(() => {
    if (!isAssetFound) return []

    let iconIds: string | string[]

    if (assets.isStableSwap(asset) || assets.isShareToken(asset)) {
      iconIds = asset.assets
    } else if (assets.isBond(asset)) {
      iconIds = asset.assetId
    } else {
      iconIds = asset.id
    }

    return iconIds
  }, [asset, assets, isAssetFound])

  const isSelectable = !!onClick

  return (
    <SSelectAssetButton
      size="small"
      onClick={(e) => {
        e.preventDefault()
        onClick?.()
      }}
    >
      {typeof iconIds === "string" ? (
        <Icon icon={<AssetLogo id={iconIds} />} size={30} />
      ) : (
        <MultipleIcons
          icons={iconIds.map((asset) => ({
            icon: <AssetLogo id={asset} />,
          }))}
        />
      )}

      {isAssetFound && (
        <div sx={{ flex: "column", justify: "space-between" }}>
          <Text fw={700} font="ChakraPetchBold" lh={16} color="white">
            {symbol}
          </Text>
          <Text
            fs={13}
            lh={13}
            css={{
              whiteSpace: "nowrap",
              color: `rgba(${theme.rgbColors.whiteish500}, 0.6)`,
              display: isTablet ? "block" : "none",
            }}
          >
            {name}
          </Text>
        </div>
      )}

      {!isAssetFound && isSelectable && (
        <Text fw={700} font="ChakraPetchBold" lh={16} color="white">
          {t("wallet.assets.transfer.asset.label_mob")}
        </Text>
      )}

      {isSelectable && <Icon icon={<ChevronDown />} />}
    </SSelectAssetButton>
  )
}
