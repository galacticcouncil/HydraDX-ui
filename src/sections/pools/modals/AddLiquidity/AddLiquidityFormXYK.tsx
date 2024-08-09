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
import { useQueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "utils/queryKeys"
import { useSpotPrice } from "api/spotPrice"
import { TXYKPool } from "sections/pools/PoolsPage.utils"
import { TokensConversion } from "./components/TokensConvertion/TokensConversion"
import { useTokensBalances } from "api/balances"
import * as xyk from "@galacticcouncil/math-xyk"
import { TShareToken } from "api/assetDetails"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { getXYKPoolShare, useXYKZodSchema } from "./AddLiquidity.utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { TOAST_MESSAGES } from "state/toasts"
import { Alert } from "components/Alert/Alert"
import { ISubmittableResult } from "@polkadot/types/types"
import { Farm } from "api/farms"
import { useRefetchAccountNFTPositions } from "api/deposits"

type Props = {
  onClose: () => void
  pool: TXYKPool
  onSuccess: (result: ISubmittableResult) => void
  onSubmitted?: () => void
  farms: Farm[]
}

type FromValues = {
  assetA: string
  assetB: string
  lastUpdated: "assetA" | "assetB"
  shares: string
  ratio: string
}

const opposite = (value: "assetA" | "assetB") =>
  value === "assetA" ? "assetB" : "assetA"

export const AddLiquidityFormXYK = ({
  pool,
  onClose,
  onSuccess,
  onSubmitted,
  farms,
}: Props) => {
  const queryClient = useQueryClient()
  const { assets } = useRpcProvider()
  const { account } = useAccount()
  const { t } = useTranslation()
  const refetch = useRefetchAccountNFTPositions()

  const shareTokenMeta = assets.getAsset(pool.id) as TShareToken
  const [assetA, assetB] = assets.getAssets(shareTokenMeta.assets)

  const zodSchema = useXYKZodSchema(assetA.id, assetB.id, shareTokenMeta, farms)
  const form = useForm<FromValues>({
    mode: "onChange",
    defaultValues: {
      assetA: "",
      assetB: "",
      lastUpdated: "assetA",
      shares: "",
      ratio: "",
    },
    resolver: zodSchema ? zodResolver(zodSchema) : undefined,
  })

  const spotPrice = useSpotPrice(assetA.id, assetB.id)
  const [{ data: assetAReserve }, { data: assetBReserve }] = useTokensBalances(
    [assetA.id, assetB.id],
    pool.poolAddress,
  )

  const lastUpdated = form.watch("lastUpdated")
  const [assetValueA, assetValueB, shares, ratio] = form.watch([
    "assetA",
    "assetB",
    "shares",
    "ratio",
  ])

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

  const { api } = useRpcProvider()
  const { createTransaction } = useStore()

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
            shares: shares,
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
        onSuccess: (result) => {
          refetch()
          queryClient.refetchQueries(
            QUERY_KEYS.tokenBalance(shareTokenMeta.id, account?.address),
          )
          onSuccess(result)
        },
        onSubmitted: () => {
          !farms.length && onClose()
          form.reset()
          onSubmitted?.()
        },
        onClose,
        disableAutoClose: !!farms.length,
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

        const { totalShare } = pool.shareTokenIssuance ?? {}

        if (assetAReserve && totalShare) {
          const shares = xyk.calculate_shares(
            assetAReserve.balance.toString(),
            scale(form.getValues("assetA"), assetA.decimals).toFixed(),
            totalShare.toString(),
          )

          const ratio = getXYKPoolShare(
            totalShare,
            BigNumber(shares),
          ).toString()

          form.setValue("shares", shares, { shouldValidate: true })
          form.setValue("ratio", ratio)
        }
      }
    },
    [
      assetA.decimals,
      assetAReserve,
      assetValues,
      form,
      pool.shareTokenIssuance,
    ],
  )

  const minAddLiquidityValidation =
    form.formState.errors.shares?.message === "minAddLiquidity"
  const customErrors = form.formState.errors.shares as unknown as
    | {
        farm?: { message: string }
      }
    | undefined

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
              disabled={!assetAReserve}
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
              disabled={!assetBReserve}
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
            value: ratio,
            type: "token",
          })}
        />
        <Separator color="darkBlue400" opacity={0.3} />
        <SummaryRow
          label="Received amount of Pool Shares:"
          content={t("value.token", {
            value: shares,
            fixedPointScale: shareTokenMeta.decimals,
          })}
        />

        {minAddLiquidityValidation && (
          <Alert variant="warning" css={{ marginBottom: 8 }}>
            {t("liquidity.xyk.addLiquidity.warning")}
          </Alert>
        )}
        {customErrors?.farm && (
          <Alert variant="error" css={{ margin: "20px 0" }}>
            {customErrors.farm.message}
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
        disabled={
          !!Object.keys(form.formState.errors).length ||
          minAddLiquidityValidation
        }
      >
        {t("confirm")}
      </Button>
    </form>
  )
}
