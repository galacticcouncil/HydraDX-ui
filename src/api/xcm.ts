import { assetsMap, chainsConfigMap, chainsMap } from "@galacticcouncil/xcm-cfg"
import { ConfigService, SubstrateApis } from "@galacticcouncil/xcm-core"
import { Wallet } from "@galacticcouncil/xcm-sdk"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Transaction, useStore } from "state/store"
import { isAnyParachain } from "utils/helpers"
import { QUERY_KEYS } from "utils/queryKeys"
import { external } from "@galacticcouncil/apps"
import { ASSETHUB_XCM_ASSET_SUFFIX } from "./external/assethub"
import { TRegisteredAsset } from "sections/wallet/addToken/AddToken.utils"
import { useTranslation } from "react-i18next"
import { createToastMessages } from "state/toasts"

type TransferProps = {
  asset: string
  srcAddr: string
  srcChain: string
  dstAddr: string
  dstChain: string
}

export const xcmConfigService = new ConfigService({
  assets: assetsMap,
  chains: chainsMap,
  chainsConfig: chainsConfigMap,
})

export const wallet = new Wallet({
  config: xcmConfigService,
})

export const createXcmAssetKey = (id: string, symbol: string) => {
  if (id && symbol) {
    return `${symbol?.toLowerCase()}${ASSETHUB_XCM_ASSET_SUFFIX}${id}`
  }

  return ""
}

export const syncAssethubXcmConfig = (asset: TRegisteredAsset) => {
  const assetData = external.buildAssetData(asset, ASSETHUB_XCM_ASSET_SUFFIX)
  external.buildAssethubConfig(assetData, xcmConfigService)
}

export const useCrossChainTransfer = ({
  asset,
  srcAddr,
  srcChain,
  dstAddr,
  dstChain,
}: TransferProps) => {
  return useQuery(
    QUERY_KEYS.xcmTransfer(asset, srcAddr, srcChain, dstAddr, dstChain),
    async () =>
      await wallet.transfer(asset, srcAddr, srcChain, dstAddr, dstChain),
  )
}

export const useCrossChainTransaction = ({
  steps,
}: {
  steps?: Transaction["steps"]
} = {}) => {
  const { t } = useTranslation()
  const { createTransaction } = useStore()

  return useMutation(
    async (values: TransferProps & { amount: number | string }) => {
      const srcChain = chainsMap.get(values.srcChain)
      const dstChain = chainsMap.get(values.dstChain)

      if (!srcChain) throw new Error(`Chain ${values.srcChain} not found`)
      if (!dstChain) throw new Error(`Chain ${values.dstChain} not found`)
      if (!isAnyParachain(srcChain))
        throw new Error(`Chain ${values.srcChain} is not a parachain`)

      const apiPool = SubstrateApis.getInstance()
      const api = await apiPool.api(srcChain.ws)

      const xTransfer = await wallet.transfer(
        values.asset,
        values.srcAddr,
        values.srcChain,
        values.dstAddr,
        values.dstChain,
      )

      const { balance, srcFee, dstFee, srcFeeBalance } = xTransfer

      const call = await xTransfer.buildCall(values.amount)

      return await createTransaction(
        {
          title: t("xcm.transfer.reviewTransaction.modal.title"),
          description: t("xcm.transfer.reviewTransaction.modal.description", {
            amount: values.amount,
            symbol: balance.symbol,
            srcChain: srcChain.name,
            dstChain: dstChain.name,
          }),
          tx: api.tx(call.data),
          xcallMeta: {
            srcChain: values.srcChain,
            srcChainFee: srcFee.toDecimal(dstFee.decimals),
            srcChainFeeBalance: balance.toDecimal(srcFeeBalance.decimals),
            srcChainFeeSymbol: srcFee.originSymbol,
            dstChain: values.dstChain,
            dstChainFee: dstFee.toDecimal(dstFee.decimals),
            dstChainFeeSymbol: dstFee.originSymbol,
          },
        },
        {
          steps,
          toast: createToastMessages("xcm.transfer.toast", {
            t,
            tOptions: {
              amount: values.amount,
              symbol: balance.symbol,
              srcChain: srcChain.name,
              dstChain: dstChain.name,
            },
            components: ["span.highlight"],
          }),
        },
      )
    },
  )
}
