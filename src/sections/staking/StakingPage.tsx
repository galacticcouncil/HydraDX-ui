import { Spacer } from "components/Spacer/Spacer"
import { PageHeading } from "components/Layout/PageHeading"
import { useTranslation } from "react-i18next"
import { StakingDashboard } from "./sections/dashboard/StakingDashboard"

export const StakingPage = () => {
  const { t } = useTranslation()

  return (
    <>
      <PageHeading>{t("staking.title")}</PageHeading>
      <Spacer size={[20, 30]} />
      <StakingDashboard />
    </>
  )
}
