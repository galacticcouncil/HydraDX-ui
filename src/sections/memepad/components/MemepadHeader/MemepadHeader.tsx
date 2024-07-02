import { SContainer, SHeading } from "./MemepadHeader.styled"
import { Text } from "components/Typography/Text/Text"

export const MemepadHeader = () => {
  return (
    <SContainer>
      <SHeading sx={{ fontSize: [20, 33] }}>
        Launch hydrated
        <br />
        <span>memecoins in seconds</span>
      </SHeading>
      <Text>
        Fastest Polkadot asset creator. Get asset up and ready to trade in a
        minute.
      </Text>
    </SContainer>
  )
}
