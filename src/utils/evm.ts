import { encodeAddress, decodeAddress } from "@polkadot/util-crypto"
import { u8aToHex } from "@polkadot/util"
import { Buffer } from "buffer"
import { HYDRA_ADDRESS_PREFIX } from "utils/api"

import {
  isAddress as isEvmAddress,
  getAddress as getEvmAddress,
} from "@ethersproject/address"
import { evmChains } from "@galacticcouncil/xcm-sdk"

export const NATIVE_EVM_ASSET_SYMBOL =
  evmChains["hydradx"].nativeCurrency.symbol
export const NATIVE_EVM_ASSET_DECIMALS =
  evmChains["hydradx"].nativeCurrency.decimals

export const DISPATCH_ADDRESS = "0x0000000000000000000000000000000000000401"

export function isEvmAccount(address?: string) {
  if (!address) return false

  try {
    const { prefixBytes } = H160
    const pub = decodeAddress(address, true)
    return Buffer.from(pub.subarray(0, prefixBytes.length)).equals(prefixBytes)
  } catch {
    return false
  }
}

export class H160 {
  static prefixBytes = Buffer.from("ETH\0")
  address: string

  constructor(address: string) {
    this.address = safeConvertAddressH160(address) ?? ""
  }

  toAccount = () => {
    const addressBytes = Buffer.from(this.address.slice(2), "hex")
    return encodeAddress(
      new Uint8Array(
        Buffer.concat([H160.prefixBytes, addressBytes, Buffer.alloc(8)]),
      ),
      HYDRA_ADDRESS_PREFIX,
    )
  }

  static fromAccount = (address: string) => {
    const decodedBytes = decodeAddress(address)
    const addressBytes = decodedBytes.slice(H160.prefixBytes.length, -8)
    return (
      safeConvertAddressH160(Buffer.from(addressBytes).toString("hex")) ?? ""
    )
  }

  static fromSS58 = (address: string) => {
    const decodedBytes = decodeAddress(address)
    const slicedBytes = decodedBytes.slice(0, 20)
    return u8aToHex(slicedBytes)
  }
}

export function getEvmTxLink(txHash: string, chain = "hydradx") {
  const explorerUrl = evmChains[chain]?.blockExplorers?.default?.url

  if (!explorerUrl) return ""

  return `${explorerUrl}/tx/${txHash}`
}

export function safeConvertAddressH160(value: string): string | null {
  try {
    return getEvmAddress(value?.toLowerCase())
  } catch {
    return null
  }
}

export { getEvmAddress, isEvmAddress }
