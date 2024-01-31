import { API_ETH_MOCK_ADDRESS, InterestRate } from "@aave/contract-helpers"
import {
  BigNumberValue,
  USD_DECIMALS,
  valueToBigNumber,
} from "@aave/math-utils"

import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Skeleton,
  Stack,
  Typography,
  useTheme,
} from "@mui/material"
import BigNumber from "bignumber.js"
import { ReactNode, useState } from "react"
import { WalletIcon } from "sections/lending/components/icons/WalletIcon"
import { getMarketInfoById } from "sections/lending/components/MarketSwitcher"
import { FormattedNumber } from "sections/lending/components/primitives/FormattedNumber"
import { Warning } from "sections/lending/components/primitives/Warning"
import { StyledTxModalToggleButton } from "sections/lending/components/StyledToggleButton"
import { StyledTxModalToggleGroup } from "sections/lending/components/StyledToggleButtonGroup"
import { ConnectWalletButton } from "sections/lending/components/WalletConnection/ConnectWalletButton"
import {
  ComputedReserveData,
  useAppDataContext,
} from "sections/lending/hooks/app-data-provider/useAppDataProvider"
import { useWalletBalances } from "sections/lending/hooks/app-data-provider/useWalletBalances"
import { useModalContext } from "sections/lending/hooks/useModal"
import { usePermissions } from "sections/lending/hooks/usePermissions"
import { useWeb3Context } from "sections/lending/libs/hooks/useWeb3Context"
//import { BuyWithFiat } from "sections/lending/modules/staking/BuyWithFiat"
import { useRootStore } from "sections/lending/store/root"
import {
  getMaxAmountAvailableToBorrow,
  getMaxGhoMintAmount,
} from "sections/lending/utils/getMaxAmountAvailableToBorrow"
import { getMaxAmountAvailableToSupply } from "sections/lending/utils/getMaxAmountAvailableToSupply"
import { amountToUsd } from "sections/lending/utils/utils"

import { CapType } from "sections/lending/components/caps/helper"
import { AvailableTooltip } from "sections/lending/components/infoTooltips/AvailableTooltip"
import { Link, ROUTES } from "sections/lending/components/primitives/Link"
import { useReserveActionState } from "sections/lending/hooks/useReserveActionState"

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

  const { currentAccount, loading: loadingWeb3Context } = useWeb3Context()
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
    return <ConnectWallet loading={loadingWeb3Context} />
  }

  if (loadingReserves || loadingWalletBalance) {
    return <ActionsSkeleton />
  }

  const onSupplyClicked = () => {
    if (reserve.isWrappedBaseAsset && selectedAsset === baseAssetSymbol) {
      openSupply(
        API_ETH_MOCK_ADDRESS.toLowerCase(),
        currentMarket,
        reserve.name,
        "reserve",
        true,
      )
    } else {
      openSupply(
        reserve.underlyingAsset,
        currentMarket,
        reserve.name,
        "reserve",
        true,
      )
    }
  }

  const { market } = getMarketInfoById(currentMarket)

  return (
    <PaperWrapper>
      {reserve.isWrappedBaseAsset && (
        <Box>
          <WrappedBaseAssetSelector
            assetSymbol={reserve.symbol}
            baseAssetSymbol={baseAssetSymbol}
            selectedAsset={selectedAsset}
            setSelectedAsset={setSelectedAsset}
          />
        </Box>
      )}
      <WalletBalance
        balance={balance.amount}
        symbol={selectedAsset}
        marketTitle={market.marketTitle}
      />
      {reserve.isFrozen || reserve.isPaused ? (
        <Box sx={{ mt: 12 }}>
          {reserve.isPaused ? <PauseWarning /> : <FrozenWarning />}
        </Box>
      ) : (
        <>
          <Divider sx={{ my: 24 }} />
          <Stack gap={3}>
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
              <BorrowAction
                reserve={reserve}
                value={maxAmountToBorrow.toString()}
                usdValue={maxAmountToBorrowUsd}
                symbol={selectedAsset}
                disable={disableBorrowButton}
                onActionClicked={() => {
                  openBorrow(
                    reserve.underlyingAsset,
                    currentMarket,
                    reserve.name,
                    "reserve",
                    true,
                  )
                }}
              />
            )}
            {alerts}
          </Stack>
        </>
      )}
    </PaperWrapper>
  )
}

const PauseWarning = () => {
  return (
    <Warning sx={{ mb: 0 }} severity="error" icon={true}>
      <span>
        Because this asset is paused, no actions can be taken until further
        notice
      </span>
    </Warning>
  )
}

const FrozenWarning = () => {
  return (
    <Warning sx={{ mb: 0 }} severity="error" icon={true}>
      <span>
        Since this asset is frozen, the only available actions are withdraw and
        repay which can be accessed from the{" "}
        <Link href={ROUTES.dashboard}>Dashboard</Link>
      </span>
    </Warning>
  )
}

const ActionsSkeleton = () => {
  const RowSkeleton = (
    <Stack>
      <Skeleton width={150} height={14} />
      <Stack
        sx={{ height: "44px" }}
        direction="row"
        justifyContent="space-between"
        alignItems="center"
      >
        <Box>
          <Skeleton width={100} height={14} sx={{ mt: 4, mb: 8 }} />
          <Skeleton width={75} height={12} />
        </Box>
        <Skeleton height={36} width={96} />
      </Stack>
    </Stack>
  )

  return (
    <PaperWrapper>
      <Stack direction="row" gap={3}>
        <Skeleton width={42} height={42} sx={{ borderRadius: "12px" }} />
        <Box>
          <Skeleton width={100} height={12} sx={{ mt: 4, mb: 8 }} />
          <Skeleton width={100} height={14} />
        </Box>
      </Stack>
      <Divider sx={{ my: 24 }} />
      <Box>
        <Stack gap={3}>
          {RowSkeleton}
          {RowSkeleton}
        </Stack>
      </Box>
    </PaperWrapper>
  )
}

