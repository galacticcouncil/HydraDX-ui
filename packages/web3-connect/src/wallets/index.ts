import { pick } from "remeda"

import { WalletProviderType } from "@/config/providers"
import { Wallet, WalletData } from "@/types/wallet"
import { AlephZero } from "@/wallets/AlephZeroSigner"
import { Backpack, BackpackSol, BackpackSui } from "@/wallets/Backpack"
import { BraveWallet, BraveWalletSol } from "@/wallets/BraveWallet"
import { CoinbaseWallet } from "@/wallets/CoinbaseWallet"
import { Enkrypt } from "@/wallets/Enkrypt"
import { ExternalWallet } from "@/wallets/ExternalWallet"
import { FearlessWallet } from "@/wallets/FearlessWallet"
import { MantaWallet } from "@/wallets/MantaWallet"
import { MetaMask, MetaMaskSol } from "@/wallets/MetaMask"
import { Nightly, NightlySol, NightlySui } from "@/wallets/Nightly"
import { NovaWallet, NovaWalletEvm, NovaWalletH160 } from "@/wallets/NovaWallet"
import { OKXWallet, OKXWalletSol, OKXWalletSui } from "@/wallets/OKXWallet"
import { Phantom, PhantomEvm, PhantomSui } from "@/wallets/Phantom"
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
import { TrustWallet, TrustWalletSol } from "@/wallets/TrustWallet"

export {
  AlephZero,
  Backpack,
  BackpackSol,
  BackpackSui,
  BraveWallet,
  BraveWalletSol,
  CoinbaseWallet,
  Enkrypt,
  ExternalWallet,
  FearlessWallet,
  MantaWallet,
  MetaMask,
  MetaMaskSol,
  Nightly,
  NightlySol,
  NightlySui,
  NovaWallet,
  NovaWalletEvm,
  NovaWalletH160,
  OKXWallet,
  OKXWalletSol,
  OKXWalletSui,
  Phantom,
  PhantomEvm,
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
  TrustWallet,
  TrustWalletSol,
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
  new TrustWallet(),
  new CoinbaseWallet(),
  new OKXWallet(),
  new Backpack(),
  new Nightly(),
  new PhantomEvm(),

  // Solana
  new Phantom(),
  new Solflare(),
  new TalismanSol(),
  new BraveWalletSol(),
  new TrustWalletSol(),
  new OKXWalletSol(),
  new MetaMaskSol(),
  new BackpackSol(),
  new NightlySol(),

  // Sui
  new Suiet(),
  new Slush(),
  new PhantomSui(),
  new OKXWalletSui(),
  new BackpackSui(),
  new NightlySui(),

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
