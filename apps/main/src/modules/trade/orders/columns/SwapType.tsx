import { Infinity } from "@galacticcouncil/ui/assets/icons"
import { Flex, Icon, Text } from "@galacticcouncil/ui/components"
import { getToken } from "@galacticcouncil/ui/utils"
import { FC } from "react"
import { useTranslation } from "react-i18next"

import { OrderKind } from "@/modules/trade/orders/lib/types"

type Props = {
  readonly type: OrderKind | "market"
  readonly isLimit?: boolean
}

export const SwapType: FC<Props> = ({ type, isLimit = false }) => {
  const { t } = useTranslation("trade")

  const label = isLimit
    ? t("trade.orders.type.limitTwap")
    : type === OrderKind.DcaRolling
      ? t("trade.orders.type.dca")
      : type === OrderKind.Limit
        ? t("trade.orders.type.limit")
        : t(`trade.orders.type.${type}`)

  return (
    <Flex align="center" gap="xs">
      {type === OrderKind.DcaRolling && (
        <Icon
          component={Infinity}
          size={14}
          color={getToken("icons.primary")}
        />
      )}
      <Text fw={500} fs="p5" lh={1.2} color={getToken("text.high")}>
        {label}
      </Text>
    </Flex>
  )
}
