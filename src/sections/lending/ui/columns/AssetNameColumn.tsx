import { Link } from "components/Link/Link"
import { FC } from "react"
import { ROUTES } from "sections/lending/components/primitives/Link"
import { TokenIcon } from "sections/lending/components/primitives/TokenIcon"
import { useProtocolDataContext } from "sections/lending/hooks/useProtocolDataContext"

type AssetNameColumnProps = {
  detailsAddress: string
  symbol: string
  iconSymbol?: string
}

export const AssetNameColumn: FC<AssetNameColumnProps> = ({
  detailsAddress,
  symbol,
  iconSymbol,
}) => {
  const { currentMarket } = useProtocolDataContext()

  return (
    <Link to={ROUTES.reserveOverview(detailsAddress, currentMarket)}>
      <span sx={{ flex: "row", align: "center", gap: 8 }}>
        {iconSymbol && <TokenIcon symbol={iconSymbol} sx={{ fontSize: 24 }} />}
        {symbol}
      </span>
    </Link>
  )
}
