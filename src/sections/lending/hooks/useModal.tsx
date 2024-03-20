import { ChainId, InterestRate, Stake } from "@aave/contract-helpers"
import { createContext, useContext, useState } from "react"
import { EmodeModalType } from "sections/lending/components/transactions/Emode/EmodeModalContent"
import { useWeb3Context } from "sections/lending/libs/hooks/useWeb3Context"
import { TxErrorType } from "sections/lending/ui-config/errorMapping"

export enum ModalType {
  Supply,
  Withdraw,
  Borrow,
  Repay,
  CollateralChange,
  RateSwitch,
  Stake,
  Unstake,
  StakeCooldown,
  StakeRewardClaim,
  ClaimRewards,
  Emode,
  Faucet,
  Swap,
  DebtSwitch,
  GovDelegation,
  GovVote,
  V3Migration,
  RevokeGovDelegation,
  StakeRewardsClaimRestake,
  Switch,
  GovRepresentatives,
}

export interface ModalArgsType {
  underlyingAsset?: string
  support?: boolean
  power?: string
  icon?: string
  stakeAssetName?: Stake
  currentRateMode?: InterestRate
  emode?: EmodeModalType
  isFrozen?: boolean
  representatives?: Array<{ chainId: ChainId; representative: string }>
}

export type TxStateType = {
  txHash?: string
  // txError?: string;
  loading?: boolean
  success?: boolean
}

export interface ModalContextType<T extends ModalArgsType> {
  openSupply: (underlyingAsset: string) => void
  openWithdraw: (underlyingAsset: string) => void
  openBorrow: (underlyingAsset: string) => void
  openRepay: (
    underlyingAsset: string,
    currentRateMode: InterestRate,
    isFrozen: boolean,
  ) => void
  openCollateralChange: (underlyingAsset: string) => void
  openRateSwitch: (
    underlyingAsset: string,
    currentRateMode: InterestRate,
  ) => void
  openClaimRewards: () => void
  openEmode: (mode: EmodeModalType) => void
  close: () => void
  type?: ModalType
  args: T
  mainTxState: TxStateType
  approvalTxState: TxStateType
  setApprovalTxState: (data: TxStateType) => void
  setMainTxState: (data: TxStateType) => void
  gasLimit: string
  setGasLimit: (limit: string) => void
  loadingTxns: boolean
  setLoadingTxns: (loading: boolean) => void
  txError: TxErrorType | undefined
  setTxError: (error: TxErrorType | undefined) => void
}

export const ModalContext = createContext<ModalContextType<ModalArgsType>>(
  {} as ModalContextType<ModalArgsType>,
)

export const ModalContextProvider: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const { setSwitchNetworkError } = useWeb3Context()
  // contains the current modal open state if any
  const [type, setType] = useState<ModalType>()
  // contains arbitrary key-value pairs as a modal context
  const [args, setArgs] = useState<ModalArgsType>({})
  const [approvalTxState, setApprovalTxState] = useState<TxStateType>({})
  const [mainTxState, setMainTxState] = useState<TxStateType>({})
  const [gasLimit, setGasLimit] = useState<string>("")
  const [loadingTxns, setLoadingTxns] = useState(false)
  const [txError, setTxError] = useState<TxErrorType>()

  return (
    <ModalContext.Provider
      value={{
        openSupply: (underlyingAsset) => {
          setType(ModalType.Supply)
          setArgs({ underlyingAsset })
        },
        openWithdraw: (underlyingAsset) => {
          setType(ModalType.Withdraw)
          setArgs({ underlyingAsset })
        },
        openBorrow: (underlyingAsset) => {
          setType(ModalType.Borrow)
          setArgs({ underlyingAsset })
        },
        openRepay: (underlyingAsset, currentRateMode, isFrozen) => {
          setType(ModalType.Repay)
          setArgs({ underlyingAsset, currentRateMode, isFrozen })
        },
        openCollateralChange: (underlyingAsset) => {
          setType(ModalType.CollateralChange)
          setArgs({ underlyingAsset })
        },
        openRateSwitch: (underlyingAsset, currentRateMode) => {
          setType(ModalType.RateSwitch)
          setArgs({ underlyingAsset, currentRateMode })
        },
        openClaimRewards: () => {
          setType(ModalType.ClaimRewards)
        },
        openEmode: (mode) => {
          setType(ModalType.Emode)
          setArgs({ emode: mode })
        },
        close: () => {
          setType(undefined)
          setArgs({})
          setMainTxState({})
          setApprovalTxState({})
          setGasLimit("")
          setTxError(undefined)
          setSwitchNetworkError(undefined)
        },
        type,
        args,
        approvalTxState,
        mainTxState,
        setApprovalTxState,
        setMainTxState,
        gasLimit,
        setGasLimit,
        loadingTxns,
        setLoadingTxns,
        txError,
        setTxError,
      }}
    >
      {children}
    </ModalContext.Provider>
  )
}

export const useModalContext = () => {
  const context = useContext(ModalContext)

  if (context === undefined) {
    throw new Error("useModalContext must be used within a ModalProvider")
  }

  return context
}
