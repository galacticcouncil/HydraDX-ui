import { useTokensBalances } from "api/balances"
import UserIcon from "assets/icons/UserIcon.svg?react"
import { SubNavigationTabLink } from "components/Layout/SubNavigation/SubNavigation"
import { SSeparator } from "components/Separator/Separator.styled"
import { useRpcProvider } from "providers/rpcProvider"
import { useTranslation } from "react-i18next"
import { useAccountOmnipoolPositions } from "sections/pools/PoolsPage.utils"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { theme } from "theme"
import { LINKS } from "utils/navigation"

export const MyLiquidity = () => {
  const { t } = useTranslation()
  const { account } = useAccount()
  const { assets } = useRpcProvider()
  const accountPositions = useAccountOmnipoolPositions()

  const shareTokensId = assets.shareTokens.map((shareToken) => shareToken.id)
  const stableswapsId = assets.stableswap.map((shareToken) => shareToken.id)

  const userPositions = useTokensBalances(
    [...shareTokensId, ...stableswapsId],
    account?.address,
  )

  const isOmnipoolPositions =
    accountPositions.data?.miningNfts.length ||
    accountPositions.data?.omnipoolNfts.length ||
    userPositions.some((userPosition) => userPosition.data?.freeBalance.gt(0))

  if (!isOmnipoolPositions) return null

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
