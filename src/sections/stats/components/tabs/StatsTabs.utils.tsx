import ChartIcon from "assets/icons/ChartIcon.svg?react"
import LRNAIcon from "assets/icons/LRNAIcon.svg?react"
import TreasuryIcon from "assets/icons/Treasury.svg?react"
import { LINKS } from "utils/navigation"

export const STATS_TABS = [
  { id: "overview", link: LINKS.statsOverview, icon: <ChartIcon /> },
  { id: "POL", link: LINKS.statsPOL, icon: <TreasuryIcon /> },
  { id: "LRNA", link: LINKS.statsLRNA, icon: <LRNAIcon /> },
] as const
