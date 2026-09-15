import { parseAbi } from "viem"

export const FACTORY_ABI = parseAbi([
  "function getHypervisor(address,address,uint24) view returns (address)",
])

export const UNIPROXY_ABI = parseAbi([
  "function deposit(uint256 deposit0, uint256 deposit1, address to, address pos, uint256[4] minIn) returns (uint256)",
  "function getDepositAmount(address pos, address token, uint256 _deposit) view returns (uint256 amountStart, uint256 amountEnd)",
])

export const UNIPROXY_CLEARANCE_ABI = parseAbi([
  "function clearance() view returns (address)",
])

export const CLEARING_ABI = parseAbi([
  "function twapCheck() view returns (bool)",
  "function twapInterval() view returns (uint32)",
  "function priceThreshold() view returns (uint256)",
  "function positions(address) view returns (bool customRatio, bool customTwap, bool ratioRemoved, bool depositOverride, bool twapOverride, uint8 version, uint32 twapInterval, uint256 priceThreshold, uint256 deposit0Max, uint256 deposit1Max, uint256 maxTotalSupply, uint256 fauxTotal0, uint256 fauxTotal1, uint256 customDepositDelta)",
  "function checkPriceChange(address pos, uint32 _twapInterval, uint256 _priceThreshold) view returns (uint256 price)",
])

export const REBALANCE_PROXY_ABI = parseAbi([
  "function lastRebalance(address) view returns (uint256)",
])

export const HYPERVISOR_ABI = parseAbi([
  "function balanceOf(address) view returns (uint256)",
  "function getBasePosition() view returns (uint128 liquidity, uint256 amount0, uint256 amount1)",
  "function getLimitPosition() view returns (uint128 liquidity, uint256 amount0, uint256 amount1)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function getTotalAmounts() view returns (uint256,uint256)",
  "function baseLower() view returns (int24)",
  "function baseUpper() view returns (int24)",
  "function limitLower() view returns (int24)",
  "function limitUpper() view returns (int24)",
  "function whitelistedAddress() view returns (address)",
  "function maxTotalSupply() view returns (uint256)",
  "function deposit0Max() view returns (uint256)",
  "function deposit1Max() view returns (uint256)",
  "function owner() view returns (address)",
  "function pool() view returns (address)",
])

export const POOL_ABI = parseAbi([
  "function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
  "function liquidity() view returns (uint128)",
  "function fee() view returns (uint24)",
  "function tickSpacing() view returns (int24)",
  "function token0() view returns (address)",
  "function token1() view returns (address)",
])
