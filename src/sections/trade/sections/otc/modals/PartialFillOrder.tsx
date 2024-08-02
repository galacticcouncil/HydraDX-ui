import { useTokenBalance } from "api/balances"
import BigNumber from "bignumber.js"
import { Button } from "components/Button/Button"
import { Modal } from "components/Modal/Modal"
import { Text } from "components/Typography/Text/Text"
import { Controller, useForm } from "react-hook-form"
import { Trans, useTranslation } from "react-i18next"
import { getFixedPointAmount } from "utils/balance"
import { BN_0, BN_1 } from "utils/constants"
import { FormValues } from "utils/helpers"
import { useStore } from "state/store"
import { OrderCapacity } from "sections/trade/sections/otc/capacity/OrderCapacity"
import { OfferingPair } from "sections/trade/sections/otc/orders/OtcOrdersData.utils"
import { OrderAssetGet, OrderAssetPay } from "./cmp/AssetSelect"
import { useRpcProvider } from "providers/rpcProvider"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { TokensConversion } from "sections/pools/modals/AddLiquidity/components/TokensConvertion/TokensConversion"
import { zodResolver } from "@hookform/resolvers/zod"
import { usePartialFillFormSchema } from "sections/trade/sections/otc/modals/PartialFillOrder.utils"
import { Spacer } from "components/Spacer/Spacer"
import { Summary } from "components/Summary/Summary"
import Skeleton from "react-loading-skeleton"
import { useOTCfee } from "api/consts"
import { useAssets } from "providers/assets"

const FULL_ORDER_PCT_LBOUND = 99

type FillOrderProps = {
  orderId: string
  offering: OfferingPair
  accepting: OfferingPair
  onClose: () => void
  onSuccess: () => void
}

