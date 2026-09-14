import { useAccount } from "@galacticcouncil/web3-connect"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { hoursToMilliseconds, minutesToMilliseconds } from "date-fns"
import { useEffect } from "react"
import * as z from "zod/v4"

import { TAssetData } from "@/api/assets"
import { useAccountBalances } from "@/api/balances"
import { useTradeForm } from "@/modules/trade/swap/lib/useTradeForm"
import { useAssets } from "@/providers/assetsProvider"
import {
  positive,
  positiveOptional,
  requiredObject,
  useValidateFormMaxBalance,
  validateAssetSellOnly,
} from "@/utils/validators"

export const EXPIRY_OPTIONS = ["15min", "30min", "1h", "1d", "open"] as const
export type ExpiryOption = (typeof EXPIRY_OPTIONS)[number]

/** `open` is absent on purpose - it submits without a deadline. */
export const EXPIRY_MS: Partial<Record<ExpiryOption, number>> = {
  "15min": minutesToMilliseconds(15),
  "30min": minutesToMilliseconds(30),
  "1h": minutesToMilliseconds(60),
  "1d": hoursToMilliseconds(24),
}

const schemaBase = z.object({
  sellAsset: requiredObject<TAssetData>(),
  sellAmount: positive,
  buyAsset: requiredObject<TAssetData>().check(validateAssetSellOnly),
  buyAmount: positiveOptional,
  limitPrice: positiveOptional,
  expiry: z.enum(EXPIRY_OPTIONS),
  partiallyFillable: z.boolean(),
  isLocked: z.boolean(),
  lastTwo: z.tuple([
    z.enum(["sell", "buy", "price"]),
    z.enum(["sell", "buy", "price"]),
  ]),
})

export type LimitFormValues = z.infer<typeof schemaBase>

const useSchema = () => {
  const { account } = useAccount()
  const refineMaxBalance = useValidateFormMaxBalance()

  if (!account) {
    return schemaBase
  }

  return schemaBase.check(
    refineMaxBalance("sellAmount", (form) => [form.sellAsset, form.sellAmount]),
  )
}

type Args = {
  readonly assetIn: string
  readonly assetOut: string
}

export const useLimitForm = ({ assetIn, assetOut }: Args) => {
  const { account } = useAccount()
  const { getAsset } = useAssets()
  const { isBalanceLoading } = useAccountBalances()

  const defaultValues: LimitFormValues = {
    sellAsset: getAsset(assetIn) ?? null,
    sellAmount: "",
    buyAsset: getAsset(assetOut) ?? null,
    buyAmount: "",
    limitPrice: "",
    expiry: "open",
    partiallyFillable: true,
    isLocked: false,
    lastTwo: ["price", "sell"],
  }

  const form = useTradeForm<LimitFormValues>({
    defaultValues,
    mode: "onChange",
    resolver: standardSchemaResolver(useSchema()),
  })

  const { trigger, getValues } = form

  useEffect(() => {
    const { sellAsset, sellAmount } = getValues()

    if (!account || !sellAsset || !sellAmount) {
      return
    }

    if (isBalanceLoading) {
      return
    }

    trigger("sellAmount")
  }, [account, isBalanceLoading, trigger, getValues])

  return form
}
