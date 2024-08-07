import { chainsMap } from "@galacticcouncil/xcm-cfg"
import { Parachain } from "@galacticcouncil/xcm-core"
import { AccountId32 } from "@open-web3/orml-types/interfaces"
import { ApiPromise } from "@polkadot/api"
import { ISubmittableResult } from "@polkadot/types/types"
import { u32 } from "@polkadot/types"
import { useMutation, useQueries, useQuery } from "@tanstack/react-query"
import { useExternalApi } from "api/external"
import BigNumber from "bignumber.js"
import { useTranslation } from "react-i18next"
import { TExternalAsset } from "sections/wallet/addToken/AddToken.utils"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { Transaction, useStore } from "state/store"
import { createToastMessages } from "state/toasts"
import { BN_0, BN_1, BN_NAN } from "utils/constants"
import { Maybe, undefinedNoop } from "utils/helpers"
import { QUERY_KEYS } from "utils/queryKeys"
import { arrayToMap } from "utils/rx"
import BN from "bignumber.js"
import { ParachainAssetsData } from "@galacticcouncil/xcm-core/build/types/chain/Parachain"
import { useSpotPrice } from "api/spotPrice"
import { wallet } from "api/xcm"
import { SubmittableExtrinsic } from "@polkadot/api/types"

export const ASSETHUB_XCM_ASSET_SUFFIX = "_ah_"
export const ASSETHUB_TREASURY_ADDRESS =
  "13UVJyLnbVp9RBZYFwFGyDvVd1y27Tt8tkntv6Q7JVPhFsTB"

export const assethub = chainsMap.get("assethub") as Parachain
export const assethubNativeToken = assethub.assetsData.get(
  "dot",
) as ParachainAssetsData

// TEMP CHOPSTICKS SETUP
if (window.location.hostname === "localhost") {
  //@ts-ignore
  assethub.ws = "ws://172.25.126.217:8000"
  const hydradx = chainsMap.get("hydradx") as Parachain
  //@ts-ignore
  hydradx.ws = "ws://172.25.126.217:8001"
  const polkadot = chainsMap.get("polkadot") as Parachain
  //@ts-ignore
  polkadot.ws = "ws://172.25.126.217:8002"
}

export const getAssetHubAssets = async (api: ApiPromise) => {
  try {
    const [dataRaw, assetsRaw] = await Promise.all([
      api.query.assets.metadata.entries(),
      api.query.assets.asset.entries(),
    ])

    const data: TExternalAsset[] = dataRaw.map(([key, dataRaw]) => {
      const id = key.args[0].toString()
      const data = dataRaw

      const asset = assetsRaw.find((asset) => asset[0].args.toString() === id)

      const supply = asset?.[1].unwrap().supply.toString()
      const admin = asset?.[1].unwrap().admin.toString()
      const owner = asset?.[1].unwrap().owner.toString()
      const isWhiteListed =
        admin === ASSETHUB_TREASURY_ADDRESS &&
        owner === ASSETHUB_TREASURY_ADDRESS

      return {
        id,
        decimals: data.decimals.toNumber(),
        symbol: data.symbol.toHuman() as string,
        name: data.name.toHuman() as string,
        supply,
        origin: assethub.parachainId,
        isWhiteListed,
      }
    })
    return { data, id: assethub.parachainId }
  } catch (e) {}
}

export const getAssetHubAssetsIds = async (api: ApiPromise) => {
  try {
    const dataRaw = await api.query.assets.asset.entries()
    return dataRaw
      .map(([meta]) => Number(meta.args[0].toString()))
      .sort((a, b) => a - b)
  } catch (e) {
    return []
  }
}

/**
 * Used for fetching tokens only from Asset Hub parachain
 */
export const useAssetHubAssetRegistry = (enabled = true) => {
  const { data: api } = useExternalApi("assethub")

  return useQuery(
    QUERY_KEYS.assetHubAssetRegistry,
    async () => {
      if (!api) throw new Error("Asset Hub is not connected")
      const assetHub = await getAssetHubAssets(api)

      if (assetHub) {
        return assetHub.data
      }
    },
    {
      enabled: enabled && !!api,
      retry: false,
      refetchOnWindowFocus: false,
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours,
      staleTime: 1000 * 60 * 60 * 1, // 1 hour
      select: (data) => arrayToMap("id", data),
    },
  )
}

export const getAssetHubNativeBalance =
  (api: ApiPromise, account: AccountId32 | string) => async () => {
    try {
      const res = await api.query.system.account(account)
      const freeBalance = new BigNumber(res.data.free.toHex())
      const frozenBalance = new BigNumber(res.data.frozen.toHex())
      const reservedBalance = new BigNumber(res.data.reserved.toHex())
      const balance = freeBalance.minus(frozenBalance)
      const total = freeBalance.plus(reservedBalance)

      return {
        accountId: account,
        balance,
        total,
        freeBalance,
      }
    } catch (e) {}
  }

