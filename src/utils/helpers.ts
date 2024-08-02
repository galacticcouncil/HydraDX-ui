import { UseQueryResult } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { UseFormReturn } from "react-hook-form"
import { u32 } from "@polkadot/types-codec"
import { u8aConcat } from "@polkadot/util"
import { U8aLike } from "@polkadot/util/types"
import { ApiPromise } from "@polkadot/api"
import { KeyOfType } from "utils/types"
import { knownGenesis } from "@polkadot/networks/defaults/genesis"
import { availableNetworks } from "@polkadot/networks"
import type { Network } from "@polkadot/networks/types"
import BN, { BigNumber } from "bignumber.js"
import { AnyChain, AnyEvmChain, AnyParachain } from "@galacticcouncil/xcm-core"
import { TAsset } from "providers/assets"

export const noop = () => {}
export const undefinedNoop = () => undefined

export const safelyParse = <T>(input: string): T | undefined => {
  try {
    return JSON.parse(input)
  } catch (e) {
    return undefined
  }
}

export type Maybe<T> = T | null | undefined
export type FormValues<T> =
  T extends UseFormReturn<infer Values> ? Values : never

export function isRecord<Key extends string, Value>(
  x: unknown,
): x is Record<Key, Value> {
  return typeof x === "object" && x != null && !Array.isArray(x)
}

export function keys<O extends object>(o: O) {
  return Object.keys(o) as (keyof O)[]
}

export function padEndU8a(value: U8aLike, length: number) {
  return u8aConcat(value, Array(Math.max(0, length - value.length)).fill(0))
}

/**
 * This hook allows us to modify the `data` property and pass through
 * other React Query keys while not triggering unnecessary renders due to object spread
 *
 * https://github.com/TkDodo/blog-comments/discussions/59#discussioncomment-3827243
 *
 * @param queryResult Query result to wrap
 * @param selector Function which transforms the data if not undefined
 * @returns Query result with transformed data
 */
export function useQuerySelect<TData, TError, TNewData>(
  queryResult: UseQueryResult<TData, TError>,
  selector: (data: TData) => TNewData,
) {
  const trackedItem = {} as UseQueryResult<TNewData, TError>

  // keys will not trigger the tracking of prop
  Object.keys(queryResult).forEach((i) => {
    const key = i as keyof typeof queryResult

    Object.defineProperty(trackedItem, key, {
      configurable: false,
      enumerable: true,
      get: () => {
        if (key === "data") {
          if (typeof queryResult["data"] === "undefined") return undefined
          return selector(queryResult["data"])
        }

        return queryResult[key]
      },
    })
  })

  return trackedItem
}

export const useNow = (enabled: boolean) => {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    if (!enabled) return
    const interval = window.setInterval(() => setNow(new Date()), 500)
    return () => window.clearInterval(interval)
  }, [enabled])

  return now
}

export function normalizeId(id: string | u32) {
  return id.toString()
}

export function isNil<T>(val: T | null | undefined): val is null | undefined {
  return val === undefined || val === null
}

export function isNotNil<T>(val: T | null | undefined): val is T {
  return !isNil(val)
}

export const identity = <T>(value: T): T => value

const validKeys = [
  "data",
  "isError",
  "isFetching",
  "isLoading",
  "isLoadingError",
  "isInitialLoading",
  "isPaused",
  "isPlaceholderData",
  "isPreviousData",
  "isRefetchError",
  "isRefetching",
  "isStale",
  "isSuccess",
  "isFetched",
  "isFetchedAfterMount",
] as const

type UseQueryReduceResult<T> = Pick<
  UseQueryResult<T>,
  (typeof validKeys)[number]
>

type TupleQueryResult<Tuple extends readonly unknown[]> = {
  [P in keyof Tuple]: UseQueryReduceResult<Tuple[P]> | UseQueryResult<Tuple[P]>
}

