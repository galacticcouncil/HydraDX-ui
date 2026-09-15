import { ValueStats } from "@galacticcouncil/ui/components"
import Big from "big.js"
import { useTranslation } from "react-i18next"

import { PoolsHeaderSeparator } from "@/modules/liquidity/components/PoolsHeader/PoolsHeaderSeparator"
import { useVaults } from "@/modules/liquidity/Vaults.utils"

const useVaultTotals = () => {
  const { data, isLoading } = useVaults()

  const totals = data.reduce(
    (acc, vault) => ({
      vaults: vault.vaultTvlDisplay
        ? acc.vaults.plus(vault.vaultTvlDisplay)
        : acc.vaults,
      pools: vault.tvlDisplay ? acc.pools.plus(vault.tvlDisplay) : acc.pools,
    }),
    { vaults: Big(0), pools: Big(0) },
  )

  return { ...totals, isLoading, hasVaults: data.length > 0 }
}

type VaultsValueTileProps = {
  /** Also show pool TVL (concentrated liquidity tab). */
  withPoolValue?: boolean
}

export const VaultsValueTile = ({
  withPoolValue = false,
}: VaultsValueTileProps) => {
  const { t } = useTranslation(["liquidity", "common"])
  const { vaults, pools, isLoading, hasVaults } = useVaultTotals()

  if (!withPoolValue && !hasVaults) return null

  return (
    <>
      <ValueStats
        label={t("liquidity:header.valueInVaults")}
        value={t("common:currency.compact", { value: vaults })}
        isLoading={isLoading}
        size="medium"
        wrap
      />
      <PoolsHeaderSeparator />
      {withPoolValue && (
        <ValueStats
          label={t("liquidity:vaults.column.poolLiquidity")}
          value={t("common:currency.compact", { value: pools })}
          isLoading={isLoading}
          size="medium"
          wrap
        />
      )}
    </>
  )
}
