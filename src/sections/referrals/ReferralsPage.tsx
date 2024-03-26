import { Navigate } from "@tanstack/react-location"
import { CodeForm } from "./components/CodeForm/CodeForm"
import { ReferralsTableTableWrapper } from "./components/ReferralsTable/ReferralsTableWrapper"
import { FaqAccordion } from "./components/FaqAccordion/FaqAccordion"
import { HeroBanner } from "./components/HeroBanner/HeroBanner"
import { ReferrerCard } from "./components/ReferrerCard/ReferrerCard"
import { RewardsCard } from "./components/RewardsCard/RewardsCard"
import { TierStats } from "./components/TierStats/TierStats"
import { useRpcProvider } from "providers/rpcProvider"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { useReferralCodes } from "api/referrals"
import { getChainSpecificAddress } from "utils/formatting"
import { ReferralsSkeleton } from "./ReferralsSkeleton"

export const ReferralsWrapper = () => {
  const { isLoaded, featureFlags } = useRpcProvider()

  if (!isLoaded) return <ReferralsSkeleton />

  if (!featureFlags.referrals) return <Navigate to="/trade" />

  return <ReferralsPage />
}

export const ReferralsPage = () => {
  const { account } = useAccount()

  const userReferralCode = useReferralCodes(
    account?.address ? getChainSpecificAddress(account.address) : undefined,
  )

  const myReferralCode = userReferralCode.data?.[0]?.referralCode

  return (
    <div css={{ display: "flex", flex: "column", gap: 30 }}>
      <div sx={{ flex: "column", gap: [20, 30] }}>
        <HeroBanner>
          <CodeForm />
        </HeroBanner>
        {account && (
          <>
            <div sx={{ flex: ["column", "row"], gap: 20, flexWrap: "wrap" }}>
              <RewardsCard />
              <ReferrerCard />
            </div>
            {myReferralCode && (
              <>
                <TierStats />
                {false && <ReferralsTableTableWrapper />}
              </>
            )}
          </>
        )}
        <FaqAccordion />
      </div>
    </div>
  )
}
