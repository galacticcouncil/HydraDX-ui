import {
  AccountTile,
  AssetInput,
  Flex,
  FormLabel,
  LoadingButton,
  ModalBody,
  ModalContentDivider,
  ModalHeader,
  Spinner,
  Stack,
  Text,
} from "@galacticcouncil/ui/components"
import { getToken } from "@galacticcouncil/ui/utils"
import { HYDRATION_CHAIN_KEY } from "@galacticcouncil/utils"
import { useAccount } from "@galacticcouncil/web3-connect"
import { chainsMap } from "@galacticcouncil/xc-cfg"
import { SubstrateBalanceType } from "@galacticcouncil/xc-core"
import { useQuery } from "@tanstack/react-query"
import Big from "big.js"
import { useEffect, useMemo, useState } from "react"
import { Controller, FormProvider } from "react-hook-form"
import { useTranslation } from "react-i18next"

import {
  useCrossChainBalance,
  useCrossChainWallet,
  xcmTransferQuery,
} from "@/api/xcm"
import { AssetLogo } from "@/components/AssetLogo"
import { createDepositId } from "@/modules/onramp/config/cex"
import { useDeposit } from "@/modules/onramp/deposit/hooks/useDeposit"
import { useDepositConfirmation } from "@/modules/onramp/deposit/hooks/useDepositConfirmation"
import { useSubmitXcmTransfer } from "@/modules/xcm/transfer/hooks/useSubmitXcmTransfer"
import { useXcmForm } from "@/modules/xcm/transfer/hooks/useXcmForm"
import { useAssets } from "@/providers/assetsProvider"
import { toBigInt, toDecimal } from "@/utils/formatting"

export type DepositTransferProps = {
  onTransferSuccess: () => void
  onBack: () => void
}

const CHAIN_ALIAS: Record<string, string> = {
  assethub: "assethub_cex",
}

const getDepositTransferSrcChain = (
  depositChain: string,
  assetKey: string,
): string => {
  const chain = chainsMap.get(depositChain)
  const asset = chain?.getAsset(assetKey)

  if (
    chain &&
    asset &&
    chain.getBalanceType(asset) === SubstrateBalanceType.System
  ) {
    return depositChain
  }

  return CHAIN_ALIAS[depositChain] ?? depositChain
}

export const DepositTransfer: React.FC<DepositTransferProps> = (props) => {
  const { account } = useAccount()
  const { asset } = useDeposit()

  const address = account?.address ?? ""
  const chainKey = asset?.depositChain ?? ""
  const assetKey = asset?.data?.asset?.key ?? ""

  const { data: balances } = useCrossChainBalance(address, chainKey)

  // The detected (best-block) balance is the target the finalized head must
  // reach. Capture it once so it can't drift while we wait.
  const [targetBalance] = useState(
    () => balances?.get(assetKey)?.amount ?? null,
  )
  const [isConfirmed, setIsConfirmed] = useState(targetBalance === null)

  if (!isConfirmed) {
    return (
      <DepositTransferConfirmation
        address={address}
        chainKey={chainKey}
        assetKey={assetKey}
        targetBalance={targetBalance}
        onConfirmed={() => setIsConfirmed(true)}
        onBack={props.onBack}
      />
    )
  }

  return <DepositTransferForm {...props} />
}

const DepositTransferConfirmation: React.FC<{
  address: string
  chainKey: string
  assetKey: string
  targetBalance: bigint | null
  onConfirmed: () => void
  onBack: () => void
}> = ({ address, chainKey, assetKey, targetBalance, onConfirmed, onBack }) => {
  const { t } = useTranslation(["onramp"])

  useDepositConfirmation({
    address,
    chainKey,
    assetKey,
    targetBalance,
    onSettled: onConfirmed,
  })

  return (
    <>
      <ModalHeader
        title={t("deposit.cex.transfer.title")}
        onBack={onBack}
        align="center"
        closable={false}
      />
      <ModalBody>
        <Stack justify="center" align="center" gap="base" py="xl">
          <Spinner size={90} />
          <Flex direction="column" justify="center" align="center" gap="base">
            <Text as="h2" align="center" fs="h7" fw={500} font="primary">
              {t("deposit.cex.transfer.confirming.title")}
            </Text>
            <Text fs="p5" align="center" color={getToken("text.medium")}>
              {t("deposit.cex.transfer.confirming.description")}
            </Text>
          </Flex>
        </Stack>
      </ModalBody>
    </>
  )
}

