import { useMemo } from "react"
import { FormProvider } from "react-hook-form"

import { useMultisigSetupForm } from "@/components/multisig/MultisigSetup.form"
import { MultisigSetupNew } from "@/components/multisig/MultisigSetupNew"
import { SUBSTRATE_PROVIDERS } from "@/config/providers"
import { useWeb3Connect } from "@/hooks/useWeb3Connect"

/**
 * The setup form plus its form context, without modal chrome - rendered as its
 * own modal page and inside the wallet-management right column.
 */
export const MultisigSetupPanel: React.FC<{
  readonly onContinue: () => void
}> = ({ onContinue }) => {
  const { account } = useWeb3Connect()

  const defaultSignerAddress = useMemo(() => {
    if (
      account &&
      !account.isMultisig &&
      SUBSTRATE_PROVIDERS.includes(account.provider)
    ) {
      return account.address
    }
    return undefined
  }, [account])

  const form = useMultisigSetupForm({ defaultSignerAddress })

  return (
    <FormProvider {...form}>
      <MultisigSetupNew
        isSignerPrefilled={!!defaultSignerAddress}
        onContinue={onContinue}
      />
    </FormProvider>
  )
}
