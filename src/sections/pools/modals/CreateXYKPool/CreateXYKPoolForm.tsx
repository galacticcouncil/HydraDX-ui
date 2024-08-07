import { Button } from "components/Button/Button"
import { Separator } from "components/Separator/Separator"
import { useRpcProvider } from "providers/rpcProvider"
import { Controller, UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { TokensConversion } from "sections/pools/modals/AddLiquidity/components/TokensConvertion/TokensConversion"
import { WalletTransferAssetSelect } from "sections/wallet/transfer/WalletTransferAssetSelect"
import { BN_1 } from "utils/constants"
import { CreateXYKPoolFormData } from "./CreateXYKPoolForm.utils"
import BigNumber from "bignumber.js"
import { useState } from "react"

type CreateXYKPoolFormProps = {
  form: UseFormReturn<CreateXYKPoolFormData>
  onSubmit: (values: CreateXYKPoolFormData) => void
  onAssetAOpen?: () => void
  onAssetBOpen?: () => void
  submitHidden?: boolean
}

export const CreateXYKPoolForm = ({
  form,
  onSubmit,
  onAssetAOpen,
  onAssetBOpen,
  submitHidden = false,
}: CreateXYKPoolFormProps) => {
  const { t } = useTranslation()

  const { assets } = useRpcProvider()

  const assetAId = form.watch("assetAId")
  const assetBId = form.watch("assetBId")

  const assetAValue = BigNumber(form.watch("assetAAmount"))
  const assetBValue = BigNumber(form.watch("assetBAmount"))

  const assetAMeta = assets.getAsset(assetAId)
  const assetBMeta = assets.getAsset(assetBId)

  const [rateReversed, setRateReversed] = useState(false)

  const rateAssets = [
    { value: assetAValue, symbol: assetAMeta?.symbol },
    { value: assetBValue, symbol: assetBMeta?.symbol },
  ]

  const [firstRateAsset, secondRateAsset] = rateReversed
    ? [...rateAssets].reverse()
    : rateAssets

  const firstRate = firstRateAsset.value.gt(0)
    ? {
        amount: BN_1,
        symbol: firstRateAsset.symbol,
      }
    : undefined

  const secondRate = secondRateAsset.value.gt(0)
    ? {
        amount: secondRateAsset.value.div(firstRateAsset.value),
        symbol: secondRateAsset.symbol,
      }
    : undefined

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      autoComplete="off"
      sx={{
        flex: "column",
        justify: "space-between",
      }}
    >
      <Controller
        name="assetAAmount"
        control={form.control}
        render={({
          field: { name, value, onChange },
          fieldState: { error },
        }) => (
          <WalletTransferAssetSelect
            name={name}
            value={value}
            title={t("liquidity.pool.xyk.amountA")}
            asset={assetAId}
            onAssetOpen={onAssetAOpen}
            error={error?.message}
            onChange={onChange}
          />
        )}
      />
      <TokensConversion
        label={t("liquidity.pool.xyk.exchangeRate")}
        placeholderValue="-"
        firstValue={firstRate}
        secondValue={secondRate}
        onClick={() => setRateReversed((prev) => !prev)}
      />
      <Controller
        name="assetBAmount"
        control={form.control}
        render={({
          field: { name, value, onChange },
          fieldState: { error },
        }) => (
          <WalletTransferAssetSelect
            name={name}
            value={value}
            title={t("liquidity.pool.xyk.amountB")}
            asset={assetBId}
            onAssetOpen={onAssetBOpen}
            error={error?.message}
            onChange={onChange}
          />
        )}
      />
      {!submitHidden && (
        <>
          <Separator
            sx={{
              mx: "calc(-1 * var(--modal-content-padding))",
              my: 20,
              width: "auto",
            }}
          />
          <Button variant="primary">{t("liquidity.pool.create")}</Button>
        </>
      )}
    </form>
  )
}
