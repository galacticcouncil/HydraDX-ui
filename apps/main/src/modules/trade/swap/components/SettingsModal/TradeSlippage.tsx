import {
  Flex,
  FormError,
  NumberInput,
  Text,
  ToggleGroup,
  ToggleGroupItem,
} from "@galacticcouncil/ui/components"
import { getToken } from "@galacticcouncil/ui/utils"
import { FC } from "react"
import { useTranslation } from "react-i18next"

import { SettingLabel } from "@/modules/trade/swap/components/SettingsModal/SettingLabel"

type Props = {
  readonly slippage: number | null
  readonly options?: ReadonlyArray<number>
  readonly helpTooltip?: string
  readonly description?: string
  readonly error?: string
  readonly onSlippageChange: (slippage: number | null) => void
}

export const TradeSlippage: FC<Props> = ({
  slippage,
  options = defaultSlippageOptions,
  helpTooltip,
  description,
  error,
  onSlippageChange,
}) => {
  const { t } = useTranslation()
  const isError = !!error

  const slippageOptions = Array.from(new Set(options).values()).map(
    (slippage) => ({
      id: String(slippage),
      label: t("percent", { value: slippage }),
    }),
  )

  const selectedSlippage =
    slippage !== null
      ? slippageOptions.find((option) => option.id === String(slippage))?.id
      : undefined

  return (
    <Flex direction="column" gap="s">
      <Flex justify="space-between" align="center" py="s">
        <SettingLabel label={t("slippage")} helpTooltip={helpTooltip} />
        <Flex gap="base" align="center">
          <ToggleGroup
            type="single"
            value={selectedSlippage}
            onValueChange={(value) =>
              value && onSlippageChange(parseFloat(value))
            }
          >
            {slippageOptions.map((option) => (
              <ToggleGroupItem key={option.id} value={option.id}>
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          <NumberInput
            sx={{ width: "3xl" }}
            value={slippage}
            unit="%"
            placeholder={t("custom")}
            isError={isError}
            onValueChange={({ floatValue }) =>
              onSlippageChange(floatValue ?? null)
            }
          />
        </Flex>
      </Flex>
      {error && <FormError sx={{ textAlign: "end" }}>{error}</FormError>}
      {description && (
        <Text fs="p5" lh={1.3} color={getToken("text.medium")}>
          {description}
        </Text>
      )}
    </Flex>
  )
}

const defaultSlippageOptions: ReadonlyArray<number> = [0.5, 1, 3]
