import { ApiPromise } from "@polkadot/api"
import { Provider as TooltipProvider } from "@radix-ui/react-tooltip"
import { useProvider, useProviderRpcUrlStore } from "api/provider"
import { InvalidateOnBlock } from "components/InvalidateOnBlock"
import { OnboardProvider } from "components/OnboardProvider/OnboardProvider"
import { ToastProvider } from "components/Toast/ToastProvider"
import { FC, PropsWithChildren } from "react"
import { SkeletonTheme } from "react-loading-skeleton"
import { Transactions } from "sections/transaction/Transactions"
import { theme } from "theme"
import { ApiPromiseContext } from "utils/api"

export const AppProviders: FC<PropsWithChildren> = ({ children }) => {
  const preference = useProviderRpcUrlStore()
  const api = useProvider(preference.rpcUrl)

  return (
    <TooltipProvider>
      <ApiPromiseContext.Provider
        value={
          api.data && preference._hasHydrated ? api.data : ({} as ApiPromise)
        }
      >
        <OnboardProvider>
          <InvalidateOnBlock>
            <SkeletonTheme
              baseColor={`rgba(${theme.rgbColors.white}, 0.12)`}
              highlightColor={`rgba(${theme.rgbColors.white}, 0.24)`}
              borderRadius={4}
            >
              <ToastProvider>
                {children}
                <Transactions />
              </ToastProvider>
            </SkeletonTheme>
          </InvalidateOnBlock>
        </OnboardProvider>
      </ApiPromiseContext.Provider>
    </TooltipProvider>
  )
}
