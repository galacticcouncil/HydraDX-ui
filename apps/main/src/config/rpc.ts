export type TDataEnv = "testnet" | "mainnet"
export type ProviderProps = {
  name: string
  url: string
  env: string[]
  dataEnv: TDataEnv
}

export const createProvider = (
  name: string,
  url: string,
  env = ["production"],
  dataEnv: TDataEnv = "mainnet",
): ProviderProps => ({
  name,
  url,
  env,
  dataEnv,
})

export const PROVIDERS: ProviderProps[] = [
  createProvider("node4.lark (PROP)", "wss://node4.lark.hydration.cloud"),
  // createProvider("Dwellir", "wss://hydration-rpc.n.dwellir.com"),
  // createProvider("Dotters", "wss://hydration.dotters.network"),
  // createProvider("LATAM", "wss://hydration.rpc.stkd.io"),
  // createProvider("Rotko (SEA)", "wss://hydration.rotko.net"),
  // createProvider("zipp", "wss://rpc.zipp.hydration.cloud"),
  // createProvider("roach", "wss://rpc.roach.hydration.cloud"),
  // createProvider("lait", "wss://rpc.lait.hydration.cloud"),
  // createProvider("parm", "wss://rpc.parm.hydration.cloud"),
  // createProvider("sin", "wss://subway.sin.hydration.cloud"),
  // createProvider("coke", "wss://subway.coke.hydration.cloud"),
  // createProvider("kril", "wss://rpc.kril.hydration.cloud"),
  // createProvider("shellfish", "wss://subway.shellfish.hydration.cloud"),
  // createProvider("catfish-1", "wss://rpc-catfish-1.catfish.hydration.cloud"),
  // createProvider("catfish-2", "wss://rpc-catfish-2.catfish.hydration.cloud"),
  // createProvider("catfish-3", "wss://rpc-catfish-3.catfish.hydration.cloud"),
  // createProvider("catfish-4", "wss://rpc-catfish-4.catfish.hydration.cloud"),
  createProvider(
    "Testnet",
    "wss://rpc.nice.hydration.cloud",
    ["development"],
    "testnet",
  ),
  createProvider(
    "Paseo",
    "wss://paseo-rpc.play.hydration.cloud",
    ["rococo", "development"],
    "testnet",
  ),
]
