import { CheckIcon } from "@heroicons/react/outline"
import { Box, SvgIcon } from "@mui/material"

import { NoData } from "sections/lending/components/primitives/NoData"
import { ListItemIsolationBadge } from "./ListItemIsolationBadge"

interface ListItemCanBeCollateralProps {
  isIsolated: boolean
  usageAsCollateralEnabled: boolean
}

export const ListItemCanBeCollateral = ({
  isIsolated,
  usageAsCollateralEnabled,
}: ListItemCanBeCollateralProps) => {
  const CollateralStates = () => {
    if (usageAsCollateralEnabled && !isIsolated) {
      return (
        <SvgIcon
          sx={{ color: "success.main", fontSize: { xs: "20px", xsm: "24px" } }}
        >
          <CheckIcon />
        </SvgIcon>
      )
    } else if (usageAsCollateralEnabled && isIsolated) {
      // NOTE: handled in ListItemIsolationBadge
      return null
    } else {
      return <NoData />
    }
  }

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {!isIsolated ? (
        <CollateralStates />
      ) : (
        <ListItemIsolationBadge>
          <CollateralStates />
        </ListItemIsolationBadge>
      )}
    </Box>
  )
}