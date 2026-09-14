import { Grid, Text } from "@galacticcouncil/ui/components"
import { getToken } from "@galacticcouncil/ui/utils"
import { FC } from "react"
import { useTranslation } from "react-i18next"

export const LimitFooterNote: FC = () => {
  const { t } = useTranslation("trade")

  return (
    <Grid justifyItems="center">
      <Text
        fs="p5"
        lh={1.4}
        py="m"
        align="center"
        color={getToken("text.high")}
      >
        {t("limit.footer.message")}
      </Text>
    </Grid>
  )
}
