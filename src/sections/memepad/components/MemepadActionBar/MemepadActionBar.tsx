import { Button } from "components/Button/Button"
import { SContainer } from "./MemepadActionBar.styled"
import { useTranslation } from "react-i18next"

type MemepadActionBarProps = {
  step: number
  disabled?: boolean
  isLoading?: boolean
  onSubmit?: () => void
}

export const MemepadActionBar: React.FC<MemepadActionBarProps> = ({
  step,
  disabled = false,
  isLoading = false,
  onSubmit,
}) => {
  const { t } = useTranslation()
  return (
    <SContainer>
      <Button
        disabled={disabled || isLoading}
        isLoading={isLoading}
        variant="primary"
        sx={{ minWidth: ["100%", 200] }}
        onClick={onSubmit}
      >
        {step === 0 && t("memepad.form.submit.create")}
        {step === 1 && t("memepad.form.submit.register")}
        {step === 2 && t("memepad.form.submit.transfer")}
        {step === 3 && t("memepad.form.submit.finish")}
      </Button>
    </SContainer>
  )
}
