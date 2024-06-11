import {
  calculate_liquidity_hub_in,
  calculate_shares,
  verify_asset_cap,
} from "@galacticcouncil/math-omnipool"
import { useTokenBalance, useTokensBalances } from "api/balances"
import { useMaxAddLiquidityLimit } from "api/consts"
import {
  useOmnipoolAsset,
  useOmnipoolFee,
  useOmnipoolMinLiquidity,
} from "api/omnipool"
import BigNumber from "bignumber.js"
import { useMemo } from "react"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { OMNIPOOL_ACCOUNT_ADDRESS } from "utils/api"
import { BN_10 } from "utils/constants"
import { useDisplayPrice } from "utils/displayAsset"
import { useRpcProvider } from "providers/rpcProvider"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { maxBalance, positive, required } from "utils/validators"

export const useZodSchema = (assetId: string) => {
  const { t } = useTranslation()
  const { account } = useAccount()
  const { assets } = useRpcProvider()

  const { decimals, symbol } = assets.getAsset(assetId)

  const { data: minPoolLiquidity } = useOmnipoolMinLiquidity()

  const { data: assetBalance } = useTokenBalance(assetId, account?.address)

  const { data: omnipoolAsset } = useOmnipoolAsset(assetId)
  const { data: hubBalance } = useTokenBalance(
    assets.hub.id,
    OMNIPOOL_ACCOUNT_ADDRESS,
  )
  const { data: poolBalance } = useTokenBalance(
    assetId,
    OMNIPOOL_ACCOUNT_ADDRESS,
  )
  const { data: maxAddLiquidityLimit } = useMaxAddLiquidityLimit()

  if (
    assetBalance === undefined ||
    minPoolLiquidity === undefined ||
    omnipoolAsset === undefined ||
    hubBalance === undefined ||
    poolBalance === undefined ||
    maxAddLiquidityLimit === undefined
  )
    return undefined

  const assetReserve = poolBalance.balance.toString()
  const assetHubReserve = omnipoolAsset.hubReserve.toString()
  const assetShares = omnipoolAsset.shares.toString()
  const assetCap = omnipoolAsset.cap.toString()
  const totalHubReserve = hubBalance.total.toString()

  const circuitBreakerLimit = maxAddLiquidityLimit
    .multipliedBy(assetReserve)
    .shiftedBy(-decimals)

  return z.object({
    amount: required
      .pipe(positive)
      .pipe(maxBalance(assetBalance.balance, decimals))
      .refine(
        (value) => BigNumber(value).shiftedBy(decimals).gte(minPoolLiquidity),
        {
          message: t("liquidity.add.modal.validation.minPoolLiquidity"),
        },
      )
      .refine(
        (value) => {
          if (!value) return true

          const hubIn = calculate_liquidity_hub_in(
            assetReserve,
            assetHubReserve,
            assetShares,
            BigNumber(value).shiftedBy(decimals).toString(),
          )

          const isWithinLimit = verify_asset_cap(
            assetHubReserve,
            assetCap,
            hubIn,
            totalHubReserve,
          )

          return isWithinLimit
        },
        {
          message: t("liquidity.add.modal.warningLimit.cap"),
          path: ["cap"],
        },
      )
      .refine(
        (value) => {
          if (!value) return true

          const isWithinCircuitBreakerLimit =
            BigNumber(circuitBreakerLimit).gte(value)

          return isWithinCircuitBreakerLimit
        },
        {
          message: t("liquidity.add.modal.warningLimit.circuitBreaker", {
            amount: circuitBreakerLimit,
            symbol,
          }),
          path: ["circuitBreaker"],
        },
      ),
  })
}

export const useXYKZodSchema = (assetAId: string, assetBId: string) => {
  const { account } = useAccount()
  const { assets } = useRpcProvider()

  const [{ data: assetABalance }, { data: assetBBalance }] = useTokensBalances(
    [assetAId, assetBId],
    account?.address,
  )

  const [assetAMeta, assetBMeta] = assets.getAssets([assetAId, assetBId])

  if (assetABalance === undefined || assetBBalance === undefined)
    return undefined

  return z.object({
    assetA: required
      .pipe(positive)
      .pipe(maxBalance(assetABalance.balance, assetAMeta.decimals)),

    assetB: required
      .pipe(positive)
      .pipe(maxBalance(assetBBalance.balance, assetBMeta.decimals)),
  })
}

export const useAddLiquidity = (assetId: string, assetValue?: string) => {
  const { assets } = useRpcProvider()
  const omnipoolBalance = useTokenBalance(assetId, OMNIPOOL_ACCOUNT_ADDRESS)
  const ommipoolAsset = useOmnipoolAsset(assetId)
  const assetMeta = assets.getAsset(assetId)

  const { data: spotPrice } = useDisplayPrice(assetId)

  const { data: omnipoolFee } = useOmnipoolFee()

  const calculatedShares = useMemo(() => {
    if (ommipoolAsset.data && assetValue && assetMeta) {
      const { hubReserve, shares } = ommipoolAsset.data

      const assetReserve = omnipoolBalance.data?.balance.toString()
      const amount = BigNumber(assetValue)
        .multipliedBy(BN_10.pow(assetMeta.decimals))
        .toString()

      if (assetReserve && hubReserve && shares && amount) {
        return calculate_shares(
          assetReserve,
          hubReserve.toString(),
          shares.toString(),
          amount,
        )
      }
    }
    return null
  }, [omnipoolBalance, assetValue, ommipoolAsset, assetMeta])

  return { calculatedShares, spotPrice, omnipoolFee, assetMeta }
}

export const getXYKPoolShare = (
  total: BigNumber | undefined,
  add: BigNumber | undefined,
) => {
  if (!total || !add) return undefined

  return add.div(total.plus(add)).multipliedBy(100)
}
