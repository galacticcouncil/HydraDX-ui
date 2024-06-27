import { SContainer } from "./SwapPage.styled"

import type { TxInfo } from "@galacticcouncil/apps"

import * as React from "react"
import * as Apps from "@galacticcouncil/apps"
import { createComponent, EventName } from "@lit-labs/react"
import { useStore } from "state/store"
import { z } from "zod"
import { MakeGenerics, useSearch } from "@tanstack/react-location"
import { useActiveProvider, useActiveRpcUrlList } from "api/provider"
import { useRpcProvider } from "providers/rpcProvider"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { useDisplayAssetStore } from "utils/displayAsset"
import { isEvmAccount } from "utils/evm"
import { NATIVE_ASSET_ID } from "utils/api"
import { useRemount } from "hooks/useRemount"
import { ExternalAssetImportModal } from "sections/trade/modal/ExternalAssetImportModal"
import { AddTokenModal } from "sections/wallet/addToken/modal/AddTokenModal"
import { useState } from "react"
import { Asset } from "@galacticcouncil/sdk"
import { ExternalAssetUpdateModal } from "sections/trade/modal/ExternalAssetUpdateModal"

const defaultEvmTokenId: string = import.meta.env.VITE_EVM_NATIVE_ASSET_ID

const SwapApp = createComponent({
  tagName: "gc-trade",
  elementClass: Apps.TradeApp,
  react: React,
  events: {
    onTxNew: "gc:tx:new" as EventName<CustomEvent<TxInfo>>,
    onDcaSchedule: "gc:tx:scheduleDca" as EventName<CustomEvent<TxInfo>>,
    onDcaTerminate: "gc:tx:terminateDca" as EventName<CustomEvent<TxInfo>>,
    onNewAssetClick: "gc:external:new" as EventName<CustomEvent<void>>,
    onCheckAssetDataClick: "gc:external:checkData" as EventName<
      CustomEvent<Asset>
    >,
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

const grafanaUrl = import.meta.env.VITE_GRAFANA_URL
const grafanaDsn = import.meta.env.VITE_GRAFANA_DSN
const stableCoinAssetId = import.meta.env.VITE_STABLECOIN_ASSET_ID

export function SwapPage() {
  const { api, isLoaded } = useRpcProvider()
  const { account } = useAccount()
  const { createTransaction } = useStore()
  const { stableCoinId } = useDisplayAssetStore()
  const [addToken, setAddToken] = useState(false)
  const [tokenCheck, setTokenCheck] = useState<Asset | null>(null)

  const isEvm = isEvmAccount(account?.address)
  const version = useRemount([isEvm])

  const rpcUrlList = useActiveRpcUrlList()
  const activeProvider = useActiveProvider()

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
        key={version}
        ref={(r) => {
          if (r) {
            r.setAttribute("chart", "")
            r.setAttribute("twapOn", "")
            r.setAttribute("newAssetBtn", "")
          }
        }}
        assetIn={assetIn}
        assetOut={assetOut}
        apiAddress={rpcUrlList.join()}
        stableCoinAssetId={stableCoinId ?? stableCoinAssetId}
        accountName={account?.name}
        accountProvider={account?.provider}
        accountAddress={account?.address}
        indexerUrl={activeProvider?.indexerUrl}
        grafanaUrl={grafanaUrl}
        grafanaDsn={grafanaDsn}
        onTxNew={(e) => handleSubmit(e)}
        onDcaSchedule={(e) => handleSubmit(e)}
        onDcaTerminate={(e) => handleSubmit(e)}
        onNewAssetClick={() => setAddToken(true)}
        onCheckAssetDataClick={(e) => setTokenCheck(e.detail)}
        isTestnet={activeProvider.dataEnv === "testnet"}
      />
      {isLoaded && <ExternalAssetImportModal assetIds={[assetIn, assetOut]} />}
      {isLoaded && tokenCheck && (
        <ExternalAssetUpdateModal
          assetId={tokenCheck.id}
          open={!!tokenCheck}
          onClose={() => setTokenCheck(null)}
        />
      )}
      {addToken && (
        <AddTokenModal
          css={{ zIndex: 9999 }}
          onClose={() => setAddToken(false)}
        />
      )}
    </SContainer>
  )
}
