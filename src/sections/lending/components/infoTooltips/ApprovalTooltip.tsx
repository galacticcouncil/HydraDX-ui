import { Link } from "sections/lending/components/primitives/Link"
import {
  TextWithTooltip,
  TextWithTooltipProps,
} from "sections/lending/components/TextWithTooltip"

export const ApprovalTooltip = ({ ...rest }: TextWithTooltipProps) => {
  return (
    <TextWithTooltip {...rest}>
      <span>
        To continue, you need to grant Aave smart contracts permission to move
        your funds from your wallet. Depending on the asset and wallet you use,
        it is done by signing the permission message (gas free), or by
        submitting an approval transaction (requires gas).{" "}
        <Link href="https://eips.ethereum.org/EIPS/eip-2612" underline="always">
          Learn more
        </Link>
      </span>
    </TextWithTooltip>
  )
}
