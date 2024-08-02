import { useTokenBalance } from "api/balances"
import { Button } from "components/Button/Button"
import { Modal } from "components/Modal/Modal"
import { Text } from "components/Typography/Text/Text"
import { FormEvent, useState } from "react"
import { Trans, useTranslation } from "react-i18next"
import { BN_1, BN_10 } from "utils/constants"
import { useStore } from "state/store"
import { OfferingPair } from "sections/trade/sections/otc/orders/OtcOrdersData.utils"
import { OrderAssetGet, OrderAssetPay } from "./cmp/AssetSelect"
import { useRpcProvider } from "providers/rpcProvider"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { TokensConversion } from "sections/pools/modals/AddLiquidity/components/TokensConvertion/TokensConversion"
import { useAssets } from "providers/assets"
import { useOTCfee } from "api/consts"
import { Summary } from "components/Summary/Summary"
import Skeleton from "react-loading-skeleton"
import { Spacer } from "components/Spacer/Spacer"

type FillOrderProps = {
  orderId: string
  offering: OfferingPair
  accepting: OfferingPair
  onClose: () => void
  onSuccess: () => void
}

export const FillOrder = ({
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
  const [error, setError] = useState<string | undefined>(undefined)

  const { createTransaction } = useStore()

  const price = accepting.amount.div(offering.amount)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (assetInMeta?.decimals == null) throw new Error("Missing assetIn meta")

    if (assetInBalance.data?.balance == null)
      throw new Error("Missing assetIn balance")

    const aInBalance = assetInBalance.data?.balance
    const aInDecimals = assetInMeta.decimals

    if (aInBalance.gte(accepting.amount.multipliedBy(BN_10.pow(aInDecimals)))) {
      setError(undefined)
    } else {
      setError(t("otc.order.fill.validation.notEnoughBalance"))
      return
    }

    await createTransaction(
      {
        tx: api.tx.otc.fillOrder(orderId),
      },
      {
        onSuccess,
        onSubmitted: () => {
          onClose()
        },
        toast: {
          onLoading: (
            <Trans
              t={t}
              i18nKey="otc.order.fill.toast.onLoading"
              tOptions={{
                amount: offering.amount,
                symbol: offering.symbol,
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
                amount: offering.amount,
                symbol: offering.symbol,
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

  const isDisabled =
    assetInBalance.data?.balance?.lt(
      accepting.amount.multipliedBy(BN_10.pow(assetInMeta.decimals)),
    ) ?? false

  return (
    <Modal
      open={true}
      disableCloseOutside
      title={t("otc.order.fill.title")}
      onClose={onClose}
    >
      <Text fs={16} color="basic400" sx={{ mt: 10, mb: 22 }}>
        {t("otc.order.fill.desc")}
      </Text>
      <form
        onSubmit={handleSubmit}
        autoComplete="off"
        sx={{
          flex: "column",
          justify: "space-between",
        }}
      >
        <OrderAssetPay
          title={t("otc.order.fill.payTitle")}
          value={accepting.amount.toFixed()}
          asset={accepting.asset}
          balance={assetInBalance.data?.balance}
          readonly={true}
          error={error}
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
        <OrderAssetGet
          title={t("otc.order.fill.getTitle")}
          value={offering.amount.toFixed()}
          remaining={offering.amount}
          asset={offering.asset}
          readonly={true}
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
                            value: fee.data.times(offering.amount),
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
        <Button sx={{ mt: 20 }} variant="primary" disabled={isDisabled}>
          {t("otc.order.fill.confirm")}
        </Button>
      </form>
    </Modal>
  )
}
