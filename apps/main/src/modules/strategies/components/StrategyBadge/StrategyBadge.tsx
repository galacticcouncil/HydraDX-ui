import { Chip, ChipProps } from "@galacticcouncil/ui/components"
import { useTranslation } from "react-i18next"

export enum StrategyBadgeType {
  FixedYield = "fixedYield",
  Partnership = "partnership",
  RWA = "rwa",
  Leverage = "leverage",
  NoLiquidation = "noLiquidation",
  PropellerVault = "propellerVault",
}

const variantConfig: Record<StrategyBadgeType, ChipProps["variant"]> = {
  [StrategyBadgeType.FixedYield]: "blue",
  [StrategyBadgeType.Partnership]: "green",
  [StrategyBadgeType.RWA]: "purple",
  [StrategyBadgeType.Leverage]: "amber",
  [StrategyBadgeType.NoLiquidation]: "cyan",
  [StrategyBadgeType.PropellerVault]: "pink",
}

type StrategyBadgeProps = Omit<ChipProps, "variant" | "children"> & {
  type: StrategyBadgeType
}

export const StrategyBadge: React.FC<StrategyBadgeProps> = ({
  type,
  ...props
}) => {
  const { t } = useTranslation("strategies")

  return (
    <Chip variant={variantConfig[type]} rounded {...props}>
      {t(`badge.${type}`)}
    </Chip>
  )
}
