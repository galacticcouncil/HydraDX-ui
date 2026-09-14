import {
  getTimeFrameMillis,
  getTimeFrameSchema,
  TIME_FRAME_MS,
  TimeFrame,
  TimeFrameType,
  timeFrameTypes,
} from "@galacticcouncil/main/src/components/TimeFrame/TimeFrame.utils"
import { Account, useAccount } from "@galacticcouncil/web3-connect"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { useQueryClient } from "@tanstack/react-query"
import Big from "big.js"
import { millisecondsInDay, millisecondsInHour } from "date-fns/constants"
import { useEffect } from "react"
import { FieldPath } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod/v4"

import { useAccountBalances } from "@/api/balances"
import { minimumOrderBudgetQuery } from "@/api/trade"
import i18n from "@/i18n"
import { useTradeForm } from "@/modules/trade/swap/lib/useTradeForm"
import { TAsset, useAssets } from "@/providers/assetsProvider"
import { useRpcProvider } from "@/providers/rpcProvider"
import { scaleHuman } from "@/utils/formatting"
import {
  maxBalanceError,
  positiveOptional,
  requiredObject,
  validateMaxBalance,
  validNumber,
} from "@/utils/validators"

export const MIN_DCA_ORDERS = 3
// once per block (600) and accounted for a buffer
const MAX_DCA_ORDERS_PER_HOUR = 540

export const getAbsoluteMaxDcaOrders = (duration: TimeFrame): number => {
  const hours = getTimeFrameMillis(duration) / millisecondsInHour

  return hours * MAX_DCA_ORDERS_PER_HOUR
}

export enum DcaOrdersMode {
  Custom = "Custom",
  Auto = "Auto",
  OpenBudget = "OpenBudget",
}

const ordersSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal(DcaOrdersMode.Custom),
    value: validNumber
      .min(MIN_DCA_ORDERS, {
        error: i18n.t("trade:dca.errors.minOrders", { count: MIN_DCA_ORDERS }),
      })
      .nullable(),
  }),
  z.object({
    type: z.literal(DcaOrdersMode.Auto),
    value: z.never().optional(),
  }),
  z.object({
    type: z.literal(DcaOrdersMode.OpenBudget),
    useSplitTrade: z.boolean(),
  }),
])

export type DcaOrders = z.infer<typeof ordersSchema>

export const dcaTimeFrameTypes = timeFrameTypes.filter(
  (type) => type !== "minute" && type !== "month",
)

const schemaBase = z.object({
  sellAsset: requiredObject<TAsset>(),
  sellAmount: positiveOptional,
  buyAsset: requiredObject<TAsset>(),
  duration: getTimeFrameSchema(dcaTimeFrameTypes),
  orders: ordersSchema,
  limitEnabled: z.boolean(),
  limitPrice: positiveOptional,
})

const MAX_OPEN_BUDGET_YEAR_FRAME = 1
const MAX_YEAR_FRAME = 5
const MAX_TIME_FRAME_MS = millisecondsInDay * MAX_YEAR_FRAME * 365
const MAX_OPEN_BUDGET_TIME_FRAME_MS =
  millisecondsInDay * MAX_OPEN_BUDGET_YEAR_FRAME * 365

export type DcaFormValues = z.infer<typeof schemaBase>
export type DcaDuration = DcaFormValues["duration"]

const schema = schemaBase
  .superRefine(({ duration, orders }, { addIssue }) => {
    if (orders.type !== DcaOrdersMode.Custom) {
      return
    }

    const maxOrders = getAbsoluteMaxDcaOrders(duration)

    if (orders.value && orders.value > maxOrders) {
      addIssue({
        code: "custom",
        message: i18n.t("trade:dca.errors.maxOrders", { count: maxOrders }),
        path: ["orders.value" satisfies FieldPath<DcaFormValues>],
      })
    }
  })
  .superRefine((data, { addIssue }) => {
    const { duration, orders } = data

    const isOpenBudget = orders.type === DcaOrdersMode.OpenBudget
    const maxMillis = isOpenBudget
      ? MAX_OPEN_BUDGET_TIME_FRAME_MS
      : MAX_TIME_FRAME_MS

    const { type, value } = duration
    const millis = TIME_FRAME_MS[type] * (value ?? 0)
    if (millis > maxMillis) {
      const maxInUnit = Math.floor(maxMillis / TIME_FRAME_MS[type])

      const valueFormatted = i18n.t(type as TimeFrameType, {
        count: maxInUnit,
      })
      addIssue({
        code: "custom",
        path: ["duration.value"],
        message: i18n.t(
          isOpenBudget
            ? "error.timeFrameIntervalMax"
            : "error.timeFrameDurationMax",
          { value: valueFormatted },
        ),
      })
    }
  })
  .superRefine(({ limitEnabled, limitPrice }, { addIssue }) => {
    if (limitEnabled && (!limitPrice || Big(limitPrice).lte(0))) {
      addIssue({
        code: "custom",
        path: ["limitPrice" satisfies FieldPath<DcaFormValues>],
        message: i18n.t("trade:dca.errors.limitPriceRequired"),
      })
    }
  })

