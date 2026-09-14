import { CircleInfo } from "@galacticcouncil/ui/assets/icons"
import {
  Flex,
  Icon,
  MicroButton,
  Text,
  Toggle,
  ToggleLabel,
  ToggleRoot,
  Tooltip,
} from "@galacticcouncil/ui/components"
import { getToken } from "@galacticcouncil/ui/utils"
import { FC } from "react"
import { useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { SBulletList } from "@/modules/trade/swap/sections/Limit/LimitOrderSettings.styled"
import {
  EXPIRY_OPTIONS,
  LimitFormValues,
} from "@/modules/trade/swap/sections/Limit/useLimitForm"

export const LimitOrderSettings: FC = () => {
  const { t } = useTranslation(["trade", "common"])
  const { watch, setValue } = useFormContext<LimitFormValues>()

  const [expiry, partiallyFillable] = watch(["expiry", "partiallyFillable"])

  return (
    <>
      <Flex justify="space-between" align="center" gap="base" py="base" wrap>
        <Text
          fw={400}
          fs="p5"
          whiteSpace="nowrap"
          color={getToken("text.medium")}
        >
          {t("trade:limit.expiry")}
        </Text>
        <Flex gap="s" justify="flex-end" width={["100%", "auto"]}>
          {EXPIRY_OPTIONS.map((option) => (
            <MicroButton
              key={option}
              onClick={() => setValue("expiry", option)}
              variant={expiry === option ? "emphasis" : "low"}
              sx={{ flex: [1, "auto"] }}
            >
              <Text
                as="span"
                whiteSpace="nowrap"
                py="xs"
                color={expiry === option ? undefined : getToken("text.high")}
              >
                {t(`trade:limit.expiry.${option}`)}
              </Text>
            </MicroButton>
          ))}
        </Flex>
      </Flex>

      <Flex justify="space-between" align="center" py="base">
        <Text fw={400} fs="p5" color={getToken("text.medium")}>
          {t("trade:limit.partiallyFillable")}
        </Text>
        <Flex align="center" gap="base">
          <Tooltip
            side="top"
            asChild
            text={
              <Flex direction="column" gap="s">
                <Text fs="p5" fw={500}>
                  {t("trade:limit.partiallyFillable.tooltip.intro")}
                </Text>
                <SBulletList>
                  <Text as="li" fw={500} fs="p5">
                    {t("trade:limit.partiallyFillable.tooltip.partial")}
                  </Text>
                  <Text as="li" fw={500} fs="p5">
                    {t("trade:limit.partiallyFillable.tooltip.fillOrKill")}
                  </Text>
                </SBulletList>
              </Flex>
            }
          >
            <Flex align="center" gap="s">
              <Icon
                component={CircleInfo}
                size="s"
                color={
                  partiallyFillable
                    ? getToken("text.tint.secondary")
                    : getToken("text.low")
                }
              />
              <Text
                fw={500}
                fs="p5"
                color={
                  partiallyFillable
                    ? getToken("text.tint.secondary")
                    : getToken("text.low")
                }
              >
                {t("trade:limit.partiallyFillable.enabled")}
              </Text>
            </Flex>
          </Tooltip>

          <ToggleRoot>
            <Toggle
              name="partiallyFillable"
              checked={partiallyFillable}
              onCheckedChange={(checked) =>
                setValue("partiallyFillable", !!checked)
              }
            />
            <ToggleLabel hidden>
              {t("trade:limit.partiallyFillable")}
            </ToggleLabel>
          </ToggleRoot>
        </Flex>
      </Flex>
    </>
  )
}
