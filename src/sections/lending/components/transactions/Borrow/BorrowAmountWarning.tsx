import { Checkbox, Typography } from "@mui/material"
import { Warning } from "sections/lending/components/primitives/Warning"

interface BorrowAmountWarningProps {
  riskCheckboxAccepted: boolean
  onRiskCheckboxChange: () => void
}

export const BorrowAmountWarning = ({
  riskCheckboxAccepted,
  onRiskCheckboxChange,
}: BorrowAmountWarningProps) => {
  return (
    <>
      <Warning variant="warning" sx={{ my: 20 }}>
        Borrowing this amount will reduce your health factor and increase risk
        of liquidation.
      </Warning>
      <div sx={{ flex: "row", align: "center" }}>
        <Checkbox
          checked={riskCheckboxAccepted}
          onChange={(event) => {
            onRiskCheckboxChange()
          }}
        />
        <Typography variant="description">
          <span>I acknowledge the risks involved.</span>
        </Typography>
      </div>
    </>
  )
}
