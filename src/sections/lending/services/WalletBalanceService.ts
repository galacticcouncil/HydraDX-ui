import { ChainId, WalletBalanceProvider } from "@aave/contract-helpers"
import { Provider } from "@ethersproject/providers"
import { MarketDataType } from "sections/lending/ui-config/marketsConfig"

export interface GovernanceTokensBalance {
  aave: string
  stkAave: string
  aAave: string
}

export type UserPoolTokensBalances = {
  address: string
  amount: string
}

export class WalletBalanceService {
  constructor(private readonly getProvider: (chainId: number) => Provider) {}

  private getWalletBalanceService(
    chainId: ChainId,
    walletBalanceProviderAddress: string,
  ) {
    const provider = this.getProvider(chainId)
    return new WalletBalanceProvider({
      walletBalanceProviderAddress,
      provider,
    })
  }

  async getPoolTokensBalances(
    marketData: MarketDataType,
    user: string,
  ): Promise<UserPoolTokensBalances[]> {
    const walletBalanceService = this.getWalletBalanceService(
      marketData.chainId,
      marketData.addresses.WALLET_BALANCE_PROVIDER,
    )
    const { 0: tokenAddresses, 1: balances } =
      await walletBalanceService.getUserWalletBalancesForLendingPoolProvider(
        user,
        marketData.addresses.LENDING_POOL_ADDRESS_PROVIDER,
      )
    const mappedBalances = tokenAddresses.map((address, ix) => ({
      address: address.toLowerCase(),
      amount: balances[ix].toString(),
    }))
    return mappedBalances
  }
}
