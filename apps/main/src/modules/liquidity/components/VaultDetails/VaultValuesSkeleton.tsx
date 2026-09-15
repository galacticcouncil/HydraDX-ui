import { Flex, Separator, ValueStats } from "@galacticcouncil/ui/components"
import { pxToRem } from "@galacticcouncil/ui/utils"
import { useTranslation } from "react-i18next"

export const VaultValuesSkeleton = () => {
  const { t } = useTranslation(["common", "liquidity"])

  const rows = [
    t("liquidity:totalValueLocked"),
    t("liquidity:24hVolume"),
    t("liquidity:vaults.stats.apr"),
    t("liquidity:vaults.stats.sharePrice"),
    t("liquidity:vaults.stats.poolFee"),
    t("liquidity:vaults.stats.utilisation"),
    t("liquidity:vaults.stats.band"),
  ]

  return (
    <Flex
      direction="column"
      minWidth={pxToRem(260)}
      maxWidth={["none", "none", pxToRem(360)]}
      gap="xl"
    >
      {rows.map((label, index) => (
        <Flex key={label} direction="column" gap="xl">
          {index > 0 && <Separator mx="-xl" />}
          <ValueStats size="medium" label={label} value="0" isLoading wrap />
        </Flex>
      ))}
    </Flex>
  )
}
