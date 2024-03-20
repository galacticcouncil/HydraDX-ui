import {
  JsonRpcSigner,
  TransactionRequest,
  Web3Provider,
} from "@ethersproject/providers"
import { evmChains } from "@galacticcouncil/xcm-sdk"
import { DISPATCH_ADDRESS } from "utils/evm"
import { MetaMaskProvider, requestNetworkSwitch } from "utils/metamask"

export class MetaMaskSigner {
  address: string
  provider: MetaMaskProvider
  signer: JsonRpcSigner

  constructor(address: string, provider: MetaMaskProvider) {
    this.address = address
    this.provider = provider
    this.signer = this.getSigner(provider)
  }

  getSigner(provider: MetaMaskProvider) {
    return new Web3Provider(provider).getSigner()
  }

  setAddress(address: string) {
    this.address = address
  }

  getGasValues(tx: TransactionRequest) {
    return Promise.all([
      this.signer.provider.estimateGas(tx),
      this.signer.provider.getGasPrice(),
    ])
  }

  sendDispatch = async (data: string) => {
    return this.sendTransaction({
      to: DISPATCH_ADDRESS,
      data,
      from: this.address,
    })
  }

  sendTransaction = async (
    tx: TransactionRequest,
    options: { chain?: string } = {},
  ) => {
    const { chain } = options
    const from = chain && evmChains[chain] ? chain : "hydradx"

    if (chain) {
      await requestNetworkSwitch(this.provider, {
        chain: from,
        onSwitch: () => {
          // update signer after network switch
          this.signer = this.getSigner(this.provider)
        },
      })
    }

    if (from === "hydradx") {
      const [gas, gasPrice] = await this.getGasValues(tx)

      const onePrc = gasPrice.div(100)
      const gasPricePlus = gasPrice.add(onePrc)

      return await this.signer.sendTransaction({
        maxPriorityFeePerGas: gasPricePlus,
        maxFeePerGas: gasPricePlus,
        gasLimit: gas.mul(11).div(10), // add 10%
        ...tx,
      })
    } else {
      return await this.signer.sendTransaction(tx)
    }
  }
}
