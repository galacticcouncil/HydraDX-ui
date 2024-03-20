
import { CustomMarket } from "sections/lending/ui-config/marketsConfig"

import { Link } from "sections/lending/components/primitives/Link"

export const AssetsBeingOffboarded: {
  [market: string]: { [symbol: string]: string }
} = {
  [CustomMarket.proto_mainnet]: {
    BUSD: "https://governance.aave.com/t/arfc-busd-offboarding-plan/12170",
    TUSD: "https://governance.aave.com/t/arfc-tusd-offboarding-plan/14008",
  },
}

export const OffboardingWarning = ({
  discussionLink,
}: {
  discussionLink: string
}) => {
  return (
    <span>
      This asset is planned to be offboarded due to an Aave Protocol Governance
      decision.{" "}
      <Link href={discussionLink} sx={{ textDecoration: "underline" }}>
        <span>More details</span>
      </Link>
    </span>
  )
}
