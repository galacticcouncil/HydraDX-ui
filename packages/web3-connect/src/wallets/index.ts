import { pick } from "remeda"

import { WalletProviderType } from "@/config/providers"
import { Wallet, WalletData } from "@/types/wallet"
import { AlephZero } from "@/wallets/AlephZeroSigner"
import { BraveWallet, BraveWalletSol } from "@/wallets/BraveWallet"
import { Enkrypt } from "@/wallets/Enkrypt"
import { ExternalWallet } from "@/wallets/ExternalWallet"
import { FearlessWallet } from "@/wallets/FearlessWallet"
import { MantaWallet } from "@/wallets/MantaWallet"
import { MetaMask } from "@/wallets/MetaMask"
import { NovaWallet, NovaWalletEvm, NovaWalletH160 } from "@/wallets/NovaWallet"
import { Phantom, PhantomSui } from "@/wallets/Phantom"
import { PolkadotJS } from "@/wallets/PolkadotJS"
import { PolkaGate } from "@/wallets/PolkaGate"
import { RabbyWallet } from "@/wallets/RabbyWallet"
import { ReownWalletConnect } from "@/wallets/ReownWalletConnect"
import { Slush } from "@/wallets/Slush"
import { Solflare } from "@/wallets/Solflare"
import { SubWallet, SubWalletEvm, SubWalletH160 } from "@/wallets/SubWallet"
import { Suiet } from "@/wallets/Suiet"
import {
  Talisman,
  TalismanEvm,
  TalismanH160,
  TalismanSol,
} from "@/wallets/Talisman"

export {
  AlephZero,
  BraveWallet,
  BraveWalletSol,
  Enkrypt,
  ExternalWallet,
  FearlessWallet,
  MantaWallet,
  MetaMask,
  NovaWallet,
  NovaWalletEvm,
  NovaWalletH160,
  Phantom,
  PhantomSui,
  PolkadotJS,
  PolkaGate,
  RabbyWallet,
  ReownWalletConnect,
  Slush,
  Solflare,
  SubWallet,
  SubWalletEvm,
  SubWalletH160,
  Suiet,
  Talisman,
  TalismanEvm,
  TalismanH160,
  TalismanSol,
}

const wallets = [
  // Substrate
  new PolkadotJS(),
  new NovaWallet(),
  new Talisman(),
  new SubWallet(),
  new AlephZero(),
  new Enkrypt(),
  new FearlessWallet(),
  new MantaWallet(),
  new PolkaGate(),

  // Substrate H160
  new SubWalletH160(),
  new TalismanH160(),
  new NovaWalletH160(),

  // EVM
  new MetaMask(),
  new NovaWalletEvm(),
  new BraveWallet(),
  new TalismanEvm(),
  new SubWalletEvm(),
  new RabbyWallet(),

  // Solana
  new Phantom(),
  new Solflare(),
  new TalismanSol(),
  new BraveWalletSol(),

  // Sui
  new Suiet(),
  new Slush(),
  new PhantomSui(),

  // Other
  new ReownWalletConnect(),
  new ExternalWallet(),
]

export function getWallets(): Wallet[] {
  return wallets
}

export function getWalletData(wallet: Wallet): WalletData {
  return pick(wallet, [
    "provider",
    "accessor",
    "title",
    "installUrl",
    "logo",
    "enabled",
    "installed",
  ])
}

export function getWallet(type?: WalletProviderType): Wallet | undefined {
  return wallets.find((wallet) => wallet.provider === type)
}
