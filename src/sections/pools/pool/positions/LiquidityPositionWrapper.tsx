import { Text } from "components/Typography/Text/Text"
import { useTranslation } from "react-i18next"
import { LiquidityPosition } from "./LiquidityPosition"
import LiquidityIcon from "assets/icons/WaterRippleIcon.svg?react"
import { Icon } from "components/Icon/Icon"
import { TPoolFullData } from "sections/pools/PoolsPage.utils"
import { Button } from "components/Button/Button"
import TrashIcon from "assets/icons/IconRemove.svg?react"
import { RemoveLiquidity } from "sections/pools/modals/RemoveLiquidity/RemoveLiquidity"
import { ReactElement, useMemo, useState } from "react"
import { useRefetchAccountPositions } from "api/deposits"
import { SPoolDetailsContainer } from "sections/pools/pool/details/PoolDetails.styled"
import { BN_0 } from "utils/constants"
import { Separator } from "components/Separator/Separator"
import { theme } from "theme"
import { useMedia } from "react-use"
import { CollapsedPositionsList } from "sections/pools/pool/myPositions/MyPositions"
import BN from "bignumber.js"
import { LrnaPositionTooltip } from "sections/pools/components/LrnaPositionTooltip"
import { usePoolData } from "sections/pools/pool/Pool"
import { TLPData } from "utils/omnipool"

export const LiquidityPositionWrapper = () => {
  const { t } = useTranslation()
  const isDesktop = useMedia(theme.viewport.gte.sm)
  const [openRemove, setOpenRemove] = useState<TLPData | TLPData[] | undefined>(
    undefined,
  )
  const pool = usePoolData().pool as TPoolFullData
  const refetchPositions = useRefetchAccountPositions()

  const positions = pool.omnipoolNftPositions
  const positionsNumber = positions.length

  const total = useMemo(() => {
    if (positionsNumber) {
      return positions.reduce(
        (acc, position) => {
          const newValues = {
            value: acc.value.plus(position.valueShifted),
            totalValue: acc.totalValue.plus(position.totalValueShifted),
            hub: acc.hub.plus(position.lrnaShifted),
            display: acc.display.plus(position.valueDisplay),
          }
          return newValues
        },
        { value: BN_0, totalValue: BN_0, hub: BN_0, display: BN_0 },
      )
    }
    return { value: BN_0, hub: BN_0, display: BN_0, totalValue: BN_0 }
  }, [positions, positionsNumber])

  const isHubValue = total.hub.gt(0)

  const positionsData = positions.reduce<{
    positions: { element: ReactElement; moveTo: number; height: number }[]
    height: BN
  }>(
    (acc, position, i, array) => {
      const isLastElement = array.length === i + 1

      const cardHeight = isDesktop ? 162 : 192

      acc.positions.push({
        element: (
          <LiquidityPosition
            key={`${i}-${position.assetId}`}
            position={position}
            index={i + 1}
            onSuccess={refetchPositions}
            onRemovePosition={() => setOpenRemove(position)}
            pool={pool}
          />
        ),
        moveTo: !acc.height.isZero()
          ? acc.height.minus(20 * i).toNumber()
          : acc.height.toNumber(),
        height: cardHeight,
      })

      acc.height = acc.height.plus(cardHeight + (isLastElement ? 0 : 16))

      return acc
    },
    { positions: [], height: BN_0 },
  )

  return (
    <>
      {positionsNumber && (
        <SPoolDetailsContainer
          css={{ background: "transparent" }}
          sx={{ pb: [0, 0] }}
        >
          <div
            sx={{
              flex: "row",
              justify: "space-between",
              align: "center",
              mb: 12,
            }}
          >
            <div sx={{ flex: "row", align: "center", gap: 8 }}>
              <Icon
                size={18}
                sx={{ color: "pink600" }}
                icon={<LiquidityIcon />}
              />
              <Text fs={[16, 16]} color="pink600">
                {t("liquidity.asset.liquidityPositions.title")}
              </Text>
            </div>

            <Button
              variant="error"
              size="compact"
              onClick={() => setOpenRemove(positions)}
            >
              <Icon size={12} icon={<TrashIcon />} />
              {t("liquidity.pool.positions.removeAll.btn")}
            </Button>
          </div>

          <div
            sx={{
              flex: "row",
              justify: "space-between",
              align: "center",
              py: 12,
            }}
          >
            <div sx={{ flex: "column", gap: 2 }}>
              <Text color="basic400" fs={[12, 13]} sx={{ mb: 2 }}>
                {t("liquidity.pool.positions.liq")}
              </Text>
              <div sx={{ flex: "row", align: "center", gap: 4 }}>
                <Text color="white" fs={[14, 16]}>
                  {t("value.tokenWithSymbol", {
                    value: total.totalValue,
                    symbol: pool.symbol,
                  })}
                </Text>
                {isHubValue && (
                  <LrnaPositionTooltip
                    assetId={pool.id}
                    tokenPosition={total.value}
                    lrnaPosition={total.hub}
                  />
                )}
              </div>

              <Text color="basic500" fs={12}>
                {t("value.usd", { amount: total.display })}
              </Text>
            </div>

            <Separator
              orientation="vertical"
              color="white"
              opacity={0.06}
              sx={{ height: 45 }}
            />

            <div sx={{ flex: "column", gap: 2 }}>
              <Text color="basic400" fs={[12, 13]} sx={{ mb: 2 }}>
                {t("liquidity.pool.positions.liq.number")}
              </Text>
              <Text color="white" fs={[14, 16]}>
                {positionsNumber}
              </Text>
            </div>
          </div>

          <CollapsedPositionsList positions={positionsData.positions} />
        </SPoolDetailsContainer>
      )}
      {openRemove && (
        <RemoveLiquidity
          pool={pool}
          position={openRemove}
          isOpen
          onClose={() => setOpenRemove(undefined)}
          onSuccess={refetchPositions}
        />
      )}
    </>
  )
}
