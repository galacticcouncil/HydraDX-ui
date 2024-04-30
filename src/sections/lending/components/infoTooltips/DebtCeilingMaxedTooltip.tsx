import { ExclamationIcon } from "@heroicons/react/outline"

import { Box } from "@mui/material"
import { AssetCapData } from "sections/lending/hooks/useAssetCaps"

import { Link } from "sections/lending/components/primitives/Link"
import {
  TextWithTooltip,
  TextWithTooltipProps,
} from "sections/lending/components/TextWithTooltip"

type DebtCeilingMaxedTooltipProps = TextWithTooltipProps & {
  debtCeiling: AssetCapData
}

export const DebtCeilingMaxedTooltip = ({
  debtCeiling,
  ...rest
}: DebtCeilingMaxedTooltipProps) => {
  if (!debtCeiling || !debtCeiling.isMaxed) return null

  return (
    <Box sx={{ ml: 8 }}>
      <TextWithTooltip
        {...rest}
        icon={<ExclamationIcon />}
        iconColor="error.main"
        iconSize={18}
      >
        <>
          <span>
            Protocol debt ceiling is at 100% for this asset. Futher borrowing
            against this asset is unavailable.
          </span>{" "}
          <Link
            href="https://docs.aave.com/faq/aave-v3-features#how-does-isolation-mode-affect-my-borrowing-power"
            underline="always"
          >
            <span>Learn more</span>
          </Link>
        </>
      </TextWithTooltip>
    </Box>
  )
}
