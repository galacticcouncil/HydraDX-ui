import { Stepper } from "components/Stepper/Stepper"
import { useTranslation } from "react-i18next"
import { MemepadSpinner } from "sections/memepad/components/MemepadSpinner"
import { MemepadFormAlerts } from "sections/memepad/form/MemepadFormAlerts"
import { useMemepadFormContext } from "./MemepadFormContext"

const useSpinnerPropsByStep = () => {
  const { step } = useMemepadFormContext()
  const { t } = useTranslation()

  if (step === 0) {
    return {
      title: t("memepad.form.spinner.create.title"),
      description: t("memepad.form.spinner.create.description"),
    }
  }

  if (step === 1) {
    return {
      title: t("memepad.form.spinner.register.title"),
      description: t("memepad.form.spinner.register.description"),
    }
  }

  if (step === 2) {
    return {
      title: t("memepad.form.spinner.transfer.title"),
      description: t("memepad.form.spinner.transfer.description"),
    }
  }

  if (step === 3) {
    return {
      title: t("memepad.form.spinner.xyk.title"),
      description: t("memepad.form.spinner.xyk.description"),
    }
  }

  return {}
}

export const MemepadForm = () => {
  const spinnerProps = useSpinnerPropsByStep()
  const { formComponent, isLoading, steps } = useMemepadFormContext()

  return (
    <div sx={{ flex: "column", gap: [20] }}>
      <Stepper steps={steps} sx={{ mb: [0, 60] }} />
      <div>
        {isLoading ? <MemepadSpinner {...spinnerProps} /> : formComponent}
      </div>
      <MemepadFormAlerts />
    </div>
  )
}
