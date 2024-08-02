import { useAssets } from "providers/assets"
import { useLbpPool } from "api/bonds"
import { useBestNumber } from "api/chain"
import IconBonds from "assets/icons/Bonds.svg?react"
import { SubNavigationTabLink } from "components/Layout/SubNavigation/SubNavigation"
import { useRpcProvider } from "providers/rpcProvider"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { LINKS } from "utils/navigation"

export const BondsTabLink = () => {
  const { t } = useTranslation()
  const { isLoaded } = useRpcProvider()
  const { bonds } = useAssets()

  const lbpPool = useLbpPool()
  const bestNumber = useBestNumber()

  const currentBlockNumber = bestNumber.data?.relaychainBlockNumber.toNumber()

  const isActive = useMemo(() => {
    if (!isLoaded) return false
    if (bonds) {
      return bonds.some((bond) => {
        const pool = lbpPool.data?.find((pool) =>
          pool.assets.some((assetId: number) => assetId === Number(bond.id)),
        )

        if (currentBlockNumber && pool && pool.start && pool.end) {
          return (
            currentBlockNumber > Number(pool.start) &&
            currentBlockNumber < Number(pool.end)
          )
        }

        return false
      })
    }
  }, [bonds, currentBlockNumber, isLoaded, lbpPool.data])

  return (
    <SubNavigationTabLink
      to={LINKS.bonds}
      icon={<IconBonds />}
      label={t("header.trade.bonds.title")}
      badge={isActive ? t("header.trade.active") : ""}
    />
  )
}
