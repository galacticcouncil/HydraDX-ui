import { getWallets as getStandardWallets } from "@mysten/wallet-standard"
import { Wallet as StandardWallet } from "@mysten/wallet-standard"
import { ReactNode, useEffect, useState } from "react"

import {
  EVM_PROVIDERS,
  SOLANA_PROVIDERS,
  SUBSTRATE_H160_PROVIDERS,
  SUBSTRATE_PROVIDERS,
  SUI_PROVIDERS,
  WalletProviderType,
} from "@/config/providers"
import { EIP6963AnnounceProviderEvent } from "@/types/evm"
import { getWallets } from "@/wallets"

/**
 * Dev-only dump of what the browser actually announces, so a wallet's
 * identity string can be read off the screen instead of guessed. A wrong
 * `accessor` fails silently — the wallet just never reports `installed` —
 * and nothing in tsc, eslint or review catches it.
 *
 * Unlinked route, code-split, no flag: it is meant to be opened on deploy
 * previews by whoever happens to have the wallet installed.
 */

type Announced = EIP6963AnnounceProviderEvent["detail"]["info"]

const useEip6963Announcements = () => {
  const [announced, setAnnounced] = useState<Announced[]>([])

  useEffect(() => {
    const onAnnounce = (e: Event) => {
      const { info } = (e as unknown as EIP6963AnnounceProviderEvent).detail
      setAnnounced((prev) =>
        prev.some((i) => i.uuid === info.uuid) ? prev : [...prev, info],
      )
    }

    window.addEventListener("eip6963:announceProvider", onAnnounce)
    window.dispatchEvent(new Event("eip6963:requestProvider"))

    return () =>
      window.removeEventListener("eip6963:announceProvider", onAnnounce)
  }, [])

  return announced
}

const useStandardWallets = () => {
  const [wallets, setWallets] = useState<readonly StandardWallet[]>([])

  useEffect(() => {
    const api = getStandardWallets()
    setWallets(api.get())
    return api.on("register", () => setWallets(api.get()))
  }, [])

  return wallets
}

const groupOf = (provider: WalletProviderType) => {
  const groups: [string, WalletProviderType[]][] = [
    ["EVM", EVM_PROVIDERS],
    ["Solana", SOLANA_PROVIDERS],
    ["Sui", SUI_PROVIDERS],
    ["Substrate", SUBSTRATE_PROVIDERS],
    ["Substrate H160", SUBSTRATE_H160_PROVIDERS],
  ]
  return (
    groups
      .filter(([, list]) => list.includes(provider))
      .map(([name]) => name)
      .join(" + ") || "—"
  )
}

/** `isX` flags often live as non-enumerable prototype getters, so own
 * enumerable properties alone under-report them. */
const injectedFlags = (provider: object) => {
  const flags: string[] = []
  for (
    let o: object | null = provider;
    o && o !== Object.prototype;
    o = Object.getPrototypeOf(o)
  ) {
    for (const key of Object.getOwnPropertyNames(o)) {
      if (!key.startsWith("is") || flags.includes(key)) continue
      try {
        if ((provider as Record<string, unknown>)[key] === true) flags.push(key)
      } catch {
        // a getter that throws is not a flag we can read
      }
    }
  }
  return flags
}

const Yes = ({ value }: { value: boolean }) => (
  <span style={{ color: value ? "#3fb950" : "#f85149" }}>
    {value ? "yes" : "no"}
  </span>
)

const Icon = ({ src }: { src?: string }) =>
  src ? (
    <img src={src} alt="" width={20} height={20} />
  ) : (
    <span style={{ opacity: 0.5 }}>—</span>
  )

const Section = ({
  title,
  count,
  children,
}: {
  title: string
  count: number
  children: ReactNode
}) => (
  <section style={{ marginBottom: 32 }}>
    <h2 style={{ fontSize: 16, marginBottom: 8 }}>
      {title} <span style={{ opacity: 0.5 }}>({count})</span>
    </h2>
    {count === 0 ? (
      <p style={{ opacity: 0.5 }}>nothing announced</p>
    ) : (
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        {children}
      </table>
    )}
  </section>
)

const cell = {
  border: "1px solid #333",
  padding: "4px 8px",
  textAlign: "left" as const,
}

