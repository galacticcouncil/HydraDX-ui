import { useWalletSubscriptions } from "@/hooks/useWalletSubscriptions"
import { useWeb3EagerEnable } from "@/hooks/useWeb3EagerEnable"

/**
 * Session-scoped wallet plumbing: reconnects wallets the user had connected,
 * and keeps the store in step with what the extensions report.
 *
 * Renders nothing, and must be mounted exactly once for the lifetime of the
 * app. It used to live inside `Web3ConnectModalV2`, which the app mounts
 * several times - once globally and once per cross-chain modal - so how many
 * subscriptions ran, and when they were all torn down, depended on which route
 * was open. Modals are pure views over the store; this is where the lifetime
 * actually is.
 */
export const Web3ConnectSession = () => {
  useWeb3EagerEnable()
  useWalletSubscriptions()

  return null
}
