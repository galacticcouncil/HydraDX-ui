import { normalizeBN, RAY, rayDiv, rayMul } from "@aave/math-utils"
import { BigNumber } from "bignumber.js"

type InterestRateModelType = {
  variableRateSlope1: string
  variableRateSlope2: string
  stableRateSlope1: string
  stableRateSlope2: string
  stableBorrowRateEnabled?: boolean
  optimalUsageRatio: string
  utilizationRate: string
  baseVariableBorrowRate: string
  baseStableBorrowRate: string
  totalLiquidityUSD: string
  totalDebtUSD: string
}

type Rate = {
  stableRate: number
  variableRate: number
  utilization: number
}

const resolution = 200
const step = 100 / resolution

export function getRates({
  variableRateSlope1,
  variableRateSlope2,
  stableRateSlope1,
  stableRateSlope2,
  optimalUsageRatio,
  baseVariableBorrowRate,
  baseStableBorrowRate,
}: InterestRateModelType): Rate[] {
  const rates: Rate[] = []
  const formattedOptimalUtilizationRate = normalizeBN(
    optimalUsageRatio,
    25,
  ).toNumber()

  for (let i = 0; i <= resolution; i++) {
    const utilization = i * step
    // When zero
    if (utilization === 0) {
      rates.push({
        stableRate: 0,
        variableRate: 0,
        utilization,
      })
    }
    // When hovering below optimal utilization rate, actual data
    else if (utilization < formattedOptimalUtilizationRate) {
      const theoreticalStableAPY = normalizeBN(
        new BigNumber(baseStableBorrowRate).plus(
          rayDiv(
            rayMul(stableRateSlope1, normalizeBN(utilization, -25)),
            optimalUsageRatio,
          ),
        ),
        27,
      ).toNumber()
      const theoreticalVariableAPY = normalizeBN(
        new BigNumber(baseVariableBorrowRate).plus(
          rayDiv(
            rayMul(variableRateSlope1, normalizeBN(utilization, -25)),
            optimalUsageRatio,
          ),
        ),
        27,
      ).toNumber()
      rates.push({
        stableRate: theoreticalStableAPY,
        variableRate: theoreticalVariableAPY,
        utilization,
      })
    }
    // When hovering above optimal utilization rate, hypothetical predictions
    else {
      const excess = rayDiv(
        normalizeBN(utilization, -25).minus(optimalUsageRatio),
        RAY.minus(optimalUsageRatio),
      )
      const theoreticalStableAPY = normalizeBN(
        new BigNumber(baseStableBorrowRate)
          .plus(stableRateSlope1)
          .plus(rayMul(stableRateSlope2, excess)),
        27,
      ).toNumber()
      const theoreticalVariableAPY = normalizeBN(
        new BigNumber(baseVariableBorrowRate)
          .plus(variableRateSlope1)
          .plus(rayMul(variableRateSlope2, excess)),
        27,
      ).toNumber()
      rates.push({
        stableRate: theoreticalStableAPY,
        variableRate: theoreticalVariableAPY,
        utilization,
      })
    }
  }
  return rates
}
