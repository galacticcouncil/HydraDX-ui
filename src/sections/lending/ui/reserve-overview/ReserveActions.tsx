import { API_ETH_MOCK_ADDRESS, InterestRate } from "@aave/contract-helpers"
import {
  BigNumberValue,
  USD_DECIMALS,
  valueToBigNumber,
} from "@aave/math-utils"
import BigNumber from "bignumber.js"
import { ReactNode, useState } from "react"
import { useTranslation } from "react-i18next"
import Skeleton from "react-loading-skeleton"
import { theme } from "theme"

import WalletIcon from "assets/icons/WalletIcon.svg?react"

import { Button } from "components/Button/Button"
import { DataValue } from "components/DataValue"
import { DisplayValue } from "components/DisplayValue/DisplayValue"
import { Spacer } from "components/Spacer/Spacer"
import { ToggleGroup, ToggleGroupItem } from "components/ToggleGroup"
import { Text } from "components/Typography/Text/Text"

import { Warning } from "sections/lending/components/primitives/Warning"
import {
  ComputedReserveData,
  useAppDataContext,
} from "sections/lending/hooks/app-data-provider/useAppDataProvider"
import { useWalletBalances } from "sections/lending/hooks/app-data-provider/useWalletBalances"
import { useModalContext } from "sections/lending/hooks/useModal"
import { usePermissions } from "sections/lending/hooks/usePermissions"
import { useReserveActionState } from "sections/lending/hooks/useReserveActionState"
import { useWeb3Context } from "sections/lending/libs/hooks/useWeb3Context"
import { useRootStore } from "sections/lending/store/root"
import {
  CustomMarket,
  MarketDataType,
  marketsData,
} from "sections/lending/ui-config/marketsConfig"
import {
  BaseNetworkConfig,
  networkConfigs,
} from "sections/lending/ui-config/networksConfig"
import {
  getMaxAmountAvailableToBorrow,
  getMaxGhoMintAmount,
} from "sections/lending/utils/getMaxAmountAvailableToBorrow"
import { getMaxAmountAvailableToSupply } from "sections/lending/utils/getMaxAmountAvailableToSupply"
import { amountToUsd } from "sections/lending/utils/utils"
import { Web3ConnectModalButton } from "sections/web3-connect/modal/Web3ConnectModalButton"

export const getMarketInfoById = (marketId: CustomMarket) => {
  const market: MarketDataType = marketsData[marketId as CustomMarket]
  const network: BaseNetworkConfig = networkConfigs[market.chainId]

  return { market, network }
}

const amountToUSD = (
  amount: BigNumberValue,
  formattedPriceInMarketReferenceCurrency: string,
  marketReferencePriceInUsd: string,
) => {
  return valueToBigNumber(amount)
    .multipliedBy(formattedPriceInMarketReferenceCurrency)
    .multipliedBy(marketReferencePriceInUsd)
    .shiftedBy(-USD_DECIMALS)
    .toString()
}

interface ReserveActionsProps {
  reserve: ComputedReserveData
}

