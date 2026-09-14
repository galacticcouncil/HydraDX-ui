import { Rocket } from "@galacticcouncil/ui/assets/icons"
import {
  Box,
  Button,
  Flex,
  Icon,
  Modal,
  ModalBody,
  ModalContentDivider,
  ModalFooter,
  ModalHeader,
  Separator,
  Slider,
  Stack,
  Summary,
  Text,
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
} from "@galacticcouncil/ui/components"
import { getToken } from "@galacticcouncil/ui/utils"
import { useAccount } from "@galacticcouncil/web3-connect"
import { useQuery } from "@tanstack/react-query"
import Big from "big.js"
import { CSSProperties } from "react"
import { Controller, FormProvider } from "react-hook-form"
import { Trans, useTranslation } from "react-i18next"

import { useUserGigaBorrowSummary } from "@/api/borrow"
import {
  Conviction,
  CONVICTIONS,
  REWARD_MULTIPLIER_BY_CONVICTION,
  VOTE_WEIGHT_BY_CONVICTION,
} from "@/api/democracy"
import {
  claimableVotingRewardsQuery,
  gigaAccountStakesQuery,
  useGigaStakeExchangeRate,
} from "@/api/gigaStake"
import { AssetSelectFormField } from "@/form/AssetSelectFormField"
import {
  SClaimableRewardsContainer,
  SLockedBalanceButton,
  SRewardMultiplierCard,
} from "@/modules/staking/components/VoteModal/VoteModal.styled"
import { useClaimAndCompound } from "@/modules/staking/gigaStaking/GigaHDXPosition.utils"
import { useAssets } from "@/providers/assetsProvider"
import { useRpcProvider } from "@/providers/rpcProvider"
import { scaleHuman } from "@/utils/formatting"

import {
  useVoteModal,
  VOTE_TYPE_OPTIONS,
  VoteModalFormValues,
  VoteType,
} from "./VoteModal.utils"

const MAX_REWARD_MULTIPLIER = REWARD_MULTIPLIER_BY_CONVICTION[6]

const getVoteWeightLabel = (conviction: Conviction) =>
  `${VOTE_WEIGHT_BY_CONVICTION[conviction]}x`
const getRewardMultiplierLabel = (conviction: Conviction) =>
  `${REWARD_MULTIPLIER_BY_CONVICTION[conviction]}x`
const getRewardMultiplierProgress = (conviction: Conviction) =>
  REWARD_MULTIPLIER_BY_CONVICTION[conviction] / MAX_REWARD_MULTIPLIER

type VoteFormProps = {
  referendumId: number
  open: boolean
  onClose: () => void
  isGigaStaking?: boolean
  title: string
}

export const VoteModal = ({
  open,
  onClose,
  referendumId,
  isGigaStaking,
  title,
}: VoteFormProps) => {
  const { t } = useTranslation("staking")

  return (
    <Modal open={open} onOpenChange={onClose}>
      <ModalHeader
        title={t("referenda.vote.modal.title")}
        description={title}
        align="center"
      />
      <VoteForm
        referendumId={referendumId}
        onClose={onClose}
        isGigaStaking={isGigaStaking}
      />
    </Modal>
  )
}

