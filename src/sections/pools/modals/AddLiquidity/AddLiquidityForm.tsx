import { Controller, useForm } from "react-hook-form"
import BigNumber from "bignumber.js"
import { BN_10 } from "utils/constants"
import { WalletTransferAssetSelect } from "sections/wallet/transfer/WalletTransferAssetSelect"
import { SummaryRow } from "components/Summary/SummaryRow"
import { Spacer } from "components/Spacer/Spacer"
import { Text } from "components/Typography/Text/Text"
import { Summary } from "components/Summary/Summary"
import { Trans, useTranslation } from "react-i18next"
import { DisplayValue } from "components/DisplayValue/DisplayValue"
import { AddLiquidityLimitWarning } from "./AddLiquidityLimitWarning"
import { PoolAddLiquidityInformationCard } from "./AddLiquidityInfoCard"
import { Separator } from "components/Separator/Separator"
import { Button } from "components/Button/Button"
import { FormValues } from "utils/helpers"
import { getFixedPointAmount } from "utils/balance"
import { useAddLiquidity, useVerifyLimits } from "./AddLiquidity.utils"
import { useStore } from "state/store"
import { useEffect, useState } from "react"
import { useRpcProvider } from "providers/rpcProvider"
import { useDebounce } from "react-use"
import { useQueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "utils/queryKeys"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { useMaxBalance } from "api/balances"

type Props = {
  assetId: string
  initialAmount?: string
  onClose: () => void
  onAssetOpen?: () => void
}

export const AddLiquidityForm = ({
  assetId,
  onClose,
  onAssetOpen,
  initialAmount,
}: Props) => {
  const queryClient = useQueryClient()
  const { account } = useAccount()
  const { t } = useTranslation()
  const [assetValue, setAssetValue] = useState("")

  const form = useForm<{ amount: string }>({
    mode: "onChange",
    defaultValues: { amount: initialAmount },
  })

  const amountIn = form.watch("amount")

  const [, cancel] = useDebounce(() => setAssetValue(amountIn), 300, [amountIn])

  useEffect(() => {
    return () => {
      cancel()
    }
  }, [cancel])

  const { calculatedShares, spotPrice, omnipoolFee, assetMeta, assetBalance } =
    useAddLiquidity(assetId, assetValue)

  const {
    api,
    assets: { native },
  } = useRpcProvider()
  const { createTransaction } = useStore()

  const { data: limits } = useVerifyLimits({
    assetId: assetId.toString(),
    amount: amountIn,
    decimals: assetMeta.decimals,
  })

  const balanceInfo = useMaxBalance(
    assetId,
    api.tx.omnipool.addLiquidity(
      assetId,
      assetBalance?.balance.toFixed() ?? "0",
    ),
  )

  const onSubmit = async (values: FormValues<typeof form>) => {
    if (assetMeta.decimals == null) throw new Error("Missing asset meta")

    const amount = getFixedPointAmount(
      values.amount,
      assetMeta.decimals,
    ).toFixed(0)

    return await createTransaction(
      { tx: api.tx.omnipool.addLiquidity(assetId, amount) },
      {
        onSuccess: () => {
          queryClient.refetchQueries(
            QUERY_KEYS.accountOmnipoolPositions(account?.address),
          )
        },
        onSubmitted: () => {
          onClose()
          form.reset()
        },
        onClose,
        onBack: () => {},
        toast: {
          onLoading: (
            <Trans
              t={t}
              i18nKey="liquidity.add.modal.toast.onLoading"
              tOptions={{
                value: values.amount,
                symbol: assetMeta?.symbol,
                where: "Omnipool",
              }}
            >
              <span />
              <span className="highlight" />
            </Trans>
          ),
          onSuccess: (
            <Trans
              t={t}
              i18nKey="liquidity.add.modal.toast.onSuccess"
              tOptions={{
                value: values.amount,
                symbol: assetMeta?.symbol,
                where: "Omnipool",
              }}
            >
              <span />
              <span className="highlight" />
            </Trans>
          ),
          onError: (
            <Trans
              t={t}
              i18nKey="liquidity.add.modal.toast.onLoading"
              tOptions={{
                value: values.amount,
                symbol: assetMeta?.symbol,
                where: "Omnipool",
              }}
            >
              <span />
              <span className="highlight" />
            </Trans>
          ),
        },
      },
    )
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      autoComplete="off"
      sx={{
        flex: "column",
        justify: "space-between",
        minHeight: "100%",
      }}
    >
      <div sx={{ flex: "column" }}>
        <Controller
          name="amount"
          control={form.control}
          rules={{
            required: t("wallet.assets.transfer.error.required"),
            validate: {
              validNumber: (value) => {
                try {
                  if (!new BigNumber(value).isNaN()) return true
                } catch {}
                return t("error.validNumber")
              },
              positive: (value) =>
                new BigNumber(value).gt(0) || t("error.positive"),
              maxBalance: (value) => {
                try {
                  if (assetMeta?.decimals == null)
                    throw new Error("Missing asset meta")
                  if (
                    assetBalance?.balance.gte(
                      BigNumber(value).multipliedBy(
                        BN_10.pow(assetMeta?.decimals),
                      ),
                    )
                  )
                    return true
                } catch {}
                return t("liquidity.add.modal.validation.notEnoughBalance")
              },
              minPoolLiquidity: (value) => {
                try {
                  if (assetMeta?.decimals == null)
                    throw new Error("Missing asset meta")

                  const minimumPoolLiquidity =
                    api.consts.omnipool.minimumPoolLiquidity.toBigNumber()

                  const amount = BigNumber(value).multipliedBy(
                    BN_10.pow(assetMeta?.decimals),
                  )

                  if (amount.gte(minimumPoolLiquidity)) return true
                } catch {}
                return t("liquidity.add.modal.validation.minPoolLiquidity")
              },
            },
          }}
          render={({
            field: { name, value, onChange },
            fieldState: { error },
          }) => (
            <WalletTransferAssetSelect
              title={t("wallet.assets.transfer.asset.label_mob")}
              name={name}
              value={value}
              onBlur={setAssetValue}
              balanceMax={balanceInfo.maxBalance}
              onChange={onChange}
              asset={assetId}
              error={error?.message}
              onAssetOpen={onAssetOpen}
            />
          )}
        />
        <SummaryRow
          label={t("liquidity.add.modal.lpFee")}
          content={
            assetId === native.id
              ? "--"
              : t("value.percentage.range", {
                  from: omnipoolFee?.minFee.multipliedBy(100),
                  to: omnipoolFee?.maxFee.multipliedBy(100),
                })
          }
        />
        <Spacer size={24} />
        <Text color="pink500" fs={15} font="FontOver" tTransform="uppercase">
          {t("liquidity.add.modal.positionDetails")}
        </Text>
        <Summary
          rows={[
            {
              label: t("liquidity.remove.modal.price"),
              content: (
                <Text fs={14} color="white" tAlign="right">
                  <Trans
                    t={t}
                    i18nKey="liquidity.add.modal.row.spotPrice"
                    tOptions={{
                      firstAmount: 1,
                      firstCurrency: assetMeta?.symbol,
                    }}
                  >
                    <DisplayValue value={spotPrice?.spotPrice} />
                  </Trans>
                </Text>
              ),
            },
            {
              label: t("liquidity.add.modal.receive"),
              content: t("value", {
                value: calculatedShares,
                fixedPointScale: assetMeta?.decimals.toString(),
                type: "token",
              }),
            },
          ]}
        />
        <Text color="warningOrange200" fs={14} fw={400} sx={{ mt: 17, mb: 24 }}>
          {t("liquidity.add.modal.warning")}
        </Text>

        {limits?.cap === false ? (
          <AddLiquidityLimitWarning type="cap" />
        ) : limits?.circuitBreaker.isWithinLimit === false ? (
          <AddLiquidityLimitWarning
            type="circuitBreaker"
            limit={{
              value: limits?.circuitBreaker.maxValue,
              symbol: assetMeta?.symbol,
            }}
          />
        ) : null}
        <PoolAddLiquidityInformationCard />
        <Spacer size={20} />
      </div>
      <Separator
        color="darkBlue401"
        sx={{
          mx: "calc(-1 * var(--modal-content-padding))",
          mb: 20,
          width: "auto",
        }}
      />
      <Button
        variant="primary"
        type="submit"
        disabled={
          limits?.cap === false ||
          !form.formState.isValid ||
          !limits?.circuitBreaker.isWithinLimit
        }
      >
        {t("liquidity.add.modal.confirmButton")}
      </Button>
    </form>
  )
}
