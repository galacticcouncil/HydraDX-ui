import { Search, WalletIcon } from "@galacticcouncil/ui/assets/icons"
import { Flex, Icon, ScrollArea, Text } from "@galacticcouncil/ui/components"
import { pxToRem } from "@galacticcouncil/ui/utils"
import { ChevronDown, ChevronUp, LogOut } from "lucide-react"
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react"
import { FormProvider } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useDebounce } from "react-use"
import { pick, prop, uniqueBy } from "remeda"
import { useShallow } from "zustand/react/shallow"

import { AddressBookModal } from "@/components/address-book"
import {
  WalletAccount,
  WalletAccountSection,
  WalletAccountTile,
} from "@/components/content/WalletManagementAccounts"
import {
  SAccountFilterButton,
  SAccountScrollFrame,
  SEmptyState,
  SLayoutGrid,
  SModalBody,
  SModalHeader,
  SMoreWalletsDropdown,
  SMoreWalletsList,
  SRightColumn,
  SRightColumnBody,
  SRightPanelFrame,
  SScrollAreaContent,
  SSearchInput,
  SSourceColumn,
  SSourceList,
  SSourceOtherSectionLabel,
  SSourceScrollFrame,
  SSourceSectionLabel,
  SWalletManagementShell,
} from "@/components/content/WalletManagementContent.styled"
import {
  WalletGroupSourceButton,
  WalletProviderSourceButton,
  WalletSourceButton,
  WalletSourceGroup,
} from "@/components/content/WalletManagementSource"
import {
  WalletChainSelectState,
  WalletConnectState,
  WalletErrorState,
} from "@/components/content/WalletManagementStates"
import {
  ExternalWalletForm,
  useExternalWalletConnection,
} from "@/components/external/ExternalWalletForm"
import { useExternalWalletForm } from "@/components/external/ExternalWalletForm.form"
import { ProviderLoader } from "@/components/provider/ProviderLoader"
import { WalletProviderType } from "@/config/providers"
import {
  chipModesForAccounts,
  providersForMode,
  WalletAccountFilterOption,
  WalletMode,
} from "@/config/wallet"
import { useWeb3ConnectContext } from "@/context/Web3ConnectContext"
import { useAccount } from "@/hooks/useAccount"
import { useAccountsWithBalance } from "@/hooks/useAccountsWithBalance"
import { useWeb3Connect, WalletProviderStatus } from "@/hooks/useWeb3Connect"
import { useWeb3Enable } from "@/hooks/useWeb3Enable"
import { Wallet } from "@/types/wallet"
import { getWalletModeName, toAccount } from "@/utils"
import {
  filterAccounts,
  getFilteredAccounts,
  isAccountSelected,
} from "@/utils/accountFilter"
import {
  getSelectableWallets,
  isWalletSourceGroupId,
  selectWalletSources,
  WalletSourceId,
} from "@/utils/walletSource"
import { getWallet, getWallets } from "@/wallets"