export function useQueryReduce<Tuple extends readonly unknown[], Combined>(
  list: TupleQueryResult<Tuple>,
  second: (...args: [...Tuple]) => Combined,
) {
  const trackedItem = {} as UseQueryReduceResult<Combined>

  for (const key of validKeys) {
    Object.defineProperty(trackedItem, key, {
      configurable: false,
      enumerable: true,
      get: () => {
        switch (key) {
          case "data": {
            const data = list.map((i) => i.data) as [...Tuple]
            if (data.some((x) => typeof x === "undefined")) return undefined
            return second(...data)
          }
          case "isError":
          case "isFetching":
          case "isLoading":
          case "isLoadingError":
          case "isInitialLoading":
          case "isPaused":
          case "isPlaceholderData":
          case "isPreviousData":
          case "isRefetchError":
          case "isRefetching":
          case "isStale": {
            const result = list.map((i) => i[key])
            return result.some((i) => i)
          }
          case "isSuccess":
          case "isFetched":
          case "isFetchedAfterMount": {
            const result = list.map((i) => i[key])
            return result.every((i) => i)
          }
          default: {
            return undefined
          }
        }
      },
    })
  }

  return trackedItem
}

export const isApiLoaded = (api: ApiPromise) => Object.keys(api).length

function tokenize(str: string) {
  return str.split(/[\s\-._]+/)
}

function normalize(str: string) {
  if (typeof str === "string") {
    return (
      str
        .toLowerCase()
        .trim()
        // remove diacritics
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
    )
  }

  return ""
}

/**
 * Searches an array of objects for a given search string in specified keys.
 * Keys order is an important. Result will be ordered by keys order in the array.
 */
export function arraySearch<T extends Record<string, any>>(
  array: Array<T>,
  search = "",
  keys?: Array<Extract<KeyOfType<T, string>, string>>,
) {
  return array
    .reduce<Array<Array<T>>>((memo, item) => {
      const searchableKeys =
        keys || Object.keys(item).filter((key) => typeof item[key] === "string")

      searchableKeys.some((key, index) => {
        const normalizedSearch = normalize(search)
        const tokens = tokenize(normalizedSearch)

        if (!item[key]) return false

        const values = tokenize(normalize(item[key].toString()))

        return values.some((value) => {
          if (tokens.some((token) => value.includes(token))) {
            memo[index] ? memo[index].push(item) : (memo[index] = [item])

            return true
          }

          return false
        })
      })

      return memo
    }, [])
    .flat()
}

export function randomAlphanumericString(length: number) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length)
    result += characters.charAt(randomIndex)
  }
  return result
}

export const genesisHashToChain = (genesisHash?: `0x${string}`) => {
  let chainInfo = availableNetworks.find(
    (c) => c.network === "substrate",
  ) as Network

  if (!genesisHash) return chainInfo

  for (let chain in knownGenesis) {
    if (knownGenesis[chain].includes(genesisHash)) {
      const chainIndex = availableNetworks.findIndex((entry) =>
        chain.startsWith(entry.network),
      )

      if (chainIndex >= 0) {
        chainInfo = availableNetworks[chainIndex]
        break
      }
    }
  }

  return chainInfo
}

/**
 * Converts a BN to abbreviated string if number is too large. Handles millions and billions.
 */
