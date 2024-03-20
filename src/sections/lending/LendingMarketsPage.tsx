import { useNavigate, useSearch } from "@tanstack/react-location"
import { Input } from "components/Input/Input"
import { useState } from "react"
import { useDebounce } from "react-use"
import { MarketsHeaderValues } from "sections/lending/ui/header/MarketsHeaderValues"
import { HollarBanner } from "sections/lending/ui/hollar/hollar-banner/HollarBanner"
import { MarketAssetsTable } from "sections/lending/ui/table/market-assets/MarketAssetsTable"
import IconSearch from "assets/icons/IconSearch.svg?react"

export const LendingMarketsPage = () => {
  const navigate = useNavigate()
  const query = useSearch<{
    Search: {
      search?: string
    }
  }>()

  const [search, setSearch] = useState(query.search ?? "")

  useDebounce(
    () => {
      if (search !== query.search) {
        navigate({
          search: {
            search: search,
          },
        })
      }
    },
    300,
    [search],
  )

  return (
    <>
      <MarketsHeaderValues sx={{ mb: [10, 40] }} />
      <HollarBanner sx={{ mb: [20, 30] }} />
      <Input
        label="Search"
        name="market-search"
        placeholder="Search by token name, symbol or address"
        value={search}
        onChange={setSearch}
        sx={{ mb: [20, 30] }}
        iconStart={<IconSearch />}
      />
      <MarketAssetsTable search={search} />
    </>
  )
}
