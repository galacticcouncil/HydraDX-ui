import { Buffer } from "buffer"
import { Maybe } from "utils/helpers"
import type { ExternalProvider } from "@ethersproject/providers"
import type EventEmitter from "events"
import UniversalProvider from "@walletconnect/universal-provider/dist/types/UniversalProvider"
import { chainsMap } from "@galacticcouncil/xcm-cfg"
import { EvmParachain } from "@galacticcouncil/xcm-core"

const METAMASK_LIKE_CHECKS = [
  "isTalisman",
  "isSubWallet",
  "isPhantom",
  "isNovaWallet",
] as const
type MetaMaskLikeChecksValues = (typeof METAMASK_LIKE_CHECKS)[number]

type MetaMaskLikeChecks = {
  [key in MetaMaskLikeChecksValues]: boolean
}

export interface MetaMaskLikeProvider
  extends ExternalProvider,
    EventEmitter,
    MetaMaskLikeChecks {}

export interface AddEvmChainParams {
  chainId: string
  chainName: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  rpcUrls: string[]
  blockExplorerUrls?: string[]
}

const getAddEvmChainParams = (chain: string): AddEvmChainParams => {
  const chainProps = (chainsMap.get(chain) as EvmParachain).client.chain

  return {
    chainId: "0x" + Number(chainProps.id).toString(16),
    chainName: chainProps.name,
    rpcUrls: chainProps.rpcUrls.default.http as string[],
    nativeCurrency: chainProps.nativeCurrency,
    blockExplorerUrls: chainProps.blockExplorers?.default
      ? [chainProps.blockExplorers.default.url]
      : [],
  }
}

export function isMetaMask(
  provider: Maybe<ExternalProvider>,
): provider is Required<MetaMaskLikeProvider> {
  return !!provider && !!provider?.isMetaMask
}

export function isMetaMaskLike(
  provider: Maybe<ExternalProvider>,
): provider is Required<MetaMaskLikeProvider> {
  return (
    !!provider &&
    typeof provider?.isMetaMask === "boolean" &&
    METAMASK_LIKE_CHECKS.some(
      (key) => !!(provider as MetaMaskLikeProvider)?.[key],
    )
  )
}

export function isTalisman(
  provider: Maybe<ExternalProvider>,
): provider is Required<MetaMaskLikeProvider> {
  return isMetaMaskLike(provider) && !!provider?.isTalisman
}

export function isSubWallet(provider: Maybe<ExternalProvider>) {
  return isMetaMaskLike(provider) && !!provider?.isSubWallet
}

export function isPhantom(provider: Maybe<ExternalProvider>) {
  return isMetaMaskLike(provider) && !!provider?.isPhantom
}

export function isNovaWalletEvm(
  provider: Maybe<ExternalProvider>,
): provider is Required<MetaMaskLikeProvider> {
  return isMetaMaskLike(provider) && !!provider?.isNovaWallet
}

export function isEthereumProvider(
  provider: Maybe<ExternalProvider>,
): provider is Required<MetaMaskLikeProvider | UniversalProvider> {
  return typeof provider?.request === "function"
}

type RequestNetworkSwitchOptions = {
  onSwitch?: () => void
  chain?: string
}
export async function requestNetworkSwitch(
  provider: Maybe<MetaMaskLikeProvider>,
  options: RequestNetworkSwitchOptions = {},
) {
  if (!isEthereumProvider(provider)) return

  const params = getAddEvmChainParams(options.chain ?? "hydradx")

  try {
    await provider
      .request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: params.chainId }],
      })
      .then(options?.onSwitch)
  } catch (error: any) {
    let message: Record<string, any> = {}
    try {
      message =
        typeof error?.message === "string" ? JSON.parse(error.message) : {}
    } catch (err) {}

    const errorCode =
      message?.data?.originalError?.code ||
      error.data?.originalError?.code ||
      error?.code

    // missing or unsupported network error
    if (errorCode === 4902) {
      try {
        await provider
          .request({
            method: "wallet_addEthereumChain",
            params: [params],
          })
          .then(options?.onSwitch)
      } catch (err) {}
    } else {
      throw new Error(error)
    }
  }
}

export type WatchAssetParams = {
  symbol: string
  decimals: number
  image?: string
}

export async function watchAsset(
  provider: Maybe<MetaMaskLikeProvider>,
  assetId: number | string,
  params: WatchAssetParams,
) {
  if (!isMetaMask(provider)) return

  const tokenAddress = Buffer.from(
    "0000000000000000000000000000000100000000",
    "hex",
  )
  const assetIdBuffer = numToBuffer(+assetId)
  assetIdBuffer.copy(tokenAddress, 16)

  const address = "0x" + tokenAddress.toString("hex")

  return await requestNetworkSwitch(provider, {
    onSwitch: async () =>
      await provider?.request({
        method: "wallet_watchAsset",
        params: {
          // @ts-ignore - generic ExternalProvider doesn't know this type, but it works in MetaMask
          type: "ERC20",
          options: {
            address,
            ...params,
          },
        },
      }),
  })
}

export const requestAccounts = async (
  provider: Maybe<MetaMaskLikeProvider>,
) => {
  if (!isMetaMask(provider)) return
  await provider.request({
    method: "wallet_requestPermissions",
    params: [
      {
        eth_accounts: {},
      },
    ],
  })
}

function numToBuffer(num: number) {
  const arr = new Uint8Array(4)
  for (let i = 0; i < 4; i++) arr.set([num / 0x100 ** i], 3 - i)
  return Buffer.from(arr)
}
