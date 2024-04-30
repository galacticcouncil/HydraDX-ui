import { CheckIcon } from "@heroicons/react/solid"

import {
  Box,
  BoxProps,
  Button,
  CircularProgress,
  SvgIcon,
  Typography,
} from "@mui/material"
import { ReactNode } from "react"
import { TxStateType, useModalContext } from "sections/lending/hooks/useModal"
import { useWeb3Context } from "sections/lending/libs/hooks/useWeb3Context"
import { TxAction } from "sections/lending/ui-config/errorMapping"

interface TxActionsWrapperProps extends BoxProps {
  approvalTxState?: TxStateType
  handleSignatures: () => Promise<void>
  handleAction: () => Promise<void>
  isWrongNetwork: boolean
  mainTxState: TxStateType
  preparingTransactions: boolean
  requiresAmount?: boolean
  requiresSignature: boolean
  blocked?: boolean
  errorParams?: {
    loading: boolean
    disabled: boolean
    content: ReactNode
    handleClick: () => Promise<void>
  }
  isRevoke: boolean
}

export const DelegationTxsWrapper = ({
  isRevoke,
  approvalTxState,
  handleSignatures,
  handleAction,
  isWrongNetwork,
  mainTxState,
  preparingTransactions,
  requiresSignature,
  sx,
  blocked,
}: TxActionsWrapperProps) => {
  const { txError } = useModalContext()
  const { readOnlyModeAddress } = useWeb3Context()

  function getMainParams() {
    if (blocked)
      return {
        disabled: true,
        content: <span>{isRevoke ? "Revoke" : "Delegate"}</span>,
      }
    if (
      (txError?.txAction === TxAction.GAS_ESTIMATION ||
        txError?.txAction === TxAction.MAIN_ACTION) &&
      txError?.actionBlocked
    ) {
      return {
        loading: false,
        disabled: true,
        content: <span>{isRevoke ? "Revoke" : "Delegate"}</span>,
      }
    }
    if (isWrongNetwork)
      return { disabled: true, content: <span>Wrong Network</span> }
    if (preparingTransactions) return { disabled: true, loading: true }
    if (mainTxState?.loading)
      return {
        loading: true,
        disabled: true,
        content: <span>{isRevoke ? "Revoking" : "Delegating"}</span>,
      }
    if (requiresSignature && !approvalTxState?.success)
      return {
        disabled: true,
        content: <span>{isRevoke ? "Revoke" : "Delegate"}</span>,
      }
    return {
      content: <span>{isRevoke ? "Revoke" : "Delegate"}</span>,
      handleClick: handleAction,
    }
  }

  function getSignatureParams() {
    if (
      !requiresSignature ||
      isWrongNetwork ||
      preparingTransactions ||
      blocked
    )
      return null
    if (approvalTxState?.loading)
      return { loading: true, disabled: true, content: <span>Signing</span> }
    if (approvalTxState?.success)
      return {
        disabled: true,
        content: (
          <>
            <span>Signatures ready</span>
            <SvgIcon sx={{ fontSize: 20, ml: 8 }}>
              <CheckIcon />
            </SvgIcon>
          </>
        ),
      }

    return {
      content: <span>Sign to continue</span>,
      handleClick: handleSignatures,
    }
  }

  const { content, disabled, loading, handleClick } = getMainParams()
  const approvalParams = getSignatureParams()
  return (
    <Box sx={{ display: "flex", flexDirection: "column", mt: 16, ...sx }}>
      {approvalParams && !readOnlyModeAddress && (
        <Button
          variant="contained"
          disabled={approvalParams.disabled || blocked}
          onClick={() =>
            approvalParams.handleClick && approvalParams.handleClick()
          }
          size="large"
          sx={{ minHeight: "44px" }}
          data-cy="approvalButton"
        >
          {approvalParams.loading && (
            <CircularProgress color="inherit" size="16px" sx={{ mr: 8 }} />
          )}
          {approvalParams.content}
        </Button>
      )}

      <Button
        variant="contained"
        disabled={disabled || blocked || readOnlyModeAddress !== undefined}
        onClick={handleClick}
        size="large"
        sx={{ minHeight: "44px", ...(approvalParams ? { mt: 2 } : {}) }}
        data-cy="actionButton"
      >
        {loading && (
          <CircularProgress color="inherit" size="16px" sx={{ mr: 8 }} />
        )}
        {content}
      </Button>
      {readOnlyModeAddress && (
        <Typography
          variant="helperText"
          color="warning.main"
          sx={{ textAlign: "center", mt: 8 }}
        >
          <span>
            Read-only mode. Connect to a wallet to perform transactions.
          </span>
        </Typography>
      )}
    </Box>
  )
}
