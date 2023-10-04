import { Icon } from "components/Icon/Icon"
import { Text } from "components/Typography/Text/Text"
import { theme } from "theme"
import { AssetLogo, getAssetName } from "components/AssetIcon/AssetIcon"
import { SSelectAssetButton } from "./AssetSelect.styled"
import ChevronDown from "assets/icons/ChevronDown.svg?react"
import { useRpcProvider } from "providers/rpcProvider"

type Props = {
  onClick?: () => void
  assetId: string
}

export const AssetSelectButton = ({ onClick, assetId }: Props) => {
  const { assets } = useRpcProvider()
  const asset = assets.getAsset(assetId)

  const symbol = asset?.symbol
  const name = asset?.name

  const iconId = assets.isBond(asset) ? asset.assetId : asset.id

  return (
    <SSelectAssetButton size="small" onClick={onClick} type="button">
      <Icon icon={<AssetLogo id={iconId} />} size={30} />
      {symbol && (
        <div sx={{ flex: "column", justify: "space-between" }}>
          <Text fw={700} lh={16} color="white">
            {symbol}
          </Text>
          <Text
            fs={13}
            lh={13}
            css={{
              whiteSpace: "nowrap",
              color: `rgba(${theme.rgbColors.whiteish500}, 0.6)`,
            }}
          >
            {name || getAssetName(symbol)}
          </Text>
        </div>
      )}
      {onClick && <Icon icon={<ChevronDown />} />}
    </SSelectAssetButton>
  )
}
