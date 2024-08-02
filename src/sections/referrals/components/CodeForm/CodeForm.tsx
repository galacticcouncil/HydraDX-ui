import { Controller, useForm } from "react-hook-form"
import { FormValues } from "utils/helpers"
import { WavySeparator } from "components/WavySeparator/WavySeparator"
import { CodeInput } from "sections/referrals/components/CodeInput/CodeInput"
import { CodePreview } from "sections/referrals/components/CodePreview/CodePreview"
import { Button } from "components/Button/Button"
import { useTranslation } from "react-i18next"
import { REFERRAL_CODE_REGEX } from "sections/referrals/ReferralsPage.utils"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { Web3ConnectModalButton } from "sections/web3-connect/modal/Web3ConnectModalButton"
import { useEffect } from "react"
import { FundWalletButton } from "components/FundWallet/FundWalletButton"
import { useAccountBalances } from "api/accountBalances"
import {
  CodeFormValues,
  UserState,
  defaultCodeFormValues,
  getUserState,
  useRegisterReferralCode,
} from "./CodeForm.utils"
import {
  useReferralCodeLength,
  useReferralCodes,
  useRegistrationLinkFee,
} from "api/referrals"
import { getChainSpecificAddress } from "utils/formatting"
import { useTokenBalance } from "api/balances"
import { useAccountCurrency } from "api/payments"
import { usePaymentInfo } from "api/transaction"
import { useRpcProvider } from "providers/rpcProvider"
import { useAssets } from "providers/assets"

export const CodeForm = () => {
  const { t } = useTranslation()
  const { account } = useAccount()
  const { native } = useAssets()
  const { api } = useRpcProvider()
  const referralLength = useReferralCodeLength()

  const registerReferralCode = useRegisterReferralCode()
  const registrationFee = useRegistrationLinkFee()

  const form = useForm<CodeFormValues>({
    mode: "onChange",
    defaultValues: defaultCodeFormValues,
  })

  const referralCode = form.watch("referralCode")

  const accountFeePaymentAsset = useAccountCurrency(account?.address)
  const paymentInfo = usePaymentInfo(
    api.tx.referrals.registerCode(referralCode),
    !(
      referralCode.length &&
      accountFeePaymentAsset.data === registrationFee.data?.id
    ),
  )

  const linkFeeBalance = useTokenBalance(
    registrationFee.data?.id,
    account?.address,
  )

  const balances = useAccountBalances(account?.address)

  const isLinkFeeBalance =
    registrationFee.data && linkFeeBalance.data
      ? linkFeeBalance.data.balance
          .shiftedBy(-registrationFee.data.decimals)
          .minus(registrationFee.data.amount)
          .minus(
            paymentInfo.data?.partialFee
              .toBigNumber()
              .shiftedBy(-native.decimals) ?? 0,
          )
          .isPositive()
      : false

  const userReferralCode = useReferralCodes(
    account?.address ? getChainSpecificAddress(account.address) : undefined,
  )
  const referralCodes = useReferralCodes("all")

  const existingReferralCode = userReferralCode.data?.[0]?.referralCode

  const onSubmit = async (values: FormValues<typeof form>) => {
    account?.address &&
      registerReferralCode.mutate({
        referralCode: values.referralCode,
        accountAddress: account.address,
      })
  }

  const isBalance = balances.data
    ? balances.data.balances.length > 0 ||
      !balances.data.native.freeBalance.isZero()
    : undefined

  const isBalanceLoading = balances.isInitialLoading

  const state = getUserState(account?.address, isBalance)
  const isDisabled = state !== UserState.FUNDED

  useEffect(() => {
    if (
      form.getFieldState("referralCode").isDirty &&
      state === UserState.DISCONECTED
    ) {
      form.reset()
    }
  }, [form, state])

  const { minLength, maxLength } = referralLength.data ?? {}

  return (
    <>
      {!existingReferralCode && (
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          autoComplete="off"
          sx={{ flex: ["column", "row"], gap: [18, 12], mt: 40 }}
        >
          <Controller
            name="referralCode"
            control={form.control}
            rules={{
              required: t("referrals.input.error.required"),
              validate: {
                alphanumeric: (value) =>
                  REFERRAL_CODE_REGEX.test(value) ||
                  t("referrals.input.error.alphanumeric"),
                minLength: (value) =>
                  (minLength && value.length >= minLength.toNumber()) ||
                  t("referrals.input.error.minLength", {
                    length: minLength,
                  }),
                maxLength: (value) =>
                  (maxLength && value.length <= maxLength.toNumber()) ||
                  t("referrals.input.error.maxLength", {
                    length: maxLength,
                  }),
                validCode: (value) =>
                  !referralCodes.data?.some(
                    (referralCode) => referralCode?.referralCode === value,
                  ) || t("referrals.input.error.existingCode"),
                isFeeBalance: () =>
                  isLinkFeeBalance ||
                  t("referrals.input.error.feeBalance", {
                    amount: registrationFee.data?.amount,
                    symbol: registrationFee.data?.symbol,
                  }),
              },
            }}
            render={({ field, fieldState }) => (
              <CodeInput
                {...field}
                onBlur={(data) =>
                  !data.target.value.length && form.clearErrors("referralCode")
                }
                value={field.value}
                disabled={isDisabled}
                error={fieldState.error?.message}
                sx={{ width: ["100%", "50%"] }}
                placeholder={
                  state === UserState.FUNDED
                    ? t("referrals.input.placeholder.referralCode")
                    : state === UserState.NOT_FUNDED
                      ? t("referrals.input.placeholder.deposit")
                      : state === UserState.DISCONECTED
                        ? t("referrals.input.placeholder.connect")
                        : ""
                }
              />
            )}
          />
          <div sx={{ height: 54, flex: "row" }}>
            {(state === UserState.FUNDED || isBalanceLoading) && (
              <Button
                isLoading={isBalanceLoading}
                disabled={account?.isExternalWalletConnected}
                variant="primary"
                fullWidth
              >
                {t("referrals.button.sign")}
              </Button>
            )}
            {state === UserState.NOT_FUNDED && (
              <FundWalletButton fullWidth variant="primary" type="button">
                {t("referrals.button.depositFunds")}
              </FundWalletButton>
            )}
            {state === UserState.DISCONECTED && (
              <Web3ConnectModalButton
                sx={{ width: "100%", height: "auto", px: 30 }}
              />
            )}
          </div>
        </form>
      )}
      <WavySeparator sx={{ my: 24, opacity: 0.15 }} />
      <CodePreview
        disabled={isDisabled}
        code={existingReferralCode ?? referralCode}
        hasExistingCode={!!existingReferralCode}
      />
    </>
  )
}