const VoteForm = ({
  referendumId,
  onClose,
  isGigaStaking,
}: Pick<VoteFormProps, "referendumId" | "onClose" | "isGigaStaking">) => {
  const { t } = useTranslation(["common", "staking"])
  const { native } = useAssets()
  const {
    form,
    totalHdxBalanceHuman,
    ghdxLocksHuman,
    lockedDays,
    totalVotesWithMultiplier,
    onSubmit,
    governanceLocksHuman,
    allLocksHuman,
  } = useVoteModal(referendumId, onClose, isGigaStaking)

  const voteType = form.watch("voteType")
  const isSingleInputField = voteType === "aye" || voteType === "nay"

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <ModalBody asChild>
          <Stack direction="column" gap="l">
            <Controller
              control={form.control}
              name="voteType"
              render={({ field: { value, onChange, disabled } }) => (
                <Flex direction="column" flex={1}>
                  <ToggleGroup
                    type="single"
                    fullWidth
                    value={value}
                    onValueChange={(nextValue) =>
                      nextValue && onChange(nextValue as VoteType)
                    }
                    disabled={disabled}
                  >
                    {VOTE_TYPE_OPTIONS.map((option) => (
                      <ToggleGroupItem key={option.id} value={option.id}>
                        {option.label}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </Flex>
              )}
            />

            <ModalContentDivider />

            {!isSingleInputField && (
              <Box>
                <Flex
                  justify="space-between"
                  align="center"
                  pb={getToken("scales.paddings.base")}
                >
                  <Text fs="p5" fw={500} color={getToken("text.medium")}>
                    {t("staking:referenda.vote.modal.totalBalance")}
                  </Text>
                  <Text fs="p5" fw={500} color={getToken("text.low")}>
                    {t("currency", {
                      value: totalHdxBalanceHuman,
                      symbol: native.symbol,
                    })}
                  </Text>
                </Flex>
                <ModalContentDivider />
              </Box>
            )}

            <AmountFields
              voteType={voteType}
              totalHdxBalanceHuman={totalHdxBalanceHuman}
            />

            {isGigaStaking && <ClaimableRewardsField />}

            {isSingleInputField && (
              <>
                <Box>
                  <ModalContentDivider />
                  <Flex gap="base" justify="end" py="base">
                    <SLockedBalanceButton
                      variant="muted"
                      onClick={() =>
                        form.setValue("amount", governanceLocksHuman, {
                          shouldValidate: true,
                        })
                      }
                    >
                      <Text fs="p6" fw={400} color={getToken("text.medium")}>
                        <Trans
                          t={t}
                          i18nKey="staking:referenda.vote.modal.reuseGovernanceLock"
                          values={{
                            value: governanceLocksHuman,
                            currency: native.symbol,
                          }}
                        >
                          <Text
                            as="span"
                            fw={500}
                            color={getToken("text.high")}
                          />
                        </Trans>
                      </Text>
                    </SLockedBalanceButton>
                    {isGigaStaking ? (
                      <SLockedBalanceButton
                        variant="muted"
                        onClick={() =>
                          form.setValue("amount", ghdxLocksHuman, {
                            shouldValidate: true,
                          })
                        }
                      >
                        <Text fs="p6" fw={400} color={getToken("text.medium")}>
                          <Trans
                            t={t}
                            i18nKey="staking:referenda.vote.modal.reuseGigaStakingLocks"
                            values={{
                              value: ghdxLocksHuman,
                              currency: native.symbol,
                            }}
                          >
                            <Text
                              as="span"
                              fw={500}
                              color={getToken("text.high")}
                            />
                          </Trans>
                        </Text>
                      </SLockedBalanceButton>
                    ) : (
                      <SLockedBalanceButton
                        variant="muted"
                        onClick={() =>
                          form.setValue("amount", allLocksHuman, {
                            shouldValidate: true,
                          })
                        }
                      >
                        <Text fs="p6" fw={400} color={getToken("text.medium")}>
                          <Trans
                            t={t}
                            i18nKey="staking:referenda.vote.modal.reuseAllLocks"
                            values={{
                              value: allLocksHuman,
                              currency: native.symbol,
                            }}
                          >
                            <Text
                              as="span"
                              fw={500}
                              color={getToken("text.high")}
                            />
                          </Trans>
                        </Text>
                      </SLockedBalanceButton>
                    )}
                  </Flex>
                  <ModalContentDivider />
                </Box>

                <Controller
                  control={form.control}
                  name="conviction"
                  render={({ field }) => (
                    <Stack gap="m">
                      <Flex align="center" gap="xs" justify="space-between">
                        <Text
                          fs="p3"
                          fw={500}
                          lh={1}
                          color={getToken("text.high")}
                        >
                          {t("staking:referenda.vote.modal.multiplier")}
                        </Text>

                        <Flex align="center" gap="xs">
                          <Text fs="p5" fw={500}>
                            {getVoteWeightLabel(field.value)}
                          </Text>

                          <Tooltip
                            asChild
                            text={t(
                              "staking:referenda.vote.modal.multiplier.tooltip",
                            )}
                          />
                        </Flex>
                      </Flex>

                      <Slider
                        min={0}
                        max={6}
                        step={1}
                        dashCount={12}
                        value={field.value}
                        onChange={field.onChange}
                      />

                      <Flex justify="space-between">
                        {CONVICTIONS.map((conviction) => (
                          <Text
                            key={conviction}
                            fs="p6"
                            color={getToken("text.medium")}
                          >
                            {getVoteWeightLabel(conviction)}
                          </Text>
                        ))}
                      </Flex>

                      {isGigaStaking && (
                        <RewardMultiplierCard conviction={field.value} />
                      )}
                    </Stack>
                  )}
                />
              </>
            )}
            <ModalContentDivider />
            <Summary
              separator={<ModalContentDivider />}
              rows={[
                {
                  label: t("staking:referenda.vote.modal.totalVotes"),
                  content: t("currency", {
                    value: totalVotesWithMultiplier,
                    symbol: native.symbol,
                  }),
                },
                {
                  label: t("staking:referenda.vote.modal.lockDuration"),
                  description: t(
                    "staking:referenda.vote.modal.lockDuration.description",
                  ),
                  content: t(
                    "staking:referenda.vote.modal.lockDuration.value",
                    {
                      value: isSingleInputField ? lockedDays : 0,
                    },
                  ),
                },
              ]}
            />
          </Stack>
        </ModalBody>

        <Separator />

        <ModalFooter>
          <Button
            type="submit"
            size="large"
            width="100%"
            disabled={!form.formState.isValid}
          >
            {t("confirm")}
          </Button>
        </ModalFooter>
      </form>
    </FormProvider>
  )
}

const AmountFields = ({
  voteType,
  totalHdxBalanceHuman,
}: {
  voteType: VoteType
  totalHdxBalanceHuman: string
}) => {
  const { t } = useTranslation("staking")

  if (voteType === "split") {
    return (
      <Stack
        direction="column"
        gap="m"
        separated
        separator={<ModalContentDivider />}
      >
        <AssetSelectFormField<VoteModalFormValues>
          assetFieldName="asset"
          amountFieldName="aye"
          label={t("referenda.item.aye")}
          assets={[]}
          disabledAssetSelector
          balance={false}
        />
        <AssetSelectFormField<VoteModalFormValues>
          assetFieldName="asset"
          amountFieldName="nay"
          label={t("referenda.item.nay")}
          assets={[]}
          disabledAssetSelector
          balance={false}
        />
      </Stack>
    )
  }

  if (voteType === "abstain") {
    return (
      <Stack
        direction="column"
        gap="m"
        separated
        separator={<ModalContentDivider />}
      >
        <AssetSelectFormField<VoteModalFormValues>
          assetFieldName="asset"
          amountFieldName="aye"
          label={t("referenda.item.aye")}
          assets={[]}
          disabledAssetSelector
          balance={false}
        />
        <AssetSelectFormField<VoteModalFormValues>
          assetFieldName="asset"
          amountFieldName="nay"
          label={t("referenda.item.nay")}
          assets={[]}
          disabledAssetSelector
          balance={false}
        />
        <AssetSelectFormField<VoteModalFormValues>
          assetFieldName="asset"
          amountFieldName="abstain"
          label={t("referenda.item.abstain")}
          assets={[]}
          disabledAssetSelector
          balance={false}
        />
      </Stack>
    )
  }

  return (
    <AssetSelectFormField<VoteModalFormValues>
      assetFieldName="asset"
      amountFieldName="amount"
      label={
        voteType === "aye" ? t("referenda.item.aye") : t("referenda.item.nay")
      }
      assets={[]}
      disabledAssetSelector
      balance={{ value: totalHdxBalanceHuman }}
    />
  )
}

const ClaimableRewardsField = () => {
  const { t } = useTranslation("staking")
  const rpc = useRpcProvider()
  const { account } = useAccount()
  const { native } = useAssets()

  const { data: exchangeRate } = useGigaStakeExchangeRate()
  const { data: claimableRewards } = useQuery(
    claimableVotingRewardsQuery(rpc, account?.address ?? ""),
  )
  const { data: accountStake } = useQuery(
    gigaAccountStakesQuery(rpc, account?.address ?? ""),
  )

  const { data: gigaBorrowSummary } = useUserGigaBorrowSummary()
  const { hdxReserve } = gigaBorrowSummary ?? {}

  const claimMutation = useClaimAndCompound()

  const gigaHdxBalanceHuman = hdxReserve?.underlyingBalance ?? "0"

  const stakedHdxHuman = Big(gigaHdxBalanceHuman)
    .times(exchangeRate?.toString() || "0")
    .toString()

  const principalHdxHuman = accountStake
    ? scaleHuman(accountStake.hdx, native.decimals)
    : "0"
  const accruedHdxBig = Big.max(
    Big(stakedHdxHuman).minus(principalHdxHuman),
    Big(0),
  )

  const hasClaimable = accruedHdxBig.gt(
    scaleHuman(native.existentialDeposit, native.decimals),
  )
  const claimAndCompoundArgs = {
    allocReadyVotes: claimableRewards?.allocReadyVotes ?? [],
    accountAddress: account?.address ?? "",
    hasAccruedYield: hasClaimable,
    hasClaimableRewards: false, // claim only realize yield
  }

  if (!hasClaimable) {
    return null
  }

  return (
    <SClaimableRewardsContainer justify="space-between" align="center">
      <Text fs="p4" fw={500} color={getToken("text.medium")}>
        <Trans
          t={t}
          i18nKey="staking:referenda.vote.modal.claimableRewards"
          values={{
            value: accruedHdxBig,
            currency: native.symbol,
          }}
        >
          <Text as="span" fw={500} color={getToken("text.tint.primary")} />
        </Trans>
      </Text>
      <Button
        variant="secondary"
        size="small"
        disabled={!hasClaimable || claimMutation.isPending}
        onClick={() => claimMutation.mutate(claimAndCompoundArgs)}
      >
        {t("referenda.vote.modal.claim.cta")}
      </Button>
    </SClaimableRewardsContainer>
  )
}

const RewardMultiplierCard = ({ conviction }: { conviction: Conviction }) => {
  const { t } = useTranslation("staking")
  const progress = getRewardMultiplierProgress(conviction)
  const motionIntensity = progress ** 1.6
  const electricDurationSeconds = Math.max(1.45, 6 - motionIntensity * 4.15)
  const displacementOffsetY = motionIntensity * -2.5
  const multiplierMotionStyle = {
    "--electric-progress": `${Math.round(progress * 100)}%`,
    "--electric-progress-number": progress,
    "--electric-duration": `${electricDurationSeconds}s`,
    "--electric-shake-duration": `${Math.max(
      0.32,
      1.2 - motionIntensity * 0.78,
    )}s`,
    "--electric-shake-distance": `${motionIntensity * 0.85}px`,
  } as CSSProperties

  return (
    <SRewardMultiplierCard
      align="center"
      justify="space-between"
      px="l"
      py="l"
      mt="m"
      style={multiplierMotionStyle}
    >
      <svg className="eb-svg" aria-hidden focusable="false">
        <defs>
          <filter
            id="vote-reward-turbulent-displace"
            colorInterpolationFilters="sRGB"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feTurbulence
              type="turbulence"
              baseFrequency="0.015"
              numOctaves="6"
              result="noise1"
              seed="1"
            />
            <feOffset in="noise1" dx="0" dy="0" result="offsetNoise1">
              <animate
                attributeName="dy"
                values="700; 0"
                dur={`${electricDurationSeconds}s`}
                repeatCount="indefinite"
                calcMode="linear"
              />
            </feOffset>

            <feTurbulence
              type="turbulence"
              baseFrequency="0.015"
              numOctaves="6"
              result="noise2"
              seed="1"
            />
            <feOffset in="noise2" dx="0" dy="0" result="offsetNoise2">
              <animate
                attributeName="dy"
                values="0; -700"
                dur={`${electricDurationSeconds}s`}
                repeatCount="indefinite"
                calcMode="linear"
              />
            </feOffset>

            <feTurbulence
              type="turbulence"
              baseFrequency="0.015"
              numOctaves="6"
              result="noise3"
              seed="2"
            />
            <feOffset in="noise3" dx="0" dy="0" result="offsetNoise3">
              <animate
                attributeName="dx"
                values="490; 0"
                dur={`${electricDurationSeconds}s`}
                repeatCount="indefinite"
                calcMode="linear"
              />
            </feOffset>

            <feTurbulence
              type="turbulence"
              baseFrequency="0.015"
              numOctaves="6"
              result="noise4"
              seed="2"
            />
            <feOffset in="noise4" dx="0" dy="0" result="offsetNoise4">
              <animate
                attributeName="dx"
                values="0; -490"
                dur={`${electricDurationSeconds}s`}
                repeatCount="indefinite"
                calcMode="linear"
              />
            </feOffset>

            <feComposite in="offsetNoise1" in2="offsetNoise2" result="part1" />
            <feComposite in="offsetNoise3" in2="offsetNoise4" result="part2" />
            <feBlend
              in="part1"
              in2="part2"
              mode="color-dodge"
              result="combinedNoise"
            />
            <feOffset
              in="SourceGraphic"
              dx="0"
              dy={displacementOffsetY}
              result="alignedBorder"
            />
            <feDisplacementMap
              in="alignedBorder"
              in2="combinedNoise"
              scale={2 + motionIntensity * 12}
              xChannelSelector="R"
              yChannelSelector="B"
            />
          </filter>
        </defs>
      </svg>

      <div className="eb-layers" aria-hidden>
        <div className="eb-border-outer">
          <div className="eb-main-border" />
        </div>
        <div className="eb-glow-1" />
        <div className="eb-glow-2" />
        <div className="eb-overlay-1" />
        <div className="eb-overlay-2" />
        <div className="eb-background-glow" />
      </div>

      <Flex className="eb-content" align="center" justify="space-between">
        <Text fs="p3" fw={500} color={getToken("text.high")}>
          {t("referenda.vote.modal.rewardMultiplier")}
        </Text>
        <Flex align="center" gap="s">
          <Text
            font="primary"
            fs="h6"
            fw={500}
            lh={1}
            color="var(--electric-border-color)"
          >
            {getRewardMultiplierLabel(conviction)}
          </Text>
          <span className="reward-rocket" aria-hidden>
            <Icon component={Rocket} size="l" />
          </span>
        </Flex>
      </Flex>
    </SRewardMultiplierCard>
  )
}
