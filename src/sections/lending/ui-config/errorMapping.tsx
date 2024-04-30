
import { ReactElement } from "react"

export enum TxAction {
  APPROVAL,
  MAIN_ACTION,
  GAS_ESTIMATION,
}

export type TxErrorType = {
  blocking: boolean
  actionBlocked: boolean
  rawError: Error
  error: ReactElement | undefined
  txAction: TxAction
}

export const getErrorTextFromError = (
  error: Error,
  txAction: TxAction,
  blocking = true,
): TxErrorType => {
  let errorNumber = 1

  if (
    error.message ===
      "MetaMask Tx Signature: User denied transaction signature." ||
    error.message ===
      "MetaMask Message Signature: User denied message signature."
  ) {
    return {
      error: errorMapping[4001],
      blocking: false,
      actionBlocked: false,
      rawError: error,
      txAction,
    }
  }

  // Try to parse the Pool error number from RPC provider revert error
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsedError = JSON.parse((error as any)?.error?.body)
    const parsedNumber = Number(parsedError.error.message.split(": ")[1])
    if (!isNaN(parsedNumber)) {
      errorNumber = parsedNumber
    }
  } catch {}

  const errorRender = errorMapping[errorNumber]

  if (errorRender) {
    return {
      error: errorRender,
      blocking,
      actionBlocked: true,
      rawError: error,
      txAction,
    }
  }

  return {
    error: undefined,
    blocking,
    actionBlocked: true,
    rawError: error,
    txAction,
  }
}

export const errorMapping: Record<number, ReactElement> = {
  // 1: <span>The caller of the function is not a pool admin</span>,
  // 2: <span>The caller of the function is not an emergency admin</span>,
  // 3: <span>The caller of the function is not a pool or emergency admin</span>,
  // 4: <span>The caller of the function is not a risk or pool admin</span>,
  // 5: <span>The caller of the function is not an asset listing or pool admin</span>,
  // 6: <span>The caller of the function is not a bridge</span>,
  7: <span>Pool addresses provider is not registered</span>,
  // 8: <span>Invalid id for the pool addresses provider</span>,
  9: <span>Address is not a contract</span>,
  // 10: <span>The caller of the function is not the pool configurator</span>,
  11: <span>The caller of the function is not an AToken</span>,
  12: <span>The address of the pool addresses provider is invalid</span>,
  13: <span>Invalid return value of the flashloan executor function</span>,
  // 14: <span>Reserve has already been added to reserve list</span>,
  // 15: <span>Maximum amount of reserves in the pool reached</span>,
  // 16: <span>Zero eMode category is reserved for volatile heterogeneous assets</span>,
  // 17: <span>Invalid eMode category assignment to asset</span>,
  // 18: <span>The liquidity of the reserve needs to be 0</span>,
  19: <span>Invalid flashloan premium</span>,
  // 20: <span>Invalid risk parameters for the reserve</span>,
  // 21: <span>Invalid risk parameters for the eMode category</span>,
  22: <span>Invalid bridge protocol fee</span>,
  23: <span>The caller of this function must be a pool</span>,
  24: <span>Invalid amount to mint</span>,
  25: <span>Invalid amount to burn</span>,
  26: <span>Amount must be greater than 0</span>,
  27: <span>Action requires an active reserve</span>,
  28: <span>Action cannot be performed because the reserve is frozen</span>,
  29: <span>Action cannot be performed because the reserve is paused</span>,
  30: <span>Borrowing is not enabled</span>,
  31: <span>Stable borrowing is not enabled</span>,
  32: <span>User cannot withdraw more than the available balance</span>,
  // 33: <span>Invalid interest rate mode selected</span>,
  34: <span>The collateral balance is 0</span>,
  35: <span>Health factor is lesser than the liquidation threshold</span>,
  36: <span>There is not enough collateral to cover a new borrow</span>,
  37: (
    <span>Collateral is (mostly) the same currency that is being borrowed</span>
  ),
  38: (
    <span>
      The requested amount is greater than the max loan size in stable rate mode
    </span>
  ),
  39: (
    <span>
      For repayment of a specific type of debt, the user needs to have debt that
      type
    </span>
  ),
  40: (
    <span>
      To repay on behalf of a user an explicit amount to repay is needed
    </span>
  ),
  41: (
    <span>User does not have outstanding stable rate debt on this reserve</span>
  ),
  42: (
    <span>
      User does not have outstanding variable rate debt on this reserve
    </span>
  ),
  43: <span>The underlying balance needs to be greater than 0</span>,
  44: <span>Interest rate rebalance conditions were not met</span>,
  45: <span>Health factor is not below the threshold</span>,
  46: <span>The collateral chosen cannot be liquidated</span>,
  47: <span>User did not borrow the specified currency</span>,
  48: <span>Borrow and repay in same block is not allowed</span>,
  49: <span>Inconsistent flashloan parameters</span>,
  50: <span>Borrow cap is exceeded</span>,
  51: <span>Supply cap is exceeded</span>,
  52: <span>Unbacked mint cap is exceeded</span>,
  53: <span>Debt ceiling is exceeded</span>,
  54: <span>AToken supply is not zero</span>,
  55: <span>Stable debt supply is not zero</span>,
  56: <span>Variable debt supply is not zero</span>,
  57: <span>Ltv validation failed</span>,
  // 58: <span>Inconsistent eMode category</span>,
  // 59: <span>Price oracle sentinel validation failed</span>,
  60: <span>Asset is not borrowable in isolation mode</span>,
  // 61: <span>Reserve has already been initialized</span>,
  62: <span>User is in isolation mode</span>,
  // 63: <span>Invalid ltv parameter for the reserve</span>,
  // 64: <span>Invalid liquidity threshold parameter for the reserve</span>,
  // 65: <span>Invalid liquidity bonus parameter for the reserve</span>,
  // 66: <span>Invalid decimals parameter of the underlying asset of the reserve</span>,
  // 67: <span>Invalid reserve factor parameter for the reserve</span>,
  // 68: <span>Invalid borrow cap for the reserve</span>,
  // 69: <span>Invalid supply cap for the reserve</span>,
  // 70: <span>Invalid liquidation protocol fee for the reserve</span>,
  // 71: <span>Invalid eMode category for the reserve</span>,
  // 72: <span>Invalid unbacked mint cap for the reserve</span>,
  // 73: <span>Invalid debt ceiling for the reserve</span>,
  // 74: <span>Invalid reserve index</span>,
  // 75: <span>ACL admin cannot be set to the zero address</span>,
  76: <span>Array parameters that should be equal length are not</span>,
  77: <span>Zero address not valid</span>,
  78: <span>Invalid expiration</span>,
  79: <span>Invalid signature</span>,
  80: <span>Operation not supported</span>,
  81: <span>Debt ceiling is not zero</span>,
  82: <span>Asset is not listed</span>,
  // 83: <span>Invalid optimal usage ratio</span>,
  // 84: <span>Invalid optimal stable to total debt ratio</span>,
  85: <span>The underlying asset cannot be rescued</span>,
  // 86: <span>Reserve has already been added to reserve list</span>,
  // 87: (
  //   <span>
  //     The token implementation pool address and the pool address provided by the initializing pool
  //     do not match
  //   </span>
  // ),
  88: <span>Stable borrowing is enabled</span>,
  89: (
    <span>User is trying to borrow multiple assets including a siloed one</span>
  ),
  // 90: <span>the total debt of the reserve needs to be</span>,

  4001: <span>You cancelled the transaction.</span>,
}
