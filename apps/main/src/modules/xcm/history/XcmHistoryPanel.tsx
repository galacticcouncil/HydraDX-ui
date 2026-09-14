import {
  Chip,
  Stack,
  ToggleGroup,
  ToggleGroupItem,
} from "@galacticcouncil/ui/components"
import type { XcJourney } from "@galacticcouncil/xc-scan"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { XcScanJourneyList } from "@/modules/xcm/history/XcScanJourneyList"

enum TabView {
  All = "all",
  Claimable = "claimable",
}

type XcmHistoryPanelProps = {
  all: XcJourney[]
  claimable: XcJourney[]
}

const PAGE_SIZE = 4

export const XcmHistoryPanel: React.FC<XcmHistoryPanelProps> = ({
  all,
  claimable,
}) => {
  const { t } = useTranslation(["common"])
  const [filter, setFilter] = useState<TabView>(
    all.length === 0 && claimable.length > 0 ? TabView.Claimable : TabView.All,
  )

  const shouldRenderFilter = claimable.length > 0

  useEffect(() => {
    if (claimable.length === 0 && filter === TabView.Claimable) {
      setFilter(TabView.All)
    }
  }, [claimable.length, filter])

  return (
    <Stack
      gap="base"
      justify="flex-start"
      maxWidth="6xl"
      width="100%"
      mx="auto"
    >
      {shouldRenderFilter && (
        <ToggleGroup<TabView>
          type="single"
          fullWidth
          size="medium"
          value={filter}
          onValueChange={(value) => value && setFilter(value)}
        >
          <ToggleGroupItem value={TabView.All}>{t("all")}</ToggleGroupItem>
          <ToggleGroupItem value={TabView.Claimable}>
            {t("claimable")} <Chip size="small">{claimable.length}</Chip>
          </ToggleGroupItem>
        </ToggleGroup>
      )}
      {filter === TabView.All && (
        <XcScanJourneyList data={all} pageSize={PAGE_SIZE} />
      )}
      {filter === TabView.Claimable && (
        <XcScanJourneyList data={claimable} pageSize={PAGE_SIZE} />
      )}
    </Stack>
  )
}
