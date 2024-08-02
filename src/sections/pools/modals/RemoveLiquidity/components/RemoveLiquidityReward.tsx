import { Text } from "components/Typography/Text/Text"
import { MultipleAssetLogo } from "components/AssetIcon/AssetIcon"
import { useAssets } from "providers/assets"

type Props = {
  name: string
  symbol: string
  amount: string
  id: string
}

export const RemoveLiquidityReward = ({ name, symbol, amount, id }: Props) => {
  const { getAssetWithFallback } = useAssets()
  const meta = getAssetWithFallback(id)

  return (
    <div sx={{ flex: "row", justify: "space-between", align: "center" }}>
      <div sx={{ flex: "row", align: "center", gap: 8 }}>
        <MultipleAssetLogo size={28} iconId={meta.iconId} />

        <div sx={{ flex: "column" }}>
          <Text fs={[14, 16]}>{symbol}</Text>
          <Text fs={[10, 12]} color="neutralGray500">
            {name}
          </Text>
        </div>
      </div>
      <Text fs={[16, 20]} lh={26} fw={[500, 700]}>
        {amount}
      </Text>
    </div>
  )
}
