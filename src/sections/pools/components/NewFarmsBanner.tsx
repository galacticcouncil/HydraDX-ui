import { useFarmsPoolAssets } from "api/farms"
import { NewFarmsBannerContainer } from "./NewFarmsBanner.styled"
import { Text } from "components/Typography/Text/Text"
import { SSeparator } from "components/Separator/Separator.styled"
import { Link } from "@tanstack/react-location"
import { LINKS } from "utils/navigation"
import { useTranslation } from "react-i18next"
import Star from "assets/icons/Star.svg?react"
import { Icon } from "components/Icon/Icon"
import { useState } from "react"
import CrossIcon from "assets/icons/CrossIcon.svg?react"
import { useAssets } from "providers/assets"

export const NewFarmsBanner = () => {
  const { getAssetWithFallback } = useAssets()
  const { t } = useTranslation()
  const poolAssets = useFarmsPoolAssets()

  const [visible, setVisible] = useState(true)

  if (!poolAssets.data?.length || !visible) return null

  return (
    <NewFarmsBannerContainer>
      <div
        sx={{
          flex: ["column", "row"],
          gap: ["4px", "14px"],
          justify: "center",
          flexGrow: 1,
        }}
      >
        <div sx={{ flex: "row", gap: 4, align: "center" }}>
          <Icon icon={<Star />} sx={{ color: "white" }} />
          <Text fs={11} color="white">
            {t("banner.newFarms.label", {
              symbols: poolAssets.data
                .map(
                  (poolAsset) =>
                    getAssetWithFallback(poolAsset.toString()).symbol,
                )
                .join(" & "),
            })}
          </Text>
        </div>

        <SSeparator
          orientation="vertical"
          sx={{ height: 12, display: ["none", "block"] }}
          color="white"
          opacity={0.2}
        />

        <Link to={LINKS.omnipool}>
          <Text
            fs={11}
            color="white"
            sx={{ opacity: 0.7, pl: [15, 0] }}
            css={{ textDecoration: "underline" }}
          >
            {t("banner.newFarms.link")}
          </Text>
        </Link>
      </div>

      <Icon
        sx={{ color: "white", display: ["block", "none"] }}
        icon={
          <CrossIcon
            onClick={(e) => {
              e.stopPropagation()
              setVisible(false)
            }}
          />
        }
      />
    </NewFarmsBannerContainer>
  )
}
