import {
  TransactionReceipt,
  TransactionResponse,
} from "@ethersproject/providers"
import { Hash } from "@open-web3/orml-types/interfaces"
import { ApiPromise } from "@polkadot/api"
import { SubmittableExtrinsic } from "@polkadot/api/types"
import type { AnyJson } from "@polkadot/types-codec/types"
import { ExtrinsicStatus } from "@polkadot/types/interfaces"
import { ISubmittableResult } from "@polkadot/types/types"
import { MutationObserverOptions, useMutation } from "@tanstack/react-query"
import { useNextEvmPermitNonce } from "api/transaction"
import { decodeError } from "ethers-decode-error"
import { useShallow } from "hooks/useShallow"
import { useRpcProvider } from "providers/rpcProvider"
import { useCallback, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useMountedState } from "react-use"
import { useUserExternalTokenStore } from "sections/wallet/addToken/AddToken.utils"
import { useEvmAccount } from "sections/web3-connect/Web3Connect.utils"
import { PermitResult } from "sections/web3-connect/signer/EthereumSigner"
import { useSettingsStore } from "state/store"
import { useToast } from "state/toasts"
import {
  H160,
  getEvmChainById,
  getChainByKey,
  getEvmTxLink,
  isEvmAccount,
} from "utils/evm"
import { getSubscanLinkByType } from "utils/formatting"

type TxMethod = AnyJson & {
  method: string
  section: string
  args: { [key: string]: AnyJson }
}

function isTxMethod(x: AnyJson): x is TxMethod {
  return typeof x === "object" && x != null && "method" in x && "section" in x
}

type TxHuman = Record<string, { args: TxMethod["args"] }>

function getTxHuman(x: AnyJson, prefix = ""): TxHuman | null {
  if (!isTxMethod(x)) return null

  const key = `${prefix}${x.section}.${x.method}(args)`
  let args = x.args

  if (
    (key === "utility.batch(args)" || key === "utility.batchAll(args)") &&
    Array.isArray(x.args.calls)
  ) {
    args = {
      calls: x.args.calls.reduce<TxHuman>((memo, item, idx) => {
        const parsed = getTxHuman(item, `#${idx}: `)
        if (parsed == null) return memo
        return { ...memo, ...parsed }
      }, {}),
    }
  }

  return { [key]: { args } }
}

type TxExtrinsic = AnyJson & { method: TxMethod }

function isTxExtrinsic(x: AnyJson): x is TxExtrinsic {
  return (
    typeof x === "object" && x != null && "method" in x && isTxMethod(x.method)
  )
}

export function isSetCurrencyExtrinsic(tx?: AnyJson) {
  return isTxExtrinsic(tx) && tx.method.method === "setCurrency"
}

export function getTransactionJSON(tx: SubmittableExtrinsic<"promise">) {
  const txEx = tx.toHuman()
  const res = isTxExtrinsic(txEx) ? getTxHuman(txEx.method) : null
  if (res == null || Object.entries(res).length !== 1) return null

  const [method, { args: argsRaw }] = Object.entries(res)[0]

  const args = Object.fromEntries(
    Object.entries(argsRaw).map(([key, value]) => [
      key,
      // format EVM account address to EVM H160
      typeof value === "string" && isEvmAccount(value)
        ? H160.fromAccount(value)
        : value,
    ]),
  )
  return { method, args }
}

export class UnknownTransactionState extends Error {}

function evmTxReceiptToSubmittableResult(txReceipt: TransactionReceipt) {
  const isSuccess = txReceipt.status === 1
  const submittableResult: ISubmittableResult = {
    status: {} as ExtrinsicStatus,
    events: [],
    isCompleted: isSuccess,
    isError: !isSuccess,
    isFinalized: isSuccess,
    isInBlock: isSuccess,
    isWarning: false,
    txHash: txReceipt.transactionHash as unknown as Hash,
    txIndex: txReceipt.transactionIndex,
    filterRecords: () => [],
    findRecord: () => undefined,
    toHuman: () => ({}),
  }

  return submittableResult
}

