import { ComponentPropsWithRef, useState } from "react"
import { Slider } from "components/Slider/Slider"
import { Text } from "components/Typography/Text/Text"
import BN from "bignumber.js"
import { useTranslation } from "react-i18next"
import { SInputBoxContainer } from "components/Input/Input.styled"
import { useShallowCompareEffect } from "react-use"
import { BN_0 } from "utils/constants"
import { ErrorMessage } from "components/Label/Label.styled"
import { useMemepadFormContext } from "sections/memepad/form/MemepadFormContext"

const PERC_MIN = 1
const PERC_MAX = 99

export type MemepadSupplySliderProps = {
  label: string
  totalSupply: string
  symbol: string
  error?: string
  onChange: (value: string) => void
} & Omit<ComponentPropsWithRef<typeof Slider>, "onChange" | "value">

export const MemepadSupplySlider: React.FC<MemepadSupplySliderProps> = ({
  label,
  totalSupply,
  symbol,
  error,
  onChange,
  ...props
}) => {
  const { t } = useTranslation()
  const { supplyPerc, setSupplyPerc } = useMemepadFormContext()
  const [allocatedSupply, setAllocatedSupply] = useState(BN_0)

  useShallowCompareEffect(() => {
    if (totalSupply) {
      const allocatedSupply = calculateAllocatedSupply(totalSupply, supplyPerc)
      setAllocatedSupply(calculateAllocatedSupply(totalSupply, supplyPerc))
      onChange?.(allocatedSupply.toString())
    }
  }, [{ supplyPerc, totalSupply }])

  return (
    <SInputBoxContainer as="div">
      <Text tTransform="uppercase" fs={11} color={error ? "error" : "basic500"}>
        {label}
      </Text>
      <Text fs={11} sx={{ my: 10 }}>
        {t("selectAsset.button.max")}{" "}
        {t("value.tokenWithSymbol", {
          value: totalSupply
            ? calculateAllocatedSupply(totalSupply, PERC_MAX)
            : "0",
          symbol,
        })}
      </Text>
      <div sx={{ flex: "row", gap: 10, justify: "space-between" }}>
        <Text fs={17} fw={500} font="GeistSemiBold" color="brightBlue300">
          {supplyPerc}%
        </Text>
        <Text fs={17} fw={500} font="GeistSemiBold" color="darkBlue200">
          {t("value.tokenWithSymbol", {
            value: !allocatedSupply.isNaN() ? allocatedSupply : BN_0,
            symbol,
          })}
        </Text>
      </div>
      <div sx={{ py: 10 }}>
        <Slider
          {...props}
          value={[supplyPerc]}
          onChange={([perc]) => setSupplyPerc(perc)}
          min={PERC_MIN}
          max={PERC_MAX}
          step={1}
          color="pinkLightBlue"
        />
      </div>
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </SInputBoxContainer>
  )
}

function calculateAllocatedSupply(totalSupply: string, perc: number) {
  return BN(totalSupply || "0")
    .times(perc)
    .div(100)
}
