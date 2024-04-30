import CheckIcon from "assets/icons/CheckIcon.svg?react"

import { NoData } from "sections/lending/components/primitives/NoData"
import { IsolatedEnabledBadge } from "sections/lending/ui/isolation-mode/IsolationBadge"

type CollateralColumnProps = {
  isIsolated: boolean
  usageAsCollateralEnabled: boolean
}

export const CollateralColumn = ({
  isIsolated,
  usageAsCollateralEnabled,
}: CollateralColumnProps) => {
  const CollateralStates = () => {
    if (usageAsCollateralEnabled && !isIsolated) {
      return <CheckIcon sx={{ color: "green400" }} width={16} height={16} />
    } else if (usageAsCollateralEnabled && isIsolated) {
      // NOTE: handled in ListItemIsolationBadge
      return null
    } else {
      return <NoData />
    }
  }

  return (
    <div
      sx={{
        display: "row",
        align: "center",
        justify: "center",
      }}
    >
      {!isIsolated ? (
        <CollateralStates />
      ) : (
        <>
          <CollateralStates />
          <br />
          <IsolatedEnabledBadge />
        </>
      )}
    </div>
  )
}
