import { interpolationFormat } from "@galacticcouncil/utils"
import i18next from "i18next"
import { initReactI18next } from "react-i18next"

import borrow from "@/i18n/locales/en/borrow.json"
import common from "@/i18n/locales/en/common.json"
import liquidity from "@/i18n/locales/en/liquidity.json"
import onramp from "@/i18n/locales/en/onramp.json"
import propeller from "@/i18n/locales/en/propeller.json"
import staking from "@/i18n/locales/en/staking.json"
import stats from "@/i18n/locales/en/stats.json"
import strategies from "@/i18n/locales/en/strategies.json"
import trade from "@/i18n/locales/en/trade.json"
import wallet from "@/i18n/locales/en/wallet.json"
import xcm from "@/i18n/locales/en/xcm.json"

export const defaultNS = "common"
export const resources = {
  en: {
    common,
    liquidity,
    trade,
    wallet,
    borrow,
    staking,
    xcm,
    stats,
    strategies,
    onramp,
    propeller,
  },
} as const

const i18n = i18next.createInstance()

i18n.use(initReactI18next).init({
  defaultNS,
  resources,
  fallbackLng: "en",
  lng: "en",
  interpolation: {
    format: interpolationFormat,
    escapeValue: false,
  },
})

export default i18n
