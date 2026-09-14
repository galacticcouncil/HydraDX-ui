import { Text } from "@galacticcouncil/ui/components"
import { useTranslation } from "react-i18next"

import {
  SAppUpdateBanner,
  SAppUpdateBannerContainer,
  SAppUpdateReloadButton,
} from "@/components/AppUpdateBanner/AppUpdateBanner.styled"
import { useIsOverlayOpen } from "@/hooks/useIsOverlayOpen"
import { useTutorialContext } from "@/modules/tutorials/TutorialProvider"
import { useBannersStore, useEnabledBanners } from "@/states/banners"
import { useTransactionsStore } from "@/states/transactions"
import { useAppUpdateStore } from "@/utils/appUpdate"

export const AppUpdateBanner = () => {
  const isAvailable = useAppUpdateStore((state) => state.isAvailable)

  return isAvailable ? <AppUpdatePrompt /> : null
}

const AppUpdatePrompt = () => {
  const { t } = useTranslation("common")

  const isOverlayOpen = useIsOverlayOpen()
  const { live } = useTutorialContext()

  const isTransacting = useTransactionsStore(
    (state) =>
      state.transactions.length > 0 || state.pendingTransactions.length > 0,
  )

  const enabledBanners = useEnabledBanners()
  const closedGigaNewsIds = useBannersStore((state) => state.closedGigaNewsIds)
  const hasGigaNews = enabledBanners.some(
    (banner) => !closedGigaNewsIds.includes(banner.id),
  )

  const isSuppressed = isOverlayOpen || !!live || isTransacting || hasGigaNews

  if (isSuppressed) return null

  return (
    <SAppUpdateBannerContainer>
      <SAppUpdateBanner>
        <Text>{t("appUpdate.title")}</Text>
        <SAppUpdateReloadButton onClick={() => window.location.reload()}>
          {t("appUpdate.action")}
        </SAppUpdateReloadButton>
      </SAppUpdateBanner>
    </SAppUpdateBannerContainer>
  )
}
