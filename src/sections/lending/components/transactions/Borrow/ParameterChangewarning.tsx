import { Warning } from "sections/lending/components/primitives/Warning"

export const ParameterChangewarning = ({
  underlyingAsset,
}: {
  underlyingAsset: string
}) => {
  return (
    <Warning variant="info" sx={{ my: 24 }}>
      <span>
        Attention: Parameter changes via governance can alter your account
        health factor and risk of liquidation. Follow the{" "}
        <a href="https://governance.aave.com/">Aave governance forum</a> for
        updates.
      </span>
    </Warning>
  )
}