export const ReserveActions = ({ reserve }: ReserveActionsProps) => {
  const [selectedAsset, setSelectedAsset] = useState<string>(reserve.symbol)

  const { currentAccount } = useWeb3Context()
  const { isPermissionsLoading } = usePermissions()
  const { openBorrow, openSupply } = useModalContext()
  const currentMarket = useRootStore((store) => store.currentMarket)
  const currentNetworkConfig = useRootStore(
    (store) => store.currentNetworkConfig,
  )
  const currentMarketData = useRootStore((store) => store.currentMarketData)
  const {
    ghoReserveData,
    user,
    loading: loadingReserves,
    marketReferencePriceInUsd,
  } = useAppDataContext()
  const { walletBalances, loading: loadingWalletBalance } =
    useWalletBalances(currentMarketData)

  const [minRemainingBaseTokenBalance, displayGho] = useRootStore((store) => [
    store.poolComputed.minRemainingBaseTokenBalance,
    store.displayGho,
  ])
  const { baseAssetSymbol } = currentNetworkConfig
  let balance = walletBalances[reserve.underlyingAsset]
  if (reserve.isWrappedBaseAsset && selectedAsset === baseAssetSymbol) {
    balance = walletBalances[API_ETH_MOCK_ADDRESS.toLowerCase()]
  }

  let maxAmountToBorrow = "0"
  let maxAmountToSupply = "0"
  const isGho = displayGho({ symbol: reserve.symbol, currentMarket })

  if (isGho) {
    const maxMintAmount = getMaxGhoMintAmount(user, reserve)
    maxAmountToBorrow = BigNumber.min(
      maxMintAmount,
      valueToBigNumber(ghoReserveData.aaveFacilitatorRemainingCapacity),
    ).toString()
    maxAmountToSupply = "0"
  } else {
    maxAmountToBorrow = getMaxAmountAvailableToBorrow(
      reserve,
      user,
      InterestRate.Variable,
    ).toString()

    maxAmountToSupply = getMaxAmountAvailableToSupply(
      balance?.amount || "0",
      reserve,
      reserve.underlyingAsset,
      minRemainingBaseTokenBalance,
    ).toString()
  }

  const maxAmountToBorrowUsd = amountToUsd(
    maxAmountToBorrow,
    reserve.formattedPriceInMarketReferenceCurrency,
    marketReferencePriceInUsd,
  ).toString()

  const maxAmountToSupplyUsd = amountToUSD(
    maxAmountToSupply,
    reserve.formattedPriceInMarketReferenceCurrency,
    marketReferencePriceInUsd,
  ).toString()

  const { disableSupplyButton, disableBorrowButton, alerts } =
    useReserveActionState({
      balance: balance?.amount || "0",
      maxAmountToSupply: maxAmountToSupply.toString(),
      maxAmountToBorrow: maxAmountToBorrow.toString(),
      reserve,
    })

  if (!currentAccount && !isPermissionsLoading) {
    return <ConnectWallet />
  }

  if (loadingReserves || loadingWalletBalance) {
    return <ActionsSkeleton />
  }

  const onSupplyClicked = () => {
    if (reserve.isWrappedBaseAsset && selectedAsset === baseAssetSymbol) {
      openSupply(API_ETH_MOCK_ADDRESS.toLowerCase())
    } else {
      openSupply(reserve.underlyingAsset)
    }
  }

  const { market } = getMarketInfoById(currentMarket)

  return (
    <PaperWrapper>
      {reserve.isWrappedBaseAsset && (
        <div>
          <WrappedBaseAssetSelector
            assetSymbol={reserve.symbol}
            baseAssetSymbol={baseAssetSymbol}
            selectedAsset={selectedAsset}
            setSelectedAsset={setSelectedAsset}
          />
        </div>
      )}
      <WalletBalance
        balance={balance.amount}
        symbol={selectedAsset}
        marketTitle={market.marketTitle}
      />
      {reserve.isFrozen || reserve.isPaused ? (
        <div sx={{ mt: 12 }}>
          {reserve.isPaused ? <PauseWarning /> : <FrozenWarning />}
        </div>
      ) : (
        <>
          <div sx={{ flex: "column", gap: 20 }}>
            {!isGho && (
              <SupplyAction
                reserve={reserve}
                value={maxAmountToSupply.toString()}
                usdValue={maxAmountToSupplyUsd}
                symbol={selectedAsset}
                disable={disableSupplyButton}
                onActionClicked={onSupplyClicked}
              />
            )}
            {reserve.borrowingEnabled && (
              <>
                <Spacer
                  size={1}
                  sx={{ bg: "darkBlue401", width: "100%" }}
                  axis="horizontal"
                />
                <BorrowAction
                  reserve={reserve}
                  value={maxAmountToBorrow.toString()}
                  usdValue={maxAmountToBorrowUsd}
                  symbol={selectedAsset}
                  disable={disableBorrowButton}
                  onActionClicked={() => {
                    openBorrow(reserve.underlyingAsset)
                  }}
                />
              </>
            )}
          </div>
          {alerts}
        </>
      )}
    </PaperWrapper>
  )
}

const PauseWarning = () => {
  const { t } = useTranslation()
  return (
    <Warning sx={{ mb: 0 }} variant="error">
      {t("lending.reserve.paused")}
    </Warning>
  )
}

const FrozenWarning = () => {
  const { t } = useTranslation()
  return (
    <Warning sx={{ mb: 0 }} variant="error">
      {t("lending.reserve.frozen")}
    </Warning>
  )
}

const ActionsSkeleton = () => {
  const RowSkeleton = (
    <div>
      <div sx={{ flex: "row", justify: "space-between", align: "center" }}>
        <div>
          <Skeleton width={100} height={14} sx={{ mt: 4, mb: 8 }} />
          <Skeleton width={75} height={12} />
        </div>
        <Skeleton height={36} width={96} />
      </div>
    </div>
  )

  return (
    <PaperWrapper>
      <div sx={{ flex: "row", gap: 12, mb: 30 }}>
        <Skeleton width={42} height={42} />
        <div>
          <Skeleton width={100} height={12} sx={{ mt: 4, mb: 8 }} />
          <Skeleton width={100} height={14} />
        </div>
      </div>

      <div>
        <div sx={{ flex: "column", gap: 12 }}>
          {RowSkeleton}
          <Spacer
            size={1}
            sx={{ bg: "darkBlue401", width: "100%", my: 12 }}
            axis="horizontal"
          />
          {RowSkeleton}
        </div>
      </div>
    </PaperWrapper>
  )
}

