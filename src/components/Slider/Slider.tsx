import { FC, Fragment, useLayoutEffect, useMemo, useRef, useState } from "react"
import { Range } from "@radix-ui/react-slider"
import {
  SDash,
  SRange,
  SRoot,
  SThumb,
  STrack,
} from "components/Slider/Slider.styled"
import { theme } from "theme"

const dashCount = 20

export type GradientKey = keyof typeof theme.gradients
export type ColorKey = keyof typeof theme.colors

export type SliderProps = {
  value: number[]
  onChange: (value: number[]) => void
  min: number
  max: number
  step: number
  disabled?: boolean
  color?: GradientKey | ColorKey
}

export const Slider: FC<SliderProps> = ({
  min,
  max,
  step,
  value,
  onChange,
  disabled,
  color = "brightBlue600",
}) => {
  const [rootWidth, setRootWidth] = useState(0)
  const rootRef = useRef<HTMLSpanElement>(null)

  const dashes = useMemo(
    () =>
      Array.from({ length: dashCount + 1 }).map((_, i) => (
        <Fragment key={i}>
          <SDash
            key={`top-${i}`}
            offset={i * (rootWidth / dashCount)}
            row="top"
          />
          <SDash
            key={`bottom-${i}`}
            offset={i * (rootWidth / dashCount)}
            row="bottom"
          />
        </Fragment>
      )),
    [rootWidth],
  )

  useLayoutEffect(() => {
    if (rootRef.current) setRootWidth(rootRef.current.offsetWidth)
  }, [])

  return (
    <SRoot
      value={value}
      onValueChange={onChange}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      ref={rootRef}
    >
      {dashes}
      <STrack>
        <Range asChild>
          <SRange color={color} />
        </Range>
      </STrack>
      <SThumb />
    </SRoot>
  )
}
