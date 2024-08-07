import { Trans, useTranslation } from "react-i18next"
import { SContainer, SHeading } from "./MemepadHeader.styled"
import { Text } from "components/Typography/Text/Text"

export const MemepadHeader = () => {
  const { t } = useTranslation()
  return (
    <SContainer>
      <SHeading sx={{ fontSize: [20, 33] }}>
        <Trans t={t} i18nKey="memepad.header.title">
          <span />
        </Trans>
      </SHeading>
      <Text>{t("memepad.header.description")}</Text>
    </SContainer>
  )
}
