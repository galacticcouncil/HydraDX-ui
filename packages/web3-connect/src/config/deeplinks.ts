import { createQueryString, HYDRATION_CHAIN_KEY } from "@galacticcouncil/utils"

import { WalletProviderType } from "@/config/providers"

const TARGET_HOSTNAME = window.location.hostname
const TARGET_URL = `${window.location.protocol}//${TARGET_HOSTNAME}`

const ENCODED_TARGET_URL = encodeURIComponent(TARGET_URL)
const ENCODED_SOLANA_TARGET_URL = encodeXcmTargetUrl("solana", "sol")
const ENCODED_SUI_TARGET_URL = encodeXcmTargetUrl("sui", "sui")

type DeepLinkConfig = { android?: string; universal: string }

const OKX_ANDROID_DEEPLINK = (encodedUrl: string) =>
  `okx://wallet/dapp/url?dappUrl=${encodedUrl}`

const OKX_UNIVERSAL_DEEPLINK = (encodedUrl: string) =>
  `https://web3.okx.com/download?deeplink=${encodeURIComponent(
    OKX_ANDROID_DEEPLINK(encodedUrl),
  )}`

export const WALLET_DEEPLINKS: Partial<
  Record<WalletProviderType, DeepLinkConfig>
> = {
  [WalletProviderType.MetaMask]: {
    universal: `https://link.metamask.io/dapp/${TARGET_HOSTNAME}`,
  },
  [WalletProviderType.NovaWallet]: {
    universal: `https://app.novawallet.io/open/dapp?url=${ENCODED_TARGET_URL}`,
  },
  [WalletProviderType.Phantom]: {
    android: `phantom://browse/${ENCODED_SOLANA_TARGET_URL}?ref=${ENCODED_TARGET_URL}`,
    universal: `https://phantom.app/ul/browse/${ENCODED_SOLANA_TARGET_URL}?ref=${ENCODED_TARGET_URL}`,
  },
  [WalletProviderType.PhantomSui]: {
    android: `phantom://browse/${ENCODED_SUI_TARGET_URL}?ref=${ENCODED_TARGET_URL}`,
    universal: `https://phantom.app/ul/browse/${ENCODED_SUI_TARGET_URL}?ref=${ENCODED_TARGET_URL}`,
  },
  [WalletProviderType.Solflare]: {
    android: `solflare://v1/browse/${ENCODED_SOLANA_TARGET_URL}?ref=${ENCODED_TARGET_URL}`,
    universal: `https://solflare.com/ul/v1/browse/${ENCODED_SOLANA_TARGET_URL}?ref=${ENCODED_TARGET_URL}`,
  },
  [WalletProviderType.TrustWallet]: {
    android: `trust://open_url?coin_id=60&url=${ENCODED_TARGET_URL}`,
    universal: `https://link.trustwallet.com/open_url?coin_id=60&url=${ENCODED_TARGET_URL}`,
  },
  [WalletProviderType.TrustWalletSol]: {
    android: `trust://open_url?coin_id=501&url=${ENCODED_SOLANA_TARGET_URL}`,
    universal: `https://link.trustwallet.com/open_url?coin_id=501&url=${ENCODED_SOLANA_TARGET_URL}`,
  },
  [WalletProviderType.BackpackSol]: {
    universal: `https://backpack.app/ul/v1/browse/${ENCODED_SOLANA_TARGET_URL}?ref=${ENCODED_TARGET_URL}`,
  },
  [WalletProviderType.NightlySol]: {
    android: `nightly://v1?network=solana&cluster=mainnet&url=${ENCODED_SOLANA_TARGET_URL}`,
    universal: `https://nightly.app/v1?network=solana&cluster=mainnet&url=${ENCODED_SOLANA_TARGET_URL}`,
  },
  [WalletProviderType.NightlySui]: {
    android: `nightly://v1?network=sui&cluster=mainnet&url=${ENCODED_SUI_TARGET_URL}`,
    universal: `https://nightly.app/v1?network=sui&cluster=mainnet&url=${ENCODED_SUI_TARGET_URL}`,
  },
  // OKX nests its own `okx://` deeplink inside the `?deeplink=` param, per
  // their docs — the one entry here where the nesting cannot be type-checked.
  // Their doc page is bot-gated and could not be fetched live, so a device
  // open is the only evidence these three work.
  [WalletProviderType.OKXWallet]: {
    android: OKX_ANDROID_DEEPLINK(ENCODED_TARGET_URL),
    universal: OKX_UNIVERSAL_DEEPLINK(ENCODED_TARGET_URL),
  },
  [WalletProviderType.OKXWalletSol]: {
    android: OKX_ANDROID_DEEPLINK(ENCODED_SOLANA_TARGET_URL),
    universal: OKX_UNIVERSAL_DEEPLINK(ENCODED_SOLANA_TARGET_URL),
  },
  [WalletProviderType.OKXWalletSui]: {
    android: OKX_ANDROID_DEEPLINK(ENCODED_SUI_TARGET_URL),
    universal: OKX_UNIVERSAL_DEEPLINK(ENCODED_SUI_TARGET_URL),
  },
}

function encodeXcmTargetUrl(srcChain: string, asset: string) {
  return encodeURIComponent(
    `${TARGET_URL}/cross-chain${createQueryString({
      srcChain,
      srcAsset: asset,
      destChain: HYDRATION_CHAIN_KEY,
      destAsset: asset,
    })}`,
  )
}
