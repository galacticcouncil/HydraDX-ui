import { Text } from "@galacticcouncil/ui/components"
import { getToken } from "@galacticcouncil/ui/utils"
import { shortenAccountAddress } from "@galacticcouncil/utils"

type Props = {
  readonly address: string
  // Omit to render the full address; a number shortens it to `length` chars per side.
  readonly length?: number
}

// The last 3 characters are what users actually compare, so highlight them.
export const ShortAddress: React.FC<Props> = ({ address, length }) => {
  const value = length ? shortenAccountAddress(address, length) : address
  return (
    <>
      {value.slice(0, -3)}
      <Text as="span" color={getToken("text.high")}>
        {value.slice(-3)}
      </Text>
    </>
  )
}
