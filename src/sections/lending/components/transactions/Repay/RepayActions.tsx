import {
  gasLimitRecommendations,
  InterestRate,
  ProtocolAction,
} from "@aave/contract-helpers"
import { TransactionResponse } from "@ethersproject/providers"

import { BoxProps } from "@mui/material"
import { parseUnits } from "ethers/lib/utils"
import { useEffect, useState } from "react"
import { useBackgroundDataProvider } from "sections/lending/hooks/app-data-provider/BackgroundDataProvider"
import { ComputedReserveData } from "sections/lending/hooks/app-data-provider/useAppDataProvider"
import {
  SignedParams,
  useApprovalTx,
} from "sections/lending/hooks/useApprovalTx"
import { usePoolApprovedAmount } from "sections/lending/hooks/useApprovedAmount"
import { useModalContext } from "sections/lending/hooks/useModal"
import { useWeb3Context } from "sections/lending/libs/hooks/useWeb3Context"
import { useRootStore } from "sections/lending/store/root"
import { ApprovalMethod } from "sections/lending/store/walletSlice"
import {
  getErrorTextFromError,
  TxAction,
} from "sections/lending/ui-config/errorMapping"
import { queryKeysFactory } from "sections/lending/ui-config/queries"

import { TxActionsWrapper } from "sections/lending/components/transactions/TxActionsWrapper"
import {
  APPROVAL_GAS_LIMIT,
  checkRequiresApproval,
} from "sections/lending/components/transactions/utils"
import { useQueryClient } from "@tanstack/react-query"
import { IPool__factory } from "@aave/contract-helpers/src/v3-pool-contract/typechain/IPool__factory"
import { getFunctionDefsFromAbi } from "sections/lending/utils/utils"

export interface RepayActionProps extends BoxProps {
  amountToRepay: string
  poolReserve: ComputedReserveData
  isWrongNetwork: boolean
  customGasPrice?: string
  poolAddress: string
  symbol: string
  debtType: InterestRate
  repayWithATokens: boolean
  blocked?: boolean
  maxApproveNeeded: string
}

