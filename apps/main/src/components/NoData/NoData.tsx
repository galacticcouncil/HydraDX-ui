import { Text, TextProps } from "@galacticcouncil/ui/components"
import { getToken } from "@galacticcouncil/ui/utils"

export const NoData = (props: TextProps) => (
  <Text color={getToken("text.low")} {...props}>
    &mdash;
  </Text>
)
