import { useMedia } from "react-use"
import { theme } from "theme"
import {
  getCircleCoordinates,
  getPieConfig,
} from "sections/stats/components/PieChart/PieChart.utils"
import { useTranslation } from "react-i18next"
import { Fragment, ReactNode, useCallback, useMemo, useState } from "react"
import { DefaultSliceLabel } from "./components/DefaultSliceLabel"
import { Text } from "components/Typography/Text/Text"
import {
  SClipPath,
  SLabelContainer,
  SSliceContainer,
} from "./DoughnutChart.styled"
import { AnimatePresence } from "framer-motion"
import { ScrollablePicker } from "sections/stats/components/ScrollablePicker/ScrollablePicker"
import { EmotionJSX } from "@emotion/react/types/jsx-namespace"
import { useDebouncedValue } from "hooks/useDebouncedValue"

export type TSlice = {
  percentage: number
  color: string
  label: EmotionJSX.Element
  symbol?: string
  name: string
  id: string
}

type DoughnutChartProps = {
  slices: TSlice[]
  property?: string
  label?: ReactNode
}

export const DoughnutChart = ({ slices, ...props }: DoughnutChartProps) => {
  const isDesktop = useMedia(theme.viewport.gte.sm)
  const PIE_SIZE = !isDesktop ? 190 : 300
  const config = getPieConfig(PIE_SIZE)
  const { t } = useTranslation()

  const [activeSlice, setActiveSlice] = useState<number | undefined>(undefined)

  const [debouncedAtiveSlice] = useDebouncedValue(activeSlice, 150)

  const handleSetActiveSlice = useCallback(
    (index: number | undefined) =>
      isDesktop && index !== activeSlice && setActiveSlice(index),
    [activeSlice, isDesktop],
  )

  const restCmp = slices.find((slice) => slice?.symbol === "rest")
  const restIsSelected = restCmp && slices.length - 1 === activeSlice

  let label

  if (debouncedAtiveSlice != null) {
    if (!isDesktop && restIsSelected) {
      label = (
        <Text color="basic100" fs={[20, 34]}>
          {t("value.percentage", { value: restCmp.percentage })}
        </Text>
      )
    } else {
      label = slices[debouncedAtiveSlice].label
    }
  } else {
    label = props.label ? (
      props.label
    ) : (
      <DefaultSliceLabel slices={slices} property={props.property} />
    )
  }

  const sliceComponents = useMemo(() => {
    if (!slices.length) return null

    let diffAngle = 0
    const components = slices.map((slice, index) => {
      const sliceLength = slice.percentage * 3.6
      const startAngle = diffAngle
      const endAngle = sliceLength
      diffAngle += endAngle

      return (
        <Fragment key={slice.id}>
          <SClipPath
            rotate={startAngle}
            length={sliceLength - 1}
            color={slice.color}
            size={config.shadowSize}
            radial
            onMouseMove={() => handleSetActiveSlice(index)}
            onMouseLeave={() => handleSetActiveSlice(undefined)}
            clipPath={getCircleCoordinates(
              config.shadowInnerRadius,
              config.innerRadius,
              config.shadowSize,
              slice.percentage,
            )}
          />

          <SClipPath
            rotate={startAngle}
            length={sliceLength - 1}
            color={slice.color}
            size={config.pieSize}
            clipPath={getCircleCoordinates(
              config.innerRadius,
              config.outerRadius,
              config.pieSize,
              slice.percentage,
            )}
          />

          <SClipPath
            rotate={startAngle}
            length={sliceLength - 1}
            color={slice.color}
            size={config.pieSize}
            isActive={activeSlice === index}
            clipPath={getCircleCoordinates(
              config.innerRadius,
              config.outerRadius,
              config.pieSize,
              slice.percentage,
            )}
            hoverClipPath={getCircleCoordinates(
              config.innerRadius,
              config.hoverOuterRadius,
              config.pieSize,
              slice.percentage,
            )}
            onMouseMove={() => handleSetActiveSlice(index)}
            onMouseLeave={() => handleSetActiveSlice(undefined)}
          />
        </Fragment>
      )
    })

    return <SSliceContainer size={config.pieSize}>{components}</SSliceContainer>
  }, [config, slices, activeSlice, handleSetActiveSlice])

  return (
    <div sx={{ flex: "column", gap: 24 }}>
      <div sx={{ flex: "column", justify: "space-between", align: "center" }}>
        <div css={{ position: "relative" }}>
          <SLabelContainer size={PIE_SIZE - config.shadowInnerRadius}>
            <AnimatePresence>{label}</AnimatePresence>
          </SLabelContainer>
          <svg width={PIE_SIZE} height={PIE_SIZE}>
            <foreignObject width={PIE_SIZE} height={PIE_SIZE}>
              {sliceComponents}
            </foreignObject>
          </svg>
        </div>
        {!isDesktop ? (
          <ScrollablePicker
            values={[
              {
                name: t("stats.overview.pie.rest.label"),
                color: "white",
                symbol: "overview",
                label: <Fragment />,
                percentage: 0,
                id: "overview",
              },
              ...slices,
            ]}
            onChange={setActiveSlice}
          />
        ) : null}
      </div>
      {!isDesktop && restIsSelected ? restCmp.label : null}
    </div>
  )
}
