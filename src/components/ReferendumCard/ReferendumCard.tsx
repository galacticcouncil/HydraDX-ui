import { PalletDemocracyReferendumInfo } from "@polkadot/types/lookup"
import { useReferendumInfo } from "api/democracy"
import { ReactComponent as IconArrow } from "assets/icons/IconArrow.svg"
import { ReactComponent as GovernanceIcon } from "assets/icons/GovernanceIcon.svg"
import { Separator } from "components/Separator/Separator"
import { Spacer } from "components/Spacer/Spacer"
import { Text } from "components/Typography/Text/Text"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { BN_0, BN_10, PARACHAIN_BLOCK_TIME } from "utils/constants"
import { SBar, SContainer, SHeader, SVotedBage } from "./ReferendumCard.styled"
import { ReferendumCardSkeleton } from "./ReferendumCardSkeleton"
import { Icon } from "components/Icon/Icon"
import BN from "bignumber.js"
import { useBestNumber } from "api/chain"
import { customFormatDuration } from "utils/formatting"
import { useNavigate } from "@tanstack/react-location"
import { useToast } from "state/toasts"

type Props = {
  id: string
  referendum: PalletDemocracyReferendumInfo
  type: "toast" | "staking"
  voted: boolean
}

export const ReferendumCard = ({ id, referendum, type, voted }: Props) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setSidebar } = useToast()

  const info = useReferendumInfo(id)
  const bestNumber = useBestNumber()

  const votes = useMemo(() => {
    if (!referendum.isOngoing)
      return { ayes: BN_0, nays: BN_0, percAyes: BN_0, percNays: BN_0 }

    const ayes = referendum.asOngoing.tally.ayes
      .toBigNumber()
      .div(BN_10.pow(12))
    const nays = referendum.asOngoing.tally.nays
      .toBigNumber()
      .div(BN_10.pow(12))

    const votesSum = ayes.plus(nays)

    let percAyes = BN_0
    let percNays = BN_0

    if (!votesSum.isZero()) {
      percAyes = ayes.div(votesSum).times(100)
      percNays = nays.div(votesSum).times(100)
    }

    return { ayes, nays, percAyes, percNays }
  }, [referendum])

  const isNoVotes = votes.percAyes.eq(0) && votes.percNays.eq(0)
  const diff = BN(info?.data?.onchainData.meta.end ?? 0)
    .minus(bestNumber.data?.parachainBlockNumber.toBigNumber() ?? 0)
    .times(PARACHAIN_BLOCK_TIME)
    .toNumber()
  const endDate = customFormatDuration({ end: diff * 1000 })

  const handleClick = (id: string) => {
    setSidebar(false)
    navigate({
      to: "/staking/referenda",
      search: { id },
    })
  }

  return info.isLoading || !info.data ? (
    <ReferendumCardSkeleton type={type} />
  ) : (
    <SContainer type={type} onClick={() => handleClick(id.toString())}>
      <SHeader>
        <div sx={{ flex: "row", align: "center", gap: 8 }}>
          <Text color="brightBlue200" fs={14} fw={500}>
            #{info.data.referendumIndex}
          </Text>
          <Text color="brightBlue200" fs={12} fw={500}>
            {"//"}
          </Text>
          <Text color="basic500" fs={13} fw={500}>
            {endDate &&
              t(`duration.${endDate.isPositive ? "left" : "ago"}`, {
                duration: endDate.duration,
              })}
          </Text>
        </div>

        <div sx={{ flex: "row", gap: 20, align: "center" }}>
          {voted && (
            <SVotedBage>
              {t("toast.sidebar.referendums.voted")}
              <Icon
                size={11}
                sx={{ color: "basic900" }}
                icon={<GovernanceIcon />}
              />
            </SVotedBage>
          )}
          <Icon sx={{ color: "brightBlue300" }} icon={<IconArrow />} />
        </div>
      </SHeader>

      <Separator color="primaryA15Blue" opacity={0.35} sx={{ my: 16 }} />

      <Text color="white" fw={500}>
        {info.data.title}
      </Text>

      <Spacer size={20} />

      <div sx={{ flex: "row", gap: 8 }}>
        {isNoVotes ? (
          <SBar variant="neutral" percentage={100} />
        ) : (
          <>
            {/*zero value of progress bar should be visible*/}
            <SBar
              variant="aye"
              percentage={votes.percAyes.eq(0) ? 2 : votes.percAyes.toNumber()}
            />
            <SBar
              variant="nay"
              percentage={votes.percNays.eq(0) ? 2 : votes.percNays.toNumber()}
            />
          </>
        )}
      </div>

      <Spacer size={4} />

      <div sx={{ flex: "row", justify: "space-between" }}>
        <Text
          color={votes.percAyes.eq(0) ? "darkBlue300" : "white"}
          fs={14}
          fw={600}
          tTransform="uppercase"
        >
          {t("toast.sidebar.referendums.aye")}
        </Text>
        <Text
          color={votes.percNays.eq(0) ? "darkBlue300" : "white"}
          fs={14}
          fw={600}
          tTransform="uppercase"
        >
          {t("toast.sidebar.referendums.nay")}
        </Text>
      </div>

      <Spacer size={4} />

      <div sx={{ flex: "row", justify: "space-between" }}>
        <Text color="darkBlue300" fs={11} fw={500}>
          {t("toast.sidebar.referendums.value", {
            value: votes.ayes,
            percent: votes.percAyes,
          })}
        </Text>
        <Text color="darkBlue300" fs={11} fw={500}>
          {t("toast.sidebar.referendums.value", {
            value: votes.nays,
            percent: votes.percNays,
          })}
        </Text>
      </div>
    </SContainer>
  )
}
