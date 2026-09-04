import { Close } from "@galacticcouncil/ui/assets/icons"
import {
  AccountAvatar,
  Box,
  BoxProps,
  Button,
  ButtonIcon,
  CopyButton,
  Flex,
  FormError,
  Icon,
  Input,
  Separator,
  Stack,
  Text,
} from "@galacticcouncil/ui/components"
import { getToken } from "@galacticcouncil/ui/utils"
import {
  isEvmParachainAccount,
  isH160Address,
  safeConvertAddressH160,
  safeConvertAddressSS58,
  safeConvertSS58toH160,
  safeConvertSS58toPublicKey,
  stringEquals,
} from "@galacticcouncil/utils"
import { ArrowDownToLine } from "lucide-react"
import { useCallback, useMemo } from "react"
import { Controller, useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { first, pick } from "remeda"
import { useShallow } from "zustand/shallow"

import { AccountDeleteButton } from "@/components/account/AccountDeleteButton"
import { ShortAddress } from "@/components/account/ShortAddress"
import {
  Address,
  useAddressStore,
} from "@/components/address-book/AddressBook.store"
import { AddressBookButton } from "@/components/address-book/AddressBookButton"
import { ExternalWalletFormValues } from "@/components/external/ExternalWalletForm.form"
import { WalletProviderType } from "@/config/providers"
import { WalletMode } from "@/config/wallet"
import { useWeb3Connect, useWeb3Enable } from "@/hooks"
import { toStoredAccount } from "@/utils"
import { getWalletModeByAddress, getWalletModeIcon } from "@/utils/wallet"
import { ExternalWallet, getWallet } from "@/wallets"

type ExternalWalletFormProps = {
  readonly onAddressBookOpen: () => void
  readonly hideSubmitAction?: boolean
}

const externalWalletPublicKey = (address: string) =>
  isH160Address(address) ? address : safeConvertSS58toPublicKey(address)

export const useExternalWalletConnection = () => {
  const { enable } = useWeb3Enable()
  const { setAccount, toggle } = useWeb3Connect(
    useShallow(pick(["setAccount", "toggle"])),
  )
  const { add: addAddress } = useAddressStore()
  const wallet = getWallet(WalletProviderType.ExternalWallet)

  const addExternalWalletAddress = useCallback(
    (address: string) => {
      const normalizedAddress = normalizeExternalWalletAddress(address)
      if (!normalizedAddress) return ""

      const publicKey = externalWalletPublicKey(normalizedAddress)
      if (!publicKey) return ""

      addAddress({
        address: normalizedAddress,
        name: "",
        provider: WalletProviderType.ExternalWallet,
        isCustom: true,
      })

      return normalizedAddress
    },
    [addAddress],
  )

  const connectExternalWallet = useCallback(
    async (address: string) => {
      const isExternalWallet = wallet instanceof ExternalWallet

      if (!isExternalWallet) return false

      const normalizedAddress = addExternalWalletAddress(address)
      if (!normalizedAddress) return false

      const isAccountSet = wallet.setAccount(normalizedAddress, true)
      if (!isAccountSet) return false

      await enable(WalletProviderType.ExternalWallet)

      const accounts = await wallet.getAccounts()
      const account = first(accounts)

      if (account) {
        setAccount(toStoredAccount(account))
        toggle()
        return true
      }

      return false
    },
    [addExternalWalletAddress, enable, setAccount, toggle, wallet],
  )

  return {
    addExternalWalletAddress,
    connectExternalWallet,
  }
}

export const ExternalWalletForm: React.FC<ExternalWalletFormProps> = ({
  onAddressBookOpen,
  hideSubmitAction = false,
}) => {
  const { t } = useTranslation()
  const form = useFormContext<ExternalWalletFormValues>()
  const addresses = useAddressStore((state) => state.addresses)
  const removeAddress = useAddressStore((state) => state.remove)
  const { addExternalWalletAddress, connectExternalWallet } =
    useExternalWalletConnection()

  const savedWallets = useMemo(
    () =>
      addresses.filter((address) => {
        if (
          !address.isCustom ||
          address.provider !== WalletProviderType.ExternalWallet
        )
          return false

        const mode = getWalletModeByAddress(address.address)
        return mode === WalletMode.Substrate || mode === WalletMode.EVM
      }),
    [addresses],
  )
  const currentAddress = form.watch("address")
  const normalizedCurrentAddress =
    normalizeExternalWalletAddress(currentAddress)
  const isCurrentAddressSaved = savedWallets.some((address) =>
    stringEquals(address.address, normalizedCurrentAddress),
  )
  const canSaveCurrentAddress =
    !!currentAddress.trim() &&
    !!normalizedCurrentAddress &&
    form.formState.errors.address === undefined &&
    !isCurrentAddressSaved

  const saveCurrentExternalWalletAddress = async () => {
    const isValid = await form.trigger("address")
    if (!isValid) return

    const normalizedAddress = addExternalWalletAddress(currentAddress)
    if (normalizedAddress) {
      form.setValue("address", normalizedAddress, { shouldValidate: true })
    }
  }

  const onSubmit = async (values: ExternalWalletFormValues) => {
    await connectExternalWallet(values.address)
  }

  const onSavedWalletSelect = async (address: Address) => {
    form.setValue("address", address.address, { shouldValidate: true })
    await connectExternalWallet(address.address)
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Stack gap="var(--modal-content-padding)">
        <Controller
          name="address"
          control={form.control}
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <Stack gap="m">
              <ExternalWalletAddressInput
                value={value}
                onChange={onChange}
                onAddressBookOpen={onAddressBookOpen}
                label={t("external.addressLabel")}
                placeholder={t("external.addressPlaceholder")}
                isError={!!error}
                canSave={canSaveCurrentAddress}
                isSaved={isCurrentAddressSaved}
                onSave={saveCurrentExternalWalletAddress}
              />
              {error && <FormError>{error.message}</FormError>}
            </Stack>
          )}
        />
        {savedWallets.length > 0 && (
          <SavedExternalWallets
            wallets={savedWallets}
            onSelect={onSavedWalletSelect}
            onRemove={(address) => removeAddress(address.publicKey)}
          />
        )}
        {!hideSubmitAction && (
          <>
            <Separator mx="var(--modal-content-inset)" />
            <Button type="submit" size="large" width="100%">
              {t("external.confirm")}
            </Button>
          </>
        )}
      </Stack>
    </form>
  )
}

