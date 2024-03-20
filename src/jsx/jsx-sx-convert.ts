import { theme } from "theme"
import { FunctionInterpolation } from "@emotion/react"
import { getResponsiveStyles, ResponsiveValue } from "utils/responsive"
import type { Properties as CSSProperties } from "csstype"

type Properties = CSSProperties<(string & {}) | number>

const toPx = (val: number | string) => {
  if (typeof val === "number") return val + "px"
  return val
}

type MarginProps = {
  m?: ResponsiveValue<Properties["margin"]>

  mt?: ResponsiveValue<Properties["marginTop"]>
  mb?: ResponsiveValue<Properties["marginBottom"]>
  ml?: ResponsiveValue<Properties["marginLeft"]>
  mr?: ResponsiveValue<Properties["marginRight"]>

  mx?: ResponsiveValue<Properties["margin"]>
  my?: ResponsiveValue<Properties["margin"]>
}

const margins: FunctionInterpolation<MarginProps> = (p) => [
  getResponsiveStyles(p.m, (value) => ({ margin: toPx(value) })),

  getResponsiveStyles(p.mt, (value) => ({ marginTop: toPx(value) })),
  getResponsiveStyles(p.mb, (value) => ({ marginBottom: toPx(value) })),
  getResponsiveStyles(p.ml, (value) => ({ marginLeft: toPx(value) })),
  getResponsiveStyles(p.mr, (value) => ({ marginRight: toPx(value) })),

  getResponsiveStyles(p.mx, (value) => ({
    marginLeft: toPx(value),
    marginRight: toPx(value),
  })),
  getResponsiveStyles(p.my, (value) => ({
    marginTop: toPx(value),
    marginBottom: toPx(value),
  })),
]

type PaddingProps = {
  p?: ResponsiveValue<Properties["padding"]>

  pt?: ResponsiveValue<Properties["paddingTop"]>
  pb?: ResponsiveValue<Properties["paddingBottom"]>
  pl?: ResponsiveValue<Properties["paddingLeft"]>
  pr?: ResponsiveValue<Properties["paddingRight"]>

  px?: ResponsiveValue<Properties["padding"]>
  py?: ResponsiveValue<Properties["padding"]>
}

const paddings: FunctionInterpolation<PaddingProps> = (p) => [
  getResponsiveStyles(p.p, (value) => ({ padding: toPx(value) })),

  getResponsiveStyles(p.pt, (value) => ({ paddingTop: toPx(value) })),
  getResponsiveStyles(p.pb, (value) => ({ paddingBottom: toPx(value) })),
  getResponsiveStyles(p.pl, (value) => ({ paddingLeft: toPx(value) })),
  getResponsiveStyles(p.pr, (value) => ({ paddingRight: toPx(value) })),

  getResponsiveStyles(p.px, (value) => ({
    paddingLeft: toPx(value),
    paddingRight: toPx(value),
  })),
  getResponsiveStyles(p.py, (value) => ({
    paddingTop: toPx(value),
    paddingBottom: toPx(value),
  })),
]

type SizeProps = {
  width?: ResponsiveValue<Properties["width"]>
  height?: ResponsiveValue<Properties["height"]>

  minWidth?: ResponsiveValue<Properties["minWidth"]>
  minHeight?: ResponsiveValue<Properties["minHeight"]>
  maxWidth?: ResponsiveValue<Properties["maxWidth"]>
  maxHeight?: ResponsiveValue<Properties["maxHeight"]>

  flexBasis?: ResponsiveValue<Properties["flexBasis"]>
  aspectRatio?: ResponsiveValue<Properties["aspectRatio"]>
  gap?: ResponsiveValue<Properties["gap"]>

  top?: ResponsiveValue<Properties["top"]>
  bottom?: ResponsiveValue<Properties["bottom"]>
  left?: ResponsiveValue<Properties["left"]>
  right?: ResponsiveValue<Properties["right"]>
}

const size: FunctionInterpolation<SizeProps> = (p) => [
  getResponsiveStyles(p.width, (value) => ({ width: toPx(value) })),
  getResponsiveStyles(p.height, (value) => ({ height: toPx(value) })),

  getResponsiveStyles(p.minWidth, (value) => ({ minWidth: toPx(value) })),
  getResponsiveStyles(p.minHeight, (value) => ({ minHeight: toPx(value) })),
  getResponsiveStyles(p.maxWidth, (value) => ({ maxWidth: toPx(value) })),
  getResponsiveStyles(p.maxHeight, (value) => ({ maxHeight: toPx(value) })),

  getResponsiveStyles(p.flexBasis, (value) => ({ flexBasis: toPx(value) })),
  getResponsiveStyles(p.aspectRatio, (aspectRatio) => ({ aspectRatio })),
  getResponsiveStyles(p.gap, (value) => ({ gap: toPx(value) })),

  getResponsiveStyles(p.top, (value) => ({ top: toPx(value) })),
  getResponsiveStyles(p.bottom, (value) => ({ bottom: toPx(value) })),
  getResponsiveStyles(p.left, (value) => ({ left: toPx(value) })),
  getResponsiveStyles(p.right, (value) => ({ right: toPx(value) })),
]

