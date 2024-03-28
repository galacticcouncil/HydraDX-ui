import { useRpcProvider } from "providers/rpcProvider"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { usePools, useXYKPools } from "sections/pools/PoolsPage.utils"
import { HeaderValues } from "sections/pools/header/PoolsHeader"
import { HeaderTotalData } from "sections/pools/header/PoolsHeaderTotal"
import { BN_0 } from "utils/constants"
import { SearchFilter } from "sections/pools/filter/SearchFilter"
import { useSearchFilter } from "sections/pools/filter/SearchFilter.utils"
import { arraySearch } from "utils/helpers"
import { PoolsTable } from "sections/pools/table/PoolsTable"
import { useSearch } from "@tanstack/react-location"
import { PoolWrapper } from "sections/pools/pool/Pool"
import { StablePoolsTotal } from "sections/pools/header/StablePoolsTotal"
import { AllPoolsVolumeTotal } from "sections/pools/header/VolumeTotal"
import { PoolsTableSkeleton } from "sections/pools/table/PoolsTableSkeleton"
import { PoolSkeleton } from "sections/pools/pool/PoolSkeleton"
import { EmptySearchState } from "components/EmptySearchState/EmptySearchState"
import { TableLabel } from "sections/pools/components/TableLabel"
import { CreateXYKPoolModalButton } from "sections/pools/modals/CreateXYKPool/CreateXYKPoolModalButton"

export const AllPools = () => {
  const { t } = useTranslation()

  const { isLoaded } = useRpcProvider()
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
          skeletonHeight={[19, 24]}
          values={[
            {
              label: t("liquidity.header.omnipool"),
              content: <HeaderTotalData isLoading fontSize={[19, 24]} />,
            },
            {
              label: t("liquidity.header.stablepool"),
              content: <HeaderTotalData isLoading fontSize={[19, 24]} />,
            },
            {
              label: t("liquidity.header.isolated"),
              content: <HeaderTotalData isLoading fontSize={[19, 24]} />,
            },
            {
              withoutSeparator: true,
              label: t("liquidity.header.24hours"),
              content: <HeaderTotalData isLoading fontSize={[19, 24]} />,
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

  return <AllPoolsData />
}

const AllPoolsData = () => {
  const { t } = useTranslation()

  const { search } = useSearchFilter()
  const { id } = useSearch<{
    Search: {
      id?: number
    }
  }>()

  const pools = usePools()
  const xylPools = useXYKPools()

  const omnipoolTotal = useMemo(
    () =>
      pools.data
        ? pools.data.reduce(
            (acc, asset) =>
              acc.plus(asset.tvlDisplay.isNaN() ? 0 : asset.tvlDisplay),
            BN_0,
          )
        : BN_0,

    [pools.data],
  )

  const xykTotal = useMemo(() => {
    if (xylPools.data) {
      return xylPools.data.reduce((acc, xykPool) => {
        return acc.plus(!xykPool.tvlDisplay.isNaN() ? xykPool.tvlDisplay : BN_0)
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

  return (
    <>
      <HeaderValues
        fontSizeLabel={14}
        skeletonHeight={[19, 24]}
        values={[
          {
            label: t("liquidity.header.omnipool"),
            content: (
              <HeaderTotalData
                isLoading={pools.isLoading}
                value={omnipoolTotal}
                fontSize={[19, 24]}
              />
            ),
          },
          {
            label: t("liquidity.header.stablepool"),
            content: <StablePoolsTotal />,
          },

          {
            label: t("liquidity.header.isolated"),
            content: (
              <HeaderTotalData
                isLoading={xylPools.isInitialLoading}
                value={xykTotal}
                fontSize={[19, 24]}
              />
            ),
          },

          {
            withoutSeparator: true,
            label: t("liquidity.header.24hours"),
            content: <AllPoolsVolumeTotal />,
          },
        ]}
      />

      <SearchFilter />

      {!pools.isLoading &&
        !xylPools.isInitialLoading &&
        !filteredPools.length &&
        !filteredXYKPools.length && <EmptySearchState />}

      <div sx={{ flex: "column" }}>
        {!!filteredPools.length || pools.isLoading ? (
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
