import { Controller, useForm } from "react-hook-form"
import BigNumber from "bignumber.js"
import { BN_0, BN_1 } from "utils/constants"
import { WalletTransferAssetSelect } from "sections/wallet/transfer/WalletTransferAssetSelect"
import { SummaryRow } from "components/Summary/SummaryRow"
import { Spacer } from "components/Spacer/Spacer"
import { Text } from "components/Typography/Text/Text"
import { Trans, useTranslation } from "react-i18next"
import { PoolAddLiquidityInformationCard } from "./AddLiquidityInfoCard"
import { Separator } from "components/Separator/Separator"
import { Button } from "components/Button/Button"
import { scale, scaleHuman } from "utils/balance"
import { ToastMessage, useStore } from "state/store"
import { useCallback, useMemo } from "react"
import { useRpcProvider } from "providers/rpcProvider"
import { useSpotPrice } from "api/spotPrice"
import { TXYKPool } from "sections/pools/PoolsPage.utils"
import { TokensConversion } from "./components/TokensConvertion/TokensConversion"
import { useTokensBalances } from "api/balances"
import * as xyk from "@galacticcouncil/math-xyk"
import { useXYKConsts } from "api/xyk"
import { TShareToken } from "api/assetDetails"
import { getXYKPoolShare, useXYKZodSchema } from "./AddLiquidity.utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { Alert } from "components/Alert/Alert"
import { useQueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "utils/queryKeys"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { TOAST_MESSAGES } from "state/toasts"

type Props = {
  assetId: string
  initialAmount?: string
  onClose: () => void
  onAssetOpen?: () => void
  pool: TXYKPool
}

const opposite = (value: "assetA" | "assetB") =>
  value === "assetA" ? "assetB" : "assetA"

type FromValues = {
  assetA: string
  assetB: string
  lastUpdated: "assetA" | "assetB"
}

export const AddLiquidityFormXYK = ({ pool, onClose }: Props) => {
  const { assets, api } = useRpcProvider()
  const { data: xykConsts } = useXYKConsts()
  const { t } = useTranslation()
  const { createTransaction } = useStore()
  const queryClient = useQueryClient()
  const { account } = useAccount()

  const shareTokenMeta = assets.getAsset(pool.id) as TShareToken
  const [assetA, assetB] = assets.getAssets(shareTokenMeta.assets)

  const zodSchema = useXYKZodSchema(assetA.id, assetB.id)

  const form = useForm<FromValues>({
    resolver: zodSchema ? zodResolver(zodSchema) : undefined,
    mode: "onChange",
    defaultValues: {
      assetA: "",
      assetB: "",
      lastUpdated: "assetA",
    },
  })

  const spotPrice = useSpotPrice(assetA.id, assetB.id)

  const [{ data: assetAReserve }, { data: assetBReserve }] = useTokensBalances(
    [assetA.id, assetB.id],
    pool.poolAddress,
  )

  const lastUpdated = form.watch("lastUpdated")
  const [assetValueA, assetValueB] = form.watch(["assetA", "assetB"])

  const assetValues = useMemo(() => {
    return {
      assetA: {
        value: assetValueA,
        meta: assetA,
        reserves: assetAReserve,
      },
      assetB: {
        value: assetValueB,
        meta: assetB,
        reserves: assetBReserve,
      },
    }
  }, [assetA, assetAReserve, assetB, assetBReserve, assetValueA, assetValueB])

  const { calculatedShares, calculatedRatio } = useMemo(() => {
    const { totalShare } = pool.shareTokenIssuance ?? {}

    if (totalShare && assetValues.assetA.reserves && assetValues.assetA) {
      const calculatedShares = BigNumber(
        xyk.calculate_shares(
          assetValues.assetA.reserves.balance.toString(),
          scale(
            assetValues.assetA.value,
            assetValues.assetA.meta.decimals,
          ).toFixed(),
          totalShare.toString(),
        ),
      )
      const calculatedRatio = getXYKPoolShare(totalShare, calculatedShares)

      return { calculatedShares, calculatedRatio }
    }

    return {}
  }, [pool, assetValues])

  const minAddLiquidityValidation = useMemo(() => {
    const minTradingLimit = BigNumber(xykConsts?.minTradingLimit ?? 0)
    const minPoolLiquidity = BigNumber(xykConsts?.minPoolLiquidity ?? 0)

    if (!assetValues.assetA || !assetValues.assetB || !calculatedShares)
      return false

    const minAssetATradingLimit = scale(
      assetValues.assetA.value,
      assetValues.assetA.meta.decimals,
    ).gt(minTradingLimit)
    const minAssetBTradingLimit = scale(
      assetValues.assetB.value,
      assetValues.assetB.meta.decimals,
    ).gt(minTradingLimit)

    const isMinPoolLiquidity = calculatedShares.gt(minPoolLiquidity)

    const isMinAddLiqudity =
      !minAssetATradingLimit || !minAssetBTradingLimit || !isMinPoolLiquidity

    return isMinAddLiqudity
  }, [assetValues, xykConsts, calculatedShares])

  const onSubmit = async () => {
    const inputData = {
      assetA: {
        id: assetValues[lastUpdated].meta.id,
        amount: scale(
          assetValues[lastUpdated].value,
          assetValues[lastUpdated].meta.decimals,
        ),
      },
      assetB: {
        id: assetValues[opposite(lastUpdated)].meta.id,
        amount: scale(
          assetValues[opposite(lastUpdated)].value,
          assetValues[opposite(lastUpdated)].meta.decimals,
        ).decimalPlaces(0),
      },
    }

    const toast = TOAST_MESSAGES.reduce((memo, type) => {
      const msType = type === "onError" ? "onLoading" : type
      memo[type] = (
        <Trans
          t={t}
          i18nKey={`liquidity.add.modal.xyk.toast.${msType}`}
          tOptions={{
            shares: calculatedShares,
            fixedPointScale: shareTokenMeta.decimals,
          }}
        >
          <span />
          <span className="highlight" />
        </Trans>
      )
      return memo
    }, {} as ToastMessage)

    return await createTransaction(
      {
        tx: api.tx.xyk.addLiquidity(
          inputData.assetA.id,
          inputData.assetB.id,
          inputData.assetA.amount.toFixed(),
          inputData.assetB.amount.toFixed(),
        ),
      },
      {
        onSuccess: () => {
          queryClient.refetchQueries(
            QUERY_KEYS.accountOmnipoolPositions(account?.address),
          )
          queryClient.refetchQueries(
            QUERY_KEYS.tokenBalance(shareTokenMeta.id, account?.address),
          )
        },
        onSubmitted: () => {
          onClose()
          form.reset()
        },
        onClose,
        onBack: () => {},
        toast,
      },
    )
  }

  const handleChange = useCallback(
    (value: string, name: "assetA" | "assetB") => {
      const assetDecimals = assetValues[name].meta.decimals
      const pairAssetDecimals = assetValues[opposite(name)].meta.decimals

      const currReserves = assetValues[name].reserves
      const nextReserves = assetValues[opposite(name)].reserves

      if (currReserves && nextReserves) {
        const pairTokenValue = scaleHuman(
          xyk.calculate_liquidity_in(
            currReserves.balance.toFixed(),
            nextReserves.balance.toFixed(),
            scale(value, assetDecimals).toFixed(),
          ),
          pairAssetDecimals,
        ).toString()

        form.setValue(name, value, { shouldValidate: true, shouldTouch: true })
        form.setValue(opposite(name), pairTokenValue, {
          shouldValidate: true,
          shouldTouch: true,
        })
        form.setValue("lastUpdated", name)
      }
    },
    [assetValues, form],
  )

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
          name="assetA"
          control={form.control}
          render={({ field: { name, value }, fieldState: { error } }) => (
            <WalletTransferAssetSelect
              title={t("wallet.assets.transfer.asset.label_mob")}
              name={name}
              value={value}
              onChange={(value) => handleChange(value, name)}
              asset={assetA.id}
              error={error?.message}
            />
          )}
        />
        <TokensConversion
          firstValue={{ amount: BN_1, symbol: assetValues.assetA.meta.symbol }}
          secondValue={{
            amount: spotPrice.data?.spotPrice ?? BN_0,
            symbol: assetValues.assetB.meta.symbol,
          }}
        />
        <Controller
          name="assetB"
          control={form.control}
          render={({ field: { name, value }, fieldState: { error } }) => (
            <WalletTransferAssetSelect
              title={t("wallet.assets.transfer.asset.label_mob")}
              name={name}
              value={value}
              onChange={(value) => handleChange(value, name)}
              asset={assetB.id}
              error={error?.message}
            />
          )}
        />
        <Spacer size={4} />
        <SummaryRow
          label={t("liquidity.add.modal.poolTradeFee")}
          content={t("value.percentage", {
            value: pool.fee,
          })}
        />

        <Spacer size={24} />
        <Text color="pink500" fs={15} font="GeistMono" tTransform="uppercase">
          {t("liquidity.add.modal.positionDetails")}
        </Text>
        <SummaryRow
          label="Share of pool:"
          content={t("value.percentage", {
            value: calculatedRatio,
            type: "token",
          })}
        />
        <Separator color="darkBlue400" opacity={0.3} />
        <SummaryRow
          label="Received amount of Pool Shares:"
          content={t("value.token", {
            value: calculatedShares,
            fixedPointScale: shareTokenMeta.decimals,
          })}
        />

        {minAddLiquidityValidation && (
          <Alert variant="warning" css={{ marginBottom: 8 }}>
            {t("liquidity.xyk.addLiquidity.warning")}
          </Alert>
        )}
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
        disabled={!form.formState.isValid || minAddLiquidityValidation}
      >
        {t("confirm")}
      </Button>
    </form>
  )
}
