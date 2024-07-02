import ChevronRight from "assets/icons/ChevronRight.svg?react"
import DownloadIcon from "assets/icons/DownloadIcon.svg?react"
import { Text } from "components/Typography/Text/Text"
import { FC } from "react"
import { useTranslation } from "react-i18next"
import {
  WalletProvider,
  WalletProviderType,
  useEnableWallet,
} from "sections/web3-connect/Web3Connect.utils"
import { SProviderButton } from "./Web3ConnectProviders.styled"
import {
  WalletProviderStatus,
  useWeb3ConnectStore,
} from "sections/web3-connect/store/useWeb3ConnectStore"

type Props = WalletProvider

export const Web3ConnectProviderButton: FC<Props> = ({ type, wallet }) => {
  const { t } = useTranslation()

  const { setStatus, setError } = useWeb3ConnectStore()

  const { logo, title, installed, installUrl } = wallet

  const { enable } = useEnableWallet(type, {
    onMutate: () => setStatus(type, WalletProviderStatus.Pending),
    onSuccess: () => setStatus(type, WalletProviderStatus.Connected),
    onError: (error) => {
      setStatus(type, WalletProviderStatus.Error)
      if (error instanceof Error && error.message) {
        setError(error.message)
      }
    },
  })

  function onClick() {
    if (type === WalletProviderType.WalletConnect) {
      // defer WalletConnect enabling until the user clicks chooses a chain to connect to
      setStatus(type, WalletProviderStatus.Pending)
    } else {
      installed ? enable() : openInstallUrl(installUrl)
    }
  }

  return (
    <SProviderButton onClick={onClick} type="button">
      <img src={logo.src} alt={logo.alt} width={40} height={40} />
      <Text fs={18} css={{ flexGrow: 1 }}>
        {title}
      </Text>
      <Text
        color="brightBlue300"
        fs={14}
        tAlign="right"
        sx={{ flex: "row", align: "center", gap: 4 }}
      >
        {installed ? (
          <>
            {t("walletConnect.provider.continue")}
            <ChevronRight />
          </>
        ) : (
          <>
            {t("walletConnect.provider.download")}
            <DownloadIcon />
          </>
        )}
      </Text>
    </SProviderButton>
  )
}

function openInstallUrl(installUrl: string) {
  window.open(installUrl, "_blank")
}