const normalizeExternalWalletAddress = (address: string) =>
  safeConvertAddressH160(address) ||
  (isEvmParachainAccount(address) ? safeConvertSS58toH160(address) : "") ||
  safeConvertAddressSS58(address) ||
  address

const ExternalWalletAddressInput: React.FC<{
  readonly value: string
  readonly onChange: (value: string) => void
  readonly onAddressBookOpen: () => void
  readonly label: string
  readonly placeholder: string
  readonly isError: boolean
  readonly canSave: boolean
  readonly isSaved: boolean
  readonly onSave: () => void
}> = ({
  value,
  onChange,
  onAddressBookOpen,
  label,
  placeholder,
  isError,
  canSave,
  isSaved,
  onSave,
}) => {
  const { t } = useTranslation()
  const hasValue = value.trim().length > 0

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      onChange(text)
    } catch (error) {
      console.warn("Failed to read clipboard:", error)
    }
  }

  return (
    <Input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      aria-label={label}
      customSize="large"
      isError={isError}
      spellCheck={false}
      sx={externalAddressInputSx}
      trailingElement={
        <Flex align="center" gap="xs" sx={{ flexShrink: 0 }}>
          {hasValue ? (
            <>
              <Button
                size="small"
                variant="secondary"
                disabled={!canSave && !isSaved}
                sx={externalAddressInlineButtonSx}
                onClick={canSave ? onSave : undefined}
              >
                {isSaved
                  ? t("external.addressSaved")
                  : t("external.saveAddress")}
              </Button>
              <ButtonIcon
                aria-label={t("external.clearAddress")}
                sx={externalAddressActionButtonSx}
                onClick={() => onChange("")}
              >
                <Icon size="s" component={Close} />
              </ButtonIcon>
            </>
          ) : (
            <>
              <ButtonIcon
                aria-label={t("external.pasteAddress")}
                sx={externalAddressActionButtonSx}
                onClick={handlePaste}
              >
                <Icon size="s" component={ArrowDownToLine} />
              </ButtonIcon>
              <AddressBookButton
                sx={externalAddressContactsButtonSx}
                onClick={onAddressBookOpen}
              />
            </>
          )}
        </Flex>
      }
    />
  )
}

