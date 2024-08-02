import { Farm, useFarmAprs, getMinAndMaxAPR } from "api/farms"
import { MultipleIcons } from "components/MultipleIcons/MultipleIcons"
import { Text } from "components/Typography/Text/Text"
import { useTranslation } from "react-i18next"
import { AssetLogo } from "components/AssetIcon/AssetIcon"

export const GlobalFarmRowMulti = ({
  farms,
  fontSize = 12,
  iconSize = 12,
  className,
}: {
  farms: Farm[]
  fontSize?: number
  iconSize?: number
  className?: string
}) => {
  const { t } = useTranslation()
  const farmAprs = useFarmAprs(farms)

  if (!farmAprs.data) return null

  const { maxApr } = getMinAndMaxAPR(farmAprs)

  return (
    <div sx={{ flex: "row", gap: 4, align: "center" }} className={className}>
      <Text fs={fontSize} color="brightBlue200">
        {maxApr.gt(0)
          ? t(`value.upToAPR`, { maxApr })
          : t(`value.percentage`, { value: maxApr })}
      </Text>

      <MultipleIcons
        size={iconSize}
        icons={farmAprs.data.map((farm) => ({
          icon: <AssetLogo id={farm.assetId.toString()} />,
        }))}
      />
    </div>
  )
}