export const WalletManagementContent = () => {
  const { t } = useTranslation()
  const { account: currentAccount } = useAccount()
  const { mode, onAccountSelect, isControlled, setModalContentWidth } =
    useWeb3ConnectContext()
  const { enable, disconnect } = useWeb3Enable()
  const { enable: enableWithDisconnectOnError } = useWeb3Enable({
    disconnectOnError: true,
  })
  const {
    accounts,
    toggle,
    providers: walletProviders,
    recentProvider,
    recentlyDisconnectedProviders,
    error,
    meta,
    getStatus,
  } = useWeb3Connect(
    useShallow(
      pick([
        "accounts",
        "toggle",
        "providers",
        "recentProvider",
        "recentlyDisconnectedProviders",
        "error",
        "meta",
        "getStatus",
      ]),
    ),
  )

  const [selectedSource, setSelectedSource] = useState<WalletSourceId>(
    meta?.initialProvider ?? "all",
  )
  const [accountFilter, setAccountFilter] = useState<WalletAccountFilterOption>(
    WalletMode.Default,
  )
  const [walletSearchValue, setWalletSearchValue] = useState("")
  const [accountSearchValue, setAccountSearchValue] = useState("")
  const [walletSearch, setWalletSearch] = useState("")
  const [accountSearch, setAccountSearch] = useState("")
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const [isAddressBookOpen, setIsAddressBookOpen] = useState(false)
  const externalWalletForm = useExternalWalletForm()
  const { connectExternalWallet } = useExternalWalletConnection()
  const showExternalWallet = !meta?.hideExternalWallet

  useEffect(() => {
    if (!meta?.initialProvider) return
    setSelectedSource(meta.initialProvider)
  }, [meta?.initialProvider])

  useDebounce(() => setWalletSearch(walletSearchValue), 100, [
    walletSearchValue,
  ])
  useDebounce(() => setAccountSearch(accountSearchValue), 100, [
    accountSearchValue,
  ])

  const allWallets = useMemo(() => getWallets(), [])

  /**
   * The single gate the forced mode acts through. `null` means "no
   * restriction" and covers two cases: Default, where no chain has been
   * singled out and every wallet is connectable; and a chain that has no
   * connectors yet (Near, Zcash), where filtering would render an empty modal.
   */
  const modeProviders = useMemo(() => providersForMode(mode), [mode])

  const providers = useMemo(
    () =>
      modeProviders
        ? walletProviders.filter(({ type }) => modeProviders.includes(type))
        : walletProviders,
    [modeProviders, walletProviders],
  )
  const connectedProviderTypes = useMemo(
    () =>
      providers
        .filter(({ status }) => status === WalletProviderStatus.Connected)
        .map(prop("type")),
    [providers],
  )
  const pendingProviderTypes = useMemo(
    () =>
      providers
        .filter(({ status }) => status === WalletProviderStatus.Pending)
        .map(prop("type")),
    [providers],
  )

  const isProvidersConnecting = pendingProviderTypes.length > 0
  const hasConnectedWalletState =
    connectedProviderTypes.length > 0 || accounts.length > 0
  const showErrorState = !!error

  const {
    available: compatibleWallets,
    sortedGroups: sortedWalletGroups,
    otherGroups: otherWalletGroups,
  } = useMemo(
    () =>
      selectWalletSources(allWallets, modeProviders, connectedProviderTypes),
    [allWallets, connectedProviderTypes, modeProviders],
  )

  const selectedWallet =
    selectedSource !== "all" &&
    selectedSource !== "recent" &&
    !isWalletSourceGroupId(selectedSource)
      ? getWallet(selectedSource)
      : undefined
  const selectedWalletGroup = isWalletSourceGroupId(selectedSource)
    ? [...sortedWalletGroups, ...otherWalletGroups].find(
        (group) => group.id === selectedSource,
      )
    : undefined
  const selectedWalletStatus = selectedWallet
    ? getStatus(selectedWallet.provider)
    : null
  const isExternalWalletSelected =
    selectedSource === WalletProviderType.ExternalWallet && showExternalWallet
  const isSelectedWalletConnecting =
    !!selectedWallet &&
    selectedWallet.installed &&
    selectedWalletStatus === WalletProviderStatus.Pending
  const showSelectedWalletConnectState =
    !!selectedWallet &&
    selectedWallet.provider !== WalletProviderType.ExternalWallet &&
    !selectedWallet.installed &&
    (selectedWalletStatus === WalletProviderStatus.Disconnected ||
      selectedWalletStatus === WalletProviderStatus.Pending)
  const showWalletGroupChainSelectState =
    !!selectedWalletGroup &&
    getSelectableWallets(selectedWalletGroup, connectedProviderTypes).length > 1
  const showAccountPanel =
    hasConnectedWalletState ||
    isExternalWalletSelected ||
    isSelectedWalletConnecting ||
    showSelectedWalletConnectState ||
    showWalletGroupChainSelectState ||
    showErrorState

  useLayoutEffect(() => {
    setModalContentWidth?.(showAccountPanel ? pxToRem(650) : pxToRem(452))
  }, [setModalContentWidth, showAccountPanel])

  const recentlyDisconnectedProviderTypes = useMemo(
    () =>
      recentlyDisconnectedProviders.filter((provider) => {
        const isCompatible = compatibleWallets.some(
          (wallet) => wallet.provider === provider,
        )
        return isCompatible && !connectedProviderTypes.includes(provider)
      }),
    [compatibleWallets, connectedProviderTypes, recentlyDisconnectedProviders],
  )
  const recentlyConnectedProviderTypes = useMemo(() => {
    const providers = [
      ...(recentProvider ? [recentProvider] : []),
      ...recentlyDisconnectedProviderTypes,
    ]

    return uniqueBy(
      providers.filter((provider) => {
        const isCompatible = compatibleWallets.some(
          (wallet) => wallet.provider === provider,
        )
        return isCompatible && !connectedProviderTypes.includes(provider)
      }),
      (provider) => provider,
    ).slice(0, 3)
  }, [
    compatibleWallets,
    connectedProviderTypes,
    recentProvider,
    recentlyDisconnectedProviderTypes,
  ])
  const visibleWallets = useMemo(() => {
    const phrase = walletSearch.toLowerCase().trim()
    if (!phrase) return sortedWalletGroups
    return sortedWalletGroups.filter((group) =>
      group.title.toLowerCase().includes(phrase),
    )
  }, [sortedWalletGroups, walletSearch])

  const visibleSuggestedWalletGroups = useMemo(
    () =>
      showAccountPanel
        ? visibleWallets
        : visibleWallets.filter(
            (group) =>
              !group.providers.every((provider) =>
                recentlyConnectedProviderTypes.includes(provider),
              ),
          ),
    [recentlyConnectedProviderTypes, showAccountPanel, visibleWallets],
  )

  const visibleOtherWalletGroups = useMemo(() => {
    const phrase = walletSearch.toLowerCase().trim()
    if (!phrase) return otherWalletGroups
    return otherWalletGroups.filter((group) =>
      group.title.toLowerCase().includes(phrase),
    )
  }, [otherWalletGroups, walletSearch])

  const shouldAutoOpenMoreWallets =
    !showAccountPanel &&
    visibleSuggestedWalletGroups.length === 0 &&
    recentlyConnectedProviderTypes.length === 0
  const isMoreWalletsListOpen = isMoreOpen || shouldAutoOpenMoreWallets

  /**
   * Accounts the forced mode allows, narrowed by the selected wallet source.
   * `mode` is a hard bound applied unconditionally - the chips below can only
   * narrow further, never widen past it.
   */
  const modeAccounts = useMemo(() => {
    const selectedProvider =
      selectedSource !== "all" &&
      selectedSource !== "recent" &&
      !isWalletSourceGroupId(selectedSource)
        ? selectedSource
        : null

    const sourceAccounts =
      selectedSource === "recent"
        ? accounts.filter((account) =>
            connectedProviderTypes.includes(account.provider),
          )
        : selectedProvider
          ? accounts.filter((account) => account.provider === selectedProvider)
          : accounts

    return filterAccounts(mode)(sourceAccounts.map(toAccount))
  }, [accounts, connectedProviderTypes, mode, selectedSource])

  /**
   * Chips are derived from the accounts actually on screen, so a filter that
   * cannot change what is displayed is never offered. A forced mode therefore
   * renders no chips at all: one mode survives, and one chip plus All is noise.
   */
  const chipModes = useMemo(
    () => chipModesForAccounts(modeAccounts),
    [modeAccounts],
  )

  /**
   * The chip set shrinks as wallets disconnect. Drop a filter that no longer
   * has a chip, otherwise it silently empties the list.
   */
  useEffect(() => {
    if (accountFilter === WalletMode.Default) return
    if (chipModes.includes(accountFilter)) return
    setAccountFilter(WalletMode.Default)
  }, [accountFilter, chipModes])

  const accountList = useMemo(
    () =>
      getFilteredAccounts(
        modeAccounts,
        currentAccount,
        accountSearch,
        accountFilter,
      ),
    [accountFilter, accountSearch, currentAccount, modeAccounts],
  )

  const { accountsWithBalances, areBalancesLoading } =
    useAccountsWithBalance(accountList)

  const groupedAccounts = useMemo(() => {
    const groups = new Map<WalletProviderType, WalletAccount[]>()

    for (const account of accountsWithBalances) {
      const group = groups.get(account.provider) ?? []
      group.push(account)
      groups.set(account.provider, group)
    }

    return Array.from(groups.entries()).map(([provider, groupAccounts]) => ({
      provider,
      wallet: getWallet(provider),
      accounts: groupAccounts,
    }))
  }, [accountsWithBalances])

  const handleAccountSelect = useCallback(
    (account: ReturnType<typeof toAccount>) => {
      onAccountSelect(account)
      if (!isControlled) {
        toggle()
      }
    },
    [isControlled, onAccountSelect, toggle],
  )

  const handleProviderSelect = (wallet: Wallet) => {
    setSelectedSource(wallet.provider)
  }

  const handleWalletClick = (wallet: Wallet) => {
    handleProviderSelect(wallet)

    const status = getStatus(wallet.provider)
    if (wallet.installed && status === WalletProviderStatus.Disconnected) {
      void enable(wallet.provider).catch(() => undefined)
    }
  }

  const handleWalletGroupSelect = (group: WalletSourceGroup) => {
    const selectableWallets = getSelectableWallets(
      group,
      connectedProviderTypes,
    )
    const [wallet] = selectableWallets

    if (wallet && selectableWallets.length === 1) {
      handleWalletClick(wallet)
      return
    }

    if (!wallet) {
      handleWalletClick(group.wallets[0])
      return
    }

    setSelectedSource(group.id)
  }

  const handleRecentWalletsConnect = () => {
    for (const provider of recentlyConnectedProviderTypes) {
      if (pendingProviderTypes.includes(provider)) continue
      enable(provider)
    }
  }

  if (isAddressBookOpen) {
    return (
      <AddressBookModal
        whitelist={[WalletMode.Substrate, WalletMode.EVM]}
        onBack={() => setIsAddressBookOpen(false)}
        onSelect={async (address) => {
          externalWalletForm.setValue("address", address.address, {
            shouldValidate: true,
          })
          const isConnected = await connectExternalWallet(address.address)

          if (!isConnected) {
            setIsAddressBookOpen(false)
          }
        }}
      />
    )
  }

  const shouldFoldOtherWallets =
    !showAccountPanel && visibleSuggestedWalletGroups.length >= 3
  const visibleOtherWalletPreview =
    shouldFoldOtherWallets && !isMoreWalletsListOpen
      ? visibleOtherWalletGroups.slice(0, 2)
      : visibleOtherWalletGroups
  const hasHiddenOtherWallets =
    shouldFoldOtherWallets &&
    visibleOtherWalletPreview.length < visibleOtherWalletGroups.length

  return (
    <SWalletManagementShell showAccountPanel={showAccountPanel}>
      <SModalHeader
        title={
          meta?.title ??
          (showAccountPanel
            ? t("provider.selectSourceWallet")
            : t("provider.selectSourceWalletOnly"))
        }
        description={
          meta?.description ??
          (showAccountPanel
            ? undefined
            : t("provider.selectSourceWalletDescription"))
        }
        align="center"
        showAccountPanel={showAccountPanel}
      />
      <SModalBody noPadding scrollable={false}>
        <SLayoutGrid showAccountPanel={showAccountPanel}>
          <SSourceColumn showAccountPanel={showAccountPanel}>
            <SSearchInput
              value={walletSearchValue}
              onChange={(event) => setWalletSearchValue(event.target.value)}
              customSize="large"
              iconStart={Search}
              placeholder={t("provider.searchWallets")}
            />

            <SSourceScrollFrame>
              <ScrollArea>
                <SScrollAreaContent
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: showAccountPanel ? pxToRem(10) : "base",
                  }}
                >
                  <SSourceSectionLabel fs="p5" fw={500} color="text.low">
                    {t("provider.installedAndRecent")}
                  </SSourceSectionLabel>

                  <SSourceList>
                    {showAccountPanel && (
                      <WalletSourceButton
                        active={selectedSource === "all"}
                        title={t("provider.allAccountsAndWallets")}
                        icon={WalletIcon}
                        onClick={() => setSelectedSource("all")}
                      />
                    )}

                    {recentlyConnectedProviderTypes.length > 0 && (
                      <WalletSourceButton
                        title={t("provider.recentlyConnected")}
                        subtitle={t("provider.connect")}
                        logos={recentlyConnectedProviderTypes}
                        pending={recentlyConnectedProviderTypes.some(
                          (provider) => pendingProviderTypes.includes(provider),
                        )}
                        variant={
                          showAccountPanel ? "management" : "firstConnection"
                        }
                        onClick={handleRecentWalletsConnect}
                      />
                    )}

                    {visibleSuggestedWalletGroups.map((group) =>
                      group.wallets.length === 1 ? (
                        <WalletProviderSourceButton
                          key={group.id}
                          wallet={group.wallets[0]}
                          active={selectedSource === group.wallets[0].provider}
                          status={getStatus(group.wallets[0].provider)}
                          pending={pendingProviderTypes.includes(
                            group.wallets[0].provider,
                          )}
                          variant={
                            showAccountPanel ? "management" : "firstConnection"
                          }
                          onClick={() => handleWalletClick(group.wallets[0])}
                          onDisconnect={() =>
                            disconnect(group.wallets[0].provider)
                          }
                        />
                      ) : (
                        <WalletGroupSourceButton
                          key={group.id}
                          group={group}
                          active={
                            selectedSource === group.id ||
                            group.providers.includes(
                              selectedSource as WalletProviderType,
                            )
                          }
                          connected={group.providers.some((provider) =>
                            connectedProviderTypes.includes(provider),
                          )}
                          pending={group.providers.some((provider) =>
                            pendingProviderTypes.includes(provider),
                          )}
                          variant={
                            showAccountPanel ? "management" : "firstConnection"
                          }
                          onClick={() => handleWalletGroupSelect(group)}
                        />
                      ),
                    )}

                    {showExternalWallet && (
                      <WalletProviderSourceButton
                        wallet={getWallet(WalletProviderType.ExternalWallet)}
                        active={
                          selectedSource === WalletProviderType.ExternalWallet
                        }
                        status={getStatus(WalletProviderType.ExternalWallet)}
                        pending={pendingProviderTypes.includes(
                          WalletProviderType.ExternalWallet,
                        )}
                        variant={
                          showAccountPanel ? "management" : "firstConnection"
                        }
                        onClick={() =>
                          setSelectedSource(WalletProviderType.ExternalWallet)
                        }
                        onDisconnect={() =>
                          disconnect(WalletProviderType.ExternalWallet)
                        }
                      />
                    )}

                    {hasConnectedWalletState && (
                      <WalletSourceButton
                        title={t("provider.logOutAll")}
                        icon={LogOut}
                        variant={
                          showAccountPanel ? "management" : "firstConnection"
                        }
                        onClick={() => disconnect()}
                      />
                    )}
                  </SSourceList>

                  {visibleOtherWalletGroups.length > 0 && (
                    <SSourceList>
                      <SSourceOtherSectionLabel
                        fs="p5"
                        fw={500}
                        color="text.low"
                        showAccountPanel={showAccountPanel}
                      >
                        {showAccountPanel
                          ? t("provider.otherWallets")
                          : t("provider.otherWalletsFirstConnection")}
                      </SSourceOtherSectionLabel>
                      {showAccountPanel ? (
                        <SMoreWalletsDropdown>
                          <WalletSourceButton
                            title={t("provider.moreWallets")}
                            onClick={() => setIsMoreOpen((open) => !open)}
                            action={
                              <Icon
                                size="xs"
                                component={
                                  isMoreWalletsListOpen
                                    ? ChevronUp
                                    : ChevronDown
                                }
                              />
                            }
                          />
                          {isMoreWalletsListOpen && (
                            <SMoreWalletsList>
                              {visibleOtherWalletGroups.map((group) =>
                                group.wallets.length === 1 ? (
                                  <WalletProviderSourceButton
                                    key={group.id}
                                    wallet={group.wallets[0]}
                                    active={
                                      selectedSource ===
                                      group.wallets[0].provider
                                    }
                                    status={getStatus(
                                      group.wallets[0].provider,
                                    )}
                                    pending={pendingProviderTypes.includes(
                                      group.wallets[0].provider,
                                    )}
                                    onClick={() =>
                                      handleWalletClick(group.wallets[0])
                                    }
                                    onDisconnect={() =>
                                      disconnect(group.wallets[0].provider)
                                    }
                                  />
                                ) : (
                                  <WalletGroupSourceButton
                                    key={group.id}
                                    group={group}
                                    active={selectedSource === group.id}
                                    connected={false}
                                    pending={group.providers.some((provider) =>
                                      pendingProviderTypes.includes(provider),
                                    )}
                                    onClick={() =>
                                      handleWalletGroupSelect(group)
                                    }
                                  />
                                ),
                              )}
                            </SMoreWalletsList>
                          )}
                        </SMoreWalletsDropdown>
                      ) : (
                        <>
                          {visibleOtherWalletPreview.map((group) =>
                            group.wallets.length === 1 ? (
                              <WalletProviderSourceButton
                                key={group.id}
                                wallet={group.wallets[0]}
                                active={
                                  selectedSource === group.wallets[0].provider
                                }
                                status={getStatus(group.wallets[0].provider)}
                                pending={pendingProviderTypes.includes(
                                  group.wallets[0].provider,
                                )}
                                variant="firstConnection"
                                onClick={() =>
                                  handleWalletClick(group.wallets[0])
                                }
                                onDisconnect={() =>
                                  disconnect(group.wallets[0].provider)
                                }
                              />
                            ) : (
                              <WalletGroupSourceButton
                                key={group.id}
                                group={group}
                                active={selectedSource === group.id}
                                connected={false}
                                pending={group.providers.some((provider) =>
                                  pendingProviderTypes.includes(provider),
                                )}
                                variant="firstConnection"
                                onClick={() => handleWalletGroupSelect(group)}
                              />
                            ),
                          )}
                          {(hasHiddenOtherWallets ||
                            (shouldFoldOtherWallets &&
                              isMoreWalletsListOpen)) && (
                            <WalletSourceButton
                              title={
                                isMoreWalletsListOpen
                                  ? t("provider.hide")
                                  : t("provider.showMore")
                              }
                              icon={
                                isMoreWalletsListOpen ? ChevronUp : ChevronDown
                              }
                              variant="firstConnectionPlain"
                              onClick={() => setIsMoreOpen((open) => !open)}
                            />
                          )}
                        </>
                      )}
                    </SSourceList>
                  )}
                </SScrollAreaContent>
              </ScrollArea>
            </SSourceScrollFrame>
          </SSourceColumn>

          <SRightPanelFrame
            aria-hidden={!showAccountPanel}
            showAccountPanel={showAccountPanel}
          >
            {selectedSource === WalletProviderType.ExternalWallet &&
            showExternalWallet ? (
              <SRightColumn>
                <SRightColumnBody>
                  <FormProvider {...externalWalletForm}>
                    <ExternalWalletForm
                      onAddressBookOpen={() => setIsAddressBookOpen(true)}
                      hideSubmitAction
                    />
                  </FormProvider>
                </SRightColumnBody>
              </SRightColumn>
            ) : showErrorState ? (
              <WalletErrorState
                error={error}
                onRetry={
                  recentProvider
                    ? () => enableWithDisconnectOnError(recentProvider)
                    : undefined
                }
              />
            ) : showWalletGroupChainSelectState && selectedWalletGroup ? (
              <WalletChainSelectState
                group={selectedWalletGroup}
                getStatus={getStatus}
                onConnect={(wallet) => enable(wallet.provider)}
                onInstall={(wallet) => {
                  if (wallet.installUrl) {
                    window.open(
                      wallet.installUrl,
                      "_blank",
                      "noopener,noreferrer",
                    )
                  }
                }}
                onSelect={handleProviderSelect}
              />
            ) : showSelectedWalletConnectState && selectedWallet ? (
              <WalletConnectState
                wallet={selectedWallet}
                isConnecting={
                  selectedWalletStatus === WalletProviderStatus.Pending
                }
                onConnect={() => enable(selectedWallet.provider)}
              />
            ) : (
              <SRightColumn>
                <SSearchInput
                  value={accountSearchValue}
                  onChange={(event) =>
                    setAccountSearchValue(event.target.value)
                  }
                  customSize="large"
                  iconStart={Search}
                  placeholder={t("account.searchAccounts")}
                />

                {chipModes.length > 0 && (
                  <Flex gap="base" wrap sx={{ flexShrink: 0 }}>
                    {chipModes.map((filter) => (
                      <SAccountFilterButton
                        key={filter}
                        variant={
                          accountFilter === filter ? "secondary" : "muted"
                        }
                        outline={accountFilter !== filter}
                        size="small"
                        onClick={() => setAccountFilter(filter)}
                      >
                        {filter === WalletMode.Default
                          ? t("accountFilter.all")
                          : getWalletModeName(filter)}
                      </SAccountFilterButton>
                    ))}
                  </Flex>
                )}

                <SAccountScrollFrame>
                  <ScrollArea>
                    <SScrollAreaContent
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "base",
                      }}
                    >
                      {isProvidersConnecting ? (
                        <ProviderLoader providers={pendingProviderTypes} />
                      ) : accountsWithBalances.length > 0 ? (
                        selectedSource === "all" ? (
                          groupedAccounts.map((group) => (
                            <WalletAccountSection
                              key={group.provider}
                              title={group.wallet?.title ?? group.provider}
                              logo={group.wallet?.logo}
                              accounts={group.accounts}
                              currentAccount={currentAccount}
                              isBalanceLoading={areBalancesLoading}
                              onAccountSelect={handleAccountSelect}
                            />
                          ))
                        ) : (
                          accountsWithBalances.map((account) => (
                            <WalletAccountTile
                              key={`${account.publicKey}-${account.provider}`}
                              account={account}
                              isActive={isAccountSelected(
                                currentAccount,
                                account,
                              )}
                              isBalanceLoading={areBalancesLoading}
                              onClick={() => handleAccountSelect(account)}
                            />
                          ))
                        )
                      ) : (
                        <SEmptyState>
                          <Text fs="p4" color="text.medium">
                            {t("account.noResults")}
                          </Text>
                        </SEmptyState>
                      )}
                    </SScrollAreaContent>
                  </ScrollArea>
                </SAccountScrollFrame>
              </SRightColumn>
            )}
          </SRightPanelFrame>
        </SLayoutGrid>
      </SModalBody>
    </SWalletManagementShell>
  )
}
