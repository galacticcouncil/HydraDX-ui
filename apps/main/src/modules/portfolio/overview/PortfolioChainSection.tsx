import {
  Alert,
  Box,
  Button,
  CollapsibleContent,
  CollapsibleRoot,
  CollapsibleTrigger,
} from "@galacticcouncil/ui/components"
import {
  getChainAssetId,
  getChainId,
  hasRouteToHydration,
} from "@galacticcouncil/utils"
import { AnyChain } from "@galacticcouncil/xc-core"
import Big from "big.js"
import { FC, memo, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { useAssetMetadata } from "@/api/metadata"
import { MultichainValuedBalance } from "@/api/portfolio"
import { useCrossChainConfigService } from "@/api/xcm"
import { SortingProps } from "@/hooks/useDataTableUrlSorting"
import { MyAssetsEmptyState } from "@/modules/portfolio/overview/MyAssets/MyAssetsEmptyState"
import { MyAssetsTable } from "@/modules/portfolio/overview/MyAssets/MyAssetsTable"
import { MyAsset } from "@/modules/portfolio/overview/MyAssets/MyAssetsTable.columns"
import { myAssetsMobileSorter } from "@/modules/portfolio/overview/MyAssets/MyAssetsTable.utils"
import { PortfolioChainHeader } from "@/modules/portfolio/overview/PortfolioChainHeader"
import { toSourceChainAssetData } from "@/modules/portfolio/overview/PortfolioChainSection.utils"
import { SPortfolioTableWrapper } from "@/modules/portfolio/overview/PortfolioOverview.styled"
import { useAssets } from "@/providers/assetsProvider"
import { toDecimal } from "@/utils/formatting"

type Props = {
  readonly chain: AnyChain
  readonly balances: ReadonlyArray<MultichainValuedBalance>
  readonly total: string
  readonly isLoading: boolean
  readonly isError: boolean
  readonly refetch: () => void
  readonly searchPhrase: string
  readonly sortingProps: SortingProps
  readonly showDepositAction?: boolean
}

export const PortfolioChainSection: FC<Props> = memo(
  ({
    chain,
    balances,
    total,
    isLoading,
    isError,
    refetch,
    searchPhrase,
    sortingProps,
    showDepositAction = true,
  }) => {
    const { t } = useTranslation(["wallet", "common"])
    const { getAsset } = useAssets()
    const metadata = useAssetMetadata()
    const configService = useCrossChainConfigService()
    const [open, setOpen] = useState<boolean | null>(null)

    const data = useMemo(
      () =>
        balances
          .map<MyAsset>(({ balance, assetId, displayValue }) => {
            const amount = toDecimal(balance.amount, balance.decimals)
            const chainId = getChainId(chain)
            const chainAssetId = getChainAssetId(chain, balance).toString()
            const externalIconSrc =
              (chainId
                ? metadata.getAssetLogoSrc(
                    chainId,
                    chainAssetId,
                    chain.ecosystem,
                  )
                : "") || undefined

            const meta = toSourceChainAssetData(
              chain.key,
              balance,
              assetId ? getAsset(assetId) : undefined,
              externalIconSrc,
            )

            return {
              ...meta,
              origin: chain,
              xcAssetKey: balance.key,
              canDeposit: hasRouteToHydration(
                balance.key,
                chain,
                configService,
              ),
              total: amount,
              totalDisplay: displayValue ?? undefined,
              transferable: amount,
              transferableDisplay: displayValue ?? undefined,
              canStake: false,
            }
          })
          .filter((asset) => Big(asset.total).gt(0))
          .sort(myAssetsMobileSorter),
      [balances, chain, configService, getAsset, metadata],
    )

    const canDepositAny = data.some((asset) => asset.canDeposit)

    const hasAssets = data.length > 0
    const showEmptyState = !isLoading && !isError && !hasAssets
    const defaultOpen = isError || showEmptyState || hasAssets
    const isOpen = open ?? defaultOpen

    return (
      <CollapsibleRoot open={isOpen} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <PortfolioChainHeader
            isExpandable
            name={chain.name}
            chainId={getChainId(chain)}
            ecosystem={chain.ecosystem}
            totalDisplay={
              isError
                ? "—"
                : Big(total).gt(0)
                  ? t("common:currency", { value: total })
                  : undefined
            }
            isLoading={isLoading}
          />
        </CollapsibleTrigger>
        <CollapsibleContent
          forceMount={showEmptyState || hasAssets || undefined}
          animationDurationMs={400}
          sx={{ overflow: "hidden" }}
        >
          <Box sx={{ minHeight: 0 }}>
            {isError ? (
              <Box p="m">
                <Alert
                  variant="error"
                  title={t("myAssets.otherChains.error.title", {
                    chain: chain.name,
                  })}
                  action={
                    <Button size="small" variant="tertiary" onClick={refetch}>
                      {t("myAssets.otherChains.error.retry")}
                    </Button>
                  }
                />
              </Box>
            ) : showEmptyState ? (
              <MyAssetsEmptyState />
            ) : (
              <SPortfolioTableWrapper>
                <MyAssetsTable
                  isReadOnly
                  showDepositAction={showDepositAction && canDepositAny}
                  data={data}
                  isLoading={isLoading}
                  searchPhrase={searchPhrase}
                  sortingProps={sortingProps}
                />
              </SPortfolioTableWrapper>
            )}
          </Box>
        </CollapsibleContent>
      </CollapsibleRoot>
    )
  },
)
PortfolioChainSection.displayName = "PortfolioChainSection"
