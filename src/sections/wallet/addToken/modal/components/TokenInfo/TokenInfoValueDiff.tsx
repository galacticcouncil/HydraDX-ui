import BN from "bignumber.js"
import { Text } from "components/Typography/Text/Text"
import ArrowRightIcon from "assets/icons/ArrowRightIcon.svg?react"

export type TokenInfoValueDiffProps = {
  before: string | number | BN
  after: string | number | BN
}

export const TokenInfoValueDiff: React.FC<TokenInfoValueDiffProps> = ({
  before,
  after,
}) => {
  return (
    <div sx={{ flex: "row", gap: 6 }}>
      <Text fs={12} fw={500} font="GeistMedium">
        {before.toString()}
      </Text>
      <ArrowRightIcon width={12} height={12} sx={{ color: "alarmRed400" }} />
      <Text fs={12} fw={500} font="GeistMedium" color="alarmRed400">
        {after.toString()}
      </Text>
    </div>
  )
}
