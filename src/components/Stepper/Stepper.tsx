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
import { Spinner } from "components/Spinner/Spinner"

const STEP_STATES = ["active", "done", "todo"] as const

type StepState = (typeof STEP_STATES)[number]

type StepperProps = { steps: Array<StepProps> }

export type StepProps = {
  label: string
  state: StepState
}

export const getStepState = (stepPage: number, currentStep: number) => {
  if (stepPage === currentStep) {
    return "active" as const
  }

  return currentStep > stepPage ? ("done" as const) : ("todo" as const)
}

export const LoadgingPage = ({ title }: { title: string }) => (
  <div
    sx={{
      flex: "column",
      gap: 50,
      align: "center",
      justify: "center",
      height: 240,
    }}
  >
    <Spinner size={50} />
    <Text color="whiteish500">{title}</Text>
  </div>
)

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
        color={state === "active" ? "brightBlue600" : "basic500"}
        css={{ position: "absolute", bottom: 0, whiteSpace: "nowrap" }}
      >
        {label}
      </Text>
    </div>
  )
}

export const Stepper = ({ steps }: StepperProps) => {
  const isDesktop = useMedia(theme.viewport.gte.sm)
  const { t } = useTranslation()

  const active = steps.findIndex((step) => step.state === "active")

  if (isDesktop) {
    return (
      <SStepperContainer>
        {steps.map((step, index) => (
          <Fragment key={index}>
            <Step {...step} />
            {index < steps.length - 1 && <SStepperLine />}
          </Fragment>
        ))}
      </SStepperContainer>
    )
  }

  return (
    <Text color="whiteish500">
      {t("stepper.title", {
        current: active + 1,
        total: steps.length,
      })}
    </Text>
  )
}
