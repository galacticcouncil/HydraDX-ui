import {
  Box,
  Points,
  Separator,
  Stack,
  Text,
} from "@galacticcouncil/ui/components"
import { getToken } from "@galacticcouncil/ui/utils"
import { Link } from "@tanstack/react-router"
import { FC } from "react"
import { Trans, useTranslation } from "react-i18next"

import { swapTabLink } from "@/config/navigation"

type Points = ReadonlyArray<readonly [title: string, description: string]>

export const HowToStake: FC = () => {
  const { t } = useTranslation(["common", "staking"])
  const points = t("staking:howTo.points", { returnObjects: true }) as Points

  return (
    <Box>
      <Text
        p="xl"
        font="primary"
        fw={500}
        fs="h7"
        color={getToken("text.high")}
      >
        {t("staking:howTo.title")}
      </Text>
      <Separator />
      <Stack separated>
        {points.map(([title, description], index) => (
          <Points
            key={index}
            size="l"
            sx={{ px: "xxl" }}
            number={index + 1}
            title={title}
            description={
              <Trans
                t={t}
                i18nKey={description}
                components={[
                  <Link key="trade-link" {...swapTabLink("market")} />,
                ]}
              />
            }
          />
        ))}
      </Stack>
    </Box>
  )
}
