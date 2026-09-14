import { Flex, ModalContentDivider } from "@galacticcouncil/ui/components"
import { FC, ReactNode } from "react"

import { PastExecutionData } from "@/modules/trade/orders/lib/types"

type Props = {
  readonly executions: ReadonlyArray<PastExecutionData>
  readonly isLoading: boolean
  readonly children: ReactNode
}

export const PastExecutionsModalSection: FC<Props> = ({
  executions,
  isLoading,
  children,
}) => {
  if (!isLoading && executions.length === 0) {
    return null
  }

  return (
    <>
      <Flex
        direction="column"
        sx={{ marginInline: "var(--modal-content-inset)" }}
      >
        {children}
      </Flex>
      <ModalContentDivider />
    </>
  )
}
