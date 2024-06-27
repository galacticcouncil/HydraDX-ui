import { Link } from "@tanstack/react-location"
import { useSetAsFeePayment } from "api/payments"
import TradeIcon from "assets/icons/Fill.svg?react"
import DollarIcon from "assets/icons/DollarIcon.svg?react"
import TransferIcon from "assets/icons/TransferIcon.svg?react"
import PlusIcon from "assets/icons/PlusIcon.svg?react"
import { Button } from "components/Button/Button"
import { DisplayValue } from "components/DisplayValue/DisplayValue"
import { Modal } from "components/Modal/Modal"
import { Separator } from "components/Separator/Separator"
import { Text } from "components/Typography/Text/Text"
import { Trans, useTranslation } from "react-i18next"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { theme } from "theme"
import { LINKS } from "utils/navigation"
import { SActionButtonsContainer } from "./WalletAssetsTable.styled"
import { AssetTableName } from "components/AssetTableName/AssetTableName"
import {
  AssetsTableData,
  useLockedNativeTokens,
  useUnlockableTokens,
  useUnlockTokens,
} from "sections/wallet/assets/table/data/WalletAssetsTableData.utils"
import Skeleton from "react-loading-skeleton"
import {
  AddTokenAction,
  UpdateTokenDataAction,
} from "./WalletAssetsTableActions"
import { isEvmAccount } from "utils/evm"
import { TOAST_MESSAGES } from "state/toasts"
import { ToastMessage } from "state/store"
import BN from "bignumber.js"
import { BN_0 } from "utils/constants"
import { SLocksContainer } from "sections/wallet/assets/table/details/WalletAssetsTableDetails.styled"
import { useRpcProvider } from "providers/rpcProvider"
import { enableUnlockTokens } from "sections/wallet/assets/table/details/WalletAssetsTableDetails"
import { useExternalTokensRugCheck } from "api/externalAssetRegistry"

type Props = {
  row?: AssetsTableData
  onClose: () => void
  onTransferClick: (id: string) => void
}

export const WalletAssetsTableActionsMob = ({
  row,
  onClose,
  onTransferClick,
}: Props) => {
  const { t } = useTranslation()
  const {
    assets: { native },
  } = useRpcProvider()
  const { account } = useAccount()
  const setFeeAsPayment = useSetAsFeePayment()
  const { featureFlags } = useRpcProvider()
  const rugCheck = useExternalTokensRugCheck()

  if (!row) return null

  const isNativeAsset = row.id === native.id

  const displayFeePaymentAssetButton = isEvmAccount(account?.address)
    ? featureFlags.dispatchPermit
    : true

  const isUnknownExternalAsset = row.isExternal && !row.name
  const hasWarnings = !!rugCheck.tokensMap.get(row.id)?.warnings.length

  return (
    <Modal open={!!row} isDrawer onClose={onClose} title="">
      <div>
        <div sx={{ pb: 30 }}>
          <AssetTableName {...row} large />
        </div>
        <Separator
          css={{ background: `rgba(${theme.rgbColors.alpha0}, 0.06)` }}
        />
        <div
          sx={{
            flex: "row",
            justify: "space-between",
            py: 30,
            flexWrap: "wrap",
          }}
        >
          {hasWarnings ? (
            <>
              <Text fs={13} color="warningOrange200" sx={{ p: 8 }}>
                {t("wallet.assets.table.addToken.changed")}
              </Text>{" "}
            </>
          ) : isUnknownExternalAsset ? (
            <Text fs={13} color="whiteish500" sx={{ p: 8 }}>
              {t("wallet.assets.table.addToken.unknown")}
            </Text>
          ) : (
            <>
              <div sx={{ flex: "column", gap: 4 }}>
                <Text fs={14} lh={16} color="whiteish500">
                  {t("wallet.assets.table.header.total")}
                </Text>
                <Text fs={14} lh={14} color="white">
                  {t("value", { value: row.total })}
                </Text>
                <Text fs={12} lh={17} color="whiteish500">
                  <DisplayValue value={row.totalDisplay} />
                </Text>
              </div>

              <div sx={{ flex: "column", gap: 4 }}>
                <Text fs={14} lh={16} color="whiteish500">
                  {t("wallet.assets.table.header.transferable")}
                </Text>
                <Text fs={14} lh={14} color="white">
                  {t("value", { value: row.transferable })}
                </Text>
                <Text fs={12} lh={12} color="whiteish500">
                  <DisplayValue value={row.transferableDisplay} />
                </Text>
              </div>
            </>
          )}
        </div>
        <SActionButtonsContainer>
          {hasWarnings ? (
            <UpdateTokenDataAction
              id={row.id}
              css={{ width: "100%", marginTop: 20 }}
            />
          ) : isUnknownExternalAsset ? (
            <AddTokenAction
              id={row.id}
              css={{ width: "100%", marginTop: 20 }}
              onClose={onClose}
            />
          ) : (
            <>
              {isNativeAsset ? (
                <NativeLocks
                  reserved={row.reserved}
                  reservedDisplay={row.reservedDisplay}
                />
              ) : (
                <Locks
                  reserved={row.reserved}
                  reservedDisplay={row.reservedDisplay}
                />
              )}
              <div sx={{ flex: "column", gap: 12, px: 8 }}>
                <Link
                  to={LINKS.swap}
                  search={
                    row.tradability.canBuy
                      ? { assetOut: row.id }
                      : { assetIn: row.id }
                  }
                  disabled={
                    !row.tradability.inTradeRouter ||
                    account?.isExternalWalletConnected
                  }
                  sx={{ width: "100%" }}
                >
                  <Button
                    sx={{ width: "100%" }}
                    size="small"
                    disabled={
                      !row.tradability.inTradeRouter ||
                      account?.isExternalWalletConnected
                    }
                  >
                    <TradeIcon />
                    {t("wallet.assets.table.actions.trade")}
                  </Button>
                </Link>

                <Button
                  sx={{ width: "100%" }}
                  size="small"
                  disabled={account?.isExternalWalletConnected}
                  onClick={() => onTransferClick(row.id)}
                >
                  <TransferIcon />
                  {t("wallet.assets.table.actions.transfer")}
                </Button>

                <Link
                  to={LINKS.cross_chain}
                  disabled={account?.isExternalWalletConnected}
                  sx={{ width: "100%" }}
                >
                  <Button
                    sx={{ width: "100%" }}
                    size="small"
                    disabled={account?.isExternalWalletConnected}
                  >
                    <PlusIcon />
                    {t("wallet.assets.table.actions.deposit")}
                  </Button>
                </Link>

                {displayFeePaymentAssetButton && (
                  <Button
                    sx={{ width: "100%" }}
                    size="small"
                    onClick={() => setFeeAsPayment(row.id)}
                    disabled={
                      !row.couldBeSetAsPaymentFee ||
                      account?.isExternalWalletConnected
                    }
                  >
                    <DollarIcon />
                    {t("wallet.assets.table.actions.payment.asset")}
                  </Button>
                )}
              </div>
            </>
          )}
        </SActionButtonsContainer>
      </div>
    </Modal>
  )
}

