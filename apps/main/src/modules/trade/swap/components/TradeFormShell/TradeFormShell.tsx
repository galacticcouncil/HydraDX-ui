import { Flex } from "@galacticcouncil/ui/components"
import { ReactNode } from "react"

import { STradeFormShell } from "@/modules/trade/swap/components/TradeFormShell/TradeFormShell.styled"

type Props = {
  readonly fields: ReactNode
  readonly submit: ReactNode
  readonly summary?: ReactNode
  readonly children?: ReactNode
}

export const TradeFormShell: React.FC<Props> = ({
  fields,
  submit,
  summary,
  children,
}) => (
  <STradeFormShell>
    {fields}
    {children}
    <Flex direction="column" py="l">
      {submit}
    </Flex>
    {summary}
  </STradeFormShell>
)