const createResultOnCompleteHandler =
  (
    api: ApiPromise,
    {
      onSuccess,
      onError,
      onSettled,
    }: {
      onSuccess: (result: ISubmittableResult) => void
      onError: (error: Error) => void
      onSettled: () => void
    },
  ) =>
  (result: ISubmittableResult) => {
    if (result.isCompleted) {
      if (result.dispatchError) {
        let errorMessage = result.dispatchError.toString()

        if (result.dispatchError.isModule) {
          const decoded = api.registry.findMetaError(
            result.dispatchError.asModule,
          )
          errorMessage = `${decoded.section}.${
            decoded.method
          }: ${decoded.docs.join(" ")}`
        }

        onError(new Error(errorMessage))
      } else {
        onSuccess(result)
      }

      onSettled()
    }
  }

export const useSendEvmTransactionMutation = (
  options: MutationObserverOptions<
    ISubmittableResult,
    unknown,
    {
      evmTx: TransactionResponse
      tx?: SubmittableExtrinsic<"promise">
      xcallMeta?: Record<string, string>
    }
  > = {},
) => {
  const [txState, setTxState] = useState<ExtrinsicStatus["type"] | null>(null)
  const [txHash, setTxHash] = useState<string>("")
  const [txData, setTxData] = useState<string>()
  const [xcallMeta, setCallMeta] = useState<Record<string, string> | undefined>(
    undefined,
  )

  const { account } = useEvmAccount()

  const sendTx = useMutation(async ({ evmTx, xcallMeta }) => {
    return await new Promise(async (resolve, reject) => {
      const timeout = setTimeout(
        () => {
          clearTimeout(timeout)
          reject(new UnknownTransactionState())
        },
        5 * 60 * 1000,
      )

      try {
        setTxState("Broadcast")
        setTxHash(evmTx?.hash ?? "")
        setTxData(evmTx?.data)
        setCallMeta(xcallMeta)
        const receipt = await evmTx.wait()
        setTxState("InBlock")

        return resolve(evmTxReceiptToSubmittableResult(receipt))
      } catch (err) {
        const { error } = decodeError(err)
        reject(new Error(error))
      } finally {
        clearTimeout(timeout)
      }
    })
  }, options)

  const chain = account?.chainId ? getEvmChainById(account.chainId) : null
  const txLink = txHash && chain ? getEvmTxLink(txHash, txData, chain.key) : ""

  const isApproveTx = txData?.startsWith("0x095ea7b3")

  const destChain = xcallMeta?.dstChain
    ? getChainByKey(xcallMeta.dstChain)
    : undefined

  const bridge =
    chain?.isEvmChain() || destChain?.isEvmChain() ? chain?.key : undefined

  return {
    ...sendTx,
    txState,
    txLink,
    bridge: isApproveTx ? undefined : bridge,
    reset: () => {
      setTxState(null)
      setTxHash("")
      setCallMeta(undefined)
      sendTx.reset()
    },
  }
}

