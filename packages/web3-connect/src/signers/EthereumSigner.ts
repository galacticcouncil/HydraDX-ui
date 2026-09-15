import { ExtendedEvmCall } from "@galacticcouncil/money-market/types"
import { HYDRATION_CHAIN_KEY, isAnyEvmChain } from "@galacticcouncil/utils"
import { chainsMap } from "@galacticcouncil/xc-cfg"
import { isObjectType } from "remeda"
import {
  Address,
  BaseError,
  createPublicClient,
  createWalletClient,
  custom,
  EIP1193Provider,
  EstimateGasParameters,
  ExecutionRevertedError,
  getContract,
  Hex,
  parseSignature,
  PublicClient,
  TransactionReceipt,
  WalletClient,
} from "viem"

import {
  EVM_CALL_PERMIT_ABI,
  EVM_CALL_PERMIT_ADDRESS,
  EVM_CALL_PERMIT_TYPES,
  EVM_DEFAULT_CHAIN_KEY,
  EVM_DISPATCH_ADDRESS,
} from "@/config/evm"
import { requestNetworkSwitch } from "@/utils"
import {
  getPermitGasFromWeight,
  getPermitGasLimit,
  getPermitGasPrice,
} from "@/utils/permitGas"

type PermitMessage = {
  from: string
  to: string
  value: number
  data: string
  gaslimit: number
  nonce: number
  deadline: number
}

export type PermitResult = {
  signature: ReturnType<typeof parseSignature>
  message: PermitMessage
}

type TransactionCall = Omit<ExtendedEvmCall, "from" | "type" | "dryRun">

type EthereumSignerOptions = {
  chainKey?: string
  weight?: bigint
  priorityRpcUrl?: string
  nonce?: number
  onSubmitted: (txHash: string) => void
  onSuccess: (receipt: TransactionReceipt) => void
  onError: (error: string) => void
  onFinalized: (receipt: TransactionReceipt) => void
}

export class EthereumSigner {
  address: string
  provider: EIP1193Provider
  publicClient: PublicClient
  walletClient: WalletClient

  constructor(address: string, provider: EIP1193Provider) {
    this.address = address
    this.provider = provider

    this.publicClient = createPublicClient({
      transport: custom(provider),
    })

    this.walletClient = createWalletClient({
      transport: custom(provider),
    })
  }

  formatError = (err: unknown): string => {
    if (err instanceof BaseError)
      return `${err.name}: ${err.details || err.shortMessage}`
    if (err instanceof Error) return err.message
    return "Unknown error"
  }

  async getGas(
    tx: EstimateGasParameters,
    weight: bigint = 0n,
  ): Promise<bigint> {
    const isPrecompileTx = tx.to === EVM_DISPATCH_ADDRESS

    if (isPrecompileTx && weight > 0n) {
      return getPermitGasFromWeight(weight)
    }

    return this.publicClient.estimateGas({
      ...tx,
      account: this.address as Address,
    })
  }

  async estimateGas(tx: EstimateGasParameters, weight: bigint = 0n) {
    console.log("IN ESTIMATE", { tx, weight })
    const [gas, gasPriceBase] = await Promise.all([
      this.getGas(tx, weight),
      this.publicClient.getGasPrice(),
    ])
    const gasPrice = getPermitGasPrice(gasPriceBase)
    const gasLimit = getPermitGasLimit(gas, weight)

    return {
      gas,
      gasLimit,
      gasPrice,
      maxPriorityFeePerGas: gasPrice,
      maxFeePerGas: gasPrice,
    }
  }

  switchChain = async (options: EthereumSignerOptions) => {
    const chainKey = options.chainKey ?? EVM_DEFAULT_CHAIN_KEY
    const chain = chainsMap.get(chainKey)

    const isEvmChain = !!chain && isAnyEvmChain(chain)

    if (!isEvmChain) throw new Error(`Chain ${chainKey} is not an EVM chain`)

    const { evmClient } = chain

    await requestNetworkSwitch(this.provider, {
      chain: chainKey,
      priorityRpcUrl: options.priorityRpcUrl,
    })

    const prevChainId = this.publicClient?.chain?.id
    const newChainId = evmClient.chain.id

    if (prevChainId !== newChainId) {
      this.publicClient = evmClient.getProvider() as PublicClient
    }

    return chain
  }

  async signAndSubmitDispatch(
    call: Omit<TransactionCall, "to">,
    options: EthereumSignerOptions,
  ) {
    return this.signAndSubmit(
      {
        ...call,
        to: EVM_DISPATCH_ADDRESS,
      },
      options,
    )
  }

