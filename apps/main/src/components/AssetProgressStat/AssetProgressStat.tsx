import {
  Flex,
  ProgressBar,
  Skeleton,
  Text,
} from "@galacticcouncil/ui/components"
import { getToken } from "@galacticcouncil/ui/utils"
import { ReactNode } from "react"
import { useTranslation } from "react-i18next"

import { AssetLogo } from "@/components/AssetLogo"
import {
  SAssetProgressStat,
  SAssetProgressStatGrid,
  SAssetProgressStatProgress,
} from "@/components/AssetProgressStat/AssetProgressStat.styled"

export type AssetProgressStatProps = {
  assetId: string
  value: ReactNode
  progressPct?: number
  isProgressLoading?: boolean
  layout?: "default" | "grid"
}

export const AssetProgressStat = ({
  assetId,
  value,
  progressPct = 0,
  isProgressLoading = false,
  layout = "default",
}: AssetProgressStatProps) => {
  const { t } = useTranslation(["common"])

  const showProgress = !isProgressLoading && progressPct > 0
  const reserveProgressSpace = isProgressLoading || showProgress
  const Root = layout === "grid" ? SAssetProgressStatGrid : SAssetProgressStat

  return (
    <Root>
      <Flex
        align="center"
        gap="base"
        sx={{ pb: reserveProgressSpace && "base" }}
      >
        <AssetLogo id={assetId} size="medium" hideChain />
        {value}
      </Flex>
      {isProgressLoading ? (
        <SAssetProgressStatProgress>
          <Skeleton sx={{ height: "2xs" }} />
        </SAssetProgressStatProgress>
      ) : (
        showProgress && (
          <SAssetProgressStatProgress>
            <ProgressBar
              value={progressPct}
              customLabel={
                <Text
                  fs="p4"
                  as="span"
                  fw={600}
                  color={getToken("text.tint.quart")}
                >
                  {t("percent", { value: progressPct })}
                </Text>
              }
            />
          </SAssetProgressStatProgress>
        )
      )}
    </Root>
  )
}
