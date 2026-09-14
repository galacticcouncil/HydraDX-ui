import {
  Box,
  FormLabel,
  Modal,
  Separator,
  Stack,
} from "@galacticcouncil/ui/components"
import { getToken } from "@galacticcouncil/ui/utils"
import { AddressBookModal, WalletMode } from "@galacticcouncil/web3-connect"
import { useNavigate } from "@tanstack/react-router"
import Big from "big.js"
import { useCallback, useState } from "react"
import { useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { isNumber } from "remeda"

import { useAccountBalances } from "@/api/balances"
import { TradeType } from "@/api/trade"
import { useDisplayAssetPrice } from "@/components/AssetPrice"
import { AddressBookFormField } from "@/form/AddressBookFormField"
import { XcLogo } from "@/modules/trade/swap/sections/XcSwap/components/ChainAssetSelect/XcLogo"
import { XcChainAssetSelectFormField } from "@/modules/trade/swap/sections/XcSwap/components/XcChainAssetSelect"
import { XcSrcAssetSelectField } from "@/modules/trade/swap/sections/XcSwap/components/XcSrcAssetSelectField"
import { useSwitchXcAssets } from "@/modules/trade/swap/sections/XcSwap/hooks/useSwitchXcAssets"
import { XcSwapFormValues } from "@/modules/trade/swap/sections/XcSwap/hooks/useXcSwapForm"
import { useXcSwapFormReset } from "@/modules/trade/swap/sections/XcSwap/hooks/useXcSwapFormReset"
import {
  getXcAssetId,
  isSameXcAsset,
} from "@/modules/trade/swap/sections/XcSwap/lib/xcSwapAssets"
import {
  XcChain,
  XcChainAssetPair,
} from "@/modules/trade/swap/sections/XcSwap/types"
import { useXcSwap } from "@/modules/trade/swap/sections/XcSwap/XcSwapProvider"
import { XcSwapSwitcher } from "@/modules/trade/swap/sections/XcSwap/XcSwapSwitcher"
import { scaleHuman } from "@/utils/formatting"

type Props = {
  readonly destChainAssetPairs: XcChainAssetPair[]
}

const ChainBadge: React.FC<{ chain: XcChain | null }> = ({ chain }) =>
  chain ? (
    <>
      <XcLogo src={chain.logo} size="extra-small" />
      <FormLabel fw={600} color={getToken("text.high")}>
        {chain.name}
      </FormLabel>
    </>
  ) : null

export const XcSwapFields: React.FC<Props> = ({ destChainAssetPairs }) => {
  const { t } = useTranslation(["common", "trade"])
  const navigate = useNavigate()
  const { watch, setValue, getValues } = useFormContext<XcSwapFormValues>()
  const {
    isCrossChain,
    isSelectionLoading,
    isQuoteLoading,
    maxSwapSellBalance,
    maxTwapSellBalance,
    isMaxSwapSellBalanceLoading,
    isMaxTwapSellBalanceLoading,
    destBalance,
    isDestBalanceLoading,
    destSpotPrice,
    isDestSpotPriceLoading,
  } = useXcSwap()
  const switchAssets = useSwitchXcAssets()
  const resetForm = useXcSwapFormReset()
  const { getTransferableBalance } = useAccountBalances()
  const [isContactsOpen, setIsContactsOpen] = useState(false)

  const handleSellAssetChange = useCallback(
    (
      sellAsset: NonNullable<XcSwapFormValues["sellAsset"]>,
      previousSellAsset: XcSwapFormValues["sellAsset"],
    ) => {
      const { buyAsset } = getValues()
      const isSwitch =
        buyAsset?.id !== undefined && sellAsset.id === String(buyAsset.id)

      if (isSwitch) {
        setValue("sellAsset", previousSellAsset)
        if (!isCrossChain) {
          switchAssets()
        }
        return
      }

      if (getValues("type") === TradeType.Sell) {
        resetForm()
      }

      navigate({
        to: ".",
        search: (search) => ({
          ...search,
          assetIn: sellAsset.id,
          assetOut: getXcAssetId(buyAsset) ?? search.assetOut,
        }),
        resetScroll: false,
      })
    },
    [getValues, isCrossChain, navigate, resetForm, setValue, switchAssets],
  )

  const handleBuySelectionChange = useCallback(
    (selection: XcChainAssetPair, previousSelection: XcChainAssetPair) => {
      const { sellAsset } = getValues()
      const isSwitch =
        sellAsset &&
        selection.asset.id !== undefined &&
        sellAsset.id === String(selection.asset.id)

      if (isSwitch) {
        setValue("destChain", previousSelection.chain)
        setValue("buyAsset", previousSelection.asset)
        if (!isCrossChain) {
          switchAssets()
        }
        return
      }

      const chainChanged = selection.chain.key !== previousSelection.chain.key
      const assetChanged = !isSameXcAsset(
        selection.asset,
        previousSelection.asset,
      )

      if (chainChanged) {
        resetForm({ clearDestAddress: true })
      } else if (getValues("type") === TradeType.Buy && assetChanged) {
        resetForm()
      }

      navigate({
        to: ".",
        search: (search) => ({
          ...search,
          assetIn: sellAsset?.id,
          assetOut: getXcAssetId(selection.asset) ?? search.assetOut,
          destPlatform: selection.chain.platform,
        }),
        resetScroll: false,
      })
    },
    [getValues, isCrossChain, navigate, resetForm, setValue, switchAssets],
  )

  const [
    srcChain,
    destChain,
    buyAsset,
    buyAmount,
    type,
    isSingleTrade,
    destAddress,
  ] = watch([
    "srcChain",
    "destChain",
    "buyAsset",
    "buyAmount",
    "type",
    "isSingleTrade",
    "destAddress",
  ])
  const isSell = type === TradeType.Sell
  const contactsWhitelist =
    destChain?.platform === "near"
      ? ([WalletMode.Near] as const)
      : destChain?.platform === "zec"
        ? ([WalletMode.Zcash] as const)
        : undefined
  const onChainDestAssetId =
    !isCrossChain && isNumber(buyAsset?.id) ? String(buyAsset.id) : ""
  const [
    onChainDestDisplayValue,
    { isLoading: isOnChainDestDisplayValueLoading },
  ] = useDisplayAssetPrice(onChainDestAssetId, buyAmount || "0")
  const crossChainDestDisplayValue =
    isCrossChain && destSpotPrice
      ? t("currency", {
          value: Big(buyAmount || "0")
            .mul(destSpotPrice)
            .toString(),
        })
      : undefined
  const destDisplayValue = isCrossChain
    ? crossChainDestDisplayValue
    : onChainDestDisplayValue
  const destMaxBalance =
    onChainDestAssetId && buyAsset
      ? scaleHuman(
          getTransferableBalance(onChainDestAssetId),
          buyAsset.decimals,
        )
      : undefined

  const showDestBalance =
    destChain?.platform === "near" &&
    destChain.addressValidator(destAddress.trim()) &&
    (isDestBalanceLoading || destBalance !== undefined)

  return (
    <Stack>
      <Box py="l" width="100%">
        <XcSrcAssetSelectField
          label={isCrossChain ? t("from") : t("sell")}
          labelAdornment={<ChainBadge chain={isCrossChain ? srcChain : null} />}
          isLoading={isSelectionLoading}
          maxBalance={isSingleTrade ? maxSwapSellBalance : maxTwapSellBalance}
          isMaxBalanceLoading={
            isSingleTrade
              ? isMaxSwapSellBalanceLoading
              : isMaxTwapSellBalanceLoading
          }
          onAssetChange={handleSellAssetChange}
          onAmountChange={() => {
            if (!isSell) {
              setValue("type", TradeType.Sell)
            }
          }}
        />
      </Box>

      <XcSwapSwitcher />

      <Box py="l" width="100%">
        <XcChainAssetSelectFormField<XcSwapFormValues>
          chainFieldName="destChain"
          assetFieldName="buyAsset"
          amountFieldName="buyAmount"
          label={isCrossChain ? t("to") : t("buy")}
          labelAdornment={
            <ChainBadge chain={isCrossChain ? destChain : null} />
          }
          chainAssetPairs={destChainAssetPairs}
          modalTitle={t("trade:xc.swap.field.destTitle")}
          balance={
            isCrossChain && !showDestBalance
              ? undefined
              : {
                  label: t("common:balance"),
                  value: t("common:number", {
                    value:
                      (showDestBalance ? destBalance : destMaxBalance) || "0",
                  }),
                  isLoading: isDestBalanceLoading,
                }
          }
          ignoreErrors={isCrossChain}
          displayValue={
            isCrossChain && !destSpotPrice ? undefined : destDisplayValue
          }
          isReadOnly={isCrossChain}
          isLoading={isSelectionLoading}
          isValueLoading={isSell && isQuoteLoading}
          isDisplayValueLoading={
            isCrossChain
              ? isDestSpotPriceLoading || (isSell && isQuoteLoading)
              : isQuoteLoading || isOnChainDestDisplayValueLoading
          }
          onSelectionChange={handleBuySelectionChange}
          onAmountChange={() => {
            if (isSell) {
              setValue("type", TradeType.Buy)
            }
          }}
        />
      </Box>

      {isCrossChain && (
        <>
          <Separator mx="-xl" />

          <AddressBookFormField<XcSwapFormValues>
            fieldName="destAddress"
            onOpenMyContacts={() => setIsContactsOpen(true)}
          />

          <Modal
            variant="popup"
            open={isContactsOpen}
            onOpenChange={setIsContactsOpen}
          >
            <AddressBookModal
              whitelist={contactsWhitelist}
              onBack={() => setIsContactsOpen(false)}
              onSelect={(address) => {
                setValue("destAddress", address.address, {
                  shouldValidate: true,
                })
                setIsContactsOpen(false)
              }}
            />
          </Modal>
        </>
      )}
    </Stack>
  )
}