const useSchema = (
  account: Account | null,
  limitOrderMaxBalance: string,
  openBudgetOrderMaxBalance: string,
) => {
  const { t } = useTranslation(["common", "trade"])
  const rpc = useRpcProvider()
  const queryClient = useQueryClient()

  const { getTransferableBalance } = useAccountBalances()

  if (!account) {
    return schema
  }

  const minBudgetSchema = schema
    .refine(
      (form) => {
        return validateMaxBalance(
          form.orders.type === DcaOrdersMode.OpenBudget
            ? openBudgetOrderMaxBalance
            : limitOrderMaxBalance,
          form.sellAmount,
        )
      },
      {
        error: maxBalanceError,
        path: ["sellAmount"],
      },
    )
    .check(async (ctx) => {
      const { sellAsset, sellAmount, orders } = ctx.value

      if (!sellAsset || !sellAmount) {
        return
      }

      const isOpenBudget = orders.type === DcaOrdersMode.OpenBudget

      {
        const minAmount = await queryClient.ensureQueryData(
          minimumOrderBudgetQuery(rpc, sellAsset.id, sellAsset.decimals),
        )

        const minAmountHuman = scaleHuman(
          // min amount for open budget is 500 HDX, vs 1000 HDX for limited budget
          (isOpenBudget ? minAmount / 2n : minAmount).toString(),
          sellAsset.decimals,
        )

        const isValid = Big(sellAmount).gte(minAmountHuman)

        if (!isValid) {
          ctx.issues.push({
            code: "custom",
            input: sellAmount,
            path: ["sellAmount" satisfies keyof DcaFormValues],
            message: t("trade:dca.errors.minBudgetTooLow", {
              value: t("currency", {
                value: minAmountHuman,
                symbol: sellAsset.symbol,
              }),
            }),
          })
        }
      }

      if (!isOpenBudget) {
        return
      }

      const minAmount = Big(getTransferableBalance(sellAsset.id).toString())
        .div(MIN_DCA_ORDERS)
        .toString()

      const minAmountHuman = scaleHuman(
        minAmount.toString(),
        sellAsset.decimals,
      )

      const isValid = Big(sellAmount).lte(minAmountHuman)

      if (isValid) {
        return
      }

      ctx.issues.push({
        code: "custom",
        input: sellAmount,
        path: ["sellAmount" satisfies keyof DcaFormValues],
        message: t("trade:dca.errors.minTrades"),
      })
    })

  return minBudgetSchema
}

type Args = {
  readonly assetIn: string
  readonly assetOut: string
  readonly limitOrderMaxBalance: string
  readonly openBudgetOrderMaxBalance: string
}

export const useDcaForm = ({
  assetIn,
  assetOut,
  limitOrderMaxBalance,
  openBudgetOrderMaxBalance,
}: Args) => {
  const { account } = useAccount()
  const { getAsset } = useAssets()
  const { isBalanceLoading } = useAccountBalances()

  const defaultValues: DcaFormValues = {
    sellAsset: getAsset(assetIn) ?? null,
    sellAmount: "",
    buyAsset: getAsset(assetOut) ?? null,
    duration: DEFAULT_DCA_DURATION,
    orders: {
      type: DcaOrdersMode.Auto,
    },
    limitEnabled: false,
    limitPrice: "",
  }

  const form = useTradeForm<DcaFormValues>({
    mode: "onChange",
    defaultValues,
    resolver: standardSchemaResolver(
      useSchema(account, limitOrderMaxBalance, openBudgetOrderMaxBalance),
    ),
  })

  const { trigger, getValues } = form

  useEffect(() => {
    const { sellAsset, buyAsset } = getValues()

    if (!account || !sellAsset || !buyAsset) {
      return
    }

    if (!isBalanceLoading) {
      trigger("sellAmount")
    }
  }, [account, isBalanceLoading, trigger, getValues])

  return form
}

export const DEFAULT_DCA_DURATION: DcaDuration = {
  type: "day",
  value: 1,
}
