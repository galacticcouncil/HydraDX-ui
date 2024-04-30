import { Text, TextProps } from "components/Typography/Text/Text"
import { FC } from "react"

export const NoData: FC<TextProps> = (props) => {
  return (
    <Text as="span" color="basic300" {...props}>
      —
    </Text>
  )
}
