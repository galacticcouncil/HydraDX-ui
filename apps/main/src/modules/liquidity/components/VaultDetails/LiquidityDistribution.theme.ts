type ManagedRangeTheme = {
  controls: {
    outline: { active: string }
  }
}

export const MANAGED_RANGE = {
  getColor: ({ controls }: ManagedRangeTheme) => controls.outline.active,
  fillOpacity: 0.35,
  borderOpacity: 0.85,
} as const

export const managedRangeMixedColor = (color: string, opacity: number) =>
  `color-mix(in srgb, ${color} ${opacity * 100}%, transparent)`

export const managedRangeChartStroke = (
  color: string,
  borderOpacity: number,
) =>
  borderOpacity <= 0
    ? { stroke: "none", strokeWidth: 0 }
    : {
        stroke: managedRangeMixedColor(color, borderOpacity),
        strokeWidth: 1,
      }
