import { AlertColor, Typography } from "@mui/material"

import { Link } from "sections/lending/components/primitives/Link"
import { Warning } from "sections/lending/components/primitives/Warning"

interface IsolationModeWarningProps {
  asset?: string
  severity?: AlertColor
}

export const IsolationModeWarning = ({
  asset,
  severity,
}: IsolationModeWarningProps) => {
  return (
    <Warning variant={severity || "info"} sx={{ mb: 12 }}>
      <Typography variant="subheader1" mb={0.5}>
        <span>You are entering Isolation mode</span>
      </Typography>
      <Typography>
        <span>
          In Isolation mode, you cannot supply other assets as collateral. A
          global debt ceiling limits the borrowing power of the isolated asset.
          To exit isolation mode disable {asset ? asset : ""} as collateral
          before borrowing another asset. Read more in our{" "}
          <Link href="https://docs.aave.com/faq/aave-v3-features#isolation-mode">
            FAQ
          </Link>
        </span>
      </Typography>
    </Warning>
  )
}
