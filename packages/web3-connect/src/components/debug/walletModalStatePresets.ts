import { WalletProviderType } from "@/config/providers"
import {
  StoredAccount,
  useWeb3Connect,
  WalletMode,
  WalletProviderStatus,
} from "@/hooks/useWeb3Connect"
import { WalletSourceId } from "@/utils/walletSource"
import { getWallets } from "@/wallets"

export type WalletModalStatePreset = {
  id: string
  label: string
  description: string
  disabled?: boolean
  disabledReason?: string
  apply: () => void
}

const MOCK_SUBSTRATE_ACCOUNT: StoredAccount = {
  name: "Hydration Account",
  publicKey: "mock-substrate-pk",
  address: "7LC9ix79TzUUCiDG3k2D3q3F4H7v3B42n",
  rawAddress: "7LC9ix79TzUUCiDG3k2D3q3F4H7v3B42n",
  provider: WalletProviderType.Talisman,
  balance: 1523.45,
}

const MOCK_EVM_ACCOUNT: StoredAccount = {
  name: "EVM Account",
  publicKey: "mock-evm-pk",
  address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
  rawAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
  provider: WalletProviderType.MetaMask,
  balance: 0.842,
}

/** `initialProvider` is typed as a provider enum but accepts any source id. */
const initialSource = (source: WalletSourceId) =>
  source as unknown as WalletProviderType

const findNotInstalledProvider = () =>
  getWallets().find(
    (wallet) =>
      !wallet.installed &&
      wallet.provider !== WalletProviderType.ExternalWallet &&
      wallet.provider !== WalletProviderType.Multisig,
  )?.provider ?? null

const findInstalledProvider = () =>
  getWallets().find((wallet) => wallet.installed)?.provider ?? null

const applyPreset = (
  patch: Partial<
    Pick<
      ReturnType<typeof useWeb3Connect.getState>,
      | "providers"
      | "accounts"
      | "account"
      | "error"
      | "meta"
      | "recentProvider"
      | "recentlyUsedProviders"
    >
  >,
) => {
  useWeb3Connect.setState((current) => ({
    ...current,
    open: true,
    mode: WalletMode.Default,
    error: "",
    meta: null,
    providers: [],
    accounts: [],
    account: null,
    recentProvider: null,
    ...patch,
  }))
}

export const closeWalletModal = () => {
  useWeb3Connect.setState({ open: false, error: "", meta: null })
}

export const resetWalletModalState = () => {
  useWeb3Connect.setState({
    open: false,
    providers: [],
    accounts: [],
    account: null,
    error: "",
    meta: null,
    recentProvider: null,
    recentlyUsedProviders: [],
  })
}