const SavedExternalWallets: React.FC<{
  readonly wallets: Address[]
  readonly onSelect: (address: Address) => void
  readonly onRemove: (address: Address) => void
}> = ({ wallets, onSelect, onRemove }) => {
  const { t } = useTranslation()

  return (
    <Flex direction="column" gap="base">
      <Flex align="center">
        <Text fs="p5" fw={500} color="text.high">
          {t("external.savedWallets")}
        </Text>
      </Flex>
      <Flex direction="column" gap="base">
        {wallets.map((wallet) => (
          <SavedExternalWalletTile
            key={wallet.publicKey}
            wallet={wallet}
            onSelect={() => onSelect(wallet)}
            onRemove={() => onRemove(wallet)}
          />
        ))}
      </Flex>
    </Flex>
  )
}

// ponytail: inline rename dropped — blueprint used EditableText (packages/ui,
// out of scope per Non-Goals). Names stay editable via the address book modal.
const SavedExternalWalletTile: React.FC<{
  readonly wallet: Address
  readonly onSelect: () => void
  readonly onRemove: () => void
}> = ({ wallet, onSelect, onRemove }) => {
  const { t } = useTranslation()
  const mode = getWalletModeByAddress(wallet.address)
  const modeIcon = mode ? getWalletModeIcon(mode) : null

  return (
    <Flex
      align="center"
      gap="base"
      role="button"
      tabIndex={0}
      sx={savedExternalWalletTileSx}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onSelect()
        }
      }}
    >
      <Box sx={{ flexShrink: 0 }}>
        <AccountAvatar address={wallet.address} size={32} />
      </Box>
      <Flex direction="column" gap="xs" sx={{ minWidth: 0, flex: 1 }}>
        <Flex align="center" gap="s" sx={{ minWidth: 0 }}>
          {modeIcon && (
            <img sx={{ size: "xs", flexShrink: 0 }} src={modeIcon} />
          )}
          <Text
            fs="p5"
            color={getToken("text.medium")}
            font="mono"
            truncate={320}
          >
            <ShortAddress address={wallet.address} length={10} />
          </Text>
        </Flex>
      </Flex>
      <Flex align="center" gap="base">
        <Box
          asChild
          sx={savedExternalWalletCopyButtonSx}
          onClick={(event) => event.stopPropagation()}
        >
          <CopyButton aria-label="Copy address" text={wallet.address} />
        </Box>
        <AccountDeleteButton
          aria-label={t("external.removeAddress")}
          onClick={onRemove}
        />
      </Flex>
    </Flex>
  )
}

const savedExternalWalletTileSx: BoxProps["sx"] = {
  p: "base",
  borderRadius: "m",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: getToken("details.borders"),
  bg: getToken("surfaces.containers.dim.dimOnBg"),
  cursor: "pointer",
  transition: "colors",
  "&:hover": {
    borderColor: getToken("buttons.secondary.outline.outline"),
    bg: getToken("buttons.secondary.outline.fill"),
  },
}

const externalAddressInputSx: BoxProps["sx"] = {
  minWidth: 0,
  input: {
    minWidth: 0,
    textOverflow: "ellipsis",
  },
}

const externalAddressActionButtonSx: BoxProps["sx"] = {
  color: getToken("text.medium"),
  flexShrink: 0,
  p: "xs",
  "&:hover:not(:disabled)": {
    color: getToken("text.high"),
  },
}

const externalAddressInlineButtonSx: BoxProps["sx"] = {
  py: "s",
  px: "m",
  height: "auto",
  flexShrink: 0,
}

const externalAddressContactsButtonSx: BoxProps["sx"] = {
  py: "s",
  px: "m",
  height: "auto",
  flexShrink: 0,
}

const savedExternalWalletCopyButtonSx: BoxProps["sx"] = {
  display: "flex",
  color: getToken("text.medium"),
  cursor: "pointer",
  flexShrink: 0,
  "&[data-copied='true']": {
    color: getToken("accents.success.emphasis"),
  },
  "&:hover:not(:disabled)": {
    color: getToken("text.high"),
  },
}
