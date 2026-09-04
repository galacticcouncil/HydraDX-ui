import { useEffect, useRef, useState } from "react"
import { useMount, usePrevious } from "react-use"
import { pick } from "remeda"
import { useShallow } from "zustand/shallow"

import { WalletProviderType } from "@/config/providers"
import { useWeb3Connect, WalletProviderStatus } from "@/hooks/useWeb3Connect"
import { useWeb3Enable } from "@/hooks/useWeb3Enable"
import { toStoredAccount } from "@/utils"
import { ExternalWallet, getWallet } from "@/wallets"
import { BaseSubstrateWallet } from "@/wallets/BaseSubstrateWallet"

export const useWeb3EagerEnable = () => {
  const { enable, disconnect } = useWeb3Enable()
  const { providers, setAccount } = useWeb3Connect(
    useShallow(pick(["providers", "setAccount"])),
  )
  const prevProviders = usePrevious(providers)

  const [providersRequested, setProvidersRequested] = useState(false)
  const hasTriedEagerEnable = useRef(false)

  useMount(() => {
    window.dispatchEvent(new Event("eip6963:requestProvider"))
    setProvidersRequested(true)
  })

  useEffect(() => {
    if (!providersRequested) return

    const state = useWeb3Connect.getState()
    const { providers, account } = state

    if (providers.length > 0) {
      eagerEnable()
      hasTriedEagerEnable.current = true
    } else {
      state.disconnect()
    }

    async function eagerEnable() {
      if (hasTriedEagerEnable.current) return

      for (const { type, status } of providers) {
        const wallet = getWallet(type)

        // Skip external wallet, it is handled separately based on `acocunt` query param
        if (wallet instanceof ExternalWallet) continue

        if (!wallet || status !== WalletProviderStatus.Connected) {
          disconnect(type)
          continue
        }

        if (!wallet.installed) {
          disconnect(type)
          continue
        }

        if (wallet.enabled) continue

        try {
          await enable(wallet.provider)

          const isSubstrate = wallet instanceof BaseSubstrateWallet
          if (isSubstrate && account) {
            const signerAddress = account.isMultisig
              ? (account.multisigSignerAddress ?? account.address)
              : account.address
            wallet.setSigner(signerAddress)
          }
        } catch {
          disconnect(type)
        }
      }
    }
  }, [providersRequested, enable, disconnect])

  useEffect(() => {
    prevProviders?.forEach(({ type }) => {
      const hasWalletDisconnected = !providers.find((p) => p.type === type)
      const wallet = getWallet(type)
      if (wallet && hasWalletDisconnected) {
        wallet.disconnect()
      }
    })
  }, [prevProviders, providers])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const address = params.get("account")

    if (!address) return

    const wallet = getWallet(WalletProviderType.ExternalWallet)

    const isExternalWallet = wallet instanceof ExternalWallet
    if (!isExternalWallet) return

    const isValid = wallet.setAccount(address)
    if (!isValid) return

    enable(WalletProviderType.ExternalWallet).then(([account]) => {
      setAccount(toStoredAccount(account))
    })
  }, [enable, setAccount])
}