const DepositTransferForm: React.FC<DepositTransferProps> = ({
  onTransferSuccess,
  onBack,
}) => {
  const { t } = useTranslation(["onramp", "common", "xcm"])
  const { account } = useAccount()
  const {
    asset,
    amount: depositAmount,
    setAmount: setDepositedAmount,
    setFinishedDeposit,
  } = useDeposit()
  const { getAsset } = useAssets()

  const address = account?.address ?? ""
  const depositChain = asset?.depositChain ?? ""
  const assetKey = asset?.data?.asset?.key ?? ""
  const srcChainKey = getDepositTransferSrcChain(depositChain, assetKey)
  const assetMeta = asset ? getAsset(asset.assetId) : null

  const wallet = useCrossChainWallet()
  const {
    data: transfer,
    isLoading: isLoadingTransfer,
    isFetchedAfterMount,
  } = useQuery(
    xcmTransferQuery(wallet, {
      srcAddress: address,
      srcAsset: assetKey,
      srcChain: srcChainKey,
      destAddress: address,
      destAsset: assetKey,
      destChain: HYDRATION_CHAIN_KEY,
    }),
  )

  const transferData = useMemo(() => {
    if (!transfer)
      return {
        balance: 0n,
        min: 0n,
        max: 0n,
        symbol: "",
        decimals: 0,
      }

    const { balance, min, max } = transfer.source

    return {
      symbol: balance.symbol,
      decimals: balance.decimals,
      balance: balance.amount,
      min: min.amount,
      max: max.amount,
    }
  }, [transfer])

  const form = useXcmForm(transfer ?? null)
  const amount = form.watch("srcAmount")

  useEffect(() => {
    if (asset && transfer && isFetchedAfterMount && depositAmount && !amount) {
      const amountToSet = Big.min(
        depositAmount,
        transfer.source.max.amount.toString(),
      )

      form.reset({
        srcChain: chainsMap.get(srcChainKey),
        srcAsset: asset.data.asset,

        destChain: chainsMap.get(HYDRATION_CHAIN_KEY),
        destAsset: asset.data.asset,

        srcAmount: toDecimal(amountToSet, transfer.source.balance.decimals),
        destAmount: toDecimal(amountToSet, transfer.source.balance.decimals),

        destAddress: address,
        destAccount: account,

        bridgeProvider: null,
      })
      form.trigger()
    }
  }, [
    account,
    address,
    amount,
    asset,
    depositAmount,
    form,
    isFetchedAfterMount,
    srcChainKey,
    transfer,
  ])

  const { mutate: submitTx, isPending: isSubmitting } = useSubmitXcmTransfer({
    onSuccess: () => {
      const values = form.getValues()
      if (!assetMeta || !asset) return
      const amount = toBigInt(values.srcAmount, assetMeta.decimals)
      setDepositedAmount(amount.toString())
      setFinishedDeposit(createDepositId(assetMeta.id, address))
      onTransferSuccess()
    },
  })

  return (
    <FormProvider {...form}>
      <ModalHeader
        title={t("deposit.cex.transfer.title")}
        onBack={onBack}
        align="center"
        closable={false}
      />
      <ModalBody>
        <form
          onSubmit={form.handleSubmit(
            (values) => transfer && submitTx([values, transfer]),
          )}
        >
          <Controller
            name="srcAmount"
            control={form.control}
            render={({ field, fieldState }) => (
              <AssetInput
                label={t("common:asset")}
                value={field.value}
                asset={
                  assetMeta
                    ? {
                        symbol: assetMeta.symbol,
                        icon: <AssetLogo id={asset?.assetId ?? ""} />,
                      }
                    : null
                }
                amountError={fieldState.error?.message}
                onChange={field.onChange}
                isLoading={isLoadingTransfer}
                balance={{
                  label: t("common:balance"),
                  value: t("common:number", {
                    value: toDecimal(
                      transferData.balance,
                      transferData.decimals,
                    ),
                  }),
                  onMax: () =>
                    field.onChange(
                      toDecimal(transferData.max, transferData.decimals),
                    ),
                  isMaxDisabled: !(Number(transferData.max) > 0),
                }}
              />
            )}
          />
          <ModalContentDivider my="xl" />
          <Stack gap="m">
            <FormLabel>{t("deposit.cex.transfer.destination")}</FormLabel>
            <AccountTile
              active
              name={account?.name ?? ""}
              address={account?.address ?? ""}
              shortenAddress={false}
            />
          </Stack>
          <ModalContentDivider sx={{ my: "xl" }} />
          <LoadingButton
            type="submit"
            size="large"
            variant="primary"
            width="100%"
            disabled={isLoadingTransfer || isSubmitting}
            isLoading={isLoadingTransfer || isSubmitting}
          >
            {t("deposit.cex.transfer.button")}
          </LoadingButton>
        </form>
      </ModalBody>
    </FormProvider>
  )
}
