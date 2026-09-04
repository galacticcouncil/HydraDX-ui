/**
 * The screens the modal can show. One member per screen that actually renders
 * differently - connection state is derived inside `WalletManagementContent`,
 * not encoded here.
 */
export enum Web3ConnectModalPage {
  Wallets = "Wallets",
  ExternalWallet = "ExternalWallet",
  MultisigSetup = "MultisigSetup",
  MultisigConfigSelect = "MultisigConfigSelect",
  MultisigSignerSelect = "MultisigSignerSelect",
}

/**
 * `meta.initialPage` is persisted, so it can outlive a page it named. Anything
 * unrecognised falls back to the wallets screen rather than rendering nothing.
 */
export const isModalPage = (
  page: string | undefined,
): page is Web3ConnectModalPage =>
  !!page && (Object.values(Web3ConnectModalPage) as string[]).includes(page)
