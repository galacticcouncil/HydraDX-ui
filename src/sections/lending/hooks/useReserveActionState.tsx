import { ChainId } from "@aave/contract-helpers"
import { Link, ROUTES } from "sections/lending/components/primitives/Link"
import { Warning } from "sections/lending/components/primitives/Warning"
import { getEmodeMessage } from "sections/lending/components/transactions/Emode/EmodeNaming"
import {
  ComputedReserveData,
  useAppDataContext,
} from "sections/lending/hooks/app-data-provider/useAppDataProvider"
import { useAssetCaps } from "sections/lending/hooks/useAssetCaps"
import { useRootStore } from "sections/lending/store/root"
import { assetCanBeBorrowedByUser } from "sections/lending/utils/getMaxAmountAvailableToBorrow"

interface ReserveActionStateProps {
  balance: string
  maxAmountToSupply: string
  maxAmountToBorrow: string
  reserve: ComputedReserveData
}

export const useReserveActionState = ({
  balance,
  maxAmountToSupply,
  maxAmountToBorrow,
  reserve,
}: ReserveActionStateProps) => {
  const { user, eModes } = useAppDataContext()
  const { supplyCap, borrowCap, debtCeiling } = useAssetCaps()
  const [currentMarket, currentNetworkConfig, currentChainId, displayGho] =
    useRootStore((store) => [
      store.currentMarket,
      store.currentNetworkConfig,
      store.currentChainId,
      store.displayGho,
    ])

  const { bridge, name: networkName } = currentNetworkConfig

  const assetCanBeBorrowedFromPool = assetCanBeBorrowedByUser(reserve, user)
  const userHasNoCollateralSupplied =
    user?.totalCollateralMarketReferenceCurrency === "0"
  const isolationModeBorrowDisabled =
    user?.isInIsolationMode && !reserve.borrowableInIsolation
  const eModeBorrowDisabled =
    user?.isInEmode && reserve.eModeCategoryId !== user.userEmodeCategoryId

  const isGho = displayGho({ symbol: reserve.symbol, currentMarket })

  return {
    disableSupplyButton: balance === "0" || maxAmountToSupply === "0" || isGho,
    disableBorrowButton:
      !assetCanBeBorrowedFromPool ||
      userHasNoCollateralSupplied ||
      isolationModeBorrowDisabled ||
      eModeBorrowDisabled ||
      maxAmountToBorrow === "0",
    alerts: (
      <div sx={{ flex: "column", gap: 12 }}>
        {balance === "0" && !isGho && (
          <Warning sx={{ mt: 12 }} variant="info">
            {bridge ? (
              <span>
                Your {networkName} wallet is empty. Purchase or transfer assets
                or use {<Link href={bridge.url}>{bridge.name}</Link>} to
                transfer your{" "}
                {[ChainId.avalanche].includes(currentChainId)
                  ? "Ethereum & Bitcoin"
                  : "Ethereum"}{" "}
                assets.
              </span>
            ) : (
              <span>
                Your {networkName} wallet is empty. Purchase or transfer assets.
              </span>
            )}
          </Warning>
        )}

        {(balance !== "0" || isGho) &&
          user?.totalCollateralMarketReferenceCurrency === "0" && (
            <Warning sx={{ mt: 12 }} variant="info">
              <span>
                To borrow you need to supply any asset to be used as collateral.
              </span>
            </Warning>
          )}

        {isolationModeBorrowDisabled && (
          <Warning sx={{ mt: 12 }} variant="warning">
            <span>Collateral usage is limited because of Isolation mode.</span>
          </Warning>
        )}

        {eModeBorrowDisabled && isolationModeBorrowDisabled && (
          <Warning sx={{ mt: 12 }} variant="info">
            <span>
              Borrowing is unavailable because you’ve enabled Efficiency Mode
              (E-Mode) and Isolation mode. To manage E-Mode and Isolation mode
              visit your <Link href={ROUTES.dashboard}>Dashboard</Link>.
            </span>
          </Warning>
        )}

        {eModeBorrowDisabled && !isolationModeBorrowDisabled && (
          <Warning sx={{ mt: 12 }} variant="info">
            <span>
              Borrowing is unavailable because you’ve enabled Efficiency Mode
              (E-Mode) for{" "}
              {getEmodeMessage(eModes[user.userEmodeCategoryId].label)}{" "}
              category. To manage E-Mode categories visit your{" "}
              <Link href={ROUTES.dashboard}>Dashboard</Link>.
            </span>
          </Warning>
        )}

        {!eModeBorrowDisabled && isolationModeBorrowDisabled && (
          <Warning sx={{ mt: 12 }} variant="info">
            <span>
              Borrowing is unavailable because you’re using Isolation mode. To
              manage Isolation mode visit your{" "}
              <Link href={ROUTES.dashboard}>Dashboard</Link>.
            </span>
          </Warning>
        )}

        {maxAmountToSupply === "0" &&
          supplyCap?.determineWarningDisplay({
            supplyCap,
            icon: false,
            sx: { mt: 12 },
          })}
        {maxAmountToBorrow === "0" &&
          borrowCap?.determineWarningDisplay({
            borrowCap,
            icon: false,
            sx: { mt: 12 },
          })}
        {reserve.isIsolated &&
          balance !== "0" &&
          user?.totalCollateralUSD !== "0" &&
          debtCeiling?.determineWarningDisplay({
            debtCeiling,
            icon: false,
            sx: { mt: 12 },
          })}
      </div>
    ),
  }
}
