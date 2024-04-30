import { Text } from "components/Typography/Text/Text"
import { theme } from "theme"

export type ChartField = {
  dataKey: string
  lineColor: keyof typeof theme.colors
  text: string
}

export type ChartLegendProps = {
  fields: ChartField[]
}

export const ChartLegend: React.FC<ChartLegendProps> = ({ fields }) => {
  if (!fields?.length) return null

  return (
    <div
      sx={{
        flex: "row",
        align: "center",
        flexWrap: "wrap",
        gap: [12, 34],
      }}
    >
      {fields.map(({ dataKey, lineColor, text }) => (
        <div key={dataKey} sx={{ flex: "row", align: "center", gap: 6 }}>
          <span
            css={{ borderRadius: "100%" }}
            sx={{ display: "block", width: 6, height: 6, bg: lineColor }}
          />
          <Text
            fs={14}
            color="basic400"
            css={{ textTransform: "uppercase" }}
            font="ChakraPetchSemiBold"
          >
            {text}
          </Text>
        </div>
      ))}
    </div>
  )
}
