import { InfoTooltip } from "components/InfoTooltip/InfoTooltip"
import { SInfoIcon } from "components/InfoTooltip/InfoTooltip.styled"
import { TextProps } from "components/Typography/Text/Text"
import { ReactNode } from "react"
import Skeleton from "react-loading-skeleton"
import { SText } from "./DataValue.styled"

type DataValueSize = "small" | "medium" | "large" | "extra-large"

const LABEL_SIZES: Record<DataValueSize, TextProps> = {
  small: {
    fs: 13,
    lh: 16,
  },
  medium: {
    fs: 14,
    lh: 16,
  },
  large: {
    fs: 14,
    lh: 16,
  },
  "extra-large": {
    fs: [14, 16],
    lh: [14, 16],
  },
}

const VALUE_SIZES: Record<DataValueSize, TextProps> = {
  small: {
    fs: 14,
    lh: 14,
  },
  medium: {
    fs: 19,
    lh: 19,
  },
  large: {
    fs: [19, 24],
    lh: [19, 24],
  },
  "extra-large": {
    fs: [19, 38],
    lh: [19, 38],
  },
}

export type DataValueProps = {
  label: ReactNode
  children: ReactNode
  className?: string
  tooltip?: ReactNode
  size?: DataValueSize
  font?: TextProps["font"]
  labelColor?: TextProps["color"]
  isLoading?: boolean
}

export const DataValue: React.FC<DataValueProps> = ({
  label,
  children,
  className,
  tooltip,
  size = "medium",
  font = "FontOver",
  labelColor = "white",
  isLoading = false,
}) => {
  return (
    <div className={className}>
      <div sx={{ flex: "column", gap: size === "small" ? 4 : 8 }}>
        <SText
          as="div"
          color={labelColor}
          {...LABEL_SIZES[size]}
          sx={{ flex: "row", gap: 4, align: "center" }}
        >
          {label}
          {tooltip && (
            <InfoTooltip text={tooltip}>
              <SInfoIcon />
            </InfoTooltip>
          )}
        </SText>
        <SText as="div" font={font} {...VALUE_SIZES[size]}>
          {isLoading ? <Skeleton width={80} height="1em" /> : children}
        </SText>
      </div>
    </div>
  )
}
