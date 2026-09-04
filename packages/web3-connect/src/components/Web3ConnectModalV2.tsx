import { hydration } from "@galacticcouncil/descriptors"
import { NeckworkClient } from "@galacticcouncil/indexer/neckwork"
import { Modal } from "@galacticcouncil/ui/components"
import { pxToRem } from "@galacticcouncil/ui/utils"
import { TypedApi } from "polkadot-api"
import { FC, useEffect, useMemo, useState } from "react"
import { I18nextProvider } from "react-i18next"
import { pick } from "remeda"
import { useShallow } from "zustand/shallow"

import { ExternalWalletContent } from "@/components/content/ExternalWalletContent"
import { MultisigConfigSelectContent } from "@/components/content/MultisigConfigSelectContent"
import { MultisigSetupContent } from "@/components/content/MultisigSetupContent"
import { MultisigSignerSelectContent } from "@/components/content/MultisigSignerSelectContent"
import { WalletManagementContent } from "@/components/content/WalletManagementContent"
import { Web3ConnectModalPage } from "@/config/modal"
import {
  useEmptyExtraAccountBalances,
  UseExtraAccountBalances,
  Web3ConnectContextType,
  Web3ConnectProvider,
} from "@/context/Web3ConnectContext"
import { Account, useWeb3Connect, WalletMode } from "@/hooks/useWeb3Connect"
import { useWeb3ConnectInit } from "@/hooks/useWeb3ConnectInit"
import { useWeb3ConnectModal } from "@/hooks/useWeb3ConnectModal"
import i18n from "@/i18n"

const contentMap: Record<Web3ConnectModalPage, React.ReactNode> = {
  [Web3ConnectModalPage.Wallets]: <WalletManagementContent />,
  [Web3ConnectModalPage.ExternalWallet]: <ExternalWalletContent />,
  [Web3ConnectModalPage.MultisigSetup]: <MultisigSetupContent />,
  [Web3ConnectModalPage.MultisigConfigSelect]: <MultisigConfigSelectContent />,
  [Web3ConnectModalPage.MultisigSignerSelect]: <MultisigSignerSelectContent />,
}

type ControlledProps = {
  readonly neckwork: NeckworkClient
  readonly papi: TypedApi<typeof hydration>
  readonly useExtraAccountBalances?: UseExtraAccountBalances
  readonly open: boolean
  readonly mode: WalletMode
  readonly onOpenChange: (open: boolean) => void
  readonly onAccountSelect: (account: Account) => void
}

type UncontrolledProps = {
  readonly neckwork: NeckworkClient
  readonly papi: TypedApi<typeof hydration>
  readonly useExtraAccountBalances?: UseExtraAccountBalances
}

type Props = ControlledProps | UncontrolledProps

type Web3ConnectModalContentProps = Props & {
  readonly setModalContentWidth: (width: string) => void
}

const Web3ConnectModalContent: FC<Web3ConnectModalContentProps> = (props) => {
  const { setModalContentWidth } = props
  const {
    neckwork,
    papi,
    useExtraAccountBalances = useEmptyExtraAccountBalances,
  } = props

  const isControlled =
    "open" in props &&
    "onOpenChange" in props &&
    "onAccountSelect" in props &&
    "mode" in props

  const store = useWeb3Connect(useShallow(pick(["setAccount", "mode", "meta"])))

  const mode = isControlled ? props.mode : store.mode
  const onAccountSelect = isControlled
    ? props.onAccountSelect
    : store.setAccount

  const { page, setPage } = useWeb3ConnectInit({
    initialPage: store.meta?.initialPage,
  })

  /**
   * Every page but Wallets is a fixed width. Wallets sizes itself from
   * `showAccountPanel` inside `WalletManagementContent`, so this must not fire
   * for it - two writers on one value is what made the error screen jump.
   */
  useEffect(() => {
    if (page === Web3ConnectModalPage.Wallets) return
    setModalContentWidth(pxToRem(650))
  }, [page, setModalContentWidth])

  const context = useMemo<Web3ConnectContextType>(
    () => ({
      isControlled,
      page,
      setPage,
      neckwork,
      papi,
      useExtraAccountBalances,
      onAccountSelect,
      mode,
      setModalContentWidth,
    }),
    [
      page,
      setPage,
      neckwork,
      useExtraAccountBalances,
      onAccountSelect,
      isControlled,
      mode,
      papi,
      setModalContentWidth,
    ],
  )
  return (
    <Web3ConnectProvider value={context}>
      {contentMap[page]}
    </Web3ConnectProvider>
  )
}

export const Web3ConnectModalV2: FC<Props> = (props) => {
  const isControlled =
    "open" in props && "onOpenChange" in props && "onAccountSelect" in props

  const modalState = useWeb3ConnectModal()
  const [modalContentWidth, setModalContentWidth] = useState(pxToRem(650))

  const open = isControlled ? props.open : modalState.open
  const onOpenChange = isControlled
    ? props.onOpenChange
    : () => modalState.toggle()

  return (
    <I18nextProvider i18n={i18n}>
      <Modal
        variant="popup"
        open={open}
        onOpenChange={onOpenChange}
        disableInteractOutside
        contentWidth={modalContentWidth}
      >
        <Web3ConnectModalContent
          {...props}
          setModalContentWidth={setModalContentWidth}
        />
      </Modal>
    </I18nextProvider>
  )
}
