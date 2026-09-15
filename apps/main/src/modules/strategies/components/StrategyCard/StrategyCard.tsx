import {
  Flex,
  Paper,
  Separator,
  Stack,
  Text,
  ValueStats,
  ValueStatsProps,
} from "@galacticcouncil/ui/components"
import { getToken } from "@galacticcouncil/ui/utils"
import { FileRouteTypes, Link } from "@tanstack/react-router"
import { type ReactNode } from "react"

import { AssetLogo } from "@/components/AssetLogo"
import {
  StrategyBadge,
  StrategyBadgeType,
} from "@/modules/strategies/components/StrategyBadge"

export type StrategyCardProps = {
  logoId: string
  logo?: ReactNode
  stats: ValueStatsProps[]
  badges?: StrategyBadgeType[]
  title: string
  description: string
  link?: FileRouteTypes["to"]
}

export const StrategyCard: React.FC<StrategyCardProps> = ({
  logoId,
  logo,
  stats,
  title,
  description,
  link,
  badges = [],
}) => {
  return (
    <Paper p="xl" hoverable position="relative">
      <Stack gap="l">
        <Flex
          justify="space-between"
          align="flex-start"
          sx={{ aspectRatio: ["4 / 1", null, null, null, "2 / 1"] }}
        >
          {logo ?? <AssetLogo id={logoId} size="extra-large" hideChain />}
          {badges.length > 0 && (
            <Flex direction="column" gap="s" align="flex-end">
              {badges.map((badge) => (
                <StrategyBadge key={badge} type={badge} />
              ))}
            </Flex>
          )}
        </Flex>

        <Flex gap="xl">
          {stats.map((stat) => (
            <ValueStats
              key={stat.label}
              customValue={
                <Text fs="h5" lh={1} font="primary" fw={600}>
                  {stat.value}
                </Text>
              }
              {...stat}
              size="large"
              wrap
            />
          ))}
        </Flex>

        <Separator my="s" />

        <Stack gap="base">
          <Text fw={500} lh={1.1} fs="h6" font="primary">
            {title}
          </Text>
          <Text fs="p4" color={getToken("text.low")}>
            {description}
          </Text>
        </Stack>
      </Stack>
      <Link
        to={link}
        sx={{ "&::before": { content: "''", position: "absolute", inset: 0 } }}
      />
    </Paper>
  )
}