export const useAssetHubNativeBalance = (
  account: Maybe<AccountId32 | string>,
) => {
  const { data: api } = useExternalApi("assethub")
  const enabled = !!account && !!api
  return useQuery(
    QUERY_KEYS.assetHubNativeBalance(account),
    enabled ? getAssetHubNativeBalance(api, account) : undefinedNoop,
    {
      enabled,
    },
  )
}

export const getAssetHubTokenBalance =
  (api: ApiPromise, id: string | u32, account: AccountId32 | string) =>
  async () => {
    try {
      const codec = await api.query.assets.account(id, account)
      // @ts-ignore
      const balance = !codec.isNone
        ? // @ts-ignore
          codec.unwrap().balance.toBigNumber()
        : BN_0

      return {
        accountId: account,
        assetId: id,
        balance,
      }
    } catch (e) {}
  }

export const useAssetHubTokenBalances = (
  ids: string[],
  account: AccountId32 | string,
) => {
  const { data: api } = useExternalApi("assethub")
  const enabled = !!account && !!api
  return useQueries({
    queries: ids.map((id) => ({
      queryKey: QUERY_KEYS.assetHubTokenBalance(
        id.toString(),
        account.toString(),
      ),
      queryFn: enabled
        ? getAssetHubTokenBalance(api, id, account)
        : undefinedNoop,
      enabled: enabled && !!id,
      retry: false,
      refetchOnWindowFocus: false,
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours,
      staleTime: 1000 * 60 * 60 * 1, // 1 hour
    })),
  })
}

export const useAssetHubTokenBalance = (
  id: string,
  account: AccountId32 | string,
) => {
  const { data: api } = useExternalApi("assethub")
  const enabled = !!account && !!api && !!id
  return useQuery(
    QUERY_KEYS.assetHubTokenBalance(account.toString(), id.toString()),
    enabled ? getAssetHubTokenBalance(api, id, account) : undefinedNoop,
    { enabled },
  )
}

export const useGetNextAssetHubId = () => {
  const { data: api } = useExternalApi("assethub")
  const mutation = useMutation(async () => {
    if (!api) throw new Error("Asset Hub is not connected")
    const ids = await getAssetHubAssetsIds(api)

    let smallestId = 1

    for (let i = 0; i < ids.length; i++) {
      if (ids[i] === smallestId) {
        smallestId++
      } else if (Number(ids[i]) > smallestId) {
        break
      }
    }

    return smallestId
  })

  return {
    getNextAssetHubId: mutation.mutateAsync,
  }
}

export type CreateTokenValues = {
  id: string
  name: string
  symbol: string
  deposit: string
  supply: string
  decimals: number
  account: string
  dotAmount?: string
}

type SwapNativeOptions = {
  asset: ParachainAssetsData
  address: string
  nativeAmount: string
  assetAmount: string
}

export function assetHubSwapNativeForAssetExactOut(
  api: ApiPromise,
  options: SwapNativeOptions,
) {
  return api.tx.assetConversion.swapTokensForExactTokens(
    [
      api
        .createType("MultiLocation", {
          parents: 1,
          interior: {
            here: null,
          },
        })
        .toU8a(),
      api
        .createType("MultiLocation", {
          parents: 0,
          interior: {
            x2: [
              { palletInstance: options.asset.palletInstance },
              { generalIndex: options.asset.id },
            ],
          },
        })
        .toU8a(),
    ],
    options.assetAmount,
    options.nativeAmount,
    options.address,
    true,
  )
}

type XCMOutTransferOptions = {
  asset: ParachainAssetsData
  address: string
  amount: string
  dstChain: string
}

export async function getAssetHubXcmOutTransfer(
  api: ApiPromise,
  options: XCMOutTransferOptions,
) {
  const xTransfer = await wallet.transfer(
    options.asset.asset.key,
    options.address,
    "assethub",
    options.address,
    options.dstChain,
  )

  const call = await xTransfer.buildCall(options.amount)
  return api.tx(call.data)
}

export function getCreateAssetCalls(
  api: ApiPromise,
  values: CreateTokenValues,
) {
  const supply = BigNumber(values.supply).shiftedBy(values.decimals).toString()

  const deposit = BigNumber(values.deposit)
    .shiftedBy(values.decimals)
    .toString()

  return [
    api.tx.assets.create(values.id, values.account, deposit),
    api.tx.assets.setMetadata(
      values.id,
      values.name,
      values.symbol,
      values.decimals,
    ),
    api.tx.assets.mint(values.id, values.account, supply),
  ]
}

