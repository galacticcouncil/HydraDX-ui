import { Text } from "components/Typography/Text/Text"
import { useShallow } from "hooks/useShallow"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useMedia } from "react-use"
import {
  WalletProvider,
  WalletProviderType,
  getSupportedWallets,
} from "sections/web3-connect/Web3Connect.utils"
import {
  ALTERNATIVE_PROVIDERS,
  DESKTOP_ONLY_PROVIDERS,
  EVM_PROVIDERS,
  MOBILE_ONLY_PROVIDERS,
  SUBSTRATE_H160_PROVIDERS,
  SUBSTRATE_PROVIDERS,
} from "sections/web3-connect/constants/providers"
import {
  Web3ConnectAltProviderButton,
  Web3ConnectProviderButton,
} from "sections/web3-connect/providers/Web3ConnectProviderButton"
import {
  WalletMode,
  useWeb3ConnectStore,
} from "sections/web3-connect/store/useWeb3ConnectStore"
import { POLKADOT_CAIP_ID_MAP } from "sections/web3-connect/wallets/WalletConnect"
import { theme } from "theme"
import {
  SExpandButton,
  SProviderContainer,
} from "./Web3ConnectProviders.styled"
import { Icon } from "components/Icon/Icon"
import ChevronDownIcon from "assets/icons/ChevronDown.svg?react"
import { Chip } from "components/Chip"
import { Separator } from "components/Separator/Separator"
import { AccordionAnimation } from "components/Accordion/Accordion"
import { MetadataStore } from "@galacticcouncil/ui"
import { pick } from "utils/rx"

const getModeIcon = (mode: WalletMode) => {
  try {
    const key = mode === WalletMode.EVM ? "eth" : "dot"
    return MetadataStore.getInstance().asset(key)
  } catch (e) {}
}

const useWalletProviders = (mode: WalletMode, chain?: string) => {
  const isDesktop = useMedia(theme.viewport.gte.sm)

  return useMemo(() => {
    const wallets = getSupportedWallets()

    const isDefaultMode = mode === WalletMode.Default
    const isEvmMode = mode === WalletMode.EVM
    const isSubstrateMode = mode === WalletMode.Substrate
    const isSubstrateEvmMode = mode === WalletMode.SubstrateEVM
    const isSubstrateH160Mode = mode === WalletMode.SubstrateH160

    const filteredProviders = wallets
      .filter((provider) => {
        if (isEvmMode) return EVM_PROVIDERS.includes(provider.type)

        const byScreen = isDesktop
          ? !MOBILE_ONLY_PROVIDERS.includes(provider.type)
          : !DESKTOP_ONLY_PROVIDERS.includes(provider.type)

        const isEvmProvider = EVM_PROVIDERS.includes(provider.type)
        const isSubstrateProvider = SUBSTRATE_PROVIDERS.includes(provider.type)
        const isSubstrateH160Provider = SUBSTRATE_H160_PROVIDERS.includes(
          provider.type,
        )

        const byMode =
          isDefaultMode ||
          isSubstrateEvmMode ||
          (isEvmMode && isEvmProvider) ||
          (isSubstrateMode && isSubstrateProvider) ||
          (isSubstrateH160Mode && isSubstrateH160Provider)

        const byWalletConnect =
          isSubstrateMode && provider.type === "walletconnect" && chain
            ? !!POLKADOT_CAIP_ID_MAP[chain]
            : true

        return byScreen && byMode && byWalletConnect
      })
      .sort((a, b) => {
        const order = Object.values(WalletProviderType)
        return order.indexOf(a.type) - order.indexOf(b.type)
      })

    const alternativeProviders = wallets.filter((provider) =>
      ALTERNATIVE_PROVIDERS.includes(provider.type),
    )

    const { installedProviders, otherProviders } = filteredProviders.reduce<{
      installedProviders: WalletProvider[]
      otherProviders: WalletProvider[]
    }>(
      (prev, curr) => {
        if (curr.wallet.installed) {
          prev.installedProviders.push(curr)
        } else {
          prev.otherProviders.push(curr)
        }
        return prev
      },
      {
        installedProviders: [],
        otherProviders: [],
      },
    )

    return {
      installedProviders,
      otherProviders,
      alternativeProviders,
    }
  }, [mode, isDesktop, chain])
}

