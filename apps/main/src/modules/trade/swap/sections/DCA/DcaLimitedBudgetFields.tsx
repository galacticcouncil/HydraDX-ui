import {
  Box,
  Flex,
  Grid,
  NumberInput,
  Toggle,
  ToggleRoot,
} from "@galacticcouncil/ui/components"
import { getToken } from "@galacticcouncil/ui/utils"
import { FC } from "react"
import {
  Controller,
  FieldError,
  useController,
  useFormContext,
} from "react-hook-form"
import { useTranslation } from "react-i18next"

import { TimeFrameFormField } from "@/form/TimeFrameFormField"
import { DcaFieldError } from "@/modules/trade/swap/sections/DCA/DcaFieldError"
import { DcaFieldLabel } from "@/modules/trade/swap/sections/DCA/DcaFieldLabel"
import {
  DcaFormValues,
  DcaOrders,
  DcaOrdersMode,
  dcaTimeFrameTypes,
} from "@/modules/trade/swap/sections/DCA/useDcaForm"

export const DcaLimitedBudgetFields: FC = () => {
  const { t } = useTranslation(["common", "trade"])
  const { control, formState, trigger } = useFormContext<DcaFormValues>()

  const { field: ordersField } = useController({
    control,
    name: "orders",
  })

  const isAuto = ordersField.value.type === DcaOrdersMode.Auto

  const ordersError =
    formState.errors.duration?.value?.message ??
    (formState.errors.orders as { value?: FieldError } | undefined)?.value
      ?.message

  return (
    <Grid
      pt="l"
      pb="xxl"
      columnTemplate="minmax(0,1fr) minmax(0,1fr)"
      rowGap="base"
      columnGap="xxl"
    >
      <DcaFieldLabel>{t("trade:dca.duration.label")}</DcaFieldLabel>
      <Flex sx={{ justifySelf: "end" }} gap="s" align="center">
        <ToggleRoot>
          <DcaFieldLabel>
            {t("trade:dca.orders.label")}:{" "}
            <Box
              as="span"
              color={
                isAuto ? getToken("text.tint.secondary") : getToken("text.high")
              }
            >
              {isAuto ? t("auto") : t("custom")}
            </Box>
          </DcaFieldLabel>
          <Toggle
            checked={isAuto}
            onCheckedChange={(auto) =>
              ordersField.onChange(
                (auto
                  ? { type: DcaOrdersMode.Auto }
                  : {
                      type: DcaOrdersMode.Custom,
                      value: null,
                    }) satisfies DcaOrders,
              )
            }
          />
        </ToggleRoot>
      </Flex>

      <TimeFrameFormField<DcaFormValues>
        sx={{
          gridColumn: isAuto ? "1/-1" : "1",
        }}
        fieldName="duration"
        allowedTypes={new Set(dcaTimeFrameTypes)}
        onChange={() => trigger("orders.value")}
      />
      {!isAuto && (
        <Controller
          control={control}
          name="orders.value"
          render={({ field, fieldState }) => (
            <NumberInput
              value={field.value}
              decimalScale={0}
              allowNegative={false}
              keepInvalidInput
              onValueChange={({ floatValue }) => field.onChange(floatValue)}
              isError={!!fieldState.error?.message}
              unit={t("trade:dca.orders.unit")}
            />
          )}
        />
      )}
      {ordersError && (
        <DcaFieldError sx={{ gridColumn: "1/-1" }}>{ordersError}</DcaFieldError>
      )}
    </Grid>
  )
}
