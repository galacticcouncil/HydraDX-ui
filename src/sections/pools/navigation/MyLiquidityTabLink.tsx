import { useAccountBalances } from "api/accountBalances"
import { useAssets } from "providers/assets"
import { useAccountPositions } from "api/deposits"
import UserIcon from "assets/icons/UserIcon.svg?react"
import { SubNavigationTabLink } from "components/Layout/SubNavigation/SubNavigation"
import { SSeparator } from "components/Separator/Separator.styled"
import { useRpcProvider } from "providers/rpcProvider"
import { useTranslation } from "react-i18next"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { theme } from "theme"
import { LINKS } from "utils/navigation"

export const MyLiquidity = () => {
  const { t } = useTranslation()
  const { account } = useAccount()
  const { getAsset } = useAssets()
  const accountPositions = useAccountPositions()

  const balances = useAccountBalances(account?.address)

  const isPoolBalances = balances.data?.balances.some((balance) => {
    if (balance.freeBalance.gt(0)) {
      const meta = getAsset(balance.id)
      return meta?.isStableSwap || meta?.isShareToken
    }
    return false
  })

  const isPositions =
    accountPositions.data?.miningNfts.length ||
    accountPositions.data?.omnipoolNfts.length ||
    isPoolBalances

  if (!isPositions) return null

  return (
    <>
      <SubNavigationTabLink
        to={LINKS.myLiquidity}
        icon={
          <UserIcon style={{ width: 14, height: 14, alignSelf: "center" }} />
        }
        label={t("liquidity.navigation.myLiquidity")}
      />
      <SSeparator
        orientation="vertical"
        sx={{ width: 1, height: "60%", flexShrink: ["0", "inherit"] }}
        css={{
          background: `rgba(${theme.rgbColors.white}, 0.12)`,
        }}
      />
    </>
  )
}

export const MyLiquidityTabLink = () => {
  const { isLoaded } = useRpcProvider()
  return isLoaded ? <MyLiquidity /> : null
}