export const Web3ConnectProviders = () => {
  const { t } = useTranslation()

  const { mode, meta, recentProvider } = useWeb3ConnectStore(
    useShallow((state) => pick(state, ["mode", "meta", "recentProvider"])),
  )

  const isRecentEvmProvider =
    recentProvider &&
    EVM_PROVIDERS.includes(recentProvider) &&
    !SUBSTRATE_PROVIDERS.includes(recentProvider)

  const isFilterable =
    mode === WalletMode.Default || mode === WalletMode.SubstrateEVM

  const defaultSelectedMode = isRecentEvmProvider
    ? WalletMode.EVM
    : WalletMode.Substrate

  const [selectedMode, setSelectedMode] = useState<WalletMode>(
    isFilterable ? defaultSelectedMode : mode,
  )

  const { installedProviders, otherProviders, alternativeProviders } =
    useWalletProviders(selectedMode, meta?.chain)

  const installedCountWithoutWC = installedProviders.filter(
    ({ type }) => type !== WalletProviderType.WalletConnect,
  ).length

  const [expanded, setExpanded] = useState(installedCountWithoutWC === 0)

  const modes = [WalletMode.Substrate, WalletMode.EVM] as const

  return (
    <>
      {isFilterable && (
        <>
          <div sx={{ flex: "row", align: "center", gap: 10, flexWrap: "wrap" }}>
            <Text color="basic500" fs={14}>
              {t("walletConnect.provider.mode.title")}:
            </Text>
            <div sx={{ flex: "row", align: "center", gap: 10 }}>
              {modes.map((mode) => (
                <Chip
                  key={mode}
                  active={selectedMode === mode}
                  onClick={() => setSelectedMode(mode)}
                >
                  <Icon
                    size={20}
                    sx={{ ml: -4 }}
                    icon={
                      <img
                        src={getModeIcon(mode)}
                        alt={t(`walletConnect.provider.mode.${mode}`)}
                      />
                    }
                  />
                  {t(`walletConnect.provider.mode.${mode}`)}
                </Chip>
              ))}
            </div>
            <div sx={{ display: ["none", "block"], ml: "auto" }}>
              {alternativeProviders.map((provider) => (
                <Web3ConnectAltProviderButton {...provider} key={provider.type}>
                  {t("walletConnect.accountSelect.viewAsWallet")}
                </Web3ConnectAltProviderButton>
              ))}
            </div>
          </div>
          <Separator
            sx={{
              width: "auto",
              mx: "calc(var(--modal-content-padding) * -1)",
              my: 20,
            }}
            color="darkBlue401"
          />
        </>
      )}

      <Text color="basic400">
        {t("walletConnect.provider.section.installed")}
      </Text>
      {installedProviders.length > 0 ? (
        <SProviderContainer>
          {installedProviders.map((provider) => (
            <Web3ConnectProviderButton
              key={provider.type}
              mode={selectedMode}
              {...provider}
            />
          ))}
        </SProviderContainer>
      ) : (
        <Text fs={12} color="basic400" sx={{ mt: 8 }}>
          {t("walletConnect.provider.section.installed.notFound")}
        </Text>
      )}

      <div sx={{ display: ["block", "none"], mt: 20 }}>
        {alternativeProviders.map((provider) => (
          <Web3ConnectAltProviderButton {...provider} key={provider.type}>
            {t("walletConnect.accountSelect.viewAsWallet")}
          </Web3ConnectAltProviderButton>
        ))}
      </div>
      {otherProviders.length > 0 && (
        <>
          <Separator sx={{ my: 20 }} color="darkBlue401" />
          <SExpandButton
            aria-expanded={expanded}
            onClick={() => setExpanded((state) => !state)}
          >
            {t("walletConnect.provider.section.other")}
            <div sx={{ flex: "row", align: "center", fontSize: 13 }}>
              {t(expanded ? "hide" : "show")}
              <Icon icon={<ChevronDownIcon />} />
            </div>
          </SExpandButton>
          <AccordionAnimation expanded={expanded}>
            <SProviderContainer>
              {otherProviders.map((provider) => (
                <Web3ConnectProviderButton {...provider} key={provider.type} />
              ))}
            </SProviderContainer>
          </AccordionAnimation>
        </>
      )}
    </>
  )
}
