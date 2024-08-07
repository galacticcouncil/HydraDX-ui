import { MemepadActionBar } from "./components/MemepadActionBar"
import { RouteBlockModal } from "./modal/RouteBlockModal"
import { MemepadSummary } from "sections/memepad/components/MemepadSummary"
import { useRpcProvider } from "providers/rpcProvider"
import { MemepadForm } from "./form/MemepadForm"
import { MemepadSpinner } from "./components/MemepadSpinner"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { Web3ConnectModalButton } from "sections/web3-connect/modal/Web3ConnectModalButton"
import { MemepadLayout } from "./components/MemepadLayout"
import {
  MemepadFormProvider,
  useMemepadFormContext,
} from "./form/MemepadFormContext"
import { useMemepadDryRun } from "./form/MemepadForm.utils"
import { isEvmAccount } from "utils/evm"
import { Alert } from "components/Alert/Alert"
import { useWeb3ConnectStore } from "sections/web3-connect/store/useWeb3ConnectStore"
import { Button } from "components/Button/Button"
import { Text } from "components/Typography/Text/Text"
import { useTranslation } from "react-i18next"

const MemepadPageContent = () => {
  const { isLoaded } = useRpcProvider()

  const { step, submit, isFinalized, isLoading, form, reset, alerts } =
    useMemepadFormContext()

  const { isLoading: isDryRunLoading } = useMemepadDryRun()

  const submitDisabled = !isLoaded || isDryRunLoading || alerts.length > 0

  return (
    <>
      {isFinalized ? (
        <MemepadSummary values={form.getValues()} onReset={reset} />
      ) : (
        <MemepadLayout>
          {isLoaded ? <MemepadForm /> : <MemepadSpinner />}
          <MemepadActionBar
            step={step}
            disabled={submitDisabled}
            isLoading={isLoading}
            onSubmit={submit}
          />
        </MemepadLayout>
      )}
      <RouteBlockModal />
    </>
  )
}

export const MemepadPage = () => {
  const { t } = useTranslation()
  const { account } = useAccount()
  const { disconnect } = useWeb3ConnectStore()

  if (!account) {
    return (
      <MemepadLayout>
        <Web3ConnectModalButton sx={{ width: "100%" }} />
      </MemepadLayout>
    )
  }

  if (isEvmAccount(account.address)) {
    return (
      <MemepadLayout>
        <Alert variant="warning">
          <div sx={{ flex: ["column", "row"], gap: 10 }}>
            <Text>{t("memepad.alert.evmAccount")}</Text>
            <Button
              variant="outline"
              size="small"
              onClick={disconnect}
              css={{ borderColor: "white" }}
            >
              {t("walletConnect.logout")}
            </Button>
          </div>
        </Alert>
      </MemepadLayout>
    )
  }

  return (
    <MemepadFormProvider key={account.address}>
      <MemepadPageContent />
    </MemepadFormProvider>
  )
}
