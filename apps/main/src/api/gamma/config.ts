export type GammaContracts = {
  readonly hypervisor: `0x${string}`
  readonly hypervisorFactory: `0x${string}`
  readonly clearing: `0x${string}`
  readonly uniProxy: `0x${string}`
  readonly admin: `0x${string}`
  readonly rebalanceProxy: `0x${string}`
}

/** Mainnet addresses of record: mainnet/DEPLOYMENTS.md in galacticcouncil/uniswap-v3-deploy. */
export const MAINNET_GAMMA_CONTRACTS = {
  hypervisor: "0xa206D0959813f17c17C87147271C49065438648A",
  hypervisorFactory: "0x1d652D8333F412c5e86360D3adc43E3F3C93E603",
  clearing: "0x3541A3E5Db2d611904BE4F45A3CAFEA9A4df3e48",
  uniProxy: "0x20aA5d9ffF339c3f1ACaee792aa05c53cEb3F741",
  admin: "0x8fc8a0d7cb9c6B2366Ec08f1Bf03067D54b67bc5",
  rebalanceProxy: "0x8B7Dd119b7edb85D9cF166129DBec5D88DC78C94",
} as const satisfies GammaContracts

// TODO: remove once lark4 gamma is in chain state / DEPLOYMENTS.md
/** Redeployed on lark4 after the 2026-08-26 fork reset. */
export const LARK4_GAMMA_CONTRACTS = {
  hypervisor: "0xFa45C2f07Cf62C543F2247E9e5B5a6acBEc762ae",
  hypervisorFactory: "0x9E545E3C0baAB3E08CdfD552C960A1050f373042",
  clearing: "0x1613beB3B2C4f22Ee086B2b38C1476A3cE7f78E8",
  uniProxy: "0x851356ae760d987E095750cCeb3bC6014560891C",
  admin: "0x70e0bA845a1A0F2DA3359C97E0285013525FFC49",
  rebalanceProxy: "0x4826533B4897376654Bb4d4AD88B7faFD0C98528",
} as const satisfies GammaContracts

const LARK4_HOSTS = ["4.lark.hydration.cloud", "node4.lark.hydration.cloud"]

export const getGammaContracts = (rpcUrl: string): GammaContracts => {
  try {
    const host = new URL(rpcUrl).host
    if (LARK4_HOSTS.includes(host)) return LARK4_GAMMA_CONTRACTS
  } catch {
    // fall through to mainnet
  }

  return MAINNET_GAMMA_CONTRACTS
}
