import { Button, Icon, Skeleton, Text } from "@galacticcouncil/ui/components"
import { useBreakpoints } from "@galacticcouncil/ui/theme"
import { getToken } from "@galacticcouncil/ui/utils"
import { Link } from "@tanstack/react-router"
import { Plus, Repeat } from "lucide-react"
import { useTranslation } from "react-i18next"

import { swapTabLink } from "@/config/navigation"
import { AssetYields } from "@/modules/liquidity/components/PoolDetailsHeader/AssetYields"
import { PoolDetailsHeaderShell } from "@/modules/liquidity/components/PoolDetailsHeader/PoolDetailsHeaderShell"
import {
  isIsolatedPool,
  IsolatedPoolTable,
  OmnipoolAssetTable,
} from "@/modules/liquidity/Liquidity.utils"

export const PoolDetailsHeader = ({
  data,
}: {
  data: OmnipoolAssetTable | IsolatedPoolTable
}) => {
  const { t } = useTranslation("liquidity")
  const isOmnipool = !isIsolatedPool(data)
  const isNative = isOmnipool ? data.isNative : false
  const stablepoolData = isOmnipool ? data.stablepoolData : undefined
  const { isMobile } = useBreakpoints()

  return (
    <PoolDetailsHeaderShell
      logoId={isOmnipool ? data.meta.id : data.meta.iconId}
      title={data.meta.name}
      subtitle={
        <Text fw={600} fs="p6" color={getToken("text.medium")}>
          {data.meta.symbol}
        </Text>
      }
      badges={
        data.isFeeLoading ? (
          <Skeleton width={60} height="1em" />
        ) : (
          <AssetYields data={data} />
        )
      }
      actions={
        <>
          <Button
            size={isMobile ? "medium" : "small"}
            width="100%"
            asChild
            disabled={!data.canAddLiquidity || isNative}
          >
            <Link
              to="/liquidity/$id/add"
              params={{
                id: data.id,
              }}
              search={
                stablepoolData
                  ? {
                      stableswapId: stablepoolData.id.toString(),
                      erc20Id: stablepoolData.aToken?.id.toString(),
                    }
                  : undefined
              }
              resetScroll={false}
            >
              <Icon size="s" component={Plus} />
              {t("addLiquidity")}
            </Link>
          </Button>
          {isOmnipool && (
            <Button
              variant="secondary"
              size={isMobile ? "medium" : "small"}
              width="100%"
              asChild
            >
              <Link
                {...swapTabLink("market")}
                search={{
                  assetOut: stablepoolData
                    ? stablepoolData.aToken?.id || data.id
                    : data.id,
                }}
              >
                <Icon size="s" component={Repeat} />
                {t("details.header.swap")}
              </Link>
            </Button>
          )}
        </>
      }
    />
  )
}
