import { ExclamationIcon } from "@heroicons/react/outline"

import { Box } from "@mui/material"
import { AssetCapData } from "sections/lending/hooks/useAssetCaps"

import { Link } from "sections/lending/components/primitives/Link"
import {
  TextWithTooltip,
  TextWithTooltipProps,
} from "sections/lending/components/TextWithTooltip"

type SupplyCapMaxedTooltipProps = TextWithTooltipProps & {
  supplyCap: AssetCapData
}

export const SupplyCapMaxedTooltip = ({
  supplyCap,
  ...rest
}: SupplyCapMaxedTooltipProps) => {
  if (!supplyCap || !supplyCap.isMaxed) return null

  return (
    <Box sx={{ ml: 8 }}>
      <TextWithTooltip
        {...rest}
        icon={<ExclamationIcon />}
        iconColor="warning.main"
        iconSize={18}
      >
        <>
          <span>
            Protocol supply cap at 100% for this asset. Further supply
            unavailable.
          </span>{" "}
          <Link
            href="https://docs.aave.com/developers/whats-new/supply-borrow-caps"
            underline="always"
          >
            <span>Learn more</span>
          </Link>
        </>
      </TextWithTooltip>
    </Box>
  )
}