const NativeLocks = ({
  reserved,
  reservedDisplay,
}: {
  reserved: BN
  reservedDisplay: BN
}) => {
  const { account } = useAccount()
  const { t } = useTranslation()
  const lockedTokens = useLockedNativeTokens()
  const unlocable = useUnlockableTokens()

  const toast = TOAST_MESSAGES.reduce((memo, type) => {
    const msType = type === "onError" ? "onLoading" : type
    memo[type] = (
      <Trans
        t={t}
        i18nKey={`wallet.assets.table.details.unlock.${msType}`}
        tOptions={{
          value: unlocable.value,
        }}
      >
        <span />
      </Trans>
    )
    return memo
  }, {} as ToastMessage)

  const unlock = useUnlockTokens({ ids: unlocable.ids, toast })

  return (
    <div sx={{ flex: "row", flexWrap: "wrap", py: 20 }}>
      <div
        sx={{
          flex: "column",
          gap: 4,
          pr: 10,
          mb: 20,
          flexBasis: "50%",
        }}
      >
        <Text fs={14} lh={16} color="whiteish500">
          {t("wallet.assets.table.details.lockedStaking")}
        </Text>
        {lockedTokens.isLoading ? (
          <Skeleton height={14} width={40} />
        ) : (
          <Text fs={14} lh={14} color="white">
            {t("value", { value: lockedTokens.lockStaking })}
          </Text>
        )}
        {lockedTokens.isLoading ? (
          <Skeleton height={12} width={30} />
        ) : (
          <Text fs={12} lh={12} color="whiteish500">
            <DisplayValue value={lockedTokens.lockStakingDisplay} />
          </Text>
        )}
      </div>

      <div
        sx={{
          flex: "row",
          align: "end",
          justify: "end",
          flexBasis: "50%",
          mb: 20,
        }}
      >
        <div
          sx={{
            flex: "column",
            gap: 4,
          }}
        >
          <Text fs={14} lh={16} color="whiteish500">
            {t("wallet.assets.table.details.lockedDemocracy")}
          </Text>
          {lockedTokens.isLoading ? (
            <Skeleton height={14} width={40} />
          ) : (
            <Text fs={14} lh={14} color="white">
              {t("value", { value: lockedTokens.lockDemocracy })}
            </Text>
          )}
          {lockedTokens.isLoading ? (
            <Skeleton height={12} width={30} />
          ) : (
            <Text fs={12} lh={12} color="whiteish500">
              <DisplayValue value={lockedTokens.lockDemocracyDisplay} />
            </Text>
          )}
          {unlocable.endDate ? (
            <SLocksContainer sx={{ width: "fit-content" }}>
              <Text fs={11} lh={15} color="darkBlue200">
                {t("wallet.assets.table.details.expiring", {
                  duration: unlocable.endDate,
                })}
              </Text>
            </SLocksContainer>
          ) : null}
        </div>
      </div>

      {enableUnlockTokens && (
        <>
          <div
            sx={{ flex: "column", gap: 4, pr: 10, flexBasis: "50%", mb: 20 }}
          >
            <Text fs={14} lh={16} color="whiteish500">
              {t("wallet.assets.table.details.unlockable")}
            </Text>

            <Text fs={14} lh={14} color="white">
              {unlocable.isLoading ? (
                <Skeleton height={14} width={30} />
              ) : (
                t("value.token", { value: unlocable.value ?? BN_0 })
              )}
            </Text>
            <Text fs={12} lh={12} color="whiteish500">
              {unlocable.isLoading ? (
                <Skeleton height={10} width={20} />
              ) : (
                <DisplayValue value={unlocable.displayValue ?? BN_0} />
              )}
            </Text>
            {unlocable.votesUnlocked ? (
              <SLocksContainer>
                <Text fs={11} lh={15} color="darkBlue200">
                  {t("wallet.assets.table.details.expired", {
                    count: unlocable.votesUnlocked,
                  })}
                </Text>
              </SLocksContainer>
            ) : null}
          </div>

          <div
            sx={{
              flex: "row",
              align: "center",
              justify: "end",
              flexBasis: "50%",
              mb: 20,
            }}
          >
            <Button
              variant="primary"
              size="compact"
              disabled={
                account?.isExternalWalletConnected ||
                unlocable.value.isZero() ||
                !unlocable.ids.length ||
                unlock.isLoading
              }
              onClick={() => unlock.mutate()}
              isLoading={unlock.isLoading}
            >
              {t("wallet.assets.table.details.btn")}
            </Button>
          </div>
        </>
      )}

      <div sx={{ flex: "column", gap: 4, pr: 10, flexBasis: "50%" }}>
        <Text fs={14} lh={16} color="whiteish500">
          {t("wallet.assets.table.details.reserved")}
        </Text>
        <Text fs={14} lh={14} color="white">
          {t("value", { value: reserved })}
        </Text>
        <Text fs={12} lh={12} color="whiteish500">
          <DisplayValue value={reservedDisplay} />
        </Text>
      </div>

      <div
        sx={{
          flex: "row",
          align: "end",
          justify: "end",
          flexBasis: "50%",
          mb: 20,
        }}
      >
        <div sx={{ flex: "column", gap: 4 }}>
          <Text fs={14} lh={16} color="whiteish500">
            {t("wallet.assets.table.details.lockedVesting")}
          </Text>
          {lockedTokens.isLoading ? (
            <Skeleton height={14} width={40} />
          ) : (
            <Text fs={14} lh={14} color="white">
              {t("value", { value: lockedTokens.lockVesting })}
            </Text>
          )}
          {lockedTokens.isLoading ? (
            <Skeleton height={12} width={30} />
          ) : (
            <Text fs={12} lh={12} color="whiteish500">
              <DisplayValue value={lockedTokens.lockVestingDisplay} />
            </Text>
          )}
        </div>
      </div>
    </div>
  )
}

const Locks = ({
  reserved,
  reservedDisplay,
}: {
  reserved: BN
  reservedDisplay: BN
}) => {
  const { t } = useTranslation()

  return (
    <div sx={{ flex: "row", flexWrap: "wrap", py: 20 }}>
      <div sx={{ flex: "column", gap: 4, pr: 10, flexBasis: "50%" }}>
        <Text fs={14} lh={16} color="whiteish500">
          {t("wallet.assets.table.details.reserved")}
        </Text>
        <Text fs={14} lh={14} color="white">
          {t("value", { value: reserved })}
        </Text>
        <Text fs={12} lh={12} color="whiteish500">
          <DisplayValue value={reservedDisplay} />
        </Text>
      </div>
    </div>
  )
}
