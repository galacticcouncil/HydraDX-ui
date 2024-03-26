import { useRpcProvider } from "providers/rpcProvider"
import { ReferralsConnect } from "sections/referrals/ReferralsConnect"

export const ReferralsConnectWrapper = () => {
  const { featureFlags } = useRpcProvider()
  return featureFlags.referrals ? <ReferralsConnect /> : null
}
