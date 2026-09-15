import {
  Paper,
  PaperProps,
  SectionHeader,
  Separator,
} from "@galacticcouncil/ui/components"
import { useTranslation } from "react-i18next"

import { Markdown } from "@/components/Markdown"
import { useActivePropellerVault } from "@/modules/strategies/propeller/context/PropellerVaultContext"

export const AboutCard: React.FC<PaperProps> = (props) => {
  const { t } = useTranslation(["strategies", "propeller"])
  const { symbol, shareSymbol } = useActivePropellerVault()

  return (
    <Paper p="xl" {...props}>
      <SectionHeader
        title={t("strategies:about.title", {
          suffix: t("propeller:strategy.name", { symbol }),
        })}
        as="h2"
        noTopPadding
      />
      <Separator mx="-xl" mb="xl" />
      <Markdown
        id="propeller-vault"
        muted
        size="small"
        values={{ symbol, shareSymbol }}
      />
    </Paper>
  )
}
