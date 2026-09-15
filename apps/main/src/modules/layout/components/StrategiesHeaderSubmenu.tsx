import { ArrowRight } from "@galacticcouncil/ui/assets/icons"
import { Box, Icon, Text } from "@galacticcouncil/ui/components"
import { getToken } from "@galacticcouncil/ui/utils"
import { BIL_ERC20_ID, HOLLAR_ASSET_ID } from "@galacticcouncil/utils"
import { Link } from "@tanstack/react-router"

import { AssetLogo } from "@/components/AssetLogo"
import { SDetailedLink } from "@/components/DetailedLink/DetailedLink.styled"
import { InternalNavigationItem, NavigationKey } from "@/config/navigation"
import { useMenuTranslations } from "@/modules/layout/components/HeaderMenu.utils"
import { PROPELLER_VAULTS } from "@/modules/strategies/propeller/config/vaults"
import { useAssets } from "@/providers/assetsProvider"
import { useRpcProvider } from "@/providers/rpcProvider"

const STRATEGY_ASSET_ICON_BY_KEY: Partial<Record<NavigationKey, string>> = {
  strategiesBil: BIL_ERC20_ID,
  strategiesHollarBonds: HOLLAR_ASSET_ID,
  strategiesPropellerEth: PROPELLER_VAULTS.eth.assetId,
  strategiesPropellerTbtc: PROPELLER_VAULTS.tbtc.assetId,
}

type Props = {
  readonly items: InternalNavigationItem[]
}

export const StrategiesHeaderSubmenu: React.FC<Props> = ({ items }) => {
  const translations = useMenuTranslations()
  const { isReady } = useRpcProvider()
  const { getAsset } = useAssets()

  return items.map(({ key, to, search }) => {
    const assetIconId = STRATEGY_ASSET_ICON_BY_KEY[key]
    const showAssetIcon = isReady && assetIconId && !!getAsset(assetIconId)

    return (
      <SDetailedLink key={key} asChild>
        <Link to={to} search={search}>
          {showAssetIcon ? (
            <AssetLogo id={assetIconId} size="medium" hideChain />
          ) : null}
          <Box>
            <Text fw={600} fs="p4" lh={1.4}>
              {translations[key].title}
            </Text>
            {translations[key].description && (
              <Text fs="p5" lh={1.25} color={getToken("text.low")}>
                {translations[key].description}
              </Text>
            )}
          </Box>
          <Icon
            size="m"
            component={ArrowRight}
            ml="auto"
            color={getToken("icons.onSurface")}
          />
        </Link>
      </SDetailedLink>
    )
  })
}
