import { Controller, useForm } from "react-hook-form"
import { WalletTransferAssetSelect } from "sections/wallet/transfer/WalletTransferAssetSelect"
import { SummaryRow } from "components/Summary/SummaryRow"
import { Spacer } from "components/Spacer/Spacer"
import { Text } from "components/Typography/Text/Text"
import { Summary } from "components/Summary/Summary"
import { Trans, useTranslation } from "react-i18next"
import { DisplayValue } from "components/DisplayValue/DisplayValue"
import { PoolAddLiquidityInformationCard } from "./AddLiquidityInfoCard"
import { Separator } from "components/Separator/Separator"
import { Button } from "components/Button/Button"
import { FormValues } from "utils/helpers"
import { getFixedPointAmount } from "utils/balance"
import { useAddLiquidity, useZodSchema } from "./AddLiquidity.utils"
import { useStore } from "state/store"
import { useRpcProvider } from "providers/rpcProvider"
import { zodResolver } from "@hookform/resolvers/zod"
import { useDebouncedValue } from "hooks/useDebouncedValue"
import { Alert } from "components/Alert/Alert"
import { useRefetchPositions } from "sections/pools/PoolsPage.utils"

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
  const {
    api,
    assets: { native },
  } = useRpcProvider()
  const { createTransaction } = useStore()
  const { t } = useTranslation()

  const refetch = useRefetchPositions()

  const zodSchema = useZodSchema(assetId)

  const form = useForm<{ amount: string }>({
    mode: "onChange",
    defaultValues: { amount: initialAmount },
    resolver: zodSchema ? zodResolver(zodSchema) : undefined,
  })

  const [debouncedAmount] = useDebouncedValue(form.watch("amount"), 300)

  const { calculatedShares, spotPrice, omnipoolFee, assetMeta } =
    useAddLiquidity(assetId, debouncedAmount)

  const onSubmit = async (values: FormValues<typeof form>) => {
    if (assetMeta.decimals == null) throw new Error("Missing asset meta")

    const amount = getFixedPointAmount(
      values.amount,
      assetMeta.decimals,
    ).toString()

    return await createTransaction(
      { tx: api.tx.omnipool.addLiquidity(assetId, amount) },
      {
        onSuccess: () => refetch(),
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

  const customErrors = form.formState.errors.amount as unknown as {
    cap?: { message: string }
    circuitBreaker?: { message: string }
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
          render={({
            field: { name, value, onChange },
            fieldState: { error },
          }) => (
            <WalletTransferAssetSelect
              title={t("wallet.assets.transfer.asset.label_mob")}
              name={name}
              value={value}
              onBlur={onChange}
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
        <Text color="pink500" fs={15} font="GeistMono" tTransform="uppercase">
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

        {customErrors?.cap ? (
          <Alert variant="warning" css={{ marginBottom: 8 }}>
            {customErrors.cap.message}
          </Alert>
        ) : null}

        {customErrors?.circuitBreaker ? (
          <Alert variant="warning" css={{ marginBottom: 8 }}>
            {customErrors.circuitBreaker.message}
          </Alert>
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
        disabled={!form.formState.isValid || !zodSchema}
      >
        {t("liquidity.add.modal.confirmButton")}
      </Button>
    </form>
  )
}
