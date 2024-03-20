import { ButtonTransparent } from "components/Button/Button"
import { Warning } from "sections/lending/components/primitives/Warning"
import { TxErrorType } from "sections/lending/ui-config/errorMapping"

export const GasEstimationError = ({ txError }: { txError: TxErrorType }) => {
  return (
    <Warning variant="error" sx={{ mt: 16, mb: 0 }}>
      <span>
        {txError.error ? (
          <span>
            {txError.error}{" "}
            <ButtonTransparent
              css={{ color: "white", textDecoration: "underline" }}
              onClick={() =>
                navigator.clipboard.writeText(
                  txError.rawError.message.toString(),
                )
              }
            >
              <span>
                <span>copy the error</span>
              </span>
            </ButtonTransparent>
          </span>
        ) : (
          <span>
            There was some error. Please try changing the parameters or{" "}
            <ButtonTransparent
              css={{ color: "white", textDecoration: "underline" }}
              onClick={() =>
                navigator.clipboard.writeText(
                  txError.rawError.message.toString(),
                )
              }
            >
              <span>copy the error</span>
            </ButtonTransparent>
          </span>
        )}
      </span>
    </Warning>
  )
}
