import { API_ETH_MOCK_ADDRESS, PERMISSION } from "@aave/contract-helpers"
import React from "react"
import {
  ComputedReserveData,
  ComputedUserReserveData,
  useAppDataContext,
} from "sections/lending/hooks/app-data-provider/useAppDataProvider"
import { useWalletBalances } from "sections/lending/hooks/app-data-provider/useWalletBalances"
import { AssetCapsProvider } from "sections/lending/hooks/useAssetCaps"
import { useIsWrongNetwork } from "sections/lending/hooks/useIsWrongNetwork"
import { useModalContext } from "sections/lending/hooks/useModal"
import { usePermissions } from "sections/lending/hooks/usePermissions"
import { useWeb3Context } from "sections/lending/libs/hooks/useWeb3Context"
import { useRootStore } from "sections/lending/store/root"
import {
  getNetworkConfig,
  isFeatureEnabled,
} from "sections/lending/utils/marketsAndNetworksConfig"

import { ModalContents } from "components/Modal/contents/ModalContents"
import { ChangeNetworkWarning } from "sections/lending/components/transactions/Warnings/ChangeNetworkWarning"
import { TxErrorView } from "./Error"

export interface ModalWrapperProps {
  underlyingAsset: string
  poolReserve: ComputedReserveData
  userReserve: ComputedUserReserveData
  symbol: string
  tokenBalance: string
  nativeBalance: string
  isWrongNetwork: boolean
  action?: string
}

export const ModalWrapper: React.FC<{
  underlyingAsset: string
  title: string
  requiredChainId?: number
  // if true wETH will stay wETH otherwise wETH will be returned as ETH
  keepWrappedSymbol?: boolean
  hideTitleSymbol?: boolean
  requiredPermission?: PERMISSION
  children: (props: ModalWrapperProps) => React.ReactNode
  action?: string
}> = ({
  hideTitleSymbol,
  underlyingAsset,
  children,
  requiredChainId: _requiredChainId,
  title,
  requiredPermission,
  keepWrappedSymbol,
}) => {
  const { readOnlyModeAddress } = useWeb3Context()
  const currentMarketData = useRootStore((store) => store.currentMarketData)
  const currentNetworkConfig = useRootStore(
    (store) => store.currentNetworkConfig,
  )
  const { walletBalances } = useWalletBalances(currentMarketData)
  const { user, reserves } = useAppDataContext()
  const { txError, mainTxState, close } = useModalContext()
  const { permissions } = usePermissions()

  const { isWrongNetwork, requiredChainId } =
    useIsWrongNetwork(_requiredChainId)

  if (txError && txError.blocking) {
    return <TxErrorView txError={txError} />
  }

  if (
    requiredPermission &&
    isFeatureEnabled.permissions(currentMarketData) &&
    !permissions.includes(requiredPermission) &&
    currentMarketData.permissionComponent
  ) {
    return <>{currentMarketData.permissionComponent}</>
  }

  const poolReserve = reserves.find((reserve) => {
    if (underlyingAsset?.toLowerCase() === API_ETH_MOCK_ADDRESS.toLowerCase())
      return reserve?.isWrappedBaseAsset
    return underlyingAsset === reserve.underlyingAsset
  }) as ComputedReserveData

  const userReserve = user?.userReservesData.find((userReserve) => {
    if (underlyingAsset?.toLowerCase() === API_ETH_MOCK_ADDRESS.toLowerCase())
      return userReserve?.reserve?.isWrappedBaseAsset
    return underlyingAsset === userReserve?.underlyingAsset
  }) as ComputedUserReserveData

  const symbol =
    poolReserve?.isWrappedBaseAsset && !keepWrappedSymbol
      ? currentNetworkConfig?.baseAssetSymbol
      : poolReserve?.symbol

  const modalTitle = !mainTxState.success ? title : ""
  const fullModalTitle = `${modalTitle}${hideTitleSymbol ? "" : ` ${symbol}`}`

  return (
    <AssetCapsProvider asset={poolReserve}>
      <ModalContents
        onClose={close}
        sx={{ color: "white" }}
        contents={[
          {
            title: fullModalTitle,
            content: (
              <>
                {isWrongNetwork && !readOnlyModeAddress && (
                  <ChangeNetworkWarning
                    networkName={getNetworkConfig(requiredChainId).name}
                    chainId={requiredChainId}
                    sx={{ mb: 20 }}
                  />
                )}
                {children({
                  isWrongNetwork,
                  nativeBalance:
                    walletBalances[API_ETH_MOCK_ADDRESS.toLowerCase()]
                      ?.amount || "0",
                  tokenBalance:
                    walletBalances[poolReserve?.underlyingAsset?.toLowerCase()]
                      ?.amount || "0",
                  poolReserve,
                  symbol,
                  underlyingAsset,
                  userReserve,
                })}
              </>
            ),
          },
        ]}
      />
    </AssetCapsProvider>
  )
}