const PaperWrapper = ({ children }: { children: ReactNode }) => {
  return (
    <Paper sx={{ pt: 4, pb: { xs: 4, xsm: 6 }, px: { xs: 4, xsm: 6 } }}>
      <Typography variant="h3" sx={{ mb: 24 }}>
        <span>Your info</span>
      </Typography>

      {children}
    </Paper>
  )
}

const ConnectWallet = ({ loading }: { loading: boolean }) => {
  return (
    <Paper sx={{ pt: 4, pb: { xs: 4, xsm: 6 }, px: { xs: 4, xsm: 6 } }}>
      {loading ? (
        <CircularProgress />
      ) : (
        <>
          <Typography variant="h3" sx={{ mb: { xs: 6, xsm: 10 } }}>
            <span>Your info</span>
          </Typography>
          <Typography sx={{ mb: 24 }} color="text.secondary">
            <span>
              Please connect a wallet to view your personal information here.
            </span>
          </Typography>
          <ConnectWalletButton />
        </>
      )}
    </Paper>
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
  reserve,
  value,
  usdValue,
  symbol,
  disable,
  onActionClicked,
}: ActionProps) => {
  return (
    <Stack>
      <AvailableTooltip
        variant="description"
        text={<span>Available to supply</span>}
        capType={CapType.supplyCap}
      />
      <Stack
        sx={{ height: "44px" }}
        direction="row"
        justifyContent="space-between"
        alignItems="center"
      >
        <Box>
          <ValueWithSymbol value={value} symbol={symbol} />
          <FormattedNumber
            value={usdValue}
            variant="subheader2"
            color="text.muted"
            symbolsColor="text.muted"
            symbol="USD"
          />
        </Box>
        <Button
          sx={{ height: "36px", width: "96px" }}
          onClick={onActionClicked}
          disabled={disable}
          fullWidth={false}
          variant="contained"
          data-cy="supplyButton"
        >
          <span>Supply</span>
        </Button>
      </Stack>
    </Stack>
  )
}

const BorrowAction = ({
  reserve,
  value,
  usdValue,
  symbol,
  disable,
  onActionClicked,
}: ActionProps) => {
  return (
    <Stack>
      <AvailableTooltip
        variant="description"
        text={<span>Available to borrow</span>}
        capType={CapType.borrowCap}
      />
      <Stack
        sx={{ height: "44px" }}
        direction="row"
        justifyContent="space-between"
        alignItems="center"
      >
        <Box>
          <ValueWithSymbol value={value} symbol={symbol} />
          <FormattedNumber
            value={usdValue}
            variant="subheader2"
            color="text.muted"
            symbolsColor="text.muted"
            symbol="USD"
          />
        </Box>
        <Button
          sx={{ height: "36px", width: "96px" }}
          onClick={onActionClicked}
          disabled={disable}
          fullWidth={false}
          variant="contained"
          data-cy="borrowButton"
        >
          <span>Borrow </span>
        </Button>
      </Stack>
    </Stack>
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
    <StyledTxModalToggleGroup
      color="primary"
      value={selectedAsset}
      exclusive
      onChange={(_, value) => setSelectedAsset(value)}
      sx={{ mb: 4 }}
    >
      <StyledTxModalToggleButton value={assetSymbol}>
        <Typography variant="buttonM">{assetSymbol}</Typography>
      </StyledTxModalToggleButton>

      <StyledTxModalToggleButton value={baseAssetSymbol}>
        <Typography variant="buttonM">{baseAssetSymbol}</Typography>
      </StyledTxModalToggleButton>
    </StyledTxModalToggleGroup>
  )
}

interface ValueWithSymbolProps {
  value: string
  symbol: string
  children?: ReactNode
}

const ValueWithSymbol = ({ value, symbol, children }: ValueWithSymbolProps) => {
  return (
    <Stack direction="row" alignItems="center" gap={1}>
      <FormattedNumber value={value} variant="h4" color="text.primary" />
      <Typography variant="buttonL" color="text.secondary">
        {symbol}
      </Typography>
      {children}
    </Stack>
  )
}

interface WalletBalanceProps {
  balance: string
  symbol: string
  marketTitle: string
}
const WalletBalance = ({
  balance,
  symbol,
  marketTitle,
}: WalletBalanceProps) => {
  const theme = useTheme()

  return (
    <Stack direction="row" gap={3}>
      <Box
        sx={(theme) => ({
          width: "42px",
          height: "42px",
          background: theme.palette.background.surface,
          border: `0.5px solid ${theme.palette.background.disabled}`,
          borderRadius: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        })}
      >
        <WalletIcon sx={{ stroke: `${theme.palette.text.secondary}` }} />
      </Box>
      <Box>
        <Typography variant="description" color="text.secondary">
          Wallet balance
        </Typography>
        <ValueWithSymbol value={balance} symbol={symbol}>
          {/* <Box sx={{ ml: 8 }}>
            <BuyWithFiat
              cryptoSymbol={symbol}
              networkMarketName={marketTitle}
            />
          </Box> */}
        </ValueWithSymbol>
      </Box>
    </Stack>
  )
}