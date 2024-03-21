import { Controller, useForm } from "react-hook-form"
import BigNumber from "bignumber.js"
import { BN_1 } from "utils/constants"
import { WalletTransferAssetSelect } from "sections/wallet/transfer/WalletTransferAssetSelect"
import { SummaryRow } from "components/Summary/SummaryRow"
import { Spacer } from "components/Spacer/Spacer"
import { Text } from "components/Typography/Text/Text"
import { Trans, useTranslation } from "react-i18next"
import { PoolAddLiquidityInformationCard } from "./AddLiquidityInfoCard"
import { Separator } from "components/Separator/Separator"
import { Button } from "components/Button/Button"
import { getFixedPointAmount, getFloatingPointAmount } from "utils/balance"
import { useStore } from "state/store"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useRpcProvider } from "providers/rpcProvider"
import { useQueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "utils/queryKeys"
import { useSpotPrice } from "api/spotPrice"
import { TXYKPool } from "sections/pools/PoolsPage.utils"
import { TokensConversion } from "./components/TokensConvertion/TokensConversion"
import { useMaxBalance, useTokensBalances } from "api/balances"
import IconWarning from "assets/icons/WarningIcon.svg?react"
import * as xyk from "@galacticcouncil/math-xyk"
import { useXYKConsts } from "api/xyk"
import { TShareToken } from "api/assetDetails"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"

type Props = {
  assetId: string
  initialAmount?: string
  onClose: () => void
  onAssetOpen?: () => void
  pool: TXYKPool
}

const opposite = (value: "assetA" | "assetB") =>
  value === "assetA" ? "assetB" : "assetA"

export const AddLiquidityFormXYK = ({ pool, onClose }: Props) => {
  const queryClient = useQueryClient()
  const { assets } = useRpcProvider()
  const { account } = useAccount()
  const xykConsts = useXYKConsts()
  const { t } = useTranslation()

  const shareTokenMeta = assets.getAsset(pool.id) as TShareToken
  const [assetA, assetB] = assets.getAssets(shareTokenMeta.assets)

  const [formAssets] = useState({
    assetA,
    assetB,
  })

  const form = useForm<{
    assetA: string
    assetB: string
    lastUpdated: "assetA" | "assetB"
    amount: string
  }>({
    mode: "onChange",
    defaultValues: {
      assetA: "",
      assetB: "",
      lastUpdated: "assetA",
      amount: "0",
    },
  })

  const spotPrice = useSpotPrice(formAssets.assetA.id, formAssets.assetB.id)

  const [{ data: assetAReserve }, { data: assetBReserve }] = useTokensBalances(
    [formAssets.assetA.id, formAssets.assetB.id],
    pool.poolAddress,
  )

  const [{ data: assetABalance }, { data: assetBBalance }] = useTokensBalances(
    [formAssets.assetA.id, formAssets.assetB.id],
    account?.address,
  )
  const lastUpdated = form.watch("lastUpdated")

  const reserves = useMemo(
    () => ({
      assetA: assetAReserve,
      assetB: assetBReserve,
    }),
    [assetAReserve, assetBReserve],
  )

  const [assetValueA, assetValueB] = form.watch(["assetA", "assetB"])

  const assetValues = useMemo(
    () => ({ assetA: assetValueA, assetB: assetValueB }),
    [assetValueA, assetValueB],
  )

  const minAddLiquidityValidation = useMemo(() => {
    const { decimals } = formAssets[lastUpdated]

    const mainAsset = new BigNumber(assetValues[lastUpdated])

    const minAddLiqudityValue = BigNumber(
      xykConsts.data?.minPoolLiquidity ?? 0,
    ).shiftedBy(-decimals)
    const isMinAddLiqudity = minAddLiqudityValue.gt(mainAsset)

    return isMinAddLiqudity
  }, [assetValues, formAssets, lastUpdated, xykConsts.data?.minPoolLiquidity])

  const calculatedShares = useMemo(() => {
    if (
      pool.shareTokenIssuance?.totalShare &&
      reserves.assetA &&
      assetValues.assetA
    ) {
      return new BigNumber(
        xyk.calculate_shares(
          reserves.assetA.balance.toString(),
          new BigNumber(assetValues.assetA)
            .shiftedBy(formAssets.assetA.decimals)
            .toFixed(),
          pool.shareTokenIssuance.totalShare.toString(),
        ),
      )
    }

    return null
  }, [pool, reserves.assetA, assetValues.assetA, formAssets.assetA.decimals])

  let calculatedRatio =
    pool.shareTokenIssuance?.myPoolShare &&
    calculatedShares &&
    calculatedShares
      .div(pool.shareTokenIssuance.totalShare?.plus(calculatedShares) ?? 1)
      .multipliedBy(100)

  const { api } = useRpcProvider()
  const { createTransaction } = useStore()

  const balanceAInfo = useMaxBalance(
    formAssets.assetA.id,
    api.tx.xyk.addLiquidity(
      formAssets.assetA.id,
      formAssets.assetB.id,
      assetABalance?.balance.toFixed() ?? "0",
      assetAReserve && assetBReserve && assetABalance
        ? getFloatingPointAmount(
            xyk.calculate_liquidity_in(
              assetAReserve.balance.toFixed(),
              assetBReserve.balance.toFixed(),
              getFixedPointAmount(
                assetABalance.balance,
                formAssets.assetA.decimals.toString(),
              ).toFixed(),
            ),
            formAssets.assetB.decimals.toString(),
          ).toFixed(0)
        : "0",
    ),
  )

  const balanceBInfo = useMaxBalance(
    formAssets.assetB.id,
    api.tx.xyk.addLiquidity(
      formAssets.assetA.id,
      formAssets.assetB.id,
      assetABalance?.balance.toFixed() ?? "0",
      assetAReserve && assetBReserve && assetBBalance
        ? getFloatingPointAmount(
            xyk.calculate_liquidity_in(
              assetBReserve.balance.toFixed(),
              assetAReserve.balance.toFixed(),
              getFixedPointAmount(
                assetBBalance.balance,
                formAssets.assetB.decimals.toString(),
              ).toFixed(),
            ),
            formAssets.assetA.decimals.toString(),
          ).toFixed(0)
        : "0",
    ),
  )

  const onSubmit = async () => {
    const inputData = {
      assetA: {
        id: formAssets[lastUpdated].id,
        amount: getFixedPointAmount(
          new BigNumber(assetValues[lastUpdated]),
          formAssets[lastUpdated].decimals.toString(),
        ),
      },
      assetB: {
        id: formAssets[opposite(lastUpdated)].id,
        amount: getFixedPointAmount(
          new BigNumber(assetValues[opposite(lastUpdated)]),
          formAssets[opposite(lastUpdated)].decimals.toString(),
        ).decimalPlaces(0),
      },
    }

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
              i18nKey="liquidity.add.modal.xyk.toast.onLoading"
              tOptions={{
                shares: calculatedShares,
                fixedPointScale: shareTokenMeta.decimals,
              }}
            >
              <span />
              <span className="highlight" />
            </Trans>
          ),
          onSuccess: (
            <Trans
              t={t}
              i18nKey="liquidity.add.modal.xyk.toast.onLoading"
              tOptions={{
                shares: calculatedShares,
                fixedPointScale: shareTokenMeta.decimals,
              }}
            >
              <span />
              <span className="highlight" />
            </Trans>
          ),
          onError: (
            <Trans
              t={t}
              i18nKey="liquidity.add.modal.xyk.toast.onLoading"
              tOptions={{
                shares: calculatedShares,
                fixedPointScale: shareTokenMeta.decimals,
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

  const handleChange = useCallback(
    (value: string, name: "assetA" | "assetB") => {
      const assetDecimals = formAssets[name].decimals
      const pairAssetDecimals = formAssets[opposite(name)].decimals

      const currReserves = reserves[name]
      const nextReserves = reserves[opposite(name)]

      if (currReserves && nextReserves && xyk) {
        const pairTokenValue = getFloatingPointAmount(
          xyk.calculate_liquidity_in(
            currReserves.balance.toFixed(),
            nextReserves.balance.toFixed(),
            getFixedPointAmount(
              new BigNumber(value),
              assetDecimals.toString(),
            ).toFixed(),
          ),
          pairAssetDecimals.toString(),
        ).toString()

        form.setValue(name, value, { shouldValidate: true, shouldTouch: true })
        form.setValue(opposite(name), pairTokenValue, {
          shouldValidate: true,
          shouldTouch: true,
        })
        form.setValue("lastUpdated", name)
      }
    },
    [formAssets, reserves, form],
  )

  useEffect(() => {
    return () => {
      form.reset()
    }
  }, [form, form.reset])

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
                  if (
                    assetABalance?.balance.gte(
                      BigNumber(value).shiftedBy(formAssets.assetA.decimals),
                    )
                  )
                    return true
                } catch {}
                return t("liquidity.add.modal.validation.notEnoughBalance")
              },
            },
          }}
          render={({ field: { name, value }, fieldState: { error } }) => (
            <WalletTransferAssetSelect
              title={t("wallet.assets.transfer.asset.label_mob")}
              name={name}
              value={value}
              onChange={(value) => {
                handleChange(value, name)
              }}
              asset={assetA.id}
              error={error?.message}
              balanceMax={balanceAInfo.maxBalance}
            />
          )}
        />
        <TokensConversion
          firstValue={{ amount: BN_1, symbol: formAssets.assetA.symbol }}
          secondValue={
            spotPrice.data?.spotPrice
              ? {
                  amount: spotPrice.data?.spotPrice,
                  symbol: formAssets.assetB.symbol,
                }
              : undefined
          }
        />
        <Controller
          name="assetB"
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
                  if (
                    assetBBalance?.balance.gte(
                      BigNumber(value).shiftedBy(formAssets.assetB.decimals),
                    )
                  )
                    return true
                } catch {}
                return t("liquidity.add.modal.validation.notEnoughBalance")
              },
            },
          }}
          render={({ field: { name, value }, fieldState: { error } }) => (
            <WalletTransferAssetSelect
              title={t("wallet.assets.transfer.asset.label_mob")}
              name={name}
              value={value}
              onChange={(value) => {
                handleChange(value, name)
              }}
              asset={assetB.id}
              error={error?.message}
              balanceMax={balanceBInfo.maxBalance}
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
        <Text color="pink500" fs={15} font="FontOver" tTransform="uppercase">
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
          <div
            sx={{
              flex: "row",
              align: "center",
              gap: 8,
              height: 50,
              p: "12px 14px",
              my: 8,
            }}
            css={{ borderRadius: 2, background: "rgba(245, 168, 85, 0.3)" }}
          >
            <IconWarning />
            <Text color="white" fs={13} fw={400}>
              {t("liquidity.xyk.addLiquidity.warning")}
            </Text>
          </div>
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
