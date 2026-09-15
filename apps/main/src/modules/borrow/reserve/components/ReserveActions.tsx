import {
  ComputedReserveData,
  useModalContext,
  useWalletData,
} from "@galacticcouncil/money-market/hooks"
import { isGho } from "@galacticcouncil/money-market/utils"
import { WalletIcon } from "@galacticcouncil/ui/assets/icons"
import {
  Button,
  Flex,
  Icon,
  Separator,
  Stack,
  ValueStats,
} from "@galacticcouncil/ui/components"
import { getToken } from "@galacticcouncil/ui/utils"
import {
  getAssetIdFromAddress,
  MONEY_MARKET_STRATEGY_ASSETS,
} from "@galacticcouncil/utils"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import {
  StrategySupplyModal,
  StrategySupplyModalProps,
} from "@/modules/borrow/components/StrategySupplyModal"
import { useAssets } from "@/providers/assetsProvider"

export type ReserveActionsProps = { reserve: ComputedReserveData }

export const ReserveActions: React.FC<ReserveActionsProps> = ({ reserve }) => {
  const { t } = useTranslation(["common", "borrow"])

  const { openBorrow, openSupply } = useModalContext()
  const { getRelatedAToken } = useAssets()
  const [strategyModalProps, setStrategyModalProps] =
    useState<StrategySupplyModalProps>()

  const {
    alerts,
    balance,
    disableBorrowButton,
    disableSupplyButton,
    maxAmountToBorrow,
    maxAmountToBorrowUsd,
    maxAmountToSupply,
    maxAmountToSupplyUsd,
  } = useWalletData(reserve)

  const isGhoReserve = isGho(reserve)

  const assetId = getAssetIdFromAddress(reserve.underlyingAsset)
  const aTokenId = getRelatedAToken(assetId)?.id
  const isStrategyReserve =
    (MONEY_MARKET_STRATEGY_ASSETS.includes(assetId) || reserve.isIsolated) &&
    !!aTokenId

  const onSupplyClick = () => {
    if (isStrategyReserve) {
      setStrategyModalProps({
        id: assetId,
        erc20Id: aTokenId,
        stableswapId: assetId,
        isIsolated: reserve.isIsolated,
      })
    } else {
      openSupply(reserve.underlyingAsset, reserve.symbol)
    }
  }

  return (
    <Stack separated gap="xl" separator={<Separator mx={-20} />}>
      <Flex gap="xl" align="center">
        <Icon component={WalletIcon} sx={{ color: getToken("text.low") }} />
        <ValueStats
          size="small"
          font="secondary"
          label={t("balance")}
          value={t("currency", {
            value: balance?.amount || "0",
            symbol: reserve.symbol,
          })}
          bottomLabel={t("currency", {
            value: balance?.amountUSD || "0",
            maximumFractionDigits: 2,
          })}
          wrap
        />
      </Flex>
      {!isGhoReserve && (
        <Flex gap="xl" justify="space-between" align="center">
          <ValueStats
            size="small"
            font="secondary"
            label={t("borrow:supply.available")}
            value={t("currency", {
              value: maxAmountToSupply,
              symbol: reserve.symbol,
            })}
            bottomLabel={t("currency", {
              value: maxAmountToSupplyUsd,
              maximumFractionDigits: 2,
            })}
            wrap
          />
          <Button
            disabled={
              isStrategyReserve
                ? !reserve.isActive || reserve.isPaused || reserve.isFrozen
                : disableSupplyButton
            }
            onClick={onSupplyClick}
          >
            {t("borrow:supply")}
          </Button>
        </Flex>
      )}
      {reserve.borrowingEnabled && (
        <Flex gap="xl" justify="space-between" align="center">
          <ValueStats
            size="small"
            font="secondary"
            label={t("borrow:borrow.available")}
            value={t("currency", {
              value: maxAmountToBorrow,
              symbol: reserve.symbol,
            })}
            bottomLabel={t("currency", {
              value: maxAmountToBorrowUsd,
              maximumFractionDigits: 2,
            })}
            wrap
          />
          <Button
            disabled={disableBorrowButton}
            onClick={() => openBorrow(reserve.underlyingAsset)}
          >
            {t("borrow:borrow")}
          </Button>
        </Flex>
      )}
      {alerts.length > 0 && <Stack gap="base">{alerts}</Stack>}
      <StrategySupplyModal
        props={strategyModalProps}
        onClose={() => setStrategyModalProps(undefined)}
      />
    </Stack>
  )
}
