import { Select } from "@galacticcouncil/ui/components"
import { useBreakpoints } from "@galacticcouncil/ui/theme"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

import { TabMenu } from "@/components/TabMenu"
import { LINKS } from "@/config/navigation"

export const PoolTypeTabs = () => {
  const { t } = useTranslation("liquidity")
  const { isMobile } = useBreakpoints()
  const navigate = useNavigate()
  const search = useSearch({
    from: "/liquidity/",
  })

  const poolTypes = [
    {
      key: "all" as const,
      label: t("tab.allPools"),
    },
    { key: "vaults" as const, label: t("tab.vaults") },
    {
      key: "omnipoolStablepool" as const,
      label: t("tab.omnipoolStablepool"),
    },
    {
      key: "isolated" as const,
      label: t("tab.isolatedPools"),
    },
  ]

  if (isMobile) {
    return (
      <Select
        value={search?.type}
        items={poolTypes}
        onValueChange={(value) =>
          navigate({
            to: LINKS.liquidity,
            search: {
              myLiquidity: search?.myLiquidity,
              type: value as
                | "all"
                | "omnipoolStablepool"
                | "isolated"
                | "vaults",
            },
          })
        }
      />
    )
  }

  return (
    <TabMenu
      size="medium"
      variant="muted"
      items={[
        {
          to: LINKS.liquidity,
          search: { type: "all", myLiquidity: search?.myLiquidity },
          title: t("tab.allPools"),
        },
        {
          to: LINKS.liquidity,
          search: {
            type: "vaults" as const,
            myLiquidity: search?.myLiquidity,
          },
          title: t("tab.vaults"),
        },
        {
          to: LINKS.liquidity,
          search: {
            type: "omnipoolStablepool",
            myLiquidity: search?.myLiquidity,
          },
          title: t("tab.omnipoolStablepool"),
        },
        {
          to: LINKS.liquidity,
          search: {
            type: "isolated",
            myLiquidity: search?.myLiquidity,
          },
          title: t("tab.isolatedPools"),
        },
      ]}
    />
  )
}
