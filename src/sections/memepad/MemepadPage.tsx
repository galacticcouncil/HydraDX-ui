import { Spacer } from "components/Spacer/Spacer"
import { Stepper } from "components/Stepper/Stepper"
import { useRouteBlock } from "hooks/useRouteBlock"
import { useMemo } from "react"
import { SContent } from "./MemepadPage.styled"
import { MemepadActionBar } from "./components/MemepadActionBar"
import { MemepadVisual } from "./components/MemepadVisual"
import { MemepadHeader } from "./components/MemepadHeader"
import { useMemepadForms } from "./form/MemepadForm.utils"
import { RouteBlockModal } from "./modal/RouteBlockModal"
import { MemepadSummary } from "sections/memepad/components/MemepadSummary"

export const MemepadPage = () => {
  const {
    step,
    currentForm,
    submitNext,
    isFinalStep,
    isDirty,
    isSubmitted,
    summary,
    reset,
  } = useMemepadForms()

  const { isBlocking, accept, cancel } = useRouteBlock(isDirty && !isSubmitted)

  const steps = useMemo(() => {
    const stepLabels = [
      "Create & Register",
      "Transfer Liquidity",
      "Create Isolated Pool",
      "Summary",
    ]
    return stepLabels.map(
      (label, index) =>
        ({
          label,
          state: step === index ? "active" : step > index ? "done" : "todo",
        }) as const,
    )
  }, [step])

  return (
    <>
      {isFinalStep ? (
        <MemepadSummary values={summary} onReset={reset} />
      ) : (
        <>
          <MemepadHeader />
          <Spacer size={35} />
          <SContent>
            <div>
              <Stepper fullWidth steps={steps} />
              <Spacer size={60} />
              {currentForm}
            </div>
            <div>
              <MemepadVisual />
            </div>
          </SContent>
          <MemepadActionBar
            disabled={step >= steps.length - 1}
            onNext={submitNext}
          />
        </>
      )}
      <RouteBlockModal open={isBlocking} onAccept={accept} onCancel={cancel} />
    </>
  )
}
