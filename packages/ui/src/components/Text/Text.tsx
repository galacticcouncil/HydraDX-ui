import { ResponsiveStyleValue, ThemeUICSSProperties } from "@theme-ui/core"
import { FC, Ref } from "react"

import { Box, BoxProps } from "@/components/Box"
import { ThemeFont } from "@/theme"
import { getToken } from "@/utils"

export type TextProps = BoxProps & {
  fw?: ResponsiveStyleValue<400 | 500 | 600 | 700>
  lh?: ThemeUICSSProperties["lineHeight"]
  fs?: ThemeUICSSProperties["fontSize"]
  font?: ThemeFont
  align?: ThemeUICSSProperties["textAlign"]
  textWrap?: ThemeUICSSProperties["textWrap"]
  transform?: ThemeUICSSProperties["textTransform"]
  decoration?: ThemeUICSSProperties["textDecoration"]
  whiteSpace?: ThemeUICSSProperties["whiteSpace"]
  wordBreak?: ThemeUICSSProperties["wordBreak"]
  truncate?: true | ResponsiveStyleValue<number | string>
  fontVariantNumeric?: ThemeUICSSProperties["fontVariantNumeric"]
  ref?: Ref<HTMLParagraphElement>
}

const getTruncateProps = (truncate: TextProps["truncate"]) => ({
  textOverflow: "ellipsis",
  overflow: "hidden",
  whiteSpace: "nowrap",
  maxWidth: typeof truncate === "boolean" ? undefined : truncate,
})

export const Text: FC<TextProps> = ({
  as = "p",
  fs,
  lh,
  fw,
  align,
  textWrap,
  transform,
  decoration,
  whiteSpace,
  font = "secondary",
  truncate,
  wordBreak,
  fontVariantNumeric,
  ref,
  ...props
}) => {
  return (
    <Box
      as={as}
      ref={ref}
      sx={{
        fontFamily:
          font === "mono" ? "GeistMono" : getToken(`fontFamilies1.${font}`),
        fontWeight: fw,
        fontSize: fs,
        textAlign: align,
        textTransform: transform,
        textDecoration: decoration,
        lineHeight: lh,
        textWrap,
        whiteSpace,
        wordBreak,
        fontVariantNumeric,
        ...(truncate && getTruncateProps(truncate)),
      }}
      {...props}
    />
  )
}
