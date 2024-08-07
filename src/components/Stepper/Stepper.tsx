import DoneIcon from "assets/icons/StepperDoneIcon.svg?react"
import { Icon } from "components/Icon/Icon"
import { Text } from "components/Typography/Text/Text"
import { Fragment } from "react"
import {
  SCircle,
  SStepperContainer,
  SStepperLine,
  SThumbContainer,
} from "./Stepper.styled"
import { useMedia } from "react-use"
import { theme } from "theme"
import { useTranslation } from "react-i18next"

const STEP_STATES = ["active", "done", "todo"] as const

type StepState = (typeof STEP_STATES)[number]

type StepperProps = {
  steps: Array<StepProps>
  width?: number | string
  className?: string
}

export type StepProps = {
  label: string
  state: StepState
}

const Step = ({ label, state }: StepProps) => {
  const isDone = state === "done"
  const isTodo = state === "todo"
  return (
    <div sx={{ flex: "column", gap: 4, align: "center" }}>
      <SCircle>
        {!isTodo && (
          <SThumbContainer isDone={isDone}>
            {isDone && (
              <Icon sx={{ color: "brightBlue300" }} icon={<DoneIcon />} />
            )}
          </SThumbContainer>
        )}
      </SCircle>
      <Text
        fs={12}
        lh={18}
        color={state === "active" ? "brightBlue600" : "basic500"}
        css={{
          position: "absolute",
          top: "100%",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </Text>
    </div>
  )
}

export const Stepper = ({ steps, className, width = "100%" }: StepperProps) => {
  const isDesktop = useMedia(theme.viewport.gte.sm)
  const { t } = useTranslation()

  const activeIndex = steps.findIndex((step) => step.state === "active")
  const activeStep = steps[activeIndex]

  return (
    <div sx={{ width }} className={className}>
      <SStepperContainer width={width}>
        {steps.map((step, index) => (
          <Fragment key={index}>
            <Step {...step} label={isDesktop ? step.label : ""} />
            {index < steps.length - 1 && <SStepperLine />}
          </Fragment>
        ))}
      </SStepperContainer>
      <div
        sx={{
          display: ["flex", "none"],
          justify: "space-between",
          gap: 4,
          mt: 4,
        }}
      >
        <Text color="brightBlue600" fs={12}>
          {activeStep.label}
        </Text>

        <Text color="whiteish500" fs={12}>
          {t("stepper.title", {
            current: activeIndex + 1,
            total: steps.length,
          })}
        </Text>
      </div>
    </div>
  )
}
