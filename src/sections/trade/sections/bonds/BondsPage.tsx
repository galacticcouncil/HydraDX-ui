import { Heading } from "components/Typography/Heading/Heading"
import { WhyBonds } from "./components/WhyBonds"
import { useTranslation } from "react-i18next"
import { MyActiveBonds } from "./MyActiveBonds"
import { BondList } from "./list/BondList"
import { Spacer } from "components/Spacer/Spacer"
import { useAssets } from "providers/assets"

export const BondsPage = () => {
  const { t } = useTranslation()
  const { bonds } = useAssets()

  return (
    <>
      <Heading fs={19}>{t("bonds")}</Heading>
      <Spacer axis="vertical" size={33} />
      <BondList bonds={bonds} />
      <Spacer axis="vertical" size={33} />
      <WhyBonds />
      <Spacer axis="vertical" size={40} />
      <MyActiveBonds showTransactions />
    </>
  )
}
