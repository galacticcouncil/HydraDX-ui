import { Text } from "components/Typography/Text/Text"
import { SBage, SDetailsBox, SVotingBox } from "./Voting.styled"
import { theme } from "theme"
import { BN_1, BN_10 } from "utils/constants"
import BN from "bignumber.js"
import { Separator } from "components/Separator/Separator"
import { AccountAvatar } from "components/AccountAvatar/AccountAvatar"
import { Trans, useTranslation } from "react-i18next"
import { useProviderRpcUrlStore } from "api/provider"
import ReactMarkdown from "react-markdown"
import { GradientText } from "components/Typography/GradientText/GradientText"
import { SBar } from "components/ReferendumCard/ReferendumCard.styled"
import { Icon } from "components/Icon/Icon"
import { ReactComponent as AyeIcon } from "assets/icons/SuccessIcon.svg"
import { ReactComponent as NayIcon } from "assets/icons/FailIcon.svg"
import { Controller, useForm } from "react-hook-form"
import { AssetSelectSkeleton } from "components/AssetSelect/AssetSelectSkeleton"
import { WalletTransferAssetSelect } from "sections/wallet/transfer/WalletTransferAssetSelect"
import { NATIVE_ASSET_ID, useApiPromise } from "utils/api"
import { Button } from "components/Button/Button"
import { ToastMessage, useStore } from "state/store"
import { useQueryClient } from "@tanstack/react-query"
import { FormValues } from "utils/helpers"
import {
  ConvictionDropdown,
  TConviction,
} from "./components/Dropdown/DropdownConviction"
import { useAccountStore } from "state/store"
import { getFixedPointAmount } from "utils/balance"
import { ReactComponent as VerifiedAccount } from "assets/icons/VerifiedAccount.svg"
import { TOAST_MESSAGES } from "state/toasts"
import { useVotingData } from "./Voting.utils"
import { Navigate } from "@tanstack/react-location"
import { QUERY_KEYS } from "utils/queryKeys"
import { VotingSkeleton } from "./VotingSkeleton"

const REFERENDUM_LINK = import.meta.env.VITE_REFERENDUM_LINK as string

