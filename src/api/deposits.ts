import { ApiPromise } from "@polkadot/api"
import { u128, Option, StorageKey, Null } from "@polkadot/types"
import { AccountId32 } from "@polkadot/types/interfaces"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "utils/queryKeys"
import { useRpcProvider } from "providers/rpcProvider"
import {
  PalletLiquidityMiningDepositData,
  PalletOmnipoolPosition,
} from "@polkadot/types/lookup"
import { undefinedNoop } from "utils/helpers"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import BN from "bignumber.js"
import { BN_0 } from "utils/constants"

export type TDeposit = {
  id: string
  data: PalletLiquidityMiningDepositData
  isXyk: boolean
}

export type TOmnipoolPosition = {
  id: string
  assetId: string
  amount: BN
  shares: BN
  price: string[]
}

export const useRefetchAccountPositions = () => {
  const queryClient = useQueryClient()
  const { account } = useAccount()

  return () => {
    queryClient.refetchQueries(QUERY_KEYS.accountPositions(account?.address))
  }
}

const parseNfts = (
  nfts: [StorageKey<[AccountId32, u128, u128]>, Option<Null>][],
) =>
  nfts.map(([storageKey]) => {
    const [owner, classId, instanceId] = storageKey.args

    return {
      owner: owner.toString(),
      classId: classId.toString(),
      instanceId: instanceId.toString(),
    }
  })

const parceLiquidityPositions = <T>(
  positions: Option<PalletOmnipoolPosition>[],
  ids: string[],
  metadata?: T[],
) =>
  positions.reduce<
    Array<
      {
        id: string
        assetId: string
        amount: BN
        shares: BN
        price: string[]
      } & T
    >
  >((acc, pos, i) => {
    if (!pos.isNone) {
      const data = pos.unwrap()

      acc.push({
        id: ids[i],
        amount: data.amount.toBigNumber(),
        shares: data.shares.toBigNumber(),
        price: data.price.map((e) => e.toString()),
        assetId: data.assetId.toString(),
        ...(metadata ? metadata[i] : ({} as T)),
      })
    }

    return acc
  }, [])

const parseDepositData = (
  api: ApiPromise,
  nfts: {
    owner: string
    classId: string
    instanceId: string
  }[],
  values: Option<PalletLiquidityMiningDepositData>[],
  isXyk: boolean,
) => {
  return nfts
    .reduce<
      {
        id: string
        data: PalletLiquidityMiningDepositData
        isXyk: boolean
      }[]
    >((acc, nft, index) => {
      const data = values[index]

      if (!data.isNone) {
        acc.push({
          id: nft.instanceId,
          data: api.registry.createType(
            isXyk ? "XykLMDeposit" : "OmnipoolLMDeposit",
            data.unwrap(),
          ),
          isXyk,
        })
      }

      return acc
    }, [])
    .sort((a, b) => {
      const firstFarmLastBlock = a.data.yieldFarmEntries.reduce(
        (acc, curr) =>
          acc.lt(curr.enteredAt.toBigNumber())
            ? curr.enteredAt.toBigNumber()
            : acc,
        BN_0,
      )

      const secondFarmLastBlock = b.data.yieldFarmEntries.reduce(
        (acc, curr) =>
          acc.lt(curr.enteredAt.toBigNumber())
            ? curr.enteredAt.toBigNumber()
            : acc,
        BN_0,
      )

      return secondFarmLastBlock.minus(firstFarmLastBlock).toNumber()
    })
}

export const useAccountPositions = (givenAddress?: string) => {
  const { account } = useAccount()
  const { api, isLoaded } = useRpcProvider()

  const address = givenAddress ?? account?.address

  return useQuery(
    QUERY_KEYS.accountPositions(address),
    address != null
      ? async () => {
          const [omnipoolNftId, miningNftId, xykMiningNftId] =
            await Promise.all([
              api.consts.omnipool.nftCollectionId,
              api.consts.omnipoolLiquidityMining.nftCollectionId,
              api.consts.xykLiquidityMining.nftCollectionId,
            ])
          const [omnipoolNftsRaw, miningNftsRaw, xykMiningNftsRaw] =
            await Promise.all([
              api.query.uniques.account.entries(address, omnipoolNftId),
              api.query.uniques.account.entries(address, miningNftId),
              api.query.uniques.account.entries(address, xykMiningNftId),
            ])

          const omnipoolNfts = parseNfts(omnipoolNftsRaw)
          const miningNfts = parseNfts(miningNftsRaw)
          const xykMiningNfts = parseNfts(xykMiningNftsRaw)

          const liquidityPositionIds = omnipoolNfts.map((nft) => nft.instanceId)
          const omnipoolKeys = miningNfts.map((nft) =>
            api.query.omnipoolWarehouseLM.deposit.key(nft.instanceId),
          )
          const xykKeys = xykMiningNfts.map((nft) =>
            api.query.xykWarehouseLM.deposit.key(nft.instanceId),
          )

          const [
            liquidityPos,
            omniPositionIdsRaw,
            omnipoolData = [],
            xykData = [],
          ] = await Promise.all([
            api.query.omnipool.positions.multi(liquidityPositionIds),
            api.query.omnipoolLiquidityMining.omniPositionId.multi(
              miningNfts.map((nft) => nft.instanceId),
            ),
            omnipoolKeys.length
              ? (api.rpc.state.queryStorageAt(omnipoolKeys) as Promise<
                  Option<PalletLiquidityMiningDepositData>[]
                >)
              : [],
            xykKeys.length
              ? (api.rpc.state.queryStorageAt(xykKeys) as Promise<
                  Option<PalletLiquidityMiningDepositData>[]
                >)
              : undefined,
          ])

          const omniPositionIds = omniPositionIdsRaw.map((id) => id.toString())

          const depositLiquidityPositions = parceLiquidityPositions(
            await api.query.omnipool.positions.multi(omniPositionIds),
            omniPositionIds,
            miningNfts.map((nft) => ({ depositId: nft.instanceId })),
          )

          const liquidityPositions = parceLiquidityPositions(
            liquidityPos,
            liquidityPositionIds,
          )

          const omnipoolDeposits = parseDepositData(
            api,
            miningNfts,
            omnipoolData,
            false,
          )

          const xykDeposits = parseDepositData(
            api,
            xykMiningNfts,
            xykData,
            true,
          )

          return {
            omnipoolNfts,
            miningNfts,
            xykMiningNfts,
            liquidityPositions,
            depositLiquidityPositions,
            omnipoolDeposits,
            xykDeposits,
          }
        }
      : undefinedNoop,
    { enabled: !!address && isLoaded },
  )
}
