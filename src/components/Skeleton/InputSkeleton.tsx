import { Input } from "components/Input/Input"
import { noop } from "utils/helpers"

export type InputSkeletonProps = {
  className?: string
}

export const InputSkeleton: React.FC<InputSkeletonProps> = ({ className }) => {
  return (
    <Input
      name=""
      value=""
      label=""
      onChange={noop}
      className={className}
      css={{ pointerEvents: "none", opacity: 0.4 }}
    />
  )
}
