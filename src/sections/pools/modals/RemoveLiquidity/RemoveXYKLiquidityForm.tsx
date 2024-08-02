import { useTokenBalance } from "api/balances"
import { Button } from "components/Button/Button"
import { Spacer } from "components/Spacer/Spacer"
import { Text } from "components/Typography/Text/Text"
import { Controller, useForm } from "react-hook-form"
import { Trans, useTranslation } from "react-i18next"
import { useStore } from "state/store"
import { getFloatingPointAmount } from "utils/balance"
import { BN_0 } from "utils/constants"
import { STradingPairContainer } from "./RemoveLiquidity.styled"
import { RemoveLiquidityReward } from "./components/RemoveLiquidityReward"
import { RemoveLiquidityInput } from "./components/RemoveLiquidityInput"
import { useRpcProvider } from "providers/rpcProvider"
import { TXYKPool } from "sections/pools/PoolsPage.utils"
import { useXYKTotalLiquidity } from "api/xyk"
import { useAccountBalances } from "api/accountBalances"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { useAssets } from "providers/assets"

type RemoveLiquidityProps = {
  onClose: () => void
  onSuccess: () => void
  pool: TXYKPool
}

export const RemoveXYKLiquidityForm = ({
  onClose,
  onSuccess,
  pool,
}: RemoveLiquidityProps) => {
  const { t } = useTranslation()
  const form = useForm<{ value: number }>({ defaultValues: { value: 25 } })

  const { api } = useRpcProvider()
  const { createTransaction } = useStore()
  const { account } = useAccount()
  const { native } = useAssets()
  const { assets, decimals } = pool.meta
  const [assetAMeta, assetBMeta] = assets

  const totalLiquidity = useXYKTotalLiquidity(pool.poolAddress)
  const shareTokenBalance = useTokenBalance(pool.id, account?.address)
  const poolBalance = useAccountBalances(pool.poolAddress)

  const value = form.watch("value")

  const removeShareToken =
    shareTokenBalance.data?.balance
      ?.multipliedBy(value)
      .dividedToIntegerBy(100) ?? BN_0

  const removeAmount = assets.map((asset) => {
    const isNative = asset.id === native.id

    const balance = isNative
      ? poolBalance.data?.native.freeBalance
      : poolBalance.data?.balances.find((balance) => balance.id === asset.id)
          ?.freeBalance

    return removeShareToken &&
      totalLiquidity.data &&
      balance &&
      !totalLiquidity.data?.isZero()
      ? removeShareToken.multipliedBy(balance).dividedBy(totalLiquidity.data)
      : BN_0
  })

  const handleSubmit = async () => {
    await createTransaction(
      {
        tx: api.tx.xyk.removeLiquidity(
          assetAMeta.id,
          assetBMeta.id,
          removeShareToken.toFixed(),
        ),
      },
      {
        onSuccess,
        onClose,
        onBack: () => {},
        onSubmitted: () => {
          form.reset()
        },
        toast: {
          onLoading: (
            <Trans
              t={t}
              i18nKey="liquidity.remove.modal.xyk.toast.onLoading"
              tOptions={{
                value: removeShareToken,
                fixedPointScale: decimals,
              }}
            >
              <span />
              <span className="highlight" />
            </Trans>
          ),
          onSuccess: (
            <Trans
              t={t}
              i18nKey="liquidity.remove.modal.xyk.toast.onSuccess"
              tOptions={{
                value: removeShareToken,
                fixedPointScale: decimals,
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
      onSubmit={form.handleSubmit(handleSubmit)}
      autoComplete="off"
      sx={{
        flex: "column",
        justify: "space-between",
        minHeight: "100%",
      }}
    >
      <div>
        <div>
          <Text fs={32} sx={{ mt: 24 }}>
            {t("liquidity.remove.modal.value", {
              value: getFloatingPointAmount(removeShareToken, decimals),
            })}
          </Text>
          <Text fs={18} color="pink500" sx={{ mb: 20 }}>
            {t("value.percentage", { value })}
          </Text>
          <Controller
            name="value"
            control={form.control}
            render={({ field }) => (
              <RemoveLiquidityInput
                value={field.value}
                onChange={field.onChange}
                balance={t("liquidity.remove.modal.shares", {
                  shares: getFloatingPointAmount(
                    shareTokenBalance.data?.balance ?? 0,
                    decimals,
                  ),
                })}
              />
            )}
          />

          <STradingPairContainer>
            <Text color="brightBlue300">
              {t("liquidity.remove.modal.receive")}
            </Text>

            <RemoveLiquidityReward
              id={assetAMeta.id}
              name={assetAMeta.name}
              symbol={assetAMeta.symbol}
              amount={t("value.token", {
                value: removeAmount[0],
                fixedPointScale: assetAMeta.decimals,
              })}
            />
            <RemoveLiquidityReward
              id={assetBMeta.id}
              name={assetBMeta.name}
              symbol={assetBMeta.symbol}
              amount={t("value.token", {
                value: removeAmount[1],
                fixedPointScale: assetBMeta.decimals,
              })}
            />
          </STradingPairContainer>
        </div>
        <Spacer size={6} />
      </div>
      <div>
        <Spacer size={20} />
        <Button
          fullWidth
          variant="primary"
          disabled={removeShareToken.isZero()}
        >
          {t("liquidity.remove.modal.confirm")}
        </Button>
      </div>
    </form>
  )
}
