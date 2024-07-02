import { Button } from "components/Button/Button"
import { SContainer } from "./MemepadActionBar.styled"

type MemepadActionBarProps = {
  disabled?: boolean
  onNext?: () => void
}

export const MemepadActionBar: React.FC<MemepadActionBarProps> = ({
  disabled,
  onNext,
}) => {
  return (
    <SContainer>
      <Button
        disabled={disabled}
        variant="primary"
        sx={{ minWidth: ["100%", 150] }}
        onClick={onNext}
      >
        Next
      </Button>
    </SContainer>
  )
}