export const useCreateAssetHubToken = ({
  onSuccess,
  steps,
}: {
  onSuccess?: () => ISubmittableResult
  steps?: Transaction["steps"]
} = {}) => {
  const { t } = useTranslation()
  const { createTransaction } = useStore()
  const { account } = useAccount()
  const { data: api } = useExternalApi("assethub")
  const { data: nativeBalance } = useAssetHubNativeBalance(account?.address)

  // DOT to USDT spot price
  const { data: spotPrice } = useSpotPrice("10", "5")

  return useMutation(async (values: CreateTokenValues) => {
    if (!account) throw new Error("Missing account")
    if (!api) throw new Error("Asset Hub is not connected")

    const usdt = assethub.assetsData.get("usdt")
    if (!usdt) throw new Error("USDT asset not found")

    const usdtDotExchangeRate = spotPrice?.spotPrice ?? BN_1
    const usdtAmount = BN(0.5)
    const slippage = BN(1.05) // 5%
    const nativeAmount = usdtAmount.times(usdtDotExchangeRate).times(slippage)

    // Swap DOT for USDT on AH
    const swapCall = assetHubSwapNativeForAssetExactOut(api, {
      asset: usdt,
      address: account.address,
      assetAmount: BN(usdtAmount)
        .shiftedBy(usdt?.decimals ?? 0)
        .toString(),
      nativeAmount: BN(nativeAmount)
        .shiftedBy(assethubNativeToken.decimals ?? 0)
        .decimalPlaces(0)
        .toString(),
    })

    // Transfer half of the USDT to Hydration
    const usdtTransferCall = await getAssetHubXcmOutTransfer(api, {
      asset: usdt,
      address: account.address,
      amount: usdtAmount.div(2).toString(),
      dstChain: "hydradx",
    })

    // Transfer DOT from AH to Polkadot
    const dotTransferCall = values.dotAmount
      ? await getAssetHubXcmOutTransfer(api, {
          asset: assethubNativeToken,
          address: account.address,
          amount: values.dotAmount,
          dstChain: "polkadot",
        })
      : null

    const tx = api.tx.utility.batchAll([
      swapCall,
      usdtTransferCall,
      ...(dotTransferCall ? [dotTransferCall] : []),
      ...getCreateAssetCalls(api, values),
    ])

    const { fee, feeBalance, feeSymbol } = await calculateNativeFee(tx, {
      balance: nativeBalance?.balance ?? BN_NAN,
      address: account.address,
    })

    return await createTransaction(
      {
        title: t("wallet.addToken.reviewTransaction.modal.create.title"),
        tx,
        xcallMeta: {
          srcChain: assethub.key,
          srcChainFee: fee,
          srcChainFeeBalance: feeBalance,
          srcChainFeeSymbol: feeSymbol,
        },
      },
      {
        steps,
        toast: createToastMessages("wallet.addToken.toast.create", {
          t,
          tOptions: { name: values.name, chainName: assethub.name },
          components: ["span.highlight"],
        }),
        onSuccess,
      },
    )
  })
}

export const useAssetHubExistentialDeposit = (id: string) => {
  const { data: api } = useExternalApi("assethub")
  return useQuery(QUERY_KEYS.assetHubExistentialDeposit(id), async () => {
    if (!api) throw new Error("Asset Hub is not connected")
    const response = await api.query.assets.asset(id)
    const details = response.unwrap()
    return BN(details.minBalance.toString())
  })
}

export const useAssetHubRevokeAdminRights = ({
  onSuccess,
}: { onSuccess?: () => void } = {}) => {
  const { t } = useTranslation()
  const { data: api } = useExternalApi("assethub")
  const { account } = useAccount()
  const { data: nativeBalance } = useAssetHubNativeBalance(account?.address)
  const { createTransaction } = useStore()

  return useMutation(async (id: string) => {
    if (!account) throw new Error("Missing account")
    if (!api) throw new Error("Asset Hub is not connected")
    if (!id) throw new Error("Missing asset id")

    const tx = api.tx.utility.batchAll([
      api.tx.assets.setTeam(
        id,
        ASSETHUB_TREASURY_ADDRESS,
        ASSETHUB_TREASURY_ADDRESS,
        ASSETHUB_TREASURY_ADDRESS,
      ),
      api.tx.assets.transferOwnership(id, ASSETHUB_TREASURY_ADDRESS),
    ])

    const { fee, feeBalance, feeSymbol } = await calculateNativeFee(tx, {
      balance: nativeBalance?.balance ?? BN_NAN,
      address: account.address,
    })

    return createTransaction(
      {
        tx,
        xcallMeta: {
          srcChain: assethub.key,
          srcChainFee: fee,
          srcChainFeeBalance: feeBalance,
          srcChainFeeSymbol: feeSymbol,
        },
      },
      {
        toast: createToastMessages("memepad.summary.adminRights.toast", {
          t,
        }),
        onSuccess,
      },
    )
  })
}

async function calculateNativeFee(
  tx: SubmittableExtrinsic<"promise">,
  { balance, address }: { balance: BigNumber; address: string },
) {
  const paymentInfo = await tx.paymentInfo(address)
  const feeAssetDecimals = assethubNativeToken.decimals || 10
  const feeBalance = balance?.shiftedBy(feeAssetDecimals) ?? BN_NAN
  const fee = new BigNumber(paymentInfo.partialFee.toString()).shiftedBy(
    -feeAssetDecimals,
  )

  return {
    fee: fee.toString(),
    feeBalance: feeBalance.toString(),
    feeSymbol: assethubNativeToken.asset.originSymbol,
  }
}