export const useSendDispatchPermit = (
  options: MutationObserverOptions<
    ISubmittableResult,
    unknown,
    {
      permit: PermitResult
      xcallMeta?: Record<string, string>
    }
  > = {},
) => {
  const { api } = useRpcProvider()
  const [txState, setTxState] = useState<ExtrinsicStatus["type"] | null>(null)
  const [txHash, setTxHash] = useState<string>("")
  const [xcallMeta, setCallMeta] = useState<Record<string, string> | undefined>(
    undefined,
  )
  const isMounted = useMountedState()

  const sendTx = useMutation(async ({ permit, xcallMeta }) => {
    return await new Promise(async (resolve, reject) => {
      try {
        const unsubscribe = await api.tx.multiTransactionPayment
          .dispatchPermit(
            permit.message.from,
            permit.message.to,
            permit.message.value,
            permit.message.data,
            permit.message.gaslimit,
            permit.message.deadline,
            permit.signature.v,
            permit.signature.r,
            permit.signature.s,
          )
          .send(async (result) => {
            if (!result || !result.status) return

            const timeout = setTimeout(() => {
              clearTimeout(timeout)
              reject(new UnknownTransactionState())
            }, 60000)

            if (isMounted()) {
              setTxHash(result.txHash.toHex())
              setTxState(result.status.type)
              setCallMeta(xcallMeta)
            } else {
              clearTimeout(timeout)
            }

            const onComplete = createResultOnCompleteHandler(api, {
              onError: (error) => {
                clearTimeout(timeout)
                reject(error)
              },
              onSuccess: (result) => {
                clearTimeout(timeout)
                resolve(result)
              },
              onSettled: unsubscribe,
            })

            return onComplete(result)
          })
      } catch (err) {
        reject(err?.toString() ?? "Unknown error")
      }
    })
  }, options)

  const txLink = txHash
    ? `${getSubscanLinkByType("extrinsic")}/${txHash}`
    : undefined

  const destChain = xcallMeta?.dstChain
    ? getChainByKey(xcallMeta.dstChain)
    : undefined

  const bridge = destChain?.isEvmChain() ? "substrate" : undefined

  return {
    ...sendTx,
    txState,
    txLink,
    bridge,
    reset: () => {
      setTxState(null)
      setTxHash("")
      sendTx.reset()
    },
  }
}

export const useSendTransactionMutation = (
  options: MutationObserverOptions<
    ISubmittableResult,
    unknown,
    {
      tx: SubmittableExtrinsic<"promise">
      xcallMeta?: Record<string, string>
    }
  > = {},
) => {
  const { api } = useRpcProvider()
  const isMounted = useMountedState()
  const [txState, setTxState] = useState<ExtrinsicStatus["type"] | null>(null)
  const [txHash, setTxHash] = useState<string>("")
  const [xcallMeta, setCallMeta] = useState<Record<string, string> | undefined>(
    undefined,
  )

  const sendTx = useMutation(async ({ tx, xcallMeta }) => {
    return await new Promise(async (resolve, reject) => {
      try {
        const unsubscribe = await tx.send(async (result) => {
          if (!result || !result.status) return

          const timeout = setTimeout(() => {
            clearTimeout(timeout)
            reject(new UnknownTransactionState())
          }, 60000)

          if (isMounted()) {
            setTxHash(result.txHash.toHex())
            setTxState(result.status.type)
            setCallMeta(xcallMeta)
          } else {
            clearTimeout(timeout)
          }

          const onComplete = createResultOnCompleteHandler(api, {
            onError: (error) => {
              clearTimeout(timeout)
              reject(error)
            },
            onSuccess: (result) => {
              clearTimeout(timeout)
              resolve(result)
            },
            onSettled: unsubscribe,
          })

          return onComplete(result)
        })
      } catch (err) {
        reject(err?.toString() ?? "Unknown error")
      }
    })
  }, options)

  const txLink = txHash
    ? `${getSubscanLinkByType("extrinsic")}/${txHash}`
    : undefined

  const destChain = xcallMeta?.dstChain
    ? getChainByKey(xcallMeta.dstChain)
    : undefined

  const bridge = destChain?.isEvmChain() ? "substrate" : undefined

  return {
    ...sendTx,
    txState,
    txLink,
    bridge,
    reset: () => {
      setTxState(null)
      setTxHash("")
      setCallMeta(undefined)
      sendTx.reset()
    },
  }
}

function getReferralCodeFromTx(tx: SubmittableExtrinsic<"promise">) {
  if (!tx) return null

  let code = null
  try {
    const json: any = tx.method.toHuman()
    const calls: any[] = Array.isArray(json?.args?.calls) ? json.args.calls : []
    const referralCall = calls.find(
      ({ method, section, args }) =>
        method === "linkCode" && section === "referrals" && !!args.code,
    )
    code = referralCall?.args?.code ?? null
  } catch {
    return null
  }

  return code
}

