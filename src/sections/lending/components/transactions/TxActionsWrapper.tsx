import { CheckIcon } from "@heroicons/react/solid"

import { Button } from "components/Button/Button"

import {
  Box,
  BoxProps,
  CircularProgress,
  SvgIcon,
  Typography,
} from "@mui/material"
import { ReactNode } from "react"
import { TxStateType, useModalContext } from "sections/lending/hooks/useModal"
import { useWeb3Context } from "sections/lending/libs/hooks/useWeb3Context"
import { TxAction } from "sections/lending/ui-config/errorMapping"

import { ApprovalTooltip } from "sections/lending/components/infoTooltips/ApprovalTooltip"

interface TxActionsWrapperProps extends BoxProps {
  actionInProgressText: ReactNode
  actionText: ReactNode
  amount?: string
  approvalTxState?: TxStateType
  handleApproval?: () => Promise<void>
  handleAction: () => Promise<void>
  isWrongNetwork: boolean
  mainTxState: TxStateType
  preparingTransactions: boolean
  requiresAmount?: boolean
  requiresApproval: boolean
  symbol?: string
  blocked?: boolean
  fetchingData?: boolean
  errorParams?: {
    loading: boolean
    disabled: boolean
    content: ReactNode
    handleClick: () => Promise<void>
  }
  tryPermit?: boolean
}

export const TxActionsWrapper = ({
  actionInProgressText,
  actionText,
  amount,
  approvalTxState,
  handleApproval,
  handleAction,
  isWrongNetwork,
  mainTxState,
  preparingTransactions,
  requiresAmount,
  requiresApproval,
  sx,
  symbol,
  blocked,
  fetchingData = false,
  errorParams,
  tryPermit,
  ...rest
}: TxActionsWrapperProps) => {
  const { txError } = useModalContext()
  const { readOnlyModeAddress } = useWeb3Context()
  const hasApprovalError =
    requiresApproval &&
    txError?.txAction === TxAction.APPROVAL &&
    txError?.actionBlocked
  const isAmountMissing =
    requiresAmount && requiresAmount && Number(amount) === 0

  function getMainParams() {
    if (blocked) return { disabled: true, content: actionText }
    if (
      (txError?.txAction === TxAction.GAS_ESTIMATION ||
        txError?.txAction === TxAction.MAIN_ACTION) &&
      txError?.actionBlocked
    ) {
      if (errorParams) return errorParams
      return { loading: false, disabled: true, content: actionText }
    }
    if (isWrongNetwork)
      return { disabled: true, content: <span>Wrong Network</span> }
    if (fetchingData)
      return { disabled: true, content: <span>Fetching data...</span> }
    if (isAmountMissing)
      return { disabled: true, content: <span>Enter an amount</span> }
    if (preparingTransactions) return { disabled: true, loading: true }
    // if (hasApprovalError && handleRetry)
    //   return { content: <span>Retry with approval</span>, handleClick: handleRetry };
    if (mainTxState?.loading)
      return { loading: true, disabled: true, content: actionInProgressText }
    if (requiresApproval && !approvalTxState?.success)
      return { disabled: true, content: actionText }
    return { content: actionText, handleClick: handleAction }
  }

  function getApprovalParams() {
    if (
      !requiresApproval ||
      isWrongNetwork ||
      isAmountMissing ||
      preparingTransactions ||
      hasApprovalError
    )
      return null
    if (approvalTxState?.loading)
      return {
        loading: true,
        disabled: true,
        content: <span>Approving {symbol}...</span>,
      }
    if (approvalTxState?.success)
      return {
        disabled: true,
        content: (
          <>
            <span>Approve Confirmed</span>
            <SvgIcon sx={{ fontSize: 20, ml: 8 }}>
              <CheckIcon />
            </SvgIcon>
          </>
        ),
      }

    return {
      content: (
        <ApprovalTooltip
          iconSize={20}
          iconMargin={2}
          iconColor="white"
          text={<span>Approve {symbol} to continue</span>}
        />
      ),
      handleClick: handleApproval,
    }
  }

  const { content, disabled, loading, handleClick } = getMainParams()
  const approvalParams = getApprovalParams()
  return (
    <Box sx={{ flex: "column", mt: ["auto", 16] }} {...rest}>
      {/* {approvalParams && !readOnlyModeAddress && (
        <Box
          sx={{ display: "flex", justifyContent: "end", alignItems: "center" }}
        >
          <RightHelperText
            approvalHash={approvalTxState?.txHash}
            tryPermit={tryPermit}
          />
        </Box>
      )} */}

      {approvalParams && !readOnlyModeAddress && (
        <Button
          variant="primary"
          disabled={approvalParams.disabled || blocked}
          onClick={() =>
            approvalParams.handleClick && approvalParams.handleClick()
          }
          size="medium"
        >
          {approvalParams.loading && (
            <CircularProgress color="inherit" size="16px" sx={{ mr: 8 }} />
          )}
          {approvalParams.content}
        </Button>
      )}

      <Button
        variant="primary"
        disabled={disabled || blocked || readOnlyModeAddress !== undefined}
        onClick={handleClick}
        size="medium"
        sx={approvalParams ? { mt: 8 } : undefined}
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