export function abbreviateNumber(price: BN): string {
  if (price.isNaN()) {
    return "N / A"
  }

  let formattedPrice = ""
  const decimalPlaces = price.decimalPlaces() || 0

  if (decimalPlaces > 0) {
    if (decimalPlaces <= 2 || price.gt(new BN(10))) {
      formattedPrice = "$" + price.toFixed(2)
    } else {
      formattedPrice = "$" + price.toFixed(Math.min(4, decimalPlaces))
    }
  } else {
    formattedPrice = "$" + price.toFixed(2)
  }

  if (price.gt(new BN(999999))) {
    const suffixes = [" M", " B", " T"]
    let suffixIndex = -1
    let tempPrice = price

    while (tempPrice.gt(new BN(999999))) {
      tempPrice = tempPrice.dividedBy(new BN(1000000))
      suffixIndex++
    }

    if (suffixIndex >= 0) {
      if (decimalPlaces > 0) {
        if (decimalPlaces <= 2 || tempPrice.gt(new BN(10))) {
          formattedPrice = "$" + tempPrice.toFixed(2) + suffixes[suffixIndex]
        } else {
          formattedPrice =
            "$" +
            tempPrice.toFixed(Math.min(4, decimalPlaces)) +
            suffixes[suffixIndex]
        }
      } else {
        formattedPrice = "$" + tempPrice.toFixed(2) + suffixes[suffixIndex]
      }
    }
  }

  return formattedPrice
}

export const isAnyParachain = (chain: AnyChain): chain is AnyParachain =>
  (chain as AnyParachain).parachainId !== undefined

export const isAnyEvmChain = (chain: AnyChain): chain is AnyEvmChain =>
  !!(chain as AnyEvmChain).client

export const isJson = (item: string) => {
  let value = typeof item !== "string" ? JSON.stringify(item) : item
  try {
    value = JSON.parse(value)
  } catch (e) {
    return false
  }

  return typeof value === "object" && value !== null
}

export const sortAssets = <T extends { meta: TAsset; [key: string]: any }>(
  assets: Array<T>,
  balanceKey: Extract<KeyOfType<T, BigNumber>, string>,
  firstAssetId?: string,
) => {
  const tickerOrder = [
    "HDX",
    "DOT",
    "USDC",
    "USDT",
    "IBTC",
    "VDOT",
    "WETH",
    "WBTC",
  ]
  const getTickerIndex = (ticker: string) => {
    const index = tickerOrder.indexOf(ticker.toUpperCase())
    return index === -1 ? Infinity : index
  }

  return [...assets].sort((a, b) => {
    if (firstAssetId) {
      if (a.meta.id === firstAssetId) return -1
      if (b.meta.id === firstAssetId) return 1
    }
    const balanceA = a[balanceKey] as BN
    const balanceB = b[balanceKey] as BN

    if (balanceA.isNaN() || balanceB.isNaN()) {
      if (balanceA.isNaN() && !balanceB.isNaN()) return 1
      if (!balanceA.isNaN() && balanceB.isNaN()) return -1

      if (a.meta.symbol && b.meta.symbol)
        return a.meta.symbol.localeCompare(b.meta.symbol)
    }

    if (balanceB.isZero() && balanceA.isZero()) {
      const tickerIndexA = getTickerIndex(a.meta.symbol)
      const tickerIndexB = getTickerIndex(b.meta.symbol)

      if (a.meta.isExternal && !b.meta.isExternal) return 1
      if (!a.meta.isExternal && b.meta.isExternal) return -1

      if (
        tickerIndexA === tickerIndexB ||
        (a.meta.isExternal && b.meta.isExternal)
      ) {
        return a.meta.symbol.localeCompare(b.meta.symbol)
      } else {
        return tickerIndexA - tickerIndexB
      }
    }

    return b[balanceKey].minus(a[balanceKey]).toNumber()
  })
}

const deepEqual = (obj1: any, obj2: any): boolean => {
  if (obj1 === obj2) return true
  if (obj1 == null || obj2 == null) return false
  if (typeof obj1 !== "object" || typeof obj2 !== "object") {
    return false
  }

  let keys1 = Object.keys(obj1)
  let keys2 = Object.keys(obj2)
  if (keys1.length !== keys2.length) {
    return false
  }

  for (let key of keys1) {
    if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) return false
  }

  return true
}

export const arraysEqual = <T>(arr1: T[], arr2: T[]): boolean => {
  if (arr1.length !== arr2.length) return false

  for (let i = 0; i < arr1.length; i++) {
    if (!deepEqual(arr1[i], arr2[i])) {
      return false
    }
  }

  return true
}
