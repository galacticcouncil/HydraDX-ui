import { Text } from "components/Typography/Text/Text"
import RewardIcon from "assets/icons/StakingRewardIcon.svg?react"

import {
  SRewardCardContainer,
  SRewartCardHeader,
} from "./AvailableRewards.styled"
import { Button } from "components/Button/Button"
import { Icon } from "components/Icon/Icon"
import { Trans, useTranslation } from "react-i18next"
import { useDisplayPrice } from "utils/displayAsset"
import { DisplayValue } from "components/DisplayValue/DisplayValue"
import Skeleton from "react-loading-skeleton"
import { useClaimReward } from "sections/staking/StakingPage.utils"
import { ToastMessage, useStore } from "state/store"
import { useQueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "utils/queryKeys"
import { TOAST_MESSAGES } from "state/toasts"
import { Separator } from "components/Separator/Separator"
import { useMedia } from "react-use"
import { theme } from "theme"
import { useRpcProvider } from "providers/rpcProvider"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { useProcessedVotesIds } from "api/staking"
import { BN_0 } from "utils/constants"
import { useAssets } from "providers/assets"

export const AvailableRewards = () => {
  const { api } = useRpcProvider()
  const { t } = useTranslation()
  const { account } = useAccount()
  const reward = useClaimReward()
  const { native } = useAssets()
  const spotPrice = useDisplayPrice(native.id)

  const processedVotes = useProcessedVotesIds()

  const { createTransaction } = useStore()
  const queryClient = useQueryClient()

  const isDesktop = useMedia(theme.viewport.gte.sm)

  const isLoading = !reward.data || spotPrice.isLoading

  const onClaimRewards = async () => {
    const toast = TOAST_MESSAGES.reduce((memo, type) => {
      const msType = type === "onError" ? "onLoading" : type
      memo[type] = (
        <Trans
          t={t}
          i18nKey={`staking.toasts.claim.${msType}`}
          tOptions={{
            value: reward.data?.rewards,
          }}
        >
          <span />
          <span className="highlight" />
        </Trans>
      )
      return memo
    }, {} as ToastMessage)

    const processedVoteIds = await processedVotes.mutateAsync()

    await createTransaction(
      {
        tx: processedVoteIds.length
          ? api.tx.utility.batchAll([
              ...processedVoteIds.map((id) => api.tx.democracy.removeVote(id)),
              api.tx.staking.claim(reward.data?.positionId!),
            ])
          : api.tx.staking.claim(reward.data?.positionId!),
      },
      { toast },
    )

    await queryClient.invalidateQueries(QUERY_KEYS.stake(account?.address))
    await queryClient.invalidateQueries(
      QUERY_KEYS.tokenBalance(native.id, account?.address),
    )
  }

  return (
    <SRewardCardContainer>
      <SRewartCardHeader>
        <Icon sx={{ color: "pink600" }} icon={<RewardIcon />} />
        <Text
          fs={15}
          lh={15}
          sx={{ pt: 5 }}
          color="white"
          font="GeistMono"
          tTransform="uppercase"
        >
          {t("staking.dashboard.rewards.title")}
        </Text>
      </SRewartCardHeader>
      <div sx={{ p: "28px 25px", flex: "column", gap: 20 }}>
        <div sx={{ flex: "column" }}>
          <div sx={{ flex: "row", justify: "space-between", align: "center" }}>
            <Text color="white">
              {t("staking.dashboard.rewards.allocated")}
            </Text>
            {isLoading || !reward.data ? (
              <Skeleton width={90} height={25} />
            ) : (
              <div sx={{ flex: "column", justify: "space-around" }}>
                <Text
                  fs={19}
                  color="white"
                  tTransform="uppercase"
                  css={{ whiteSpace: "nowrap" }}
                >
                  {t("value.tokenWithSymbol", {
                    value: reward.data.maxRewards ?? BN_0,
                    symbol: "HDX",
                    decimalPlaces: 2,
                  })}
                </Text>
                <Text
                  fs={14}
                  css={{ color: "rgba(255, 255, 255, 0.6)" }}
                  tAlign="right"
                >
                  <DisplayValue
                    value={
                      reward.data.maxRewards?.multipliedBy(
                        spotPrice.data?.spotPrice ?? 1,
                      ) ?? BN_0
                    }
                  />
                </Text>
              </div>
            )}
          </div>
        </div>

        <Separator orientation="horizontal" css={{ background: "#55394E" }} />

        <Text color="white">{t("staking.dashboard.rewards.available")}</Text>
        <div
          sx={{
            flex: ["column", "row"],
            justify: "space-between",
            gap: [20, 0],
          }}
        >
          <div sx={{ flex: "column", justify: "space-around" }}>
            {isLoading || !reward.data ? (
              <Skeleton width={90} height={25} />
            ) : (
              <Text
                fs={19}
                color="white"
                tTransform="uppercase"
                css={{ whiteSpace: "nowrap" }}
              >
                {t("value.tokenWithSymbol", {
                  value: reward.data.rewards,
                  symbol: "HDX",
                  decimalPlaces: 2,
                })}
              </Text>
            )}
            {isLoading || !reward.data ? (
              <Skeleton width={60} height={16} />
            ) : (
              <Text fs={14} css={{ color: "rgba(255, 255, 255, 0.6)" }}>
                <DisplayValue
                  value={reward.data.rewards.multipliedBy(
                    spotPrice.data?.spotPrice ?? 1,
                  )}
                />
              </Text>
            )}
          </div>

          <Separator
            orientation={isDesktop ? "vertical" : "horizontal"}
            css={{ background: "#55394E" }}
          />

          <div sx={{ flex: "column" }}>
            {isLoading || !reward.data ? (
              <Skeleton width={90} height={25} />
            ) : (
              <Text
                fs={19}
                color="white"
                tTransform="uppercase"
                css={{ whiteSpace: "nowrap" }}
              >
                {t("value.percentage", {
                  value: reward.data.allocatedRewardsPercentage,
                })}
              </Text>
            )}
            <Text fs={14} color="white">
              {t("staking.dashboard.rewards.allocatedRewards")}
            </Text>
          </div>
        </div>
        <Separator orientation="horizontal" css={{ background: "#55394E" }} />
        <Text color="warningYellow200" lh={22}>
          {t("staking.dashboard.rewards.desc", {
            value: reward.data?.maxRewards?.minus(reward.data.rewards),
          })}
        </Text>

        <Button
          size="small"
          variant="primary"
          fullWidth
          disabled={!reward.data || reward.data.rewards.isZero()}
          onClick={onClaimRewards}
        >
          {t("staking.dashboard.rewards.button")}
        </Button>
      </div>
    </SRewardCardContainer>
  )
}
