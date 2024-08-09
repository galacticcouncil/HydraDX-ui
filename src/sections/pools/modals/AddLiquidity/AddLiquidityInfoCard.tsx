import { Text } from "components/Typography/Text/Text"
import { SLink } from "./AddLiquidity.styled"
import { useTranslation } from "react-i18next"
import { DOC_LINK } from "utils/constants"
import { Alert } from "components/Alert/Alert"

export const PoolAddLiquidityInformationCard = () => {
  const { t } = useTranslation()

  return (
    <Alert variant="info">
      <div sx={{ flex: "column", gap: 8 }}>
        <Text fs={13} lh={16}>
          {t("liquidity.add.modal.information.text")}
        </Text>
        <SLink href={`${DOC_LINK}/omnipool_impermanent_loss`} target="_blank">
          {t("liquidity.add.modal.information.linkText")}
        </SLink>
      </div>
    </Alert>
  )
}
