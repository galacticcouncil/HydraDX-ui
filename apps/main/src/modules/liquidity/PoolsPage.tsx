import { Plus } from "@galacticcouncil/ui/assets/icons"
import {
  Button,
  DataTable,
  Icon,
  Paper,
  SectionHeader,
  TableContainer,
} from "@galacticcouncil/ui/components"
import { useBreakpoints } from "@galacticcouncil/ui/theme"
import { Link, useRouter, useSearch } from "@tanstack/react-router"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import {
  PaginationProps,
  useDataTableUrlPagination,
} from "@/hooks/useDataTableUrlPagination"
import { useDataTableUrlSearch } from "@/hooks/useDataTableUrlSearch"
import {
  SortingProps,
  useDataTableUrlSorting,
} from "@/hooks/useDataTableUrlSorting"
import { PoolsFilters } from "@/modules/liquidity/components/PoolsFilters"
import { PoolsHeader } from "@/modules/liquidity/components/PoolsHeader"
import {
  getVaultsColumnsVisibility,
  useVaultsColumns,
} from "@/modules/liquidity/Vaults.columns"
import { useVaults } from "@/modules/liquidity/Vaults.utils"
import { useOmnipoolStablepoolAssets, useXYKPools } from "@/states/liquidity"

import {
  getIsolatedPoolsColumnsVisibility,
  useIsolatedPoolsColumns,
} from "./IsolatedPools.columns"
import { getPoolColumnsVisibility, usePoolColumns } from "./Liquidity.columns"

export const PoolsPage = () => {
  const isolatedPagination = useDataTableUrlPagination(
    "/liquidity/",
    "isolatedPage",
    10,
  )

  const [search, setSearch] = useDataTableUrlSearch("/liquidity/", "search", {
    onChange: () => isolatedPagination.onPageClick(1),
  })

  const isolatedSorting = useDataTableUrlSorting(
    "/liquidity/",
    "isolatedSort",
    {
      onChange: () => isolatedPagination.onPageClick(1),
    },
  )

  const { type, myLiquidity } = useSearch({
    from: "/liquidity/",
  })

  return (
    <>
      <PoolsHeader />
      <PoolsFilters search={search} onChange={setSearch} />
      {(type === "vaults" || type === "all") && <VaultsTable search={search} />}
      {(type === "omnipoolStablepool" || type === "all") && (
        <OmnipoolAndStablepoolTable
          search={search}
          withPositions={myLiquidity}
        />
      )}
      {(type === "isolated" || type === "all") && (
        <IsolatedPoolsTable
          search={search}
          withPositions={myLiquidity}
          paginationProps={isolatedPagination}
          sortingProps={isolatedSorting}
        />
      )}
    </>
  )
}

export const VaultsTable = ({ search }: { search: string }) => {
  const { t } = useTranslation("liquidity")
  const { data, isLoading } = useVaults()
  const columns = useVaultsColumns()
  const { isMobile } = useBreakpoints()
  const router = useRouter()

  if (!isLoading && !data.length) return null

  return (
    <>
      <SectionHeader title={t("section.vaults")} />
      <TableContainer as={Paper}>
        <DataTable
          size={isMobile ? "small" : "large"}
          isLoading={isLoading}
          skeletonRowCount={1}
          data={data}
          columns={columns}
          globalFilter={search}
          columnVisibility={getVaultsColumnsVisibility(isMobile)}
          columnPinning={{ left: ["vault"] }}
          globalFilterFn={(row) =>
            row.original.tokens.some((token) =>
              token.symbol.toLowerCase().includes(search.toLowerCase()),
            )
          }
          onRowClick={(vault) =>
            router.navigate({
              to: "/liquidity/vault/$address",
              params: { address: vault.id },
            })
          }
        />
      </TableContainer>
    </>
  )
}

export const OmnipoolAndStablepoolTable = ({
  search,
  withPositions,
}: {
  search: string
  withPositions?: boolean
}) => {
  const { t } = useTranslation("liquidity")
  const { data, isLoading } = useOmnipoolStablepoolAssets()
  const columns = usePoolColumns()
  const router = useRouter()
  const { isMobile } = useBreakpoints()

  const filteredData = useMemo(() => {
    return withPositions ? data?.filter((asset) => asset.isPositions) : data
  }, [data, withPositions])

  return (
    <>
      <SectionHeader title={t("section.omnipoolStablepool")} />
      <TableContainer as={Paper}>
        <DataTable
          size={isMobile ? "small" : "large"}
          isLoading={isLoading}
          globalFilter={search}
          data={filteredData ?? []}
          columns={columns}
          {...useDataTableUrlSorting("/liquidity/", "omniSort")}
          columnVisibility={getPoolColumnsVisibility(isMobile, !!withPositions)}
          columnPinning={{
            left: ["meta_name"],
          }}
          globalFilterFn={(row) =>
            row.original.meta.name
              .toLowerCase()
              .includes(search.toLowerCase()) ||
            row.original.meta.symbol
              .toLowerCase()
              .includes(search.toLowerCase())
          }
          onRowClick={(asset) => {
            router.navigate({
              to: "/liquidity/$id",
              params: { id: asset.id },
              search: { expanded: true },
            })
          }}
        />
      </TableContainer>
    </>
  )
}

export const IsolatedPoolsTable = ({
  search,
  paginationProps,
  sortingProps,
  withPositions,
}: {
  search: string
  paginationProps: PaginationProps
  sortingProps: SortingProps
  withPositions?: boolean
}) => {
  const { t } = useTranslation("liquidity")
  const { data, isLoading } = useXYKPools()
  const columns = useIsolatedPoolsColumns()
  const { isMobile } = useBreakpoints()

  const router = useRouter()

  const filteredData = useMemo(() => {
    return (
      (withPositions ? data?.filter((asset) => asset.isPositions) : data) ?? []
    )
  }, [data, withPositions])

  return (
    <>
      <SectionHeader
        title={t("section.isolatedPools")}
        actions={
          <Button asChild>
            <Link to="/liquidity/create">
              <Icon component={Plus} size="s" />
              {t(
                isMobile
                  ? "section.isolatedPools.btn.short"
                  : "section.isolatedPools.btn",
              )}
            </Link>
          </Button>
        }
      />
      <TableContainer as={Paper}>
        <DataTable
          size={isMobile ? "small" : "large"}
          data={filteredData}
          globalFilter={search}
          columns={columns}
          isLoading={isLoading}
          paginated
          {...paginationProps}
          {...sortingProps}
          columnVisibility={getIsolatedPoolsColumnsVisibility(
            isMobile,
            !!withPositions,
          )}
          columnPinning={{
            left: ["meta_name"],
          }}
          globalFilterFn={(row) =>
            row.original.meta.name
              .toLowerCase()
              .includes(search.toLowerCase()) ||
            row.original.meta.symbol
              .toLowerCase()
              .includes(search.toLowerCase())
          }
          onRowClick={(asset) =>
            router.navigate({
              to: "/liquidity/$id",
              params: { id: asset.id },
              search: { expanded: true },
            })
          }
        />
      </TableContainer>
    </>
  )
}
