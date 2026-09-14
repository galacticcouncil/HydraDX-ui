import { WalletModalStatesControls } from "@/components/debug/WalletModalStatesControls"

/**
 * Dev-only state switcher for Web3ConnectModalV2. Each button seeds the shared
 * zustand store and opens the app-wide modal mounted in __root.
 *
 * Unlinked route, code-split, no flag — open on deploy previews when reviewing
 * wallet UI states without juggling real extensions.
 */
export const WalletModalStatesPanel = () => (
  <div
    style={{
      padding: 24,
      fontFamily: "monospace",
      fontSize: 12,
      color: "#e6edf3",
      maxWidth: 960,
    }}
  >
    <h1 style={{ fontSize: 20, marginBottom: 4 }}>Wallet modal states</h1>
    <p style={{ opacity: 0.6, marginBottom: 24, lineHeight: 1.5 }}>
      Preview each connection state in the live modal. Buttons write mock data
      into the web3-connect store and open the modal already mounted by the app.
      Some presets depend on which wallets are installed in this browser.
    </p>

    <WalletModalStatesControls />
  </div>
)
