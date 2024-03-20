import { ChainId } from "@aave/contract-helpers"
import {
  BigNumberValue,
  USD_DECIMALS,
  valueToBigNumber,
} from "@aave/math-utils"
import BigNumber from "bignumber.js"
import { Provider } from "@ethersproject/providers"
import { theme } from "theme"

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

export interface ProviderWithSend extends Provider {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  send<P = any, R = any>(method: string, params: Array<P>): Promise<R>
}

export function hexToAscii(_hex: string): string {
  const hex = _hex.toString()
  let str = ""
  for (let n = 0; n < hex.length; n += 2) {
    str += String.fromCharCode(parseInt(hex.substr(n, 2), 16))
  }
  return str
}

export interface CancelablePromise<T = unknown> {
  promise: Promise<T>
  cancel: () => void
}

export const makeCancelable = <T>(promise: Promise<T>) => {
  let hasCanceled_ = false

  const wrappedPromise = new Promise<T>((resolve, reject) => {
    promise.then(
      (val) => (hasCanceled_ ? reject({ isCanceled: true }) : resolve(val)),
      (error) => (hasCanceled_ ? reject({ isCanceled: true }) : reject(error)),
    )
  })

  return {
    promise: wrappedPromise,
    cancel() {
      hasCanceled_ = true
    },
  }
}

export const optimizedPath = (currentChainId: ChainId) => {
  return (
    currentChainId === ChainId.arbitrum_one ||
    currentChainId === ChainId.arbitrum_rinkeby ||
    currentChainId === ChainId.optimism
    // ||
    // currentChainId === ChainId.optimism_kovan
  )
}

// Overrides for minimum base token remaining after performing an action
export const minBaseTokenRemainingByNetwork: Record<number, string> = {
  [ChainId.optimism]: "0.0001",
  [ChainId.arbitrum_one]: "0.0001",
}

export const amountToUsd = (
  amount: BigNumberValue,
  formattedPriceInMarketReferenceCurrency: string,
  marketReferencePriceInUsd: string,
) => {
  return valueToBigNumber(amount)
    .multipliedBy(formattedPriceInMarketReferenceCurrency)
    .multipliedBy(marketReferencePriceInUsd)
    .shiftedBy(-USD_DECIMALS)
}

export const roundToTokenDecimals = (
  inputValue: string,
  tokenDecimals: number,
) => {
  const [whole, decimals] = inputValue.split(".")

  // If there are no decimal places or the number of decimal places is within the limit
  if (!decimals || decimals.length <= tokenDecimals) {
    return inputValue
  }

  // Truncate the decimals to the specified number of token decimals
  const adjustedDecimals = decimals.slice(0, tokenDecimals)

  // Combine the whole and adjusted decimal parts
  return whole + "." + adjustedDecimals
}

export const withoutHexPrefix = (value: string) => {
  return value.startsWith("0x") ? value.slice(2) : value
}

export const withHexPrefix = (value: string) => {
  return value.startsWith("0x") ? value : "0x" + value
}

export const getFunctionDefsFromAbi = (abi: any[], method: string) => {
  try {
    const defs = abi.filter(
      (item) => item.type === "function" && item.name === method,
    )
    return JSON.stringify(defs)
  } catch (err) {}
}

export const getHealthFactorColor = (hf: number | string) => {
  const formattedHealthFactor = Number(
    valueToBigNumber(hf).toFixed(2, BigNumber.ROUND_DOWN),
  )

  let healthFactorColor = ""
  if (formattedHealthFactor >= 3) {
    healthFactorColor = theme.colors.green400
  } else if (formattedHealthFactor < 1.1) {
    healthFactorColor = theme.colors.red400
  } else {
    healthFactorColor = theme.colors.warning300
  }

  return healthFactorColor
}

export const getLtvColor = (
  loanToValue: number | string,
  currentLoanToValue: number | string,
  currentLiquidationThreshold: number | string,
) => {
  let ltvColor: string = theme.colors.green400
  const ltvPercent = Number(loanToValue) * 100
  const currentLtvPercent = Number(currentLoanToValue) * 100
  const liquidationThresholdPercent = Number(currentLiquidationThreshold) * 100
  if (ltvPercent >= Math.min(currentLtvPercent, liquidationThresholdPercent)) {
    ltvColor = theme.colors.red400
  } else if (
    ltvPercent > currentLtvPercent / 2 &&
    ltvPercent < currentLtvPercent
  ) {
    ltvColor = theme.colors.warning300
  }

  return ltvColor
}
