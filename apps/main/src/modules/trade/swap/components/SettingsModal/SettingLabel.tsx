import { Chip, Flex, Text, Tooltip } from "@galacticcouncil/ui/components"
import { FC } from "react"

type Props = {
  readonly label: string
  readonly helpTooltip?: string
  readonly badge?: string
}

export const SettingLabel: FC<Props> = ({ label, helpTooltip, badge }) => {
  return (
    <Flex gap="s" align="center">
      <Text fw={600} fs="p4" lh={1.2}>
        {label}
      </Text>
      {badge && <Chip size="extra-small">{badge}</Chip>}
      {helpTooltip && <Tooltip text={helpTooltip} />}
    </Flex>
  )
}