export const PartialFillOrder = ({
  orderId,
  offering,
  accepting,
  onClose,
  onSuccess,
}: FillOrderProps) => {
  const { t } = useTranslation()
  const { account } = useAccount()
  const { getAssetWithFallback } = useAssets()
  const { api } = useRpcProvider()
  const fee = useOTCfee()
  const assetInMeta = getAssetWithFallback(accepting.asset)
  const assetInBalance = useTokenBalance(accepting.asset, account?.address)
  const assetOutMeta = getAssetWithFallback(offering.asset)

  const formSchema = usePartialFillFormSchema({
    offeringAmount: offering.amount,
    assetInBalance: assetInBalance.data?.balance ?? BN_0,
    assetInDecimals: assetInMeta.decimals,
  })

  const form = useForm<{
    amountIn: string
    amountOut: string
    free: BigNumber
  }>({
    mode: "onChange",
    defaultValues: {
      free: accepting.amount,
    },
    resolver: zodResolver(formSchema),
  })

  const { createTransaction } = useStore()

  const price = accepting.amount.div(offering.amount)

  const handlePayWithChange = () => {
    const { amountOut } = form.getValues()
    const amountIn = new BigNumber(amountOut).multipliedBy(price)
    form.setValue("amountIn", !amountIn.isNaN() ? amountIn.toFixed() : "")
    form.trigger()
  }

  const handleYouGetChange = () => {
    const { amountIn } = form.getValues()
    const amountOut = new BigNumber(amountIn).div(price)
    form.setValue("amountOut", !amountOut.isNaN() ? amountOut.toFixed() : "")
    form.trigger()
  }

  const handleFreeChange = () => {
    const { amountOut, amountIn } = form.getValues()
    if (!amountOut || !amountIn) {
      form.setValue("free", accepting.amount)
      return
    }

    const aIn = new BigNumber(amountIn)
    const free = aIn.gt(accepting.amount) ? BN_0 : accepting.amount.minus(aIn)
    form.setValue("free", free)
  }

  const handleSubmit = async (values: FormValues<typeof form>) => {
    if (assetInMeta.decimals == null) throw new Error("Missing assetIn meta")

    const amountIn = getFixedPointAmount(
      values.amountIn,
      assetInMeta.decimals,
    ).decimalPlaces(0, 1)

    const filledPct = new BigNumber(values.amountIn)
      .div(accepting.amount)
      .multipliedBy(100)
      .toNumber()

    await createTransaction(
      {
        tx:
          filledPct > FULL_ORDER_PCT_LBOUND
            ? api.tx.otc.fillOrder(orderId)
            : api.tx.otc.partialFillOrder(orderId, amountIn.toFixed()),
      },
      {
        onSuccess,
        onSubmitted: () => {
          onClose()
          form.reset()
        },
        toast: {
          onLoading: (
            <Trans
              t={t}
              i18nKey="otc.order.fill.toast.onLoading"
              tOptions={{
                amount: values.amountOut,
                symbol: assetOutMeta.symbol,
              }}
            >
              <span />
              <span className="highlight" />
            </Trans>
          ),
          onSuccess: (
            <Trans
              t={t}
              i18nKey="otc.order.fill.toast.onSuccess"
              tOptions={{
                amount: values.amountOut,
                symbol: assetOutMeta.symbol,
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
    <Modal
      open
      disableCloseOutside
      title={t("otc.order.partialFill.title")}
      onClose={() => {
        onClose()
        form.reset()
      }}
    >
      <div
        sx={{
          flex: "row",
          justify: "space-between",
          align: "baseline",
          mt: 20,
        }}
      >
        <Text fs={16} color="basic500">
          {"Remaining amount:"}
        </Text>
        <Text fs={[20, 24]} color="white" as="div">
          {t("otc.order.fill.remaining", {
            remaining: accepting.amount,
            symbol: accepting.symbol,
          })}
        </Text>
      </div>

      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        autoComplete="off"
        sx={{
          flex: "column",
          justify: "space-between",
        }}
      >
        <Controller
          name="free"
          control={form.control}
          render={({ field: { value } }) => (
            <OrderCapacity
              total={accepting.amount}
              free={value}
              symbol={accepting.symbol}
              modal={true}
              roundingMode={6}
            />
          )}
        />
        <Controller
          name="amountIn"
          control={form.control}
          render={({
            field: { name, value, onChange },
            fieldState: { error },
          }) => (
            <OrderAssetPay
              title={t("otc.order.fill.payTitle")}
              name={name}
              value={value}
              onChange={(e) => {
                onChange(e)
                handleYouGetChange()
                handleFreeChange()
              }}
              asset={accepting.asset}
              balance={assetInBalance.data?.balance}
              error={error?.message}
            />
          )}
        />
        <TokensConversion
          placeholderValue="-"
          firstValue={{
            amount: BN_1,
            symbol: assetOutMeta.symbol,
          }}
          secondValue={{
            amount: price,
            symbol: assetInMeta.symbol,
          }}
        />
        <Controller
          name="amountOut"
          control={form.control}
          render={({
            field: { name, value, onChange },
            fieldState: { error },
          }) => (
            <OrderAssetGet
              title={t("otc.order.fill.getTitle")}
              name={name}
              value={value}
              onChange={(e) => {
                onChange(e)
                handlePayWithChange()
                handleFreeChange()
              }}
              remaining={offering.amount}
              asset={offering.asset}
              error={error?.message}
            />
          )}
        />
        {fee.data?.isNaN() ? null : (
          <>
            <Spacer size={8} />
            <Summary
              rows={[
                {
                  label: t("liquidity.add.modal.tradeFee"),
                  content: fee.isLoading ? (
                    <Skeleton width={30} height={12} />
                  ) : (
                    <Text fs={14} color="white" tAlign="right">
                      {fee.data
                        ? t("value.tokenWithSymbol", {
                            value: fee.data.times(form.getValues("amountOut")),
                            symbol: assetOutMeta.symbol,
                          })
                        : "N/a"}
                    </Text>
                  ),
                },
              ]}
            />
          </>
        )}

        <Button
          sx={{ mt: 20 }}
          variant="primary"
          disabled={!form.formState.isValid}
        >
          {t("otc.order.partialFill.confirm")}
        </Button>
      </form>
    </Modal>
  )
}
