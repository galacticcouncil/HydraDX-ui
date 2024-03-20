import { Box, Typography } from "@mui/material"
import { Warning } from "sections/lending/components/primitives/Warning"
import { TxErrorType } from "sections/lending/ui-config/errorMapping"

import { GasEstimationError } from "sections/lending/components/transactions/FlowCommons/GasEstimationError"

const USER_DENIED_SIGNATURE =
  "MetaMask Message Signature: User denied message signature."
const USER_DENIED_TRANSACTION =
  "MetaMask Tx Signature: User denied transaction signature."

interface ErrorProps {
  txError: TxErrorType
}
export const ParaswapErrorDisplay: React.FC<ErrorProps> = ({ txError }) => {
  return (
    <Box>
      <GasEstimationError txError={txError} />
      {txError.rawError.message !== USER_DENIED_SIGNATURE &&
        txError.rawError.message !== USER_DENIED_TRANSACTION && (
          <Box sx={{ pt: 4 }}>
            <Warning variant="info">
              <Typography variant="description">
                {" "}
                <span>
                  {" "}
                  Tip: Try increasing slippage or reduce input amount
                </span>
              </Typography>
            </Warning>
          </Box>
        )}
    </Box>
  )
}
