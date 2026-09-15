import { Trash2 } from "@galacticcouncil/ui/assets/icons"
import {
  AccountAvatar,
  AccountInput,
  Button,
  ButtonIcon,
  Expander,
  Flex,
  FormError,
  Icon,
  Paper,
  Stack,
  Text,
} from "@galacticcouncil/ui/components"
import { getToken } from "@galacticcouncil/ui/utils"
import { safeConvertAddressSS58 } from "@galacticcouncil/utils"
import {
  Control,
  Controller,
  FieldArrayWithId,
  FieldError,
  FieldErrors,
} from "react-hook-form"
import { useTranslation } from "react-i18next"

import { AccountIdentity } from "@/components/account/AccountIdentity"
import { SMultisigAccount } from "@/components/multisig/components/MultisigAccount.styled"
import { MultisigSetupFormValues } from "@/components/multisig/MultisigSetup.form"
import { useWeb3ConnectContext } from "@/context/Web3ConnectContext"

type SignersStepProps = {
  fields: FieldArrayWithId<MultisigSetupFormValues, "signers">[]
  signers: MultisigSetupFormValues["signers"]
  errors: FieldErrors<MultisigSetupFormValues>
  control: Control<MultisigSetupFormValues>
  onAddSigner: (proposedLastValue?: string) => void
  onRemoveSigner: (index: number) => void
  onContinue: () => void
  canContinue: boolean
}

function getSignersRootMessage(
  signersFieldError: FieldErrors<MultisigSetupFormValues>["signers"],
): string | undefined {
  if (
    signersFieldError &&
    typeof signersFieldError === "object" &&
    "root" in signersFieldError &&
    signersFieldError.root &&
    typeof signersFieldError.root === "object" &&
    "message" in signersFieldError.root
  ) {
    return String(signersFieldError.root.message)
  }
  return undefined
}

export const SignersStep: React.FC<SignersStepProps> = ({
  fields,
  signers,
  errors,
  control,
  onAddSigner,
  onRemoveSigner,
  onContinue,
  canContinue,
}) => {
  const { t } = useTranslation()
  const { papi } = useWeb3ConnectContext()
  const lastIndex = fields.length - 1
  const lastValue = signers[lastIndex]?.value ?? ""

  const isAddDisabled = !lastValue || !!errors.signers?.[lastIndex]?.value

  return (
    <Stack gap="base" pb="xl" px="s" pt={0}>
      {fields.map((field, index) => {
        const signerValue = signers[index]?.value ?? ""

        if (index < lastIndex) {
          return (
            <Expander key={field.id} expanded>
              <SMultisigAccount>
                <AccountAvatar address={signerValue} />
                <Stack sx={{ minWidth: 0 }}>
                  <Flex gap="s" align="center">
                    <AccountIdentity
                      papi={papi}
                      fs="p5"
                      truncate
                      color={getToken("text.medium")}
                      address={signerValue}
                    />
                  </Flex>
                  <Text fs="p5" fw={500} color={getToken("text.high")} truncate>
                    {safeConvertAddressSS58(signerValue)}
                  </Text>
                </Stack>
                <ButtonIcon
                  variant="muted"
                  outline
                  size="small"
                  sx={{ flexShrink: 0, ml: "auto" }}
                  onClick={() => onRemoveSigner(index)}
                  type="button"
                >
                  <Icon size="s" component={Trash2} />
                </ButtonIcon>
              </SMultisigAccount>
            </Expander>
          )
        }

        return (
          <Stack gap="xs" key={field.id}>
            <Controller
              control={control}
              name={`signers.${index}.value`}
              render={({ field: { onChange, value }, fieldState }) => {
                const nestedError = errors.signers?.[index]?.value as
                  | FieldError
                  | undefined
                const rootMsg = getSignersRootMessage(errors.signers)
                const message =
                  fieldState.error?.message ?? nestedError?.message ?? rootMsg

                const hasError = !!(
                  fieldState.error ||
                  nestedError?.message ||
                  rootMsg
                )

                return (
                  <>
                    <Paper shadow={false} asChild borderRadius="m">
                      <Flex align="center" px="m" py="s" borderRadius="m">
                        <AccountInput
                          value={value}
                          pasteDisabled
                          clearDisabled
                          onChange={(raw) => {
                            onChange(raw)
                          }}
                          onPaste={(e) => {
                            const text = e.clipboardData.getData("text/plain")
                            e.preventDefault()
                            const trimmed = text.trim()
                            onChange(trimmed)
                            onAddSigner(trimmed)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !isAddDisabled) {
                              e.preventDefault()
                              onAddSigner()
                            }
                          }}
                          placeholder={t("multisig.setup.signerPlaceholder")}
                          isError={hasError}
                          sx={{ flex: 1, py: "s" }}
                        />
                        <Button
                          variant={isAddDisabled ? "muted" : "accent"}
                          outline
                          size="small"
                          sx={{ mt: "xs", flexShrink: 0 }}
                          onClick={() => onAddSigner()}
                          type="button"
                          disabled={isAddDisabled}
                        >
                          {t("multisig.setup.addSigner")}
                        </Button>
                      </Flex>
                    </Paper>
                    {message && <FormError>{message}</FormError>}
                  </>
                )
              }}
            />
          </Stack>
        )
      })}

      <Button
        variant={canContinue ? "secondary" : "tertiary"}
        size="large"
        type="button"
        disabled={!canContinue}
        onClick={onContinue}
        width="100%"
        sx={{ mt: "s" }}
      >
        {t("multisig.setup.new.continueToThreshold")}
      </Button>
    </Stack>
  )
}
