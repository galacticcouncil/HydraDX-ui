import BigNumber from "bignumber.js"
import i18n from "i18next"
import { z } from "zod"

export const required = z.string().trim().min(1, i18n.t("error.required"))

export const validNumber = z
  .string()
  .refine((value) => !BigNumber(value).isNaN(), i18n.t("error.validNumber"))

export const positive = z
  .string()
  .pipe(validNumber)
  .refine((value) => BigNumber(value).gt(0), i18n.t("error.positive"))

export const maxBalance = (balance: BigNumber, decimals: number) => {
  return z
    .string()
    .pipe(positive)
    .refine(
      (value) =>
        Number.isFinite(decimals) &&
        BigNumber(value).lte(balance.shiftedBy(-decimals)),
      i18n.t("error.maxBalance"),
    )
}

export const noWhitespace = z
  .string()
  .refine((s) => !/\s/gi.test(s), i18n.t("error.whitespace"))
