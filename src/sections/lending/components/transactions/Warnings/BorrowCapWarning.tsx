import { AssetCapData } from "sections/lending/hooks/useAssetCaps"
import { AlertProps } from "components/Alert"
import { Link } from "sections/lending/components/primitives/Link"
import { Warning } from "sections/lending/components/primitives/Warning"

type BorrowCapWarningProps = Omit<AlertProps, "variant"> & {
  borrowCap: AssetCapData
}

export const BorrowCapWarning = ({
  borrowCap,
  ...rest
}: BorrowCapWarningProps) => {
  // Don't show a warning when less than 98% utilized
  if (!borrowCap.percentUsed || borrowCap.percentUsed < 98) return null

  const renderText = () => {
    return borrowCap.isMaxed ? (
      <span>
        Protocol borrow cap is at 100% for this asset. Further borrowing
        unavailable.
      </span>
    ) : (
      <span>
        Maximum amount available to borrow is limited because protocol borrow
        cap is nearly reached.
      </span>
    )
  }

  return (
    <Warning {...rest} variant="warning">
      {renderText()}{" "}
      <Link
        href="https://docs.aave.com/developers/whats-new/supply-borrow-caps"
        underline="always"
      >
        <span>Learn more</span>
      </Link>
    </Warning>
  )
}