export const getWalletModalStatePresets = (): WalletModalStatePreset[] => {
  const notInstalledProvider = findNotInstalledProvider()
  const installedProvider = findInstalledProvider()

  return [
    {
      id: "first-connection",
      label: "First connection",
      description:
        "No wallet connected yet. Single-column layout with the full wallet list.",
      apply: () => applyPreset({}),
    },
    {
      id: "error",
      label: "Connection error",
      description:
        "Failed connection with retry. Right panel shows the error state.",
      apply: () =>
        applyPreset({
          error: "Connection rejected: User denied account access.",
          recentProvider: WalletProviderType.MetaMask,
          providers: [
            {
              type: WalletProviderType.Talisman,
              status: WalletProviderStatus.Connected,
            },
          ],
          accounts: [MOCK_SUBSTRATE_ACCOUNT],
          account: MOCK_SUBSTRATE_ACCOUNT,
          recentlyUsedProviders: [WalletProviderType.MetaMask],
        }),
    },
    {
      id: "not-installed",
      label: "Wallet not installed",
      description: notInstalledProvider
        ? `Right panel prompts to install ${notInstalledProvider}.`
        : "Requires at least one wallet that is not installed in this browser.",
      disabled: !notInstalledProvider,
      disabledReason: "Every configured wallet reports installed here.",
      apply: () => {
        if (!notInstalledProvider) return

        applyPreset({
          meta: { initialProvider: notInstalledProvider },
        })
      },
    },
    {
      id: "connecting-uninstalled",
      label: "Connecting (not installed)",
      description: notInstalledProvider
        ? "Pending state on a wallet that is not installed."
        : "Requires a wallet that is not installed in this browser.",
      disabled: !notInstalledProvider,
      disabledReason: "Every configured wallet reports installed here.",
      apply: () => {
        if (!notInstalledProvider) return

        applyPreset({
          meta: { initialProvider: notInstalledProvider },
          providers: [
            {
              type: notInstalledProvider,
              status: WalletProviderStatus.Pending,
            },
          ],
          recentProvider: notInstalledProvider,
        })
      },
    },
    {
      id: "connecting-installed",
      label: "Connecting (installed)",
      description: installedProvider
        ? "Spinner on the connect button for an installed wallet."
        : "Requires at least one installed wallet extension.",
      disabled: !installedProvider,
      disabledReason: "No installed wallet detected in this browser.",
      apply: () => {
        if (!installedProvider) return

        applyPreset({
          meta: { initialProvider: installedProvider },
          providers: [
            {
              type: installedProvider,
              status: WalletProviderStatus.Pending,
            },
          ],
          recentProvider: installedProvider,
        })
      },
    },
    {
      id: "chain-select",
      label: "Chain select",
      description:
        "Multi-mode brand picker (Talisman). Works best when Talisman is installed with 2+ modes, or one mode is already connected.",
      apply: () =>
        applyPreset({
          providers: [
            {
              type: WalletProviderType.Talisman,
              status: WalletProviderStatus.Connected,
            },
          ],
          accounts: [MOCK_SUBSTRATE_ACCOUNT],
          account: MOCK_SUBSTRATE_ACCOUNT,
          recentlyUsedProviders: [WalletProviderType.Talisman],
          meta: {
            initialProvider: initialSource("walletGroup:Talisman"),
          },
        }),
    },
    {
      id: "waiting-for-auth",
      label: "Waiting for authorization",
      description:
        "Account list with the provider loader while a second wallet authorizes.",
      apply: () =>
        applyPreset({
          providers: [
            {
              type: WalletProviderType.Talisman,
              status: WalletProviderStatus.Connected,
            },
            {
              type: WalletProviderType.MetaMask,
              status: WalletProviderStatus.Pending,
            },
          ],
          accounts: [MOCK_SUBSTRATE_ACCOUNT],
          account: MOCK_SUBSTRATE_ACCOUNT,
          recentlyUsedProviders: [
            WalletProviderType.Talisman,
            WalletProviderType.MetaMask,
          ],
          meta: { initialProvider: WalletProviderType.Talisman },
        }),
    },
    {
      id: "connected-accounts",
      label: "Connected accounts",
      description:
        "Two-panel layout with account search, filters, and grouped accounts.",
      apply: () =>
        applyPreset({
          providers: [
            {
              type: WalletProviderType.Talisman,
              status: WalletProviderStatus.Connected,
            },
            {
              type: WalletProviderType.MetaMask,
              status: WalletProviderStatus.Connected,
            },
          ],
          accounts: [MOCK_SUBSTRATE_ACCOUNT, MOCK_EVM_ACCOUNT],
          account: MOCK_SUBSTRATE_ACCOUNT,
          recentlyUsedProviders: [
            WalletProviderType.Talisman,
            WalletProviderType.MetaMask,
          ],
        }),
    },
    {
      id: "external-wallet",
      label: "External wallet",
      description: "Watch-only address form in the right panel.",
      apply: () =>
        applyPreset({
          meta: { initialProvider: WalletProviderType.ExternalWallet },
        }),
    },
    {
      id: "source-pending",
      label: "Source list: pending",
      description:
        "Left column shows a pending spinner on a wallet row while connected.",
      apply: () =>
        applyPreset({
          providers: [
            {
              type: WalletProviderType.Talisman,
              status: WalletProviderStatus.Connected,
            },
            {
              type: WalletProviderType.Phantom,
              status: WalletProviderStatus.Pending,
            },
          ],
          accounts: [MOCK_SUBSTRATE_ACCOUNT],
          account: MOCK_SUBSTRATE_ACCOUNT,
          recentlyUsedProviders: [WalletProviderType.Talisman],
        }),
    },
    {
      id: "source-not-installed",
      label: "Source list: not installed",
      description:
        "Left column subtitle reads “Not installed” for wallets missing in this browser.",
      apply: () => applyPreset({}),
    },
  ]
}
