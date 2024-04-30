import { createContext, useContext } from "react"
import { ApprovedAmountService } from "sections/lending/services/ApprovedAmountService"
import { UiIncentivesService } from "sections/lending/services/UIIncentivesService"
import { UiPoolService } from "sections/lending/services/UIPoolService"
import { WalletBalanceService } from "sections/lending/services/WalletBalanceService"
import { getProvider } from "sections/lending/utils/marketsAndNetworksConfig"
import invariant from "tiny-invariant"

interface SharedDependenciesContextProps {
  poolTokensBalanceService: WalletBalanceService
  approvedAmountService: ApprovedAmountService
  uiIncentivesService: UiIncentivesService
  uiPoolService: UiPoolService
}

const SharedDependenciesContext =
  createContext<SharedDependenciesContextProps | null>(null)

export const SharedDependenciesProvider: React.FC<{
  children?: React.ReactNode
}> = ({ children }) => {
  const poolTokensBalanceService = new WalletBalanceService(getProvider)
  const approvedAmountService = new ApprovedAmountService(getProvider)

  const uiPoolService = new UiPoolService(getProvider)
  const uiIncentivesService = new UiIncentivesService(getProvider)

  return (
    <SharedDependenciesContext.Provider
      value={{
        poolTokensBalanceService,
        approvedAmountService,
        uiPoolService,
        uiIncentivesService,
      }}
    >
      {children}
    </SharedDependenciesContext.Provider>
  )
}

export const useSharedDependencies = () => {
  const context = useContext(SharedDependenciesContext)
  invariant(
    context,
    "Component should be wrapper inside a <SharedDependenciesProvider />",
  )
  return context
}
