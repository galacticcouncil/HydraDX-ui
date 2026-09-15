import { createContext, type ReactNode, useContext } from "react"

import { type PropellerVaultConfig } from "@/modules/strategies/propeller/config/vaults"

const PropellerVaultContext = createContext<PropellerVaultConfig | null>(null)

export const PropellerVaultProvider = ({
  vault,
  children,
}: {
  vault: PropellerVaultConfig
  children: ReactNode
}) => (
  <PropellerVaultContext.Provider value={vault}>
    {children}
  </PropellerVaultContext.Provider>
)

/**
 * Active vault config. Pass override on the strategies overview; omit it on
 * the detail page inside PropellerVaultProvider.
 */
export const useActivePropellerVault = (
  override?: PropellerVaultConfig,
): PropellerVaultConfig => {
  const context = useContext(PropellerVaultContext)
  const vault = override ?? context

  if (!vault) {
    throw new Error(
      "useActivePropellerVault must be used within a PropellerVaultProvider (or given an override)",
    )
  }

  return vault
}
