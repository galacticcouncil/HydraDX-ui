import { useTranslation } from "react-i18next"
import { SBage, SDetailsBox, SVotingBox } from "./Voting.styled"
import { Text } from "components/Typography/Text/Text"
import Skeleton from "react-loading-skeleton"
import { theme } from "theme"
import { GradientText } from "components/Typography/GradientText/GradientText"
import { Icon } from "components/Icon/Icon"
import { ReactComponent as AyeIcon } from "assets/icons/SuccessIcon.svg"
import { ReactComponent as NayIcon } from "assets/icons/FailIcon.svg"
import { AssetSelectSkeleton } from "components/AssetSelect/AssetSelectSkeleton"
import { ConvictionDropdown } from "./components/Dropdown/DropdownConviction"
import { Button } from "components/Button/Button"
import { Separator } from "components/Separator/Separator"

export const VotingSkeleton = () => {
  const { t } = useTranslation()
  return (
    <div sx={{ flex: ["column", "row"], gap: 30 }}>
      <SDetailsBox
        css={{ flex: 3, alignSelf: "flex-start" }}
        sx={{ flex: "column", gap: 12 }}
      >
        <div sx={{ flex: "row", gap: 12, py: 15, align: "center" }}>
          <Skeleton width={300} height={20} />
        </div>

        <Separator
          css={{ background: `rgba(${theme.rgbColors.white}, 0.06)` }}
        />
        <div sx={{ flex: "row", justify: "space-between" }}>
          <div sx={{ flex: "row", gap: 14, align: "center" }}>
            <Skeleton circle width={16} height={16} />
            <div sx={{ flex: "row", gap: 4, align: "center" }}>
              <Skeleton width={100} height={13} />
            </div>

            <div
              css={{
                background: "rgba(114, 131, 165, 0.6)",
                width: 3,
                height: 3,
                borderRadius: "9999px",
              }}
            />
            <Skeleton sx={{ width: [100, 150], height: 13 }} />
          </div>
          <SBage>{t("voting.referenda.badge")}</SBage>
        </div>
        <Separator
          css={{
            background: `rgba(${theme.rgbColors.white}, 0.06)`,
            marginBottom: 12,
          }}
        />
        <Skeleton sx={{ width: [200, 400], height: 20 }} />
      </SDetailsBox>

      <SVotingBox css={{ flex: 2 }}>
        <GradientText fs={19} gradient="pinkLightBlue" sx={{ my: 12 }}>
          {t("voting.referenda.votes")}
        </GradientText>

        <div sx={{ flex: "column", gap: 12 }}>
          <div
            sx={{ flex: "row", gap: 8 }}
            css={{ "& > span": { width: "100%" } }}
          >
            <Skeleton height={12} width="100%" />
          </div>

          <div sx={{ flex: "row", justify: "space-between" }}>
            <div sx={{ flex: "column", gap: 5 }}>
              <Skeleton width={50} height={16} />
              <Text color="white" fs={14}>
                {t("toast.sidebar.referendums.aye")}
              </Text>
            </div>
            <div sx={{ flex: "column", gap: 5, align: "end" }}>
              <Skeleton width={50} height={16} />
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
            </div>

            <Skeleton width={100} height={16} />
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
            </div>
            <Skeleton width={100} height={16} />
          </div>

          <Separator
            css={{
              background: `rgba(${theme.rgbColors.white}, 0.06)`,
            }}
          />
        </div>
        <div sx={{ flex: "column", gap: 12 }}>
          <AssetSelectSkeleton
            title={t("staking.dashboard.form.stake.inputTitle")}
            name="amount"
            balanceLabel={t("selectAsset.balance.label")}
          />

          <ConvictionDropdown value="locked1x" onChange={() => null} disabled />

          <div sx={{ flex: "column", gap: 12, align: "center", mt: 16 }}>
            <div sx={{ flex: "row", gap: 12 }} css={{ alignSelf: "stretch" }}>
              <Button type="button" variant="green" fullWidth disabled>
                {t("voting.referenda.btn.aye")}
              </Button>
              <Button type="button" variant="primary" fullWidth disabled>
                {t("voting.referenda.btn.nay")}
              </Button>
            </div>
            <Text color="basic400" fs={14}>
              {t("or")}
            </Text>

            <Button type="button" fullWidth disabled>
              {t("voting.referenda.btn.subsquare")}
            </Button>
          </div>
        </div>
      </SVotingBox>
    </div>
  )
}