  getPermitNonce = async (): Promise<number> => {
    const callPermitContract = getContract({
      address: EVM_CALL_PERMIT_ADDRESS,
      abi: EVM_CALL_PERMIT_ABI,
      client: this.publicClient,
    })

    const nonce = await callPermitContract.read.nonces([this.address as Hex])

    return Number(nonce)
  }

  getPermit = async (
    call: string | ExtendedEvmCall,
    options: EthereumSignerOptions,
  ): Promise<PermitResult> => {
    if (this.provider && this.address) {
      try {
        await this.switchChain(options)

        console.log("IN GET PERMIT", { call, options })

        const weight = options.weight ?? 0n

        const isExtendedEvmCall = isObjectType(call)
        const tx = isExtendedEvmCall
          ? {
              from: call.from as Address,
              to: call.to as Hex,
              data: call.data as Hex,
            }
          : {
              from: this.address as Address,
              to: EVM_DISPATCH_ADDRESS as Hex,
              data: call as Hex,
            }

        const [latestBlock, chainId] = await Promise.all([
          this.publicClient.getBlock(),
          this.publicClient.getChainId(),
        ])

        const gasLimit =
          isExtendedEvmCall && call.gasLimit
            ? call.gasLimit
            : (await this.estimateGas(tx, weight)).gasLimit
        const nonce = options?.nonce ?? (await this.getPermitNonce())

        const createPermitMessageData = () => {
          const message: PermitMessage = {
            ...tx,
            value: 0,
            gaslimit: Number(gasLimit),
            nonce,
            deadline: Number(latestBlock.timestamp) + 3600, // 1 hour deadline,
          }

          const typedData = JSON.stringify({
            types: EVM_CALL_PERMIT_TYPES,
            primaryType: "CallPermit",
            domain: {
              name: "Call Permit Precompile",
              version: "1",
              chainId,
              verifyingContract: EVM_CALL_PERMIT_ADDRESS,
            },
            message: message,
          })

          return {
            typedData,
            message,
          }
        }

        const { message, typedData } = createPermitMessageData()

        const result = await this.walletClient.request({
          method: "eth_signTypedData_v4",
          params: [this.address as Address, typedData],
        })
        const signature = parseSignature(result)

        return {
          message,
          signature,
        }
      } catch (err) {
        options.onError(this.formatError(err))
        throw err
      }
    }

    throw new Error("Error signing transaction. Provider not found")
  }

  async signAndSubmitHydration(
    call: TransactionCall,
    options: EthereumSignerOptions,
  ) {
    try {
      const [gas, nonce] = await Promise.all([
        this.estimateGas(
          {
            data: call.data as Hex,
            to: call.to,
          },
          options.weight,
        ),
        this.publicClient.getTransactionCount({
          address: this.address as Hex,
        }),
      ])

      const txHash = await this.walletClient.sendTransaction({
        account: this.address as Hex,
        data: call.data as Hex,
        to: call.to,
        nonce: options?.nonce ?? nonce,
        chain: this.publicClient.chain,
        maxFeePerGas: call?.maxFeePerGas || gas.maxFeePerGas,
        maxPriorityFeePerGas:
          call?.maxPriorityFeePerGas || gas.maxPriorityFeePerGas,
        gas: call?.gasLimit || gas.gasLimit,
        value: call?.value,
      })

      options.onSubmitted(txHash)

      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash: txHash,
      })

      if (receipt.status === "reverted") {
        options.onError(this.formatError(new ExecutionRevertedError()))
      } else {
        options.onSuccess(receipt)
      }

      options.onFinalized(receipt)

      return receipt
    } catch (err) {
      options.onError(this.formatError(err))
    }
  }

  async signAndSubmitNative(
    call: TransactionCall,
    options: EthereumSignerOptions,
  ) {
    try {
      const nonce = await this.publicClient.getTransactionCount({
        address: this.address as Hex,
      })
      const txHash = await this.walletClient.sendTransaction({
        account: this.address as Hex,
        data: call.data as Hex,
        to: call.to,
        nonce,
        chain: this.publicClient.chain,
        value: call?.value,
      })

      options.onSubmitted(txHash)
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash: txHash,
      })
      if (receipt.status === "reverted") {
        options.onError(this.formatError(new ExecutionRevertedError()))
      } else {
        options.onSuccess(receipt)
      }

      options.onFinalized(receipt)

      return receipt
    } catch (err) {
      options.onError(this.formatError(err))
    }
  }

  async signAndSubmit(call: TransactionCall, options: EthereumSignerOptions) {
    const chain = await this.switchChain(options)

    if (chain.key === HYDRATION_CHAIN_KEY) {
      return this.signAndSubmitHydration(call, options)
    }

    return this.signAndSubmitNative(call, options)
  }
}
