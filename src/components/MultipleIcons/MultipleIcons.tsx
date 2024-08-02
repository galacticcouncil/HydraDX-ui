import { FC, ReactElement, useMemo } from "react"
import { IconsWrapper } from "./MultipleIcons.styled"
import { ResponsiveValue } from "utils/responsive"
import { Icon, IconProps } from "components/Icon/Icon"
import { chainsMap } from "@galacticcouncil/xcm-cfg"
import { isAnyParachain } from "utils/helpers"
import { useAssets } from "providers/assets"

const chains = Array.from(chainsMap.values())

type DualAssetIconsProps = {
  size?: ResponsiveValue<number>
  icons: Array<IconProps>
}

export const MultipleIcons: FC<DualAssetIconsProps> = ({
  icons,
  size = 28,
}) => {
  const { getAssets } = useAssets()

  const maskConfig = useMemo(() => {
    const iconIds = icons.map((props) => {
      const icon = props.icon as ReactElement<{ id?: string }>
      return icon.props.id || ""
    })

    const assetProps = getAssets(iconIds)

    return assetProps.map(
      (props) =>
        !!chains.find(
          (chain) =>
            isAnyParachain(chain) &&
            chain.parachainId === Number(props?.parachainId),
        ),
    )
  }, [getAssets, icons])

  return (
    <IconsWrapper
      size={size}
      maskConfig={maskConfig}
      sx={{ flexDirection: "row" }}
    >
      {icons.map((icon, index) => (
        <Icon {...icon} key={index} />
      ))}
    </IconsWrapper>
  )
}
