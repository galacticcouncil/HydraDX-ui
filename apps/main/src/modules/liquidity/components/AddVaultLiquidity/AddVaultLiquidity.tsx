import {
  Alert,
  Box,
  Button,
  Summary,
  Text,
} from "@galacticcouncil/ui/components"
import {
  ModalBody,
  ModalContentDivider,
  ModalFooter,
  ModalHeader,
} from "@galacticcouncil/ui/components/Modal"
import { getToken } from "@galacticcouncil/ui/utils"
import { useAccount } from "@galacticcouncil/web3-connect"
import Big from "big.js"
import { useEffect, useState } from "react"
import { FormProvider } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { AssetSwitcher } from "@/components/AssetSwitcher/AssetSwitcher"
import { AssetSelectFormField } from "@/form/AssetSelectFormField"
import {
  TAddVaultLiquidityFormValues,
  useAddVaultLiquidity,
} from "@/modules/liquidity/components/AddVaultLiquidity/AddVaultLiquidity.utils"
import { SupplyIsolatedLiquidity } from "@/modules/liquidity/components/SupplyIsolatedLiquidity/SupplyIsolatedLiquidity"
import { feeTierPercent, VaultTable } from "@/modules/liquidity/Vaults.utils"
import { TAsset, useAssets } from "@/providers/assetsProvider"
import { scaleHuman } from "@/utils/formatting"

type Props = {
  vault: VaultTable
  onBack?: () => void
  onSubmitted: () => void
  closable?: boolean
}

export const AddVaultLiquidity = ({
  vault,
  onBack,
  onSubmitted,
  closable = false,
}: Props) => {
  const { t } = useTranslation(["liquidity", "common"])
  const { account } = useAccount()

  const { getErc20AToken, getAssetWithFallback } = useAssets()

  const {
    form,
    assetA,
    assetB,
    getMaxBalance,
    pairedAmount,
    isPairLoading,
    price,
    shares,
    shareOfVault,
    blocker,
    submit,
    isSubmitting,
  } = useAddVaultLiquidity({ vault, onSubmitted })

  const lastUpdated = form.watch("lastUpdated")
  const amountA = form.watch("amountA")
  const amountB = form.watch("amountB")

  // Vault holds aToken; offer money-market supply for the underlying.
  const [supplyAssetId, setSupplyAssetId] = useState<string>()

  const wrapHintFor = (asset: TAsset, amount: string) => {
    const aToken = getErc20AToken(asset.id)
    if (!aToken) return undefined

    const balance = getMaxBalance(asset)
    const short = Big(balance).lte(0) || (!!amount && Big(amount).gt(balance))
    if (!short) return undefined

    return {
      symbol: asset.symbol,
      underlyingId: aToken.underlyingAssetId,
      underlyingSymbol: getAssetWithFallback(aToken.underlyingAssetId).symbol,
    }
  }

  const wrapHint = account
    ? (wrapHintFor(assetA, amountA) ?? wrapHintFor(assetB, amountB))
    : undefined

  useEffect(() => {
    if (pairedAmount === undefined) return

    const target = lastUpdated === "assetA" ? "amountB" : "amountA"

    form.setValue(target, pairedAmount, {
      shouldValidate: true,
      shouldTouch: true,
    })
  }, [pairedAmount, lastUpdated, form])

  if (supplyAssetId)
    return (
      <SupplyIsolatedLiquidity
        assetId={supplyAssetId}
        onSubmitted={() => setSupplyAssetId(undefined)}
      />
    )

  return (
    <>
      <ModalHeader
        title={t("liquidity:addLiquidity")}
        closable={closable}
        onBack={onBack}
      />
      <FormProvider {...form}>
        <form autoComplete="off" onSubmit={form.handleSubmit(submit)}>
          <ModalBody>
            <Box py={0} pb="l" width="100%">
              <AssetSelectFormField<TAddVaultLiquidityFormValues>
                label={t("liquidity:liquidity.createPool.modal.assetA")}
                assetFieldName="assetA"
                amountFieldName="amountA"
                assets={[]}
                balance={{ value: getMaxBalance(assetA) }}
                disabledAssetSelector
                onAmountChange={() => form.setValue("lastUpdated", "assetA")}
              />
            </Box>

            <AssetSwitcher
              assetInId={assetA.id}
              assetOutId={assetB.id}
              fallbackPrice={price}
              isFallbackPriceLoading={isPairLoading}
            />

            <Box py="l" width="100%">
              <AssetSelectFormField<TAddVaultLiquidityFormValues>
                label={t("liquidity:liquidity.createPool.modal.assetB")}
                assetFieldName="assetB"
                amountFieldName="amountB"
                assets={[]}
                balance={{ value: getMaxBalance(assetB) }}
                disabledAssetSelector
                onAmountChange={() => form.setValue("lastUpdated", "assetB")}
              />
            </Box>

            <ModalContentDivider />

            <Summary
              separator={<ModalContentDivider />}
              rows={[
                {
                  label: t("liquidity:liquidity.add.modal.sharesToGet.label"),
                  content: shares
                    ? t("liquidity:vaults.add.sharesSummary", {
                        value: scaleHuman(shares.toString(), 18),
                        share: shareOfVault ?? 0,
                      })
                    : t("common:notAvailable"),
                  loading: isPairLoading,
                },
                {
                  label: t("liquidity:vaults.add.feeTier"),
                  content: t("common:percent", {
                    value: feeTierPercent(vault.feeTier),
                  }),
                },
              ]}
            />

            <ModalContentDivider />

            {wrapHint && (
              <Alert
                variant="info"
                title={t("liquidity:vaults.add.wrap.title", {
                  symbol: wrapHint.symbol,
                })}
                description={t("liquidity:vaults.add.wrap.description", {
                  symbol: wrapHint.symbol,
                  underlying: wrapHint.underlyingSymbol,
                })}
                action={
                  <Button
                    type="button"
                    variant="secondary"
                    size="small"
                    onClick={() => setSupplyAssetId(wrapHint.underlyingId)}
                  >
                    {t("liquidity:vaults.add.wrap.cta", {
                      symbol: wrapHint.symbol,
                    })}
                  </Button>
                }
              />
            )}

            {blocker && (
              <Alert
                variant="warning"
                description={t(`liquidity:${blocker.key}`, {
                  symbol: blocker.symbol,
                })}
              />
            )}

            <Text fs="p6" color={getToken("text.low")}>
              {t("liquidity:vaults.add.managedNote")}
            </Text>
          </ModalBody>
          <ModalFooter pt={0}>
            <Button
              type="submit"
              size="large"
              width="100%"
              disabled={
                !account || !form.formState.isValid || isSubmitting || !!blocker
              }
            >
              {!account
                ? t("common:connectWallet")
                : t("liquidity:liquidity.add.modal.submit")}
            </Button>
          </ModalFooter>
        </form>
      </FormProvider>
    </>
  )
}
