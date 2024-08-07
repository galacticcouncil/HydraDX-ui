import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useAcountAssets } from "api/assetDetails"
import { useTokenBalance } from "api/balances"
import BigNumber from "bignumber.js"
import { useShallow } from "hooks/useShallow"
import { useRpcProvider } from "providers/rpcProvider"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useUserExternalTokenStore } from "sections/wallet/addToken/AddToken.utils"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { Transaction, useSettingsStore, useStore } from "state/store"
import { BN_0 } from "utils/constants"
import { QUERY_KEYS } from "utils/queryKeys"
import { maxBalance, required } from "utils/validators"
import { ZodType, z } from "zod"
import { createToastMessages } from "state/toasts"
import { ApiPromise } from "@polkadot/api"

type XYKAsset = {
  id: string
  amount: string
  decimals: number
}

export type CreateXYKPoolFormData = {
  assetAId: string
  assetAAmount: string
  assetBId: string
  assetBAmount: string
}

export const createXYKPoolFormSchema = (
  balanceA: BigNumber,
  decimalsA: number,
  balanceB: BigNumber,
  decimalsB: number,
): ZodType<CreateXYKPoolFormData> =>
  z.object({
    assetAId: required,
    assetAAmount: required.pipe(maxBalance(balanceA, decimalsA)),
    assetBId: required,
    assetBAmount: required.pipe(maxBalance(balanceB, decimalsB)),
  })

export const createPoolExclusivityMap = (xykPoolsAssets: string[][]) => {
  return xykPoolsAssets.reduce<Record<string, string[]>>((memo, [idA, idB]) => {
    if (!memo[idA]) {
      memo[idA] = []
    }
    if (!memo[idB]) {
      memo[idB] = []
    }
    if (!memo[idA].includes(idB)) {
      memo[idA].push(idB)
    }
    if (!memo[idB].includes(idA)) {
      memo[idB].push(idA)
    }
    return memo
  }, {})
}

export const filterIdsByExclusivity = (
  exclusiveId: string,
  ids: string[],
  map: Record<string, string[]>,
) => ids.filter((id) => id !== exclusiveId && !map[exclusiveId]?.includes(id))

export const useAllowedXYKPoolAssets = () => {
  const { account } = useAccount()
  const { assets } = useRpcProvider()
  const degenMode = useSettingsStore(useShallow((s) => s.degenMode))

  const { isAdded } = useUserExternalTokenStore()

  const accountAssets = useAcountAssets(account?.address)

  return useMemo(() => {
    const tradableAssetIds = assets.tradeAssets.map((asset) => asset.id)
    const accountAssetIds = accountAssets
      .filter(({ balance }) => balance.freeBalance.gt(0))
      .map(({ asset }) => asset.id)

    return assets.all.filter((asset) => {
      const isTradable = tradableAssetIds.includes(asset.id)
      const hasBalance = accountAssetIds.includes(asset.id)
      const isNotTradableWithBalance = !isTradable && hasBalance

      const shouldBeVisible = isTradable || isNotTradableWithBalance

      if (asset.isExternal) {
        return shouldBeVisible && (degenMode || isAdded(asset.externalId))
      }

      return shouldBeVisible
    })
  }, [degenMode, accountAssets, assets.all, assets.tradeAssets, isAdded])
}

export const useCreateXYKPoolForm = (assetA?: string, assetB?: string) => {
  const { isLoaded, assets } = useRpcProvider()

  const { account } = useAccount()

  const assetAMeta = isLoaded ? assets.getAsset(assetA ?? "") : null
  const assetBMeta = isLoaded ? assets.getAsset(assetB ?? "") : null

  const { data: balanceA } = useTokenBalance(assetA, account?.address)
  const { data: balanceB } = useTokenBalance(assetB, account?.address)

  return useForm<CreateXYKPoolFormData>({
    mode: "onChange",
    resolver: zodResolver(
      createXYKPoolFormSchema(
        balanceA?.balance ?? BN_0,
        assetAMeta?.decimals ?? 0,
        balanceB?.balance ?? BN_0,
        assetBMeta?.decimals ?? 0,
      ),
    ),
    defaultValues: {
      assetAId: assetA ?? "",
      assetBId: assetB ?? "",
      assetAAmount: "",
      assetBAmount: "",
    },
  })
}

export const createXYKpool = (
  api: ApiPromise,
  assetA: XYKAsset,
  assetB: XYKAsset,
) => {
  return api.tx.xyk.createPool(
    assetA.id,
    new BigNumber(assetA.amount).shiftedBy(assetA.decimals).toFixed(),
    assetB.id,
    new BigNumber(assetB.amount).shiftedBy(assetB.decimals).toFixed(),
  )
}

export const useCreateXYKPool = ({
  onClose,
  onSubmitted,
  onSuccess,
  steps,
}: {
  onClose?: () => void
  onSubmitted?: () => void
  onSuccess?: () => void
  steps?: Transaction["steps"]
} = {}) => {
  const { t } = useTranslation()
  const { api, assets, isLoaded } = useRpcProvider()
  const { createTransaction } = useStore()
  const queryClient = useQueryClient()

  return useMutation(async (values: CreateXYKPoolFormData) => {
    const assetAMeta = isLoaded ? assets.getAsset(values.assetAId ?? "") : null
    const assetBMeta = isLoaded ? assets.getAsset(values.assetBId ?? "") : null
    if (!assetAMeta || !assetBMeta) throw new Error("Assets not found")

    const data = {
      assetA: {
        id: assetAMeta.id,
        amount: values.assetAAmount,
        decimals: assetAMeta.decimals,
      },
      assetB: {
        id: assetBMeta.id,
        amount: values.assetBAmount,
        decimals: assetBMeta.decimals,
      },
    }

    return await createTransaction(
      {
        title: t("liquidity.pool.xyk.create.modal.title"),
        description: t("liquidity.pool.xyk.create.modal.description", {
          assetAAmount: data.assetA.amount,
          assetASymbol: assetAMeta.symbol,
          assetBAmount: data.assetB.amount,
          assetBSymbol: assetBMeta.symbol,
        }),
        tx: createXYKpool(api, data.assetA, data.assetB),
      },
      {
        steps,
        onClose,
        onBack: () => {},
        onSubmitted,
        onSuccess: () => {
          queryClient.refetchQueries(QUERY_KEYS.xykPools)
          onSuccess?.()
        },
        toast: createToastMessages("liquidity.pool.xyk.create.toast", {
          t,
          tOptions: {
            symbolA: assetAMeta.symbol,
            symbolB: assetBMeta.symbol,
          },
          components: ["span", "span.highlight"],
        }),
      },
    )
  })
}