const PaperWrapper = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation()
  return (
    <div sx={{ color: "white" }}>
      <Text fs={15} sx={{ mb: 20 }} font="FontOver">
        {t("lending.reserve.yourInfo")}
      </Text>
      {children}
    </div>
  )
}

const ConnectWallet = () => {
  const { t } = useTranslation()
  return (
    <PaperWrapper>
      <Text fs={14} lh={18} sx={{ mb: 24 }} color="basic300">
        {t("lending.wallet.connect.description")}
      </Text>
      <Web3ConnectModalButton />
    </PaperWrapper>
  )
}

interface ActionProps {
  value: string
  usdValue: string
  symbol: string
  disable: boolean
  onActionClicked: () => void
  reserve: ComputedReserveData
}

const SupplyAction = ({
  value,
  usdValue,
  symbol,
  disable,
  onActionClicked,
}: ActionProps) => {
  const { t } = useTranslation()
  return (
    <div sx={{ flex: "row", justify: "space-between", align: "center" }}>
      <DataValue
        label={t("lending.supply.available")}
        labelColor="basic400"
        font="ChakraPetchSemiBold"
        size="small"
        tooltip={t("lending.tooltip.supplyAvailable")}
      >
        {t("value.token", { value: Number(value) })} {symbol}
        <Text fs={12} lh={20} color="basic500">
          <DisplayValue value={+usdValue} isUSD compact />
        </Text>
      </DataValue>
      <div css={{ minWidth: 80 }}>
        <Button
          fullWidth
          size="micro"
          onClick={onActionClicked}
          disabled={disable}
          sx={{ py: 6 }}
        >
          {t("lending.supply")}
        </Button>
      </div>
    </div>
  )
}

const BorrowAction = ({
  value,
  usdValue,
  symbol,
  disable,
  onActionClicked,
}: ActionProps) => {
  const { t } = useTranslation()
  return (
    <div sx={{ flex: "row", justify: "space-between", align: "center" }}>
      <DataValue
        label={t("lending.borrow.available")}
        labelColor="basic400"
        font="ChakraPetchSemiBold"
        size="small"
        tooltip={t("lending.tooltip.borrowAvailable")}
      >
        {t("value.token", { value: Number(value) })} {symbol}
        <Text fs={12} lh={20} color="basic500">
          <DisplayValue value={+usdValue} isUSD compact />
        </Text>
      </DataValue>
      <div css={{ minWidth: 80 }}>
        <Button
          fullWidth
          size="micro"
          onClick={onActionClicked}
          disabled={disable}
          sx={{ py: 6 }}
        >
          {t("lending.borrow")}
        </Button>
      </div>
    </div>
  )
}

const WrappedBaseAssetSelector = ({
  assetSymbol,
  baseAssetSymbol,
  selectedAsset,
  setSelectedAsset,
}: {
  assetSymbol: string
  baseAssetSymbol: string
  selectedAsset: string
  setSelectedAsset: (value: string) => void
}) => {
  return (
    <ToggleGroup
      type="single"
      variant="secondary"
      size="small"
      value={selectedAsset}
      onValueChange={setSelectedAsset}
      sx={{ mb: 20 }}
    >
      <ToggleGroupItem value={assetSymbol}>{assetSymbol}</ToggleGroupItem>
      <ToggleGroupItem value={baseAssetSymbol}>
        {baseAssetSymbol}
      </ToggleGroupItem>
    </ToggleGroup>
  )
}

interface WalletBalanceProps {
  balance: string
  symbol: string
  marketTitle: string
}
const WalletBalance = ({ balance, symbol }: WalletBalanceProps) => {
  const { t } = useTranslation()

  return (
    <div
      sx={{ flex: "row", gap: 12, align: "center", p: 16, mb: 20 }}
      css={{
        background: `rgba(${theme.rgbColors.alpha0}, 0.06)`,
        borderRadius: theme.borderRadius.medium,
        border: `1px solid rgba(${theme.rgbColors.primaryA0}, 0.35)`,
      }}
    >
      <WalletIcon width={24} height={24} />
      <div>
        <DataValue
          label="Wallet Balance"
          font="ChakraPetchSemiBold"
          size="small"
          labelColor="basic400"
        >
          {t("value.token", { value: Number(balance) })} {symbol}
        </DataValue>
      </div>
    </div>
  )
}
