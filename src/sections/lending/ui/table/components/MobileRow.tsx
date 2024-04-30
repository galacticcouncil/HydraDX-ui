import ChevronRight from "assets/icons/ChevronRight.svg?react"
import { Link } from "components/Link/Link"
import { Text } from "components/Typography/Text/Text"
import { ROUTES } from "sections/lending/components/primitives/Link"
import { TokenIcon } from "sections/lending/components/primitives/TokenIcon"
import { useProtocolDataContext } from "sections/lending/hooks/useProtocolDataContext"
import { SContainer, SValuesContainer } from "./MobileRow.styled"
import { Cell, flexRender } from "@tanstack/react-table"
import { useMemo } from "react"

export type MobileRowProps<T> = {
  name: string
  symbol: string
  iconSymbol: string
  detailsAddress: string
  cellIds?: string[]
  cells?: Cell<T, unknown>[]
  footer?: React.ReactNode
}

export function MobileRow<T>({
  name,
  symbol,
  iconSymbol,
  detailsAddress,
  cellIds = [],
  cells = [],
  footer,
}: MobileRowProps<T>) {
  const { currentMarket } = useProtocolDataContext()

  const filteredCells = useMemo(() => {
    return cellIds?.length > 0
      ? cells.filter((cell) => cellIds.includes(cell.column.id))
      : cells
  }, [cellIds, cells])

  return (
    <SContainer>
      <Link to={ROUTES.reserveOverview(detailsAddress, currentMarket)}>
        <div sx={{ flex: "row", align: "center", gap: 8 }}>
          {iconSymbol && (
            <TokenIcon symbol={iconSymbol} sx={{ fontSize: 28 }} />
          )}
          <div>
            <Text fs={16} font="ChakraPetchSemiBold">
              {symbol}
            </Text>
            <Text fs={13} color="paleBlue" sx={{ opacity: 0.6 }}>
              {name}
            </Text>
          </div>
          <ChevronRight sx={{ ml: "auto", mr: -10, color: "basic400" }} />
        </div>
      </Link>
      {filteredCells?.length > 0 && (
        <SValuesContainer>
          {filteredCells?.map((cell) => (
            <div
              key={cell.column.id}
              sx={{ flex: "row", justify: "space-between", align: "center" }}
            >
              <Text fs={13} color="paleBlue" sx={{ opacity: 0.6 }}>
                {(cell.column.columnDef?.header ?? "") as string}
              </Text>
              <div sx={{ textAlign: "right" }}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </div>
            </div>
          ))}
        </SValuesContainer>
      )}
      {footer && <div sx={{ mt: 20 }}>{footer}</div>}
    </SContainer>
  )
}