type ColorProps = {
  color?: ResponsiveValue<keyof typeof theme.colors>
  bg?: ResponsiveValue<keyof typeof theme.colors>
}

const colors: FunctionInterpolation<ColorProps> = (p) => [
  getResponsiveStyles(p.color, (key) => ({ color: theme.colors[key] })),
  getResponsiveStyles(p.bg, (key) => ({ background: theme.colors[key] })),
]

type FontProps = {
  fontSize?: ResponsiveValue<Properties["fontSize"]>
  fontWeight?: ResponsiveValue<Properties["fontWeight"]>
  lineHeight?: ResponsiveValue<Properties["lineHeight"]>
  opacity?: ResponsiveValue<Properties["opacity"]>
  textAlign?: ResponsiveValue<Properties["textAlign"]>
}
const fonts: FunctionInterpolation<FontProps> = (p) => [
  getResponsiveStyles(p.fontSize, (value) => ({ fontSize: toPx(value) })),
  getResponsiveStyles(p.fontWeight, (fontWeight) => ({ fontWeight })),
  getResponsiveStyles(p.lineHeight, (value) => ({ lineHeight: toPx(value) })),
  getResponsiveStyles(p.opacity, (opacity) => ({ opacity })),
  getResponsiveStyles(p.textAlign, (textAlign) => ({ textAlign })),
]

interface DisplayProps {
  display?: ResponsiveValue<Properties["display"]>

  flexDirection?: ResponsiveValue<Properties["flexDirection"]>
  flexGrow?: ResponsiveValue<Properties["flexGrow"]>
  flexShrink?: ResponsiveValue<Properties["flexShrink"]>
  flexWrap?: ResponsiveValue<Properties["flexWrap"]>

  flex?: ResponsiveValue<Properties["flexDirection"]>
  align?: ResponsiveValue<Properties["alignItems"]>
  justify?: ResponsiveValue<Properties["justifyContent"]>
}
const display: FunctionInterpolation<DisplayProps> = (p) => [
  getResponsiveStyles(p.display, (display) => ({ display })),

  getResponsiveStyles(p.flexDirection, (flexDirection) => ({ flexDirection })),
  getResponsiveStyles(p.flexGrow, (flexGrow) => ({ flexGrow })),
  getResponsiveStyles(p.flexShrink, (flexShrink) => ({ flexShrink })),
  getResponsiveStyles(p.flexWrap, (flexWrap) => ({ flexWrap })),

  getResponsiveStyles(p.align, (alignItems) => ({ alignItems })),
  getResponsiveStyles(p.flex, (flexDirection) => ({
    display: "flex",
    flexDirection,
  })),
  getResponsiveStyles(p.justify, (value) => ({ justifyContent: value })),
]

export interface SxProps
  extends MarginProps,
    PaddingProps,
    SizeProps,
    ColorProps,
    FontProps,
    DisplayProps {}

type PropName = keyof SxProps

const sxPropNames = [
  "m",
  "mt",
  "mb",
  "ml",
  "mr",
  "mx",
  "my",
  "p",
  "pt",
  "pb",
  "pl",
  "pr",
  "px",
  "py",
  "width",
  "height",
  "minWidth",
  "minHeight",
  "maxWidth",
  "maxHeight",
  "flexBasis",
  "aspectRatio",
  "gap",
  "top",
  "bottom",
  "left",
  "right",
  "color",
  "bg",
  "fontSize",
  "fontWeight",
  "lineHeight",
  "opacity",
  "textAlign",
  "display",
  "flexDirection",
  "flexGrow",
  "flexShrink",
  "flexWrap",
  "align",
  "flex",
  "justify",
] satisfies PropName[]

export const sx = [margins, paddings, size, colors, fonts, display]

const isSxProp = (prop: string): prop is PropName =>
  sxPropNames.includes(prop as PropName)

const isMuiSxPropValue = (value: any) =>
  typeof value === "function" ||
  (typeof value === "object" && !Array.isArray(value))

const isSxPropsValid = (sx: SxProps) =>
  typeof sx === "object" &&
  Object.entries(sx).every(([prop, value]) => {
    return isSxProp(prop) && !isMuiSxPropValue(value)
  })

export function parseSxProps(props: any) {
  if (!isSxPropsValid(props.sx)) {
    return props
  }

  const newCss = sx.map((i) => i(props.sx))
  const hasCss = !!newCss.flat(1).filter((x) => x != null).length

  if (!hasCss) return props

  if (props.css == null) {
    props.css = newCss
  } else {
    props.css = [newCss, props.css]
  }
  delete props.sx

  return props
}