export const RepayActions = ({
  amountToRepay,
  poolReserve,
  poolAddress,
  isWrongNetwork,
  sx,
  symbol,
  debtType,
  repayWithATokens,
  blocked,
  maxApproveNeeded,
  ...props
}: RepayActionProps) => {
  const queryClient = useQueryClient()
  const [
    repay,
    repayWithPermit,
    encodeRepayParams,
    encodeRepayWithPermit,
    tryPermit,
    walletApprovalMethodPreference,
    estimateGasLimit,
    addTransaction,
    optimizedPath,
    currentMarketData,
  ] = useRootStore((store) => [
    store.repay,
    store.repayWithPermit,
    store.encodeRepayParams,
    store.encodeRepayWithPermitParams,
    store.tryPermit,
    store.walletApprovalMethodPreference,
    store.estimateGasLimit,
    store.addTransaction,
    store.useOptimizedPath,
    store.currentMarketData,
  ])
  const { sendTx } = useWeb3Context()
  const { refetchGhoData, refetchIncentiveData, refetchPoolData } =
    useBackgroundDataProvider()
  const [signatureParams, setSignatureParams] = useState<
    SignedParams | undefined
  >()
  const {
    approvalTxState,
    mainTxState,
    loadingTxns,
    setMainTxState,
    setTxError,
    setGasLimit,
    setLoadingTxns,
    setApprovalTxState,
    close,
  } = useModalContext()

  const {
    data: approvedAmount,
    refetch: fetchApprovedAmount,
    isFetching: fetchingApprovedAmount,
    isFetchedAfterMount,
  } = usePoolApprovedAmount(currentMarketData, poolAddress)

  const permitAvailable = tryPermit({
    reserveAddress: poolAddress,
    isWrappedBaseAsset: poolReserve.isWrappedBaseAsset,
  })
  const usePermit =
    permitAvailable && walletApprovalMethodPreference === ApprovalMethod.PERMIT

  setLoadingTxns(fetchingApprovedAmount)

  const requiresApproval =
    !repayWithATokens &&
    Number(amountToRepay) !== 0 &&
    checkRequiresApproval({
      approvedAmount: approvedAmount?.amount || "0",
      amount: Number(amountToRepay) === -1 ? maxApproveNeeded : amountToRepay,
      signedAmount: signatureParams ? signatureParams.amount : "0",
    })

  if (requiresApproval && approvalTxState?.success) {
    // There was a successful approval tx, but the approval amount is not enough.
    // Clear the state to prompt for another approval.
    setApprovalTxState({})
  }

  const { approval } = useApprovalTx({
    usePermit,
    approvedAmount,
    requiresApproval,
    assetAddress: poolAddress,
    symbol,
    decimals: poolReserve.decimals,
    signatureAmount: amountToRepay,
    onApprovalTxConfirmed: fetchApprovedAmount,
    onSignTxCompleted: (signedParams) => setSignatureParams(signedParams),
  })

  useEffect(() => {
    if (!isFetchedAfterMount && !repayWithATokens) {
      fetchApprovedAmount()
    }
  }, [fetchApprovedAmount, isFetchedAfterMount, repayWithATokens])

  const action = async () => {
    try {
      setMainTxState({ ...mainTxState, loading: true })

      let response: TransactionResponse
      let action = ProtocolAction.default

      if (usePermit && signatureParams) {
        const repayWithPermitParams = {
          amount:
            amountToRepay === "-1"
              ? amountToRepay
              : parseUnits(amountToRepay, poolReserve.decimals).toString(),
          reserve: poolAddress,
          interestRateMode: debtType,
          signature: signatureParams.signature,
          deadline: signatureParams.deadline,
        }

        let encodedParams: [string, string, string] | undefined
        if (optimizedPath()) {
          encodedParams = await encodeRepayWithPermit(repayWithPermitParams)
        }

        action = ProtocolAction.repayWithPermit
        let signedRepayWithPermitTxData = repayWithPermit({
          ...repayWithPermitParams,
          encodedTxData: encodedParams ? encodedParams[0] : undefined,
        })

        signedRepayWithPermitTxData = await estimateGasLimit(
          signedRepayWithPermitTxData,
        )
        response = await sendTx(
          signedRepayWithPermitTxData,
          getFunctionDefsFromAbi(IPool__factory.abi, "repayWithPermit"),
        )
        await response.wait(1)
      } else {
        const repayParams = {
          amountToRepay:
            amountToRepay === "-1"
              ? amountToRepay
              : parseUnits(amountToRepay, poolReserve.decimals).toString(),
          poolAddress,
          repayWithATokens,
          debtType,
        }

        let encodedParams: string | undefined
        if (optimizedPath()) {
          encodedParams = await encodeRepayParams(repayParams)
        }

        action = ProtocolAction.repay
        let repayTxData = repay({
          ...repayParams,
          encodedTxData: encodedParams,
        })
        repayTxData = await estimateGasLimit(repayTxData)
        response = await sendTx(
          repayTxData,
          getFunctionDefsFromAbi(IPool__factory.abi, "repay"),
        )

        console.log({ abi: IPool__factory.abi })
        await response.wait(1)
      }
      setMainTxState({
        txHash: response.hash,
        loading: false,
        success: true,
      })
      addTransaction(response.hash, {
        action,
        txState: "success",
        asset: poolAddress,
        amount: amountToRepay,
        assetName: symbol,
      })

      queryClient.invalidateQueries({ queryKey: queryKeysFactory.pool })
      refetchPoolData && refetchPoolData()
      refetchIncentiveData && refetchIncentiveData()
      refetchGhoData && refetchGhoData()
    } catch (error) {
      const parsedError = getErrorTextFromError(
        error as Error,
        TxAction.GAS_ESTIMATION,
        false,
      )
      setTxError(parsedError)
      setMainTxState({
        txHash: undefined,
        loading: false,
      })
    } finally {
      close()
    }
  }

  useEffect(() => {
    let supplyGasLimit = 0
    if (usePermit) {
      supplyGasLimit = Number(
        gasLimitRecommendations[ProtocolAction.supplyWithPermit].recommended,
      )
    } else {
      supplyGasLimit = Number(
        gasLimitRecommendations[ProtocolAction.supply].recommended,
      )
      if (requiresApproval && !approvalTxState.success) {
        supplyGasLimit += Number(APPROVAL_GAS_LIMIT)
      }
    }
    setGasLimit(supplyGasLimit.toString())
  }, [requiresApproval, approvalTxState, usePermit, setGasLimit])

  return (
    <TxActionsWrapper
      blocked={blocked}
      preparingTransactions={loadingTxns || !approvedAmount}
      symbol={poolReserve.symbol}
      mainTxState={mainTxState}
      approvalTxState={approvalTxState}
      requiresAmount
      amount={amountToRepay}
      requiresApproval={requiresApproval}
      isWrongNetwork={isWrongNetwork}
      sx={sx}
      {...props}
      handleAction={action}
      handleApproval={approval}
      actionText={<span>Repay {symbol}</span>}
      actionInProgressText={<span>Repaying {symbol}</span>}
      tryPermit={permitAvailable}
    />
  )
}
