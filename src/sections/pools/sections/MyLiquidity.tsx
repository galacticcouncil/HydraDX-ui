import { useRpcProvider } from "providers/rpcProvider"
import { useMyPools, useXYKPools } from "sections/pools/PoolsPage.utils"
import { HeaderTotalData } from "sections/pools/header/PoolsHeaderTotal"
import { HeaderValues } from "sections/pools/header/PoolsHeader"
import { useTranslation } from "react-i18next"
import { useMemo } from "react"
import { BN_0 } from "utils/constants"
import { ClaimAllDropdown } from "sections/pools/farms/components/claimAllDropdown/ClaimAllDropdown"
import { SearchFilter } from "sections/pools/filter/SearchFilter"
import { useSearchFilter } from "sections/pools/filter/SearchFilter.utils"
import { arraySearch } from "utils/helpers"
import { PoolsTable } from "sections/pools/table/PoolsTable"
import { PoolWrapper } from "sections/pools/pool/Pool"
import { Navigate, useSearch } from "@tanstack/react-location"
import { MyOmnipoolTotal } from "sections/pools/header/MyOmnipoolTotal"
import { MyStablePoolsTotal } from "sections/pools/header/StablePoolsTotal"
import { PoolsTableSkeleton } from "sections/pools/table/PoolsTableSkeleton"
import { PoolSkeleton } from "sections/pools/pool/PoolSkeleton"
import { EmptySearchState } from "components/EmptySearchState/EmptySearchState"
import { MyLiquidityTotal } from "sections/pools/header/MyLiquidityTotal"
import { TableLabel } from "sections/pools/components/TableLabel"
import { LINKS } from "utils/navigation"
import { CreateXYKPoolModalButton } from "sections/pools/modals/CreateXYKPool/CreateXYKPoolModalButton"

const poolsWithMyPositions = true

export const MyLiquidity = () => {
  const { isLoaded } = useRpcProvider()
  const { t } = useTranslation()

  const { id } = useSearch<{
    Search: {
      id?: number
    }
  }>()

  if (!isLoaded)
    return id != null ? (
      <PoolSkeleton />
    ) : (
      <>
        <HeaderValues
          fontSizeLabel={14}
          skeletonHeight={19}
          values={[
            {
              label: t("liquidity.header.myTotal"),
              content: <HeaderTotalData isLoading fontSize={19} />,
            },
            {
              label: t("liquidity.header.omnipool"),
              content: <HeaderTotalData isLoading fontSize={19} />,
            },

            {
              label: t("liquidity.header.stablepool"),
              content: <HeaderTotalData isLoading fontSize={19} />,
            },
            {
              withoutSeparator: true,
              label: t("liquidity.header.isolated"),
              content: <HeaderTotalData isLoading fontSize={19} />,
            },
          ]}
        />
        <SearchFilter />

        <div sx={{ flex: "column" }}>
          <div sx={{ flex: "column" }}>
            <TableLabel label={t("liquidity.section.omnipoolAndStablepool")} />
            <PoolsTableSkeleton />
          </div>
          <div sx={{ flex: "column" }}>
            <TableLabel label={t("liquidity.section.xyk")} />
            <PoolsTableSkeleton isXyk />
          </div>
        </div>
      </>
    )

  return <MyLiquidityData />
}

const MyLiquidityData = () => {
  const { t } = useTranslation()
  const { search } = useSearchFilter()
  const { id } = useSearch<{
    Search: {
      id?: number
    }
  }>()

  const pools = useMyPools()
  const xylPools = useXYKPools(poolsWithMyPositions)

  const xykTotal = useMemo(() => {
    if (xylPools.data) {
      return xylPools.data.reduce((acc, xykPool) => {
        const myTotalDisplay = xykPool.tvlDisplay
          ?.div(100)
          .times(xykPool.shareTokenIssuance?.myPoolShare ?? 1)

        return acc.plus(!myTotalDisplay.isNaN() ? myTotalDisplay : BN_0)
      }, BN_0)
    }
    return BN_0
  }, [xylPools.data])

  const filteredPools =
    (search && pools.data
      ? arraySearch(pools.data, search, ["symbol", "name"])
      : pools.data) ?? []

  const filteredXYKPools =
    (search && xylPools.data
      ? arraySearch(xylPools.data, search, ["symbol", "name"])
      : xylPools.data) ?? []

  if (id != null) {
    const pool = [...(pools.data ?? []), ...(xylPools.data ?? [])].find(
      (pool) => pool.id === id.toString(),
    )

    const isLoading = pools.isLoading || xylPools.isInitialLoading

    if (!pool && isLoading) return <PoolSkeleton />

    if (pool) return <PoolWrapper pool={pool} />
  }

  if (pools.data?.length === 0 && xylPools.data?.length === 0)
    return <Navigate to={LINKS.allPools} />

  return (
    <>
      <HeaderValues
        fontSizeLabel={14}
        skeletonHeight={19}
        values={[
          {
            label: t("liquidity.header.myTotal"),
            content: <MyLiquidityTotal />,
          },
          {
            label: t("liquidity.header.omnipool"),
            content: <MyOmnipoolTotal />,
          },
          {
            label: t("liquidity.header.stablepool"),
            content: <MyStablePoolsTotal />,
          },
          {
            label: t("liquidity.header.isolated"),
            withoutSeparator: true,
            content: (
              <HeaderTotalData
                isLoading={xylPools.isInitialLoading}
                value={xykTotal}
                fontSize={19}
              />
            ),
          },
          {
            initiallyHidden: true,
            content: <ClaimAllDropdown />,
          },
        ]}
      />
      <SearchFilter />

      {!pools.isLoading &&
        !xylPools.isInitialLoading &&
        !filteredPools.length &&
        !filteredXYKPools.length && <EmptySearchState />}

      <div sx={{ flex: "column" }}>
        {pools.isLoading || !!filteredPools.length ? (
          <div sx={{ flex: "column" }}>
            <TableLabel label={t("liquidity.section.omnipoolAndStablepool")} />
            {pools.isLoading ? (
              <PoolsTableSkeleton />
            ) : (
              <PoolsTable data={filteredPools} />
            )}
          </div>
        ) : null}

        {xylPools.isInitialLoading || !!filteredXYKPools.length ? (
          <div sx={{ flex: "column" }}>
            <div
              sx={{
                flex: ["column", "row"],
                justify: "space-between",
                align: ["flex-start", "flex-end"],
              }}
            >
              <TableLabel label={t("liquidity.section.xyk")} />
              <CreateXYKPoolModalButton
                disabled={xylPools.isInitialLoading}
                sx={{ mb: 14, width: ["100%", "auto"] }}
              />
            </div>
            {xylPools.isInitialLoading ? (
              <PoolsTableSkeleton isXyk />
            ) : (
              <PoolsTable data={filteredXYKPools} isXyk />
            )}
          </div>
        ) : null}
      </div>
    </>
  )
}
