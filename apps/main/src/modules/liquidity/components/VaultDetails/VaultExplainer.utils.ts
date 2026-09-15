import {
  BadgeDollarSign,
  CirclePause,
  Combine,
  HandCoins,
  MoveHorizontal,
  RefreshCw,
  SlidersHorizontal,
  WalletCards,
} from "@galacticcouncil/ui/assets/icons"
import type { TFunction } from "i18next"
import type { ComponentType } from "react"

import {
  isRangeScenario,
  type RangeScenario,
} from "@/modules/liquidity/components/VaultDetails/LiquidityDistribution.utils"

export { isRangeScenario }

export type ScenarioCopy = {
  title: string
  description: string
  facts: ReadonlyArray<{
    icon: ComponentType
    title: string
    description: string
  }>
}

export const getScenarioOptions = (
  t: TFunction<"liquidity">,
): ReadonlyArray<{ key: RangeScenario; label: string }> => [
  { key: "inRange", label: t("vaults.explainer.states.inRange") },
  { key: "outOfRange", label: t("vaults.explainer.states.outOfRange") },
  { key: "recentered", label: t("vaults.explainer.states.recentered") },
  { key: "limitOrder", label: t("vaults.explainer.states.limitOrder") },
]

export const getScenarioCopy = (
  t: TFunction<"liquidity">,
): Record<RangeScenario, ScenarioCopy> => ({
  inRange: {
    title: t("vaults.explainer.inRange.title"),
    description: t("vaults.explainer.inRange.description"),
    facts: [
      {
        icon: BadgeDollarSign,
        title: t("vaults.explainer.inRange.fees.title"),
        description: t("vaults.explainer.inRange.fees.description"),
      },
      {
        icon: SlidersHorizontal,
        title: t("vaults.explainer.inRange.ticks.title"),
        description: t("vaults.explainer.inRange.ticks.description"),
      },
    ],
  },
  outOfRange: {
    title: t("vaults.explainer.outOfRangeState.title"),
    description: t("vaults.explainer.outOfRangeState.description"),
    facts: [
      {
        icon: CirclePause,
        title: t("vaults.explainer.outOfRangeState.deposits.title"),
        description: t("vaults.explainer.outOfRangeState.deposits.description"),
      },
      {
        icon: WalletCards,
        title: t("vaults.explainer.outOfRangeState.withdraw.title"),
        description: t("vaults.explainer.outOfRangeState.withdraw.description"),
      },
    ],
  },
  recentered: {
    title: t("vaults.explainer.recentered.title"),
    description: t("vaults.explainer.recentered.description"),
    facts: [
      {
        icon: MoveHorizontal,
        title: t("vaults.explainer.recentered.range.title"),
        description: t("vaults.explainer.recentered.range.description"),
      },
      {
        icon: RefreshCw,
        title: t("vaults.explainer.recentered.compound.title"),
        description: t("vaults.explainer.recentered.compound.description"),
      },
    ],
  },
  limitOrder: {
    title: t("vaults.explainer.limitOrder.title"),
    description: t("vaults.explainer.limitOrder.description"),
    facts: [
      {
        icon: HandCoins,
        title: t("vaults.explainer.limitOrder.fill.title"),
        description: t("vaults.explainer.limitOrder.fill.description"),
      },
      {
        icon: Combine,
        title: t("vaults.explainer.limitOrder.fold.title"),
        description: t("vaults.explainer.limitOrder.fold.description"),
      },
    ],
  },
})
