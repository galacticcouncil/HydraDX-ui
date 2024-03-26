import { GradientText } from "components/Typography/GradientText/GradientText"
import { useTranslation } from "react-i18next"
import { Button } from "components/Button/Button"
import { Icon } from "components/Icon/Icon"
import PlusIcon from "assets/icons/PlusIcon.svg?react"
import Skeleton from "react-loading-skeleton"
import { Separator } from "components/Separator/Separator"
import { Text } from "components/Typography/Text/Text"
import {
  SValue,
  SValuesContainer,
} from "sections/pools/pool/details/PoolDetails.styled"
import { SPoolContainer } from "./Pool.styled"

export const PoolSkeleton = () => {
  const { t } = useTranslation()

  return (
    <SPoolContainer sx={{ mt: [-22, "inherit"] }}>
      <div sx={{ flex: "column", gap: 20, p: ["30px 12px", 30] }}>
        <GradientText
          gradient="pinkLightBlue"
          fs={19}
          sx={{ width: "fit-content" }}
        >
          {t("liquidity.pool.details.title")}
        </GradientText>
        <div
          sx={{
            flex: ["column", "row"],
            justify: "space-between",
            align: ["start", "center"],
            gap: 12,
          }}
        >
          <div sx={{ flex: "row", gap: 4, align: "center" }}>
            <Skeleton circle width={26} height={26} />
            <div sx={{ flex: "column", gap: 0 }}>
              <Skeleton height={16} width={40} />
              <Skeleton height={13} width={40} />
            </div>
          </div>
          <Button
            size="small"
            variant="primary"
            disabled
            sx={{ width: ["100%", "auto"] }}
          >
            <div
              sx={{
                flex: "row",
                align: "center",
                justify: "center",
                width: 220,
              }}
            >
              <Icon icon={<PlusIcon />} sx={{ mr: 8, height: 16 }} />
              {t("liquidity.asset.actions.addLiquidity")}
            </div>
          </Button>
        </div>
        <Separator
          color="white"
          opacity={0.06}
          sx={{ mx: "-30px", width: "calc(100% + 60px)" }}
        />
        <SValuesContainer>
          <SValue sx={{ align: "start" }}>
            <Text color="basic400">{t("tvl")}</Text>
            <Skeleton height={16} width={50} />
          </SValue>

          <Separator orientation="vertical" color="white" opacity={0.06} />

          <SValue>
            <Text color="basic400">{t("liquidity.table.header.volume")}</Text>
            <Skeleton height={16} width={50} />
          </SValue>

          <Separator
            orientation="vertical"
            color="white"
            opacity={0.06}
            sx={{ display: ["none", "inherit"] }}
          />

          <SValue sx={{ align: "start" }}>
            <Text color="basic400">{t("price")}</Text>
            <Skeleton height={16} width={50} />
          </SValue>

          <Separator orientation="vertical" color="white" opacity={0.06} />

          <SValue>
            <Text color="basic400">{t("liquidity.pool.details.fee")}</Text>
            <Skeleton height={16} width={50} />
          </SValue>
        </SValuesContainer>
      </div>
    </SPoolContainer>
  )
}
