import { css } from "@emotion/react"
import { useExistentialDeposit, useTokenBalance } from "api/balances"
import { usePaymentInfo } from "api/transaction"
import {
  useNextClaimableDate,
  useVestingTotalClaimableBalance,
} from "api/vesting"
import { DisplayValue } from "components/DisplayValue/DisplayValue"
import { Heading } from "components/Typography/Heading/Heading"
import { Text } from "components/Typography/Text/Text"
import { useCallback, useMemo } from "react"
import { Trans, useTranslation } from "react-i18next"
import { ToastMessage, useStore } from "state/store"
import { TOAST_MESSAGES } from "state/toasts"
import { theme } from "theme"
import { separateBalance } from "utils/balance"
import { BN_10 } from "utils/constants"
import { useDisplayPrice } from "utils/displayAsset"
import { SClaimButton, SInner, SSchedule } from "./WalletVestingSchedule.styled"
import { useRpcProvider } from "providers/rpcProvider"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { useAssets } from "providers/assets"

export const WalletVestingSchedule = () => {
  const { t } = useTranslation()
  const { api } = useRpcProvider()
  const { native } = useAssets()
  const { createTransaction } = useStore()
  const { account } = useAccount()
  const { data: claimableBalance } = useVestingTotalClaimableBalance()

  const { data: nextClaimableDate } = useNextClaimableDate()
  const { data: paymentInfoData } = usePaymentInfo(api.tx.vesting.claim())
  const { data: existentialDeposit } = useExistentialDeposit()

  const spotPrice = useDisplayPrice(native.id)
  const balance = useTokenBalance(native.id, account?.address)

  const claimableDisplay = useMemo(() => {
    if (claimableBalance && spotPrice.data) {
      return claimableBalance
        .times(spotPrice.data.spotPrice)
        .div(BN_10.pow(native.decimals))
    }
    return null
  }, [claimableBalance, native, spotPrice.data])

  const isClaimAllowed = useMemo(() => {
    if (paymentInfoData && existentialDeposit && claimableBalance) {
      return claimableBalance.isGreaterThan(
        existentialDeposit.plus(paymentInfoData.partialFee.toBigNumber()),
      )
    }

    return false
  }, [paymentInfoData, existentialDeposit, claimableBalance])

  const handleClaim = useCallback(async () => {
    const toast = TOAST_MESSAGES.reduce((memo, type) => {
      const msType = type === "onError" ? "onLoading" : type
      memo[type] = (
        <Trans
          t={t}
          i18nKey={`wallet.vesting.toast.${msType}`}
          tOptions={{
            amount: claimableBalance,
            fixedPointScale: native.decimals,
            symbol: native.symbol,
          }}
        >
          <span />
          <span className="highlight" />
        </Trans>
      )
      return memo
    }, {} as ToastMessage)

    return !!account?.delegate
      ? await createTransaction(
          {
            tx: api.tx.vesting.claimFor(account?.address),
          },
          { isProxy: true, toast },
        )
      : await createTransaction(
          {
            tx: api.tx.vesting.claim(),
          },
          { toast },
        )
  }, [api, account, createTransaction, claimableBalance, native, t])

  return (
    <SSchedule>
      <SInner>
        <div
          sx={{
            flex: "column",
            gap: 6,
          }}
        >
          <Text color="brightBlue200" fs={[14, 16]} fw={500}>
            {t("wallet.vesting.claimable_now")}
          </Text>
          <Heading as="h3" font="GeistMono" sx={{ fontSize: [28, 34] }}>
            <Trans
              t={t}
              i18nKey="wallet.vesting.claimable_now_value"
              tOptions={{
                ...separateBalance(claimableBalance, {
                  fixedPointScale: native.decimals,
                  type: "token",
                }),
                symbol: native.symbol,
              }}
            >
              <span
                sx={{ fontSize: [14, 21] }}
                css={css`
                  color: rgba(${theme.rgbColors.white}, 0.4);
                `}
              />
            </Trans>
          </Heading>
          <Text
            fs={[14, 16]}
            lh={18}
            css={{ color: `rgba(${theme.rgbColors.white}, 0.4);` }}
          >
            <DisplayValue value={claimableDisplay} />
          </Text>
        </div>
        <div
          sx={{
            textAlign: "center",
            mt: [24, 0],
            width: ["100%", "auto"],
          }}
        >
          {balance.data && claimableBalance && (
            <SClaimButton
              variant="gradient"
              transform="uppercase"
              onClick={handleClaim}
              disabled={
                !isClaimAllowed ||
                (account?.isExternalWalletConnected && !account?.delegate)
              }
            >
              {t("wallet.vesting.claim_assets")}
            </SClaimButton>
          )}
          {nextClaimableDate && (
            <Text
              color="basic300"
              tAlign="center"
              sx={{
                mt: 15,
                display: ["none", "inherit"],
              }}
            >
              {t("wallet.vesting.estimated_claim_date", {
                date: nextClaimableDate,
              })}
            </Text>
          )}
        </div>
      </SInner>
    </SSchedule>
  )
}
