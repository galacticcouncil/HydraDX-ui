import {
  createZustandStorage,
  EvmAddr,
  isH160Address,
  parseNearAccountName,
  safeConvertSS58toPublicKey,
  stringEquals,
} from "@galacticcouncil/utils"
import { useMemo } from "react"
import { z } from "zod/v4"
import { create } from "zustand"
import { persist } from "zustand/middleware"

import { isWalletProviderType, WalletProviderType } from "@/config/providers"
import { WalletMode } from "@/config/wallet"
import { useWeb3Connect } from "@/hooks/useWeb3Connect"
import { addressToPublicKey } from "@/utils/publicKey"
import { getWalletModeByAddress } from "@/utils/wallet"

import {
  type AddressFilter,
  buildAddresses,
  dedupeAddresses,
  getAllAddresses,
  isVisibleToWallet,
  normalizeStoredAddress,
  selectAddresses,
} from "./AddressBook.merge"

export const modeSchema = z.enum([
  WalletMode.Substrate,
  WalletMode.SubstrateH160,
  WalletMode.EVM,
  WalletMode.Solana,
  WalletMode.Sui,
  WalletMode.Near,
  WalletMode.Zcash,
])

const addressSchemaV2 = z.object({
  id: z.string().optional(),
  name: z.string(),
  address: z.string(),
  provider: z.string(),
  isCustom: z.boolean().optional(),
})

const stateSchemaV2 = z.object({
  addresses: z.array(addressSchemaV2),
})

const addressSchemaV3 = z.object({
  publicKey: z.string(),
  name: z.string(),
  address: z.string(),
  provider: z.enum(WalletProviderType),
  isCustom: z.boolean().optional(),
})

const stateSchemaV3 = z.object({
  addresses: z.array(addressSchemaV3),
})

const addressSchema = z.object({
  publicKey: z.string(),
  name: z.string(),
  address: z.string(),
  provider: z.enum(WalletProviderType).optional(),
  mode: modeSchema,
  savedBy: z.array(z.string()).default([]),
  isCustom: z.boolean().optional(),
})

export type Address = z.infer<typeof addressSchema>

export type AddressInput = Omit<Address, "mode" | "savedBy" | "publicKey"> & {
  savedBy?: string[]
  mode?: z.infer<typeof modeSchema>
  isGlobal?: boolean
}

export type NormalizedAddress = Address & { isGlobal?: boolean }

function normalizeAddress(input: AddressInput): NormalizedAddress | null {
  const { isGlobal, ...rest } = input
  const address = EvmAddr.isValid(input.address)
    ? input.address.toLowerCase()
    : input.address
  const publicKey = addressToPublicKey(address)
  if (!publicKey) return null

  const mode = input.mode ?? getWalletModeByAddress(address)
  if (!mode) return null

  const parsedMode = modeSchema.safeParse(mode)
  if (!parsedMode.success) return null

  return {
    ...rest,
    address,
    name: input.name || parseNearAccountName(address),
    publicKey,
    mode: parsedMode.data,
    savedBy: input.savedBy ?? [],
    ...(isGlobal !== undefined ? { isGlobal } : {}),
  }
}

const stateSchema = z.object({
  addresses: z.array(addressSchema),
})

type State = z.infer<typeof stateSchema>

const defaultState: State = {
  addresses: [],
}

export type AddressStore = State & {
  readonly add: (address: AddressInput | AddressInput[]) => void
  readonly edit: (address: Address) => void
  readonly remove: (publicKey: string) => void
  readonly selectAddresses: (filter?: AddressFilter) => Address[]
}

export const useAddressStore = create<AddressStore>()(
  persist(
    (set, get) => ({
      ...defaultState,

      selectAddresses: (filter = {}) =>
        selectAddresses(
          get().addresses,
          filter,
          useWeb3Connect.getState().account?.publicKey ?? null,
        ),

      add: (address) =>
        set((state) => ({
          addresses: buildAddresses(
            state.addresses,
            (Array.isArray(address) ? address : [address])
              .map(normalizeAddress)
              .filter((a) => a !== null),
            useWeb3Connect.getState().account?.publicKey ?? null,
          ),
        })),

      edit: (address) =>
        set((state) => {
          const normalized = normalizeStoredAddress(address)

          return {
            addresses: dedupeAddresses(
              state.addresses.map((a) =>
                stringEquals(a.publicKey, normalized.publicKey)
                  ? normalized
                  : a,
              ),
            ),
          }
        }),

      remove: (publicKey) =>
        set((state) => ({
          addresses: state.addresses.filter(
            (a) => !stringEquals(a.publicKey, publicKey),
          ),
        })),
    }),
    createZustandStorage({
      name: "address-book",
      version: 4,
      schema: stateSchema,
      defaultState,
      migrate: (persistedState, storedVersion) => {
        switch (storedVersion) {
          case 2:
            return migrateLegacyAddressBookV2(persistedState)
          case 3:
            return migrateAddressBookV3toV4(persistedState)
          default:
            return persistedState as State
        }
      },
    }),
  ),
)

export type { AddressFilter }

export function useAddresses(
  filter: AddressFilter = {},
  { autoName = true }: { autoName?: boolean } = {},
): Address[] {
  const addresses = useAddressStore((state) => state.addresses)
  const publicKey = useWeb3Connect((state) => state.account?.publicKey ?? null)
  return useMemo(() => {
    const selected = selectAddresses(
      addresses.filter((a) => isVisibleToWallet(a, publicKey)),
      filter,
      publicKey,
    )
    return autoName ? getAllAddresses(selected) : selected
  }, [addresses, filter, publicKey, autoName])
}

function migrateAddressBookV3toV4(persistedState: unknown): State {
  const parsed = stateSchemaV3.safeParse(persistedState)

  if (!parsed.success) return defaultState

  return {
    addresses: dedupeAddresses(
      parsed.data.addresses
        .map<Address | null>((entry) => {
          const address = EvmAddr.isValid(entry.address)
            ? entry.address.toLowerCase()
            : entry.address
          const publicKey =
            entry.publicKey.trim() || addressToPublicKey(address)
          if (!publicKey) return null

          const mode = modeSchema.safeParse(getWalletModeByAddress(address))
          if (!mode.success) return null

          return {
            ...entry,
            address,
            publicKey,
            mode: mode.data,
            savedBy: [],
          }
        })
        .filter((address) => address !== null),
    ),
  }
}

function migrateLegacyAddressBookV2(persistedState: unknown): State {
  const parsed = stateSchemaV2.safeParse(persistedState)

  if (!parsed.success) return defaultState

  return {
    addresses: parsed.data.addresses
      .map<Address | null>((address) => {
        if (!address.isCustom) return null

        const publicKey = isH160Address(address.address)
          ? address.address
          : safeConvertSS58toPublicKey(address.address)

        if (!publicKey || !isWalletProviderType(address.provider)) return null

        const mode = modeSchema.safeParse(
          getWalletModeByAddress(address.address),
        )
        if (!mode.success) return null

        return {
          address: address.address,
          name: address.name,
          provider: address.provider,
          isCustom: address.isCustom,
          publicKey,
          mode: mode.data,
          savedBy: [],
        }
      })
      .filter((address) => address !== null),
  }
}
