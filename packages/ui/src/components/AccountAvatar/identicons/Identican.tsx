import { Identican as IdenticanImpl } from "identican"
import { useMemo } from "react"

import { Flex, FlexProps } from "@/components/Flex"
import { Image } from "@/components/Image"
import { useTheme } from "@/theme"

const CAN_COLORS = [
  "#E53E76",
  "#CC1775",
  "#DE394D",
  "#53A4F3",
  "#043875",
  "#36154B",
  "#2B1D3C",
  "#B3CF92",
]
const PATTERN_COLORS = [
  "#240E32",
  "#111A15",
  "#98AFFF",
  "#BFFF98",
  "#F9AFCA",
  "#AAEEFC",
  "#E53E76",
  "#DFB1F3",
]

const BG_COLORS_LIGHT = [
  "#ffdeec",
  "#fab6cf",
  "#dfb1f3",
  "#e7ece1",
  "#aaeefc",
  "#b3d7fa",
  "#a1b4f7",
]

const BG_COLORS_DARK = [
  "#6b0054",
  "#560641",
  "#3c164b",
  "#251f42",
  "#033e4a",
  "#043267",
  "#11256f",
]

const canLight = new IdenticanImpl({
  zoom: 1.4,
  palette: {
    backgrounds: BG_COLORS_LIGHT,
    cans: CAN_COLORS,
    patterns: PATTERN_COLORS,
  },
})

const canDark = new IdenticanImpl({
  zoom: 1.4,
  palette: {
    backgrounds: BG_COLORS_DARK,
    cans: CAN_COLORS,
    patterns: PATTERN_COLORS,
  },
})

export type IdenticanProps = FlexProps & {
  address: string
  size: number
}

export const Identican: React.FC<IdenticanProps> = ({
  address,
  size,
  ...props
}) => {
  const { theme } = useTheme()

  const src = useMemo(
    () =>
      theme === "dark"
        ? canDark(address, { size }).toDataURL()
        : canLight(address, { size }).toDataURL(),
    [address, size, theme],
  )

  return (
    <Flex
      size={size}
      borderRadius="full"
      sx={{ overflow: "hidden" }}
      {...props}
    >
      <Image src={src} alt="" width={size} height={size} />
    </Flex>
  )
}
