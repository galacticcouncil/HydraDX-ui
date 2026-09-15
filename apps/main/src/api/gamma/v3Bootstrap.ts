import { SdkCtx } from "@galacticcouncil/sdk-next"
import { uniswapv3 } from "@galacticcouncil/sdk-next/pool"
import { ChainEcosystem } from "@galacticcouncil/xc-core"
import { PublicClient, zeroAddress } from "viem"

import { AssetType, TAssetData, TToken } from "@/api/assets"
import { HYPERVISOR_ABI, POOL_ABI } from "@/api/gamma/abi"
import { GammaContracts } from "@/api/gamma/config"
import { PoolToken, PoolType, V3PoolBase } from "@/api/pools"
import { useAssetRegistryStore } from "@/states/assetRegistry"

const toPoolToken = (asset: TAssetData, balance: bigint): PoolToken => ({
  id: Number(asset.id),
  decimals: asset.decimals,
  existentialDeposit: BigInt(asset.existentialDeposit),
  balance,
  type: asset.type as PoolToken["type"],
})

const resolveAsset = async (
  id: number,
  sdk: SdkCtx,
): Promise<TAssetData | null> => {
  const stored = useAssetRegistryStore
    .getState()
    .assets.find((asset) => asset.id === id.toString())

  if (stored) return stored

  const assets = await sdk.client.asset.getSupported(true)
  const asset = assets.find((entry) => entry.id === id)
  if (!asset) return null

  const fallback: TToken = {
    id: id.toString(),
    existentialDeposit: asset.existentialDeposit.toString(),
    symbol: asset.symbol ?? "",
    decimals: asset.decimals ?? 0,
    name: asset.name ?? "",
    isTradable: false,
    isSufficient: asset.isSufficient,
    type: AssetType.TOKEN,
    ecosystem: ChainEcosystem.Polkadot,
  }

  return fallback
}

// EVM fallback when UniswapV3Factory is unset; pool address from bootstrap hypervisor.
export const loadBootstrapV3Pools = async (
  evm: PublicClient,
  sdk: SdkCtx,
  contracts: GammaContracts,
): Promise<V3PoolBase[]> => {
  const poolAddress = await evm.readContract({
    abi: HYPERVISOR_ABI,
    address: contracts.hypervisor,
    functionName: "pool",
  })

  if (poolAddress.toLowerCase() === zeroAddress) return []

  const [slot0, liquidity, fee, tickSpacing, addr0, addr1] = await Promise.all([
    evm.readContract({
      abi: POOL_ABI,
      address: poolAddress,
      functionName: "slot0",
    }),
    evm.readContract({
      abi: POOL_ABI,
      address: poolAddress,
      functionName: "liquidity",
    }),
    evm.readContract({
      abi: POOL_ABI,
      address: poolAddress,
      functionName: "fee",
    }),
    evm.readContract({
      abi: POOL_ABI,
      address: poolAddress,
      functionName: "tickSpacing",
    }),
    evm.readContract({
      abi: POOL_ABI,
      address: poolAddress,
      functionName: "token0",
    }),
    evm.readContract({
      abi: POOL_ABI,
      address: poolAddress,
      functionName: "token1",
    }),
  ])

  const cfg = uniswapv3.V3_POOLS.find((entry) => entry.fee === Number(fee))
  if (!cfg) return []

  const [meta0, meta1] = await Promise.all([
    resolveAsset(cfg.assetA, sdk),
    resolveAsset(cfg.assetB, sdk),
  ])
  if (!meta0 || !meta1) return []

  const token0 = toPoolToken(meta0, 0n)
  const token1 = toPoolToken(meta1, 0n)

  return [
    {
      address: poolAddress,
      type: PoolType.V3 as V3PoolBase["type"],
      token0: cfg.assetA,
      token1: cfg.assetB,
      addr0,
      addr1,
      fee: Number(fee),
      sqrtPriceX96: slot0[0],
      tick: Number(slot0[1]),
      liquidity,
      tickSpacing: Number(tickSpacing),
      tokens: [token0, token1],
      maxInRatio: 0n,
      maxOutRatio: 0n,
      minTradingLimit: 0n,
    },
  ]
}
