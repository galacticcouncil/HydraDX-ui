import { safeConvertPublicKeyToSS58 } from "@galacticcouncil/utils"
import { queryOptions } from "@tanstack/react-query"

import { NECKWORK_BASE_STALE_TIME, NeckworkClient } from "."

export const omnipoolVolumeQuery = (client: NeckworkClient) =>
  queryOptions({
    queryKey: ["neckwork", "omnipoolVolumes"],
    staleTime: NECKWORK_BASE_STALE_TIME,
    queryFn: async () => {
      const { data } = await client.GET("/v1/pools/omnipool/volumes", {
        params: { query: { period: "24h" } },
      })

      if (!data) throw new Error("Neckwork API returned no omnipool volumes")

      return data.items.map((item) => ({
        assetId: item.assetId,
        assetVolNorm: item.volumeUsd,
      }))
    },
  })

export const stablepoolVolumeQuery = (client: NeckworkClient) =>
  queryOptions({
    queryKey: ["neckwork", "stablepoolVolumes"],
    staleTime: NECKWORK_BASE_STALE_TIME,
    queryFn: async () => {
      const { data } = await client.GET("/v1/pools/stableswap/volumes", {
        params: { query: { period: "24h" } },
      })

      if (!data) throw new Error("Neckwork API returned no stablepool volumes")

      return data.items.map((item) => ({
        poolId: item.poolId,
        poolVolNorm: item.volumeUsd,
      }))
    },
  })

export const omnipoolYieldMetricsQuery = (client: NeckworkClient) =>
  queryOptions({
    queryKey: ["neckwork", "omnipoolYieldMetrics", "30d"],
    staleTime: NECKWORK_BASE_STALE_TIME,
    queryFn: async () => {
      const { data } = await client.GET("/v1/pools/omnipool/yield", {
        params: { query: { window: "30d" } },
      })

      if (!data) throw new Error("Neckwork API returned no omnipool yield")

      return data.items.map((item) => ({
        assetId: item.assetId,
        fee: item.feeAprPerc,
      }))
    },
  })

export const stablepoolYieldMetricsQuery = (client: NeckworkClient) =>
  queryOptions({
    queryKey: ["neckwork", "stablepoolYieldMetrics", "30d"],
    staleTime: NECKWORK_BASE_STALE_TIME,
    queryFn: async () => {
      const { data } = await client.GET("/v1/pools/stableswap/yield", {
        params: { query: { window: "30d" } },
      })

      if (!data) throw new Error("Neckwork API returned no stablepool yield")

      return data.items.map((item) => ({
        poolId: item.poolId,
        feeAprPerc: item.feeAprPerc,
        feeApyPerc: item.feeApyPerc,
      }))
    },
  })

export const xykVolumeQuery = (client: NeckworkClient) =>
  queryOptions({
    queryKey: ["neckwork", "xykVolumes"],
    staleTime: NECKWORK_BASE_STALE_TIME,
    queryFn: async () => {
      const { data } = await client.GET("/v1/pools/xyk/volumes", {
        params: { query: { period: "24h" } },
      })

      if (!data) throw new Error("Neckwork API returned no XYK volumes")

      return data.items.map((item) => ({
        poolId: safeConvertPublicKeyToSS58(item.poolAccount),
        assetId: item.assetA,
        assetIdB: item.assetB,
        poolVolume: item.volumeUsd,
      }))
    },
  })

export const uniswapV3VolumeQuery = (client: NeckworkClient) =>
  queryOptions({
    queryKey: ["neckwork", "uniswapV3Volumes"],
    staleTime: NECKWORK_BASE_STALE_TIME,
    queryFn: async () => {
      const { data } = await client.GET("/v1/pools/uniswapv3/volumes", {
        params: { query: { period: "24h" } },
      })

      if (!data) throw new Error("Neckwork API returned no Uniswap v3 volumes")

      return data.items.map((item) => ({
        address: item.pool.toLowerCase(),
        volumeUsd: item.volumeUsd,
        feeUsd: item.feeUsd,
      }))
    },
  })
