import { ExternalLinkIcon } from "@heroicons/react/outline"

import { Box, Link, SvgIcon, Typography } from "@mui/material"
import { ApprovalMethodToggleButton } from "sections/lending/components/transactions/FlowCommons/ApprovalMethodToggleButton"
import { MOCK_SIGNED_HASH } from "sections/lending/helpers/useTransactionHandler"
import { useProtocolDataContext } from "sections/lending/hooks/useProtocolDataContext"
import { useRootStore } from "sections/lending/store/root"
import { ApprovalMethod } from "sections/lending/store/walletSlice"

export type RightHelperTextProps = {
  approvalHash?: string
  tryPermit?: boolean
}

const ExtLinkIcon = () => (
  <SvgIcon sx={{ ml: "2px", fontSize: "11px" }}>
    <ExternalLinkIcon />
  </SvgIcon>
)

export const RightHelperText = ({
  approvalHash,
  tryPermit,
}: RightHelperTextProps) => {
  const { walletApprovalMethodPreference, setWalletApprovalMethodPreference } =
    useRootStore()
  const usingPermit = tryPermit && walletApprovalMethodPreference
  const { currentNetworkConfig } = useProtocolDataContext()
  const isSigned = approvalHash === MOCK_SIGNED_HASH
  // a signature is not submitted on-chain so there is no link to review
  if (!approvalHash && !isSigned && tryPermit)
    return (
      <Box sx={{ display: "inline-flex", alignItems: "center", mb: 4 }}>
        <Typography variant="subheader2" color="text.secondary">
          <span>Approve with</span>&nbsp;
        </Typography>
        <ApprovalMethodToggleButton
          currentMethod={walletApprovalMethodPreference}
          setMethod={(method: ApprovalMethod) =>
            setWalletApprovalMethodPreference(method)
          }
        />
      </Box>
    )
  if (approvalHash && !usingPermit)
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
          pb: 1,
        }}
      >
        {approvalHash && (
          <Link
            variant="helperText"
            href={currentNetworkConfig.explorerLinkBuilder({
              tx: approvalHash,
            })}
            sx={{ display: "inline-flex", alignItems: "center" }}
            underline="hover"
            target="_blank"
            rel="noreferrer noopener"
          >
            <span>Review approval tx details</span>
            <ExtLinkIcon />
          </Link>
        )}
      </Box>
    )
  return <></>
}
