import { useTokenBalance } from "api/balances"
import {
  assethub,
  useAssetHubNativeBalance,
  useAssetHubTokenBalance,
} from "api/external/assethub"
import { useAccountFeePaymentAssets } from "api/payments"
import BN from "bignumber.js"
import { Alert } from "components/Alert/Alert"
import { useTranslation } from "react-i18next"
import {
  MemepadDryRunResult,
  useMemepadDryRun,
} from "sections/memepad/form/MemepadForm.utils"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { BN_0 } from "utils/constants"
import { groupBy } from "utils/rx"
import { useMemepadFormContext } from "./MemepadFormContext"
import { AssetAmount } from "@galacticcouncil/xcm-core"
import { Text } from "components/Typography/Text/Text"
import { Spinner } from "components/Spinner/Spinner"

const VALIDATE_BALANCES = false

export const MemepadFormAlerts = () => {
  const { t } = useTranslation()
  const { alerts, setAlert, clearAlert } = useMemepadFormContext()

  const { account } = useAccount()

  const address = account?.address ?? ""

  const { data: nativeBalance } = useAssetHubNativeBalance(address)
  const { data: feeBalance } = useAssetHubTokenBalance("1984", address)

  const { feePaymentAssetId } = useAccountFeePaymentAssets()
  const { data: feePaymentAssetBalance } = useTokenBalance(
    feePaymentAssetId,
    address,
  )

  const ahNativeBalance = nativeBalance?.balance ?? BN_0
  const ahXcmFeeBalance = feeBalance?.balance ?? BN_0
  const hydraFeeBalance = feePaymentAssetBalance?.balance ?? BN_0

  function handleBalanceAlert({
    balance,
    assetAmount,
    chain,
  }: {
    chain?: string
    balance?: BN
    assetAmount?: AssetAmount
  } = {}) {
    if (!assetAmount) return

    const key = `balance-${assetAmount.key}-${chain}`
    if (balance && balance.lt(assetAmount.amount.toString())) {
      setAlert({
        key,
        variant: "error",
        text: t("memepad.form.error.balance", {
          symbol: assetAmount.symbol,
          value: assetAmount.amount.toString(),
          fixedPointScale: assetAmount.decimals,
          chain,
        }),
      })
    } else {
      clearAlert(key)
    }
  }

  const { isLoading } = useMemepadDryRun({
    onSuccess: (data) => {
      if (VALIDATE_BALANCES) {
        const {
          registerTokenFee,
          createXYKPoolFee,
          createTokenFee,
          xcmDstFeeED,
          xcmSrcFee,
          xcmDstFee,
        } = data

        const hydraTotals = groupAndSumAmounts([
          registerTokenFee,
          createXYKPoolFee,
        ])

        const hydraFeeAsset = feePaymentAssetId
          ? hydraTotals[feePaymentAssetId]
          : undefined

        handleBalanceAlert({
          balance: hydraFeeBalance,
          assetAmount: hydraFeeAsset,
          chain: "Hydration",
        })

        const assethubTotals = groupAndSumAmounts([
          createTokenFee,
          xcmDstFeeED,
          xcmSrcFee,
          xcmDstFee,
        ])

        const ahDot = assethubTotals.dot
        handleBalanceAlert({
          balance: ahNativeBalance,
          assetAmount: ahDot,
          chain: assethub.name,
        })

        const ahUsdt = assethubTotals.usdt
        handleBalanceAlert({
          balance: ahXcmFeeBalance,
          assetAmount: ahUsdt,
          chain: assethub.name,
        })
      }

      printDebug(data)
    },
  })

  if (VALIDATE_BALANCES && isLoading) {
    return (
      <div sx={{ flex: "row", gap: 10, align: "center" }}>
        <Spinner size={16} />
        <Text fs={12} color="basic400">
          {t("memepad.form.balance.isLoading")}
        </Text>
      </div>
    )
  }

  if (!alerts.length) return null

  return (
    <div sx={{ flex: "column", gap: 10 }}>
      {alerts.map(({ key, variant, text }) => (
        <Alert key={key} variant={variant}>
          {text}
        </Alert>
      ))}
    </div>
  )
}

function groupAndSumAmounts(amounts: AssetAmount[]) {
  const groups = groupBy(amounts, (x) => x.key)

  return Object.fromEntries(
    Object.entries(groups).map(([key, group]) => {
      const total = group.reduce((acc, x) => x.amount + acc, 0n)
      return [key, group[0].copyWith({ amount: total })]
    }),
  )
}

function printDebug(data: MemepadDryRunResult) {
  console.group("Hydration Fees:")
  console.table({
    registerTokenFee: `${data.registerTokenFee.toDecimal()} ${data.registerTokenFee.symbol}`,
    createXYKPoolFee: `${data.createXYKPoolFee.toDecimal()} ${data.createXYKPoolFee.symbol}`,
  })
  console.groupEnd()
  console.group("Assethub Fees:")
  console.table({
    createTokenFee: `${data.createTokenFee.toDecimal()} ${data.createTokenFee.symbol}`,
    xcmDstFeeED: `${data.xcmDstFeeED.toDecimal()} ${data.xcmDstFeeED.symbol}`,
    xcmSrcFee: `${data.xcmSrcFee.toDecimal()} ${data.xcmSrcFee.symbol}`,
    xcmDstFee: `${data.xcmDstFee.toDecimal()} ${data.xcmDstFee.symbol}`,
  })
  console.groupEnd()
}
