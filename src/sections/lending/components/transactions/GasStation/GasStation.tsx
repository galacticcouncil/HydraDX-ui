import { API_ETH_MOCK_ADDRESS } from "@aave/contract-helpers"
import { normalize } from "@aave/math-utils"
import GasPumpIcon from "assets/icons/GasPumpIcon.svg?react"
import { DisplayValue } from "components/DisplayValue/DisplayValue"
import { InfoTooltip } from "components/InfoTooltip/InfoTooltip"
import { SInfoIcon } from "components/InfoTooltip/InfoTooltip.styled"
import { Text } from "components/Typography/Text/Text"
import { BigNumber } from "ethers/lib/ethers"
import { formatUnits, parseUnits } from "ethers/lib/utils"
import React, { ReactNode } from "react"
import Skeleton from "react-loading-skeleton"
import { Warning } from "sections/lending/components/primitives/Warning"
import { useWalletBalances } from "sections/lending/hooks/app-data-provider/useWalletBalances"
import { usePoolReservesHumanized } from "sections/lending/hooks/pool/usePoolReserves"
import { useGasStation } from "sections/lending/hooks/useGasStation"
import {
  GasPriceData,
  useGasPrice,
} from "sections/lending/hooks/useGetGasPrices"
import { useModalContext } from "sections/lending/hooks/useModal"
import { useRootStore } from "sections/lending/store/root"
import {
  getNetworkConfig,
  marketsData,
} from "sections/lending/utils/marketsAndNetworksConfig"
import invariant from "tiny-invariant"
import { GasOption } from "./GasStationProvider"

export interface GasStationProps {
  gasLimit: BigNumber
  skipLoad?: boolean
  disabled?: boolean
  rightComponent?: ReactNode
  chainId?: number
}

export const getGasCosts = (
  gasLimit: BigNumber,
  gasOption: GasOption,
  customGas: string,
  gasData: GasPriceData,
  baseCurrencyUsd: string,
) => {
  const gasPrice =
    gasOption === GasOption.Custom
      ? parseUnits(customGas, "gwei").toString()
      : gasData[gasOption].legacyGasPrice
  return (
    Number(formatUnits(gasLimit.mul(gasPrice), 18)) *
    parseFloat(baseCurrencyUsd)
  )
}

export const GasStation: React.FC<GasStationProps> = ({
  gasLimit,
  skipLoad,
  disabled,
  rightComponent,
  chainId,
}) => {
  const { state } = useGasStation()
  const currentChainId = useRootStore((store) => store.currentChainId)
  const selectedChainId = chainId ?? currentChainId
  // TODO: find a better way to query base token price instead of using a random market.
  const marketOnNetwork = Object.values(marketsData).find(
    (elem) => elem.chainId === selectedChainId,
  )
  invariant(marketOnNetwork, "No market for this network")
  const { data: poolReserves } = usePoolReservesHumanized(marketOnNetwork)
  const { data: gasPrice } = useGasPrice(selectedChainId)
  const { walletBalances } = useWalletBalances(marketOnNetwork)
  const nativeBalanceUSD =
    walletBalances[API_ETH_MOCK_ADDRESS.toLowerCase()]?.amountUSD
  const { name, baseAssetSymbol } = getNetworkConfig(selectedChainId)

  const { loadingTxns } = useModalContext()

  const totalGasCostsUsd =
    gasPrice && poolReserves?.baseCurrencyData
      ? getGasCosts(
          gasLimit,
          state.gasOption,
          state.customGas,
          gasPrice,
          normalize(
            poolReserves?.baseCurrencyData.networkBaseTokenPriceInUsd,
            poolReserves?.baseCurrencyData.networkBaseTokenPriceDecimals,
          ),
        )
      : undefined

  return (
    <div sx={{ flex: "column", gap: 24, width: "100%" }}>
      <div sx={{ flex: "row", mt: 12, justify: "space-between" }}>
        <div sx={{ flex: "row", align: "center" }}>
          <GasPumpIcon
            width={20}
            height={20}
            sx={{ mr: 6, color: "basic400" }}
          />
          {loadingTxns && !skipLoad ? (
            <div sx={{ flex: "row", align: "center", height: 16 }}>
              <Skeleton width={50} height={16} />
            </div>
          ) : totalGasCostsUsd && !disabled ? (
            <>
              <Text fs={14} color="basic400" sx={{ mr: 4 }}>
                <DisplayValue value={totalGasCostsUsd} isUSD />
              </Text>
              <InfoTooltip text="This gas calculation is only an estimation. Your wallet will set the price of the transaction. You can modify the gas settings directly from your wallet provider.">
                <SInfoIcon />
              </InfoTooltip>
            </>
          ) : (
            "-"
          )}
        </div>
        {rightComponent}
      </div>
      {!disabled && Number(nativeBalanceUSD) < Number(totalGasCostsUsd) && (
        <div sx={{ flex: "row", align: "center" }}>
          <Warning variant="warning" sx={{ mb: 0, mx: "auto" }}>
            You do not have enough {baseAssetSymbol} in your account to pay for
            transaction fees on {name} network. Please deposit {baseAssetSymbol}{" "}
            from another account.
          </Warning>
        </div>
      )}
    </div>
  )
}
