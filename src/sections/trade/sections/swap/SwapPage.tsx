import { SContainer } from "./SwapPage.styled"

import type { TxInfo } from "@galacticcouncil/apps"

import * as React from "react"
import * as Apps from "@galacticcouncil/apps"
import { createComponent, EventName } from "@lit-labs/react"
import { useStore } from "state/store"
import { z } from "zod"
import { MakeGenerics, useSearch } from "@tanstack/react-location"
import { useProviderRpcUrlStore } from "api/provider"
import { useRpcProvider } from "providers/rpcProvider"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { useDisplayAssetStore } from "utils/displayAsset"
import { isEvmAddress } from "utils/evm"
import { NATIVE_ASSET_ID } from "utils/api"

const defaultEvmTokenId: string = import.meta.env.VITE_EVM_NATIVE_ASSET_ID

export const SwapApp = createComponent({
  tagName: "gc-trade",
  elementClass: Apps.TradeApp,
  react: React,
  events: {
    onTxNew: "gc:tx:new" as EventName<CustomEvent<TxInfo>>,
    onDcaSchedule: "gc:tx:scheduleDca" as EventName<CustomEvent<TxInfo>>,
    onDcaTerminate: "gc:tx:terminateDca" as EventName<CustomEvent<TxInfo>>,
  },
})

const TradeAppSearch = z.object({
  assetIn: z
    .number()
    .transform((value) => String(value))
    .optional(),
  assetOut: z
    .number()
    .transform((value) => String(value))
    .optional(),
})

type SearchGenerics = MakeGenerics<{
  Search: z.infer<typeof TradeAppSearch>
}>

const indexerUrl = import.meta.env.VITE_INDEXER_URL
const grafanaUrl = import.meta.env.VITE_GRAFANA_URL
const grafanaDsn = import.meta.env.VITE_GRAFANA_DSN
const stableCoinAssetId = import.meta.env.VITE_STABLECOIN_ASSET_ID

export function SwapPage() {
  const { api } = useRpcProvider()
  const { account } = useAccount()
  const { createTransaction } = useStore()
  const { stableCoinId } = useDisplayAssetStore()

  const isEvm = isEvmAddress(account?.displayAddress ?? "")

  const preference = useProviderRpcUrlStore()
  const rpcUrl = preference.rpcUrl ?? import.meta.env.VITE_PROVIDER_URL

  const rawSearch = useSearch<SearchGenerics>()
  const search = TradeAppSearch.safeParse(rawSearch)

  const handleSubmit = async (e: CustomEvent<TxInfo>) => {
    const { transaction, notification } = e.detail
    await createTransaction(
      {
        tx: api.tx(transaction.hex),
      },
      {
        onSuccess: () => {},
        onSubmitted: () => {},
        toast: {
          onLoading: (
            <span
              dangerouslySetInnerHTML={{
                __html: notification.processing.rawHtml,
              }}
            />
          ),
          onSuccess: (
            <span
              dangerouslySetInnerHTML={{
                __html: notification.success.rawHtml,
              }}
            />
          ),
          onError: (
            <span
              dangerouslySetInnerHTML={{
                __html: notification.failure.rawHtml,
              }}
            />
          ),
        },
      },
    )
  }

  const assetIn =
    search.success && search.data.assetIn
      ? search.data.assetIn
      : isEvm
      ? defaultEvmTokenId
      : stableCoinId ?? stableCoinAssetId
  const assetOut =
    search.success && search.data.assetOut
      ? search.data.assetOut
      : NATIVE_ASSET_ID

  return (
    <SContainer>
      <SwapApp
        ref={(r) => {
          if (r) {
            r.setAttribute("chart", "")
            r.setAttribute("twapOn", "")
          }
        }}
        assetIn={assetIn}
        assetOut={assetOut}
        apiAddress={rpcUrl}
        stableCoinAssetId={stableCoinId ?? stableCoinAssetId}
        accountName={account?.name}
        accountProvider={account?.provider}
        accountAddress={account?.address}
        indexerUrl={indexerUrl}
        grafanaUrl={grafanaUrl}
        grafanaDsn={grafanaDsn}
        onTxNew={(e) => handleSubmit(e)}
        onDcaSchedule={(e) => handleSubmit(e)}
        onDcaTerminate={(e) => handleSubmit(e)}
      />
    </SContainer>
  )
}