export const VotingData = ({ id }: { id: string }) => {
  const { t } = useTranslation()
  const { account } = useAccountStore()

  const queryClient = useQueryClient()

  const api = useApiPromise()
  const { createTransaction } = useStore()

  // need it for rococo and mining-rpc rpcs
  const providers = useProviderRpcUrlStore()
  const rococoProvider = [
    "hydradx-rococo-rpc.play.hydration.cloud",
    "mining-rpc.hydradx.io",
  ].some(
    (rpc) =>
      (providers.rpcUrl ?? import.meta.env.VITE_PROVIDER_URL) ===
      `wss://${rpc}`,
  )

  const referendaQuery = useVotingData(id, rococoProvider)

  const form = useForm<{ amount: string; conviction: TConviction }>({
    defaultValues: { conviction: "locked1x" },
  })

  if (referendaQuery.isOngoing === false) return <Navigate to="/staking" />

  const onSubmit = async (values: FormValues<typeof form>, aye: boolean) => {
    const amount = getFixedPointAmount(values.amount, 12).toString()

    const toast = TOAST_MESSAGES.reduce((memo, type) => {
      const msType = type === "onError" ? "onLoading" : type
      memo[type] = (
        <Trans
          t={t}
          i18nKey={`voting.referenda.toasts.${msType}`}
          tOptions={{
            type: aye ? "Aye" : "Nye",
            amount: BN(values.amount),
            id,
          }}
        >
          <span />
          <span className="highlight" />
        </Trans>
      )
      return memo
    }, {} as ToastMessage)

    const transaction = await createTransaction(
      {
        tx: api.tx.democracy.vote(id, {
          Standard: {
            vote: {
              aye,
              conviction: String(values.conviction.toString()),
            },
            balance: amount,
          },
        }),
      },
      { toast },
    )

    if (!transaction.isError) {
      form.reset()
    }

    await queryClient.invalidateQueries(QUERY_KEYS.referendumInfoOf(id))
    await queryClient.invalidateQueries(QUERY_KEYS.referendumInfo(id))
    await queryClient.invalidateQueries(
      QUERY_KEYS.tokenBalance(NATIVE_ASSET_ID, account?.address),
    )
  }

  const referenda = referendaQuery.data

  if (referendaQuery.isLoading || !referenda) return <VotingSkeleton />

  return (
    <div sx={{ flex: ["column", "row"], gap: 30 }}>
      <SDetailsBox
        css={{ flex: 3, alignSelf: "flex-start" }}
        sx={{ flex: "column", gap: 12 }}
      >
        <div sx={{ flex: "row", gap: 12, py: 15, align: "center" }}>
          <Text color="brightBlue200" fs={[18]}>
            #{id}
          </Text>
          <Text
            css={{ color: `rgba(${theme.rgbColors.primaryA15Blue}, 0.35)` }}
            fs={[18]}
          >
            {`//`}
          </Text>
          <Text fs={[20]} color="white">
            {referenda.title}
          </Text>
        </div>

        <Separator
          css={{ background: `rgba(${theme.rgbColors.white}, 0.06)` }}
        />
        <div sx={{ flex: "row", justify: "space-between" }}>
          <div sx={{ flex: "row", gap: 14, align: "center" }}>
            <AccountAvatar address={referenda.author.address} size={16} />
            <div sx={{ flex: "row", gap: 4, align: "center" }}>
              {referenda.authorDisplay.verified && (
                <Icon icon={<VerifiedAccount />} />
              )}
              <Text fs={13} color="basic400">
                {referenda.authorDisplay.name}
              </Text>
            </div>

            <div
              css={{
                background: "rgba(114, 131, 165, 0.6)",
                width: 3,
                height: 3,
                borderRadius: "9999px",
              }}
            />
            <Text color="basic501" fs={13}>
              {t(`duration.${referenda.endDate.isPositive ? "left" : "ago"}`, {
                duration: referenda.endDate.duration,
              })}
            </Text>
          </div>
          <SBage>{t("voting.referenda.badge")}</SBage>
        </div>
        <Separator
          css={{
            background: `rgba(${theme.rgbColors.white}, 0.06)`,
            marginBottom: 12,
          }}
        />
        <ReactMarkdown
          css={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            ul: { listStyleType: "disc" },
            "*": { color: theme.colors.darkBlue100, fontSize: 15 },
          }}
        >
          {referenda.content}
        </ReactMarkdown>
      </SDetailsBox>

      <SVotingBox css={{ flex: 2 }}>
        <GradientText fs={19} gradient="pinkLightBlue" sx={{ my: 12 }}>
          {t("voting.referenda.votes")}
        </GradientText>

        <div sx={{ flex: "column", gap: 12 }}>
          <div sx={{ flex: "row", gap: 8 }}>
            {referenda.isNoVotes ? (
              <SBar variant="neutral" height={12} percentage={100} />
            ) : (
              <>
                {/*zero value of progress bar should be visible*/}
                <SBar
                  variant="aye"
                  height={12}
                  percentage={
                    referenda.percAyes.eq(0) ? 2 : referenda.percAyes.toNumber()
                  }
                />
                <SBar
                  variant="nay"
                  height={12}
                  percentage={
                    referenda.percNays.eq(0) ? 2 : referenda.percNays.toNumber()
                  }
                />
              </>
            )}
          </div>

          <div sx={{ flex: "row", justify: "space-between" }}>
            <div sx={{ flex: "column", gap: 5 }}>
              <Text
                color="white"
                fs={16}
                tTransform="uppercase"
                font="ChakraPetchSemiBold"
              >
                {t("voting.referenda.value.percentage", {
                  value: referenda.percAyes,
                })}
              </Text>
              <Text color="white" fs={14}>
                {t("toast.sidebar.referendums.aye")}
              </Text>
            </div>
            <div sx={{ flex: "column", gap: 5, align: "end" }}>
              <Text
                color="white"
                fs={16}
                tTransform="uppercase"
                font="ChakraPetchSemiBold"
              >
                {t("voting.referenda.value.percentage", {
                  value: referenda.percNays,
                })}
              </Text>
              <Text color="white" fs={14}>
                {t("toast.sidebar.referendums.nay")}
              </Text>
            </div>
          </div>

          <Separator
            css={{
              background: `rgba(${theme.rgbColors.white}, 0.06)`,
            }}
          />

          <div sx={{ flex: "row", justify: "space-between", align: "center" }}>
            <div sx={{ flex: "row", gap: 5, align: "center" }}>
              <Icon size={18} icon={<AyeIcon />} />
              <Text color="white">{t("voting.referenda.aye")}</Text>
              <Text fs={14} color="basic600">
                {`(${referenda.ayeCount})`}
              </Text>
            </div>
            <Text color="white">
              {t("voting.referenda.value.compact", { value: referenda.ayes })}
            </Text>
          </div>

          <Separator
            css={{
              background: `rgba(${theme.rgbColors.white}, 0.06)`,
            }}
          />

          <div sx={{ flex: "row", justify: "space-between", align: "center" }}>
            <div sx={{ flex: "row", gap: 5, align: "center" }}>
              <Icon size={14} icon={<NayIcon />} />
              <Text color="white">{t("voting.referenda.nay")}</Text>
              <Text fs={14} color="basic600">
                {`(${referenda.nayCount})`}
              </Text>
            </div>
            <Text color="white">
              {t("voting.referenda.value.compact", { value: referenda.nays })}
            </Text>
          </div>

          <Separator
            css={{
              background: `rgba(${theme.rgbColors.white}, 0.06)`,
            }}
          />
        </div>
        <form
          autoComplete="off"
          sx={{
            flex: "column",
            gap: 12,
            justify: "space-between",
          }}
        >
          <Controller
            name="amount"
            control={form.control}
            rules={{
              required: t("wallet.assets.transfer.error.required"),
              validate: {
                validNumber: (value) => {
                  try {
                    if (!new BN(value).isNaN()) return true
                  } catch {}
                  return t("error.validNumber")
                },
                positive: (value) => new BN(value).gt(0) || t("error.positive"),
                maxBalance: (value) => {
                  try {
                    if (
                      referenda.computedBalance.gte(
                        BN(value).multipliedBy(BN_10.pow(12)),
                      )
                    )
                      return true
                  } catch {}
                  return t("liquidity.add.modal.validation.notEnoughBalance")
                },
                minValue: (value) => {
                  const minValue = BN_1

                  try {
                    if (!new BN(value).lt(minValue ?? 0)) return true
                  } catch {}
                  return t("error.minValue", {
                    value: minValue,
                    symbol: "HDX",
                  })
                },
              },
            }}
            render={({
              field: { name, value, onChange },
              fieldState: { error },
            }) =>
              referendaQuery.isLoading ? (
                <AssetSelectSkeleton
                  title={t("staking.dashboard.form.stake.inputTitle")}
                  name={name}
                  balanceLabel={t("selectAsset.balance.label")}
                />
              ) : (
                <WalletTransferAssetSelect
                  balance={referenda.computedBalance}
                  title={t("staking.dashboard.form.stake.inputTitle")}
                  name={name}
                  value={value}
                  onChange={onChange}
                  asset={NATIVE_ASSET_ID}
                  error={error?.message}
                />
              )
            }
          />

          <Controller
            name="conviction"
            control={form.control}
            render={({ field: { value, onChange } }) => (
              <ConvictionDropdown value={value} onChange={onChange} />
            )}
          />

          <div sx={{ flex: "column", gap: 12, align: "center", mt: 16 }}>
            <div sx={{ flex: "row", gap: 12 }} css={{ alignSelf: "stretch" }}>
              <Button
                type="button"
                variant="green"
                fullWidth
                onClick={form.handleSubmit((data) => onSubmit(data, true))}
                disabled={
                  !account?.address || account.isExternalWalletConnected
                }
              >
                {t("voting.referenda.btn.aye")}
              </Button>
              <Button
                type="button"
                variant="primary"
                fullWidth
                onClick={form.handleSubmit((data) => onSubmit(data, false))}
                disabled={
                  !account?.address || account.isExternalWalletConnected
                }
              >
                {t("voting.referenda.btn.nay")}
              </Button>
            </div>
            {!rococoProvider && (
              <>
                <Text color="basic400" fs={14}>
                  {t("or")}
                </Text>
                <a
                  href={`${REFERENDUM_LINK}/${referenda.referendumIndex}`}
                  target="_blank"
                  rel="noreferrer"
                  sx={{ width: "100%" }}
                >
                  <Button
                    type="button"
                    fullWidth
                    disabled={
                      rococoProvider ||
                      !account?.address ||
                      account.isExternalWalletConnected
                    }
                  >
                    {t("voting.referenda.btn.subsquare")}
                  </Button>
                </a>
              </>
            )}
          </div>
        </form>
      </SVotingBox>
    </div>
  )
}