export const WalletDiscoveryPanel = () => {
  const announced = useEip6963Announcements()
  const standard = useStandardWallets()
  const configured = getWallets()

  // an accessor matches an EIP-6963 rdns exactly or with the `.mobile` suffix,
  // the same two ways BaseEIP1193Wallet matches it
  const matchEvm = (rdns: string) =>
    configured.filter(
      (w) => w.accessor === rdns || `${w.accessor}.mobile` === rdns,
    )

  // a name alone is ambiguous — Phantom and Nightly each register several
  // chain flavors under one name — so apply the same chain filter the
  // production lookups use: `sui:mainnet` exactly for BaseSuiWallet
  // (Slush/index.ts:24), any `solana:` chain for getSolanaStandardWallet
  const matchStandard = (wallet: StandardWallet) =>
    configured.filter((w) => {
      if (w.accessor !== wallet.name) return false
      const group = groupOf(w.provider)
      if (group.includes("Sui")) return wallet.chains.includes("sui:mainnet")
      if (group.includes("Solana"))
        return wallet.chains.some((c) => c.startsWith("solana:"))
      return true
    })

  return (
    <div
      style={{
        padding: 24,
        fontFamily: "monospace",
        fontSize: 12,
        color: "#e6edf3",
      }}
    >
      <h1 style={{ fontSize: 20, marginBottom: 4 }}>Wallet discovery</h1>
      <p style={{ opacity: 0.6, marginBottom: 24 }}>
        What this browser announces right now. Confirm every wallet `accessor`
        against this before merging it.
      </p>

      <Section title="EIP-6963 (EVM)" count={announced.length}>
        <thead>
          <tr>
            <th style={cell}>rdns</th>
            <th style={cell}>name</th>
            <th style={cell}>uuid</th>
            <th style={cell}>icon</th>
            <th style={cell}>matches config</th>
          </tr>
        </thead>
        <tbody>
          {announced.map((info) => {
            const matched = matchEvm(info.rdns)
            return (
              <tr key={info.uuid}>
                <td style={cell}>
                  <strong>{info.rdns}</strong>
                </td>
                <td style={cell}>{info.name}</td>
                <td style={cell}>{info.uuid}</td>
                <td style={cell}>
                  <Icon src={info.icon} />
                </td>
                <td style={cell}>
                  {matched.length ? (
                    matched.map((w) => w.provider).join(", ")
                  ) : (
                    <span style={{ color: "#f85149" }}>unmatched</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </Section>

      <Section title="Wallet Standard (Sui + Solana)" count={standard.length}>
        <thead>
          <tr>
            <th style={cell}>name</th>
            <th style={cell}>chains</th>
            <th style={cell}>features</th>
            <th style={cell}>icon</th>
            <th style={cell}>matches config</th>
          </tr>
        </thead>
        <tbody>
          {standard.map((wallet) => {
            const matched = matchStandard(wallet)
            return (
              <tr key={`${wallet.name}-${wallet.chains.join()}`}>
                <td style={cell}>
                  <strong>{wallet.name}</strong>
                </td>
                <td style={cell}>{wallet.chains.join(", ")}</td>
                <td style={cell}>{Object.keys(wallet.features).join(", ")}</td>
                <td style={cell}>
                  <Icon src={wallet.icon} />
                </td>
                <td style={cell}>
                  {matched.length ? (
                    matched.map((w) => w.provider).join(", ")
                  ) : (
                    <span style={{ color: "#f85149" }}>unmatched</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </Section>

      <Section title="window.* Solana sniffers" count={3}>
        <thead>
          <tr>
            <th style={cell}>key</th>
            <th style={cell}>present</th>
            <th style={cell}>flags</th>
          </tr>
        </thead>
        <tbody>
          {(
            [
              ["window.phantom.solana", window.phantom?.solana],
              ["window.solflare", window.solflare],
              ["window.braveSolana", window.braveSolana],
            ] as const
          ).map(([key, provider]) => (
            <tr key={key}>
              <td style={cell}>{key}</td>
              <td style={cell}>
                <Yes value={!!provider} />
              </td>
              <td style={cell}>
                {provider ? injectedFlags(provider).join(", ") || "—" : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </Section>

      <Section title="Configured wallets" count={configured.length}>
        <thead>
          <tr>
            <th style={cell}>provider</th>
            <th style={cell}>accessor</th>
            <th style={cell}>group</th>
            <th style={cell}>installed</th>
          </tr>
        </thead>
        <tbody>
          {configured.map((wallet) => (
            <tr key={wallet.provider}>
              <td style={cell}>{wallet.provider}</td>
              <td style={cell}>
                <strong>{wallet.accessor || "—"}</strong>
              </td>
              <td style={cell}>{groupOf(wallet.provider)}</td>
              <td style={cell}>
                <Yes value={wallet.installed} />
              </td>
            </tr>
          ))}
        </tbody>
      </Section>
    </div>
  )
}