function getAssetIdsFromTx(tx: SubmittableExtrinsic<"promise">) {
  if (!tx) return []

  try {
    const { method, section }: any = tx.method.toHuman()
    const json: any = tx.method.toJSON()
    const callName = `${section}.${method}`

    switch (callName) {
      case "router.sell":
      case "router.buy":
        return [json.args.asset_in, json.args.asset_out]
          .filter(Boolean)
          .map(String)
      default:
        return []
    }
  } catch {
    return []
  }
}

const useBoundReferralToast = () => {
  const { t } = useTranslation()
  const { loading, success, remove } = useToast()

  const pendingToastId = useRef<string>()
  const pendingReferralCode = useRef<string>()

  const onLoading = (tx: SubmittableExtrinsic<"promise">) => {
    const code = getReferralCodeFromTx(tx)

    if (code) {
      pendingReferralCode.current = code
      pendingToastId.current = loading({
        hideTime: 3000,
        title: (
          <span>
            {t("referrals.toasts.linkCode.onLoading", {
              code,
            })}
          </span>
        ),
      })
    }
  }

  const onSuccess = () => {
    if (pendingToastId.current) {
      remove(pendingToastId.current)
      success({
        title: (
          <span>
            {t("referrals.toasts.linkCode.onSuccess", {
              code: pendingReferralCode.current,
            })}
          </span>
        ),
      })
    }
  }

  return {
    onLoading,
    onSuccess,
  }
}

const useStoreExternalAssetsOnSign = () => {
  const { assets } = useRpcProvider()
  const { addToken, isAdded } = useUserExternalTokenStore()
  const degenMode = useSettingsStore(useShallow((s) => s.degenMode))

  return useCallback(
    (assetIds: string[]) => {
      if (!degenMode) return
      assetIds.forEach((id) => {
        const asset = assets.getAsset(id)
        if (
          !isAdded(asset.externalId) &&
          asset.isExternal &&
          asset.externalId
        ) {
          addToken({
            id: asset.externalId,
            decimals: asset.decimals,
            symbol: asset.symbol,
            name: asset.name,
            origin: Number(asset.parachainId),
            internalId: asset.id,
          })
        }
      })
    },
    [addToken, assets, degenMode, isAdded],
  )
}

export const useSendTx = () => {
  const [txType, setTxType] = useState<"default" | "evm" | "permit" | null>(
    null,
  )

  const boundReferralToast = useBoundReferralToast()
  const storeExternalAssetsOnSign = useStoreExternalAssetsOnSign()

  const { incrementPermitNonce, revertPermitNonce, setPendingPermit } =
    useNextEvmPermitNonce()

  const sendTx = useSendTransactionMutation({
    onMutate: ({ tx }) => {
      boundReferralToast.onLoading(tx)
      storeExternalAssetsOnSign(getAssetIdsFromTx(tx))
      setTxType("default")
    },
    onSuccess: boundReferralToast.onSuccess,
  })

  const sendEvmTx = useSendEvmTransactionMutation({
    onMutate: ({ tx }) => {
      if (tx) {
        boundReferralToast.onLoading(tx)
        storeExternalAssetsOnSign(getAssetIdsFromTx(tx))
      }
      setTxType("evm")
    },
    onSuccess: boundReferralToast.onSuccess,
  })

  const sendPermitTx = useSendDispatchPermit({
    onMutate: ({ permit }) => {
      setTxType("permit")
      incrementPermitNonce()
      setPendingPermit(permit)
    },
    onError: () => revertPermitNonce(),
    onSettled: () => setPendingPermit(null),
  })

  const activeMutation =
    txType === "default" ? sendTx : txType === "evm" ? sendEvmTx : sendPermitTx

  return {
    sendTx: sendTx.mutateAsync,
    sendEvmTx: sendEvmTx.mutateAsync,
    sendPermitTx: sendPermitTx.mutateAsync,
    ...activeMutation,
  }
}
