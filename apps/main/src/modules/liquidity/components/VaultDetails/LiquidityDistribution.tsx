import { Box, Chart, Chip, Flex, Text } from "@galacticcouncil/ui/components"
import { useResponsiveValue, useTheme } from "@galacticcouncil/ui/theme"
import type { ResponsiveStyleValue } from "@galacticcouncil/ui/types"
import { getToken, pxToRem } from "@galacticcouncil/ui/utils"
import { defineChart, dot, rect, ruleX, text } from "@tanstack/charts"
import { decorative } from "@tanstack/charts/mark/decorative"
import { scaleLinear } from "@tanstack/charts/scales/linear"
import { tooltip } from "@tanstack/charts/tooltip"
import Big from "big.js"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { AssetLogo } from "@/components/AssetLogo"
import { ChartState } from "@/components/ChartState"
import { useAssetColor } from "@/hooks/useAssetColor"
import {
  SLiquidityLegend,
  SManagedBand,
  SRangeLegendToggle,
  SSpotLine,
} from "@/modules/liquidity/components/VaultDetails/LiquidityDistribution.styled"
import {
  MANAGED_RANGE,
  managedRangeChartStroke,
  managedRangeMixedColor,
} from "@/modules/liquidity/components/VaultDetails/LiquidityDistribution.theme"
import {
  Bar,
  BARS_ID,
  getLiquidityDistribution,
  getManagedBand,
  getScenarioDistribution,
  isBarPoint,
  priceAtTick,
  RangeScenario,
  sharesFocusGroup,
} from "@/modules/liquidity/components/VaultDetails/LiquidityDistribution.utils"
import { VaultTable } from "@/modules/liquidity/Vaults.utils"
import { useAssetsPrice } from "@/states/displayAsset"
import { scaleHuman } from "@/utils/formatting"

export type { RangeScenario }

const TICK_PADDING = 8
const CHART_GUIDE_INSET = 4
const CHART_PLOT_INSET = CHART_GUIDE_INSET * 2
const plotCssPos = (fraction: number) =>
  `calc(${CHART_GUIDE_INSET}px + ${fraction} * (100% - ${CHART_PLOT_INSET}px))`
const plotCssWidth = (fraction: number) =>
  `calc(${fraction} * (100% - ${CHART_PLOT_INSET}px))`
const BAR_RADIUS = 4
const BAR_GAP = 4
const MIN_BAR_HEIGHT = 12

const FADED_OPACITY = 0.3
const BACKGROUND_TIER_TINT = 0.45
const FOCUS_TRANSITION = {
  type: "tween" as const,
  duration: 350,
  easing: "ease-out" as const,
}
const SCENARIO_TRANSITION = {
  transition: {
    type: "tween" as const,
    duration: 650,
    easing: "ease-in-out" as const,
  },
}

const DEFAULT_DESKTOP_HEIGHT = 420
const DEFAULT_HEIGHT: ResponsiveStyleValue<number> = [
  280,
  DEFAULT_DESKTOP_HEIGHT,
]

const Legend = ({ color, label }: { color: string; label: string }) => (
  <Flex align="center" gap="s">
    <Box
      as="span"
      size="xs"
      borderRadius="base"
      bg={color}
      display="inline-block"
    />
    <Text fs="p6" color={getToken("text.low")}>
      {label}
    </Text>
  </Flex>
)

const RangeLegend = ({
  range,
  label,
  visible,
  onToggle,
}: {
  range: { color: string; fillOpacity: number; borderOpacity: number }
  label: string
  visible: boolean
  onToggle: () => void
}) => (
  <SRangeLegendToggle
    as="button"
    align="center"
    gap="s"
    aria-pressed={visible}
    aria-label={label}
    onClick={onToggle}
    sx={{ opacity: visible ? 1 : FADED_OPACITY }}
  >
    <Box
      as="span"
      size="xs"
      borderRadius="base"
      display="inline-block"
      sx={{
        background: managedRangeMixedColor(range.color, range.fillOpacity),
        border: `1px solid ${managedRangeMixedColor(range.color, range.borderOpacity)}`,
      }}
    />
    <Text fs="p6" color={getToken("text.low")}>
      {label}
    </Text>
  </SRangeLegendToggle>
)

export const LiquidityDistribution = ({
  vault,
  scenario,
  height,
}: {
  vault: VaultTable
  scenario?: RangeScenario
  height?: ResponsiveStyleValue<number>
}) => {
  const { t } = useTranslation(["liquidity", "common"])
  const [managedRangesVisible, setManagedRangesVisible] = useState(true)
  const { themeProps } = useTheme()
  const resolvedHeight = useResponsiveValue(height ?? DEFAULT_HEIGHT)
  const getAssetColor = useAssetColor()
  const [token0, token1] = vault.tokens
  const { decimals: decimals0 } = token0
  const { decimals: decimals1 } = token1

  const tickFontSize = themeProps.paragraphSize.p5
  const tickBaseline = TICK_PADDING + tickFontSize * 0.8

  const managedRange = useMemo(
    () => ({
      color: MANAGED_RANGE.getColor(themeProps),
      fillOpacity: MANAGED_RANGE.fillOpacity,
      borderOpacity: MANAGED_RANGE.borderOpacity,
    }),
    [themeProps],
  )

  const colors = useMemo(
    () => ({
      token0: scenario
        ? themeProps.controls.solid.accent
        : getAssetColor(token0.id),
      token1: scenario
        ? themeProps.controls.solid.base
        : getAssetColor(token1.id),
      spot: themeProps.buttons.primary.high.rest,
      surface: themeProps.surfaces.themeBasePalette.surfaceHigh,
      background: managedRangeMixedColor(
        themeProps.text.low,
        BACKGROUND_TIER_TINT,
      ),
    }),
    [getAssetColor, scenario, themeProps, token0.id, token1.id],
  )

  const vaultState = vault.vault

  const { bars, spotTick, max, lo, hi, bands, chartDecimals0, chartDecimals1 } =
    useMemo(() => {
      if (scenario) {
        const staged = getScenarioDistribution(scenario)
        return {
          ...staged,
          chartDecimals0: staged.decimals0,
          chartDecimals1: staged.decimals1,
        }
      }

      const result = getLiquidityDistribution({
        pool: vault.pool,
        state: vault.vault,
        decimals0,
        decimals1,
      })

      return {
        ...result,
        chartDecimals0: decimals0,
        chartDecimals1: decimals1,
      }
    }, [vault.pool, vault.vault, decimals0, decimals1, scenario])

  const top = max || 1
  const ceiling = top * 1.12
  const chartHeight = resolvedHeight ?? DEFAULT_DESKTOP_HEIGHT
  const minVisibleLiquidity = ceiling * (MIN_BAR_HEIGHT / chartHeight)

  const definition = useMemo(() => {
    const bandMarks =
      managedRangesVisible && !scenario
        ? bands.map(({ id, lower, upper, height }) =>
            decorative(
              rect([{ lower, upper }], {
                id: `managed-band-${id}`,
                x1: "lower",
                x2: "upper",
                y1: () => 0,
                y2: () => Math.max(top * height, minVisibleLiquidity),
                fill: managedRange.color,
                fillOpacity: managedRange.fillOpacity,
                ...managedRangeChartStroke(
                  managedRange.color,
                  managedRange.borderOpacity,
                ),
                radius: 3,
                inset: 0,
              }),
            ),
          )
        : []

    return defineChart({
      focusRing: false,
      margin: scenario ? CHART_GUIDE_INSET : undefined,
      marks: [
        rect(bars, {
          id: BARS_ID,
          x1: "from",
          x2: "to",
          y1: () => 0,
          y2: (bar) => Math.max(bar.liquidity, minVisibleLiquidity),
          color: "colorGroup",
          key: (bar) => bar.key,
          inset: 0,
          radius: BAR_RADIUS,
          stroke: colors.surface,
          strokeWidth: BAR_GAP,
          fillOpacity: 1,
          motion: scenario ? SCENARIO_TRANSITION : undefined,
          states: [
            {
              when: ({ datum, focus }) =>
                !sharesFocusGroup(focus.primary, datum, vaultState),
              style: { fillOpacity: FADED_OPACITY },
              transition: FOCUS_TRANSITION,
            },
            {
              when: ({ datum, focus }) =>
                sharesFocusGroup(focus.primary, datum, vaultState),
              style: { fillOpacity: 1 },
              transition: FOCUS_TRANSITION,
            },
          ],
        }),
        ...bandMarks,
        ...(scenario
          ? []
          : [
              ruleX([spotTick], {
                id: "current-price-rule",
                key: () => "current-price",
                stroke: colors.spot,
                strokeOpacity: 1,
                strokeWidth: 2,
              }),
              dot([spotTick], {
                id: "current-price-dot",
                key: () => "current-price",
                x: (tick) => tick,
                y: () => ceiling,
                r: 4,
                fill: colors.spot,
              }),
              text([spotTick], {
                id: "current-price-label",
                key: () => "current-price",
                x: (tick) => tick,
                y: () => 0,
                text: (tick) =>
                  t("common:number", {
                    value: priceAtTick(tick, chartDecimals0, chartDecimals1),
                  }),
                fill: colors.spot,
                fontSize: tickFontSize,
                dy: tickBaseline,
              }),
            ]),
      ],
      x: {
        scale: scaleLinear().domain([lo, hi]),
        axis: scenario
          ? false
          : {
              line: false,
              ticks: {
                values: [lo, hi],
                size: 0,
                padding: TICK_PADDING,
                format: (tick) =>
                  t("common:number", {
                    value: priceAtTick(tick, chartDecimals0, chartDecimals1),
                  }),
              },
              tickLabels: {
                fontSize: tickFontSize,
                anchor: ({ value }) => (value === lo ? "start" : "end"),
              },
            },
      },
      y: {
        scale: scaleLinear().domain([0, ceiling]),
        grid: true,
        axis: false,
      },
      color: {
        domain: ["token1", "token0", "background"],
        range: [colors.token1, colors.token0, colors.background],
      },
      tooltip: {
        use: tooltip,
        sticky: false,
        placement: "top",
      },
    })
  }, [
    bands,
    bars,
    colors,
    hi,
    lo,
    managedRange,
    spotTick,
    t,
    tickBaseline,
    tickFontSize,
    chartDecimals0,
    chartDecimals1,
    ceiling,
    minVisibleLiquidity,
    top,
    scenario,
    managedRangesVisible,
    vaultState,
  ])

  if (!bars.length)
    return <ChartState sx={{ height: resolvedHeight }} isEmpty />

  const price = priceAtTick(spotTick, token0.decimals, token1.decimals)

  return (
    <Flex direction="column" flex={1} sx={{ minHeight: resolvedHeight }}>
      {!scenario && (
        <Flex
          justify="space-between"
          align={["flex-start", "center"]}
          direction={["column", "row"]}
          gap="m"
          mb="m"
          sx={{ flexShrink: 0 }}
        >
          <Flex direction="column" gap="xs">
            <Text fs="p6" color={getToken("text.low")}>
              {t("vaults.chart.currentPrice")}
            </Text>
            <Text fs="p2" fw={500} font="primary">
              {t("vaults.price.pair", {
                value: price,
                symbolA: token0.symbol,
                symbolB: token1.symbol,
              })}
            </Text>
            <Text fs="p6" color={getToken("text.low")}>
              {t("vaults.price.pair", {
                value: 1 / price,
                symbolA: token1.symbol,
                symbolB: token0.symbol,
              })}
            </Text>
          </Flex>
        </Flex>
      )}

      <Flex
        flex={1}
        direction="column"
        justify="flex-end"
        sx={{ minHeight: 0 }}
      >
        <Flex position="relative" minWidth={0}>
          <Chart
            css={{ ".ts-chart__grid": { strokeDasharray: "2 4" } }}
            definition={definition}
            ariaLabel={t(
              scenario
                ? "vaults.explainer.chartLabel"
                : "vaults.chart.liquidity",
            )}
            height={resolvedHeight}
            renderTooltipBody={({ points }) => {
              if (scenario) return null

              const [first] = points.filter(isBarPoint)

              if (!first) return null

              return <TickStats bar={first.datum} vault={vault} />
            }}
          />

          {scenario && (
            <>
              {managedRangesVisible &&
                bands.map((managedBand) => {
                  const span = hi - lo
                  const leftFraction = (managedBand.lower - lo) / span
                  const widthFraction =
                    (managedBand.upper - managedBand.lower) / span

                  return (
                    <SManagedBand
                      key={managedBand.id}
                      aria-hidden
                      $rangeColor={managedRange.color}
                      $fillOpacity={managedRange.fillOpacity}
                      $borderOpacity={managedRange.borderOpacity}
                      $opacity={
                        managedBand.id === "previous" ? FADED_OPACITY : 1
                      }
                      position="absolute"
                      top={`${CHART_GUIDE_INSET}px`}
                      bottom={`${CHART_GUIDE_INSET}px`}
                      left={plotCssPos(leftFraction)}
                      width={plotCssWidth(widthFraction)}
                      borderRadius="base"
                    />
                  )
                })}

              <SSpotLine
                aria-hidden
                position="absolute"
                top={`${CHART_GUIDE_INSET}px`}
                bottom={`${CHART_GUIDE_INSET}px`}
                left={plotCssPos(
                  Math.min(1, Math.max(0, (spotTick - lo) / (hi - lo))),
                )}
                width={pxToRem(2)}
                bg={colors.spot}
                transform="translateX(-1px)"
              >
                <Flex
                  position="absolute"
                  top={pxToRem(-4)}
                  left="50%"
                  size={pxToRem(8)}
                  borderRadius="full"
                  bg={colors.spot}
                  transform="translateX(-50%)"
                />
              </SSpotLine>
            </>
          )}
        </Flex>

        <SLiquidityLegend mt="s" wrap>
          <Legend
            color={colors.token1}
            label={
              scenario
                ? t("vaults.explainer.legend.tokenB")
                : t("vaults.chart.legend.token1", { symbol: token1.symbol })
            }
          />
          <Legend
            color={colors.token0}
            label={
              scenario
                ? t("vaults.explainer.legend.tokenA")
                : t("vaults.chart.legend.token0", { symbol: token0.symbol })
            }
          />
          <Legend color={colors.spot} label={t("vaults.chart.legend.spot")} />
          {bands.length > 0 && (
            <RangeLegend
              range={managedRange}
              label={t("vaults.chart.legend.ranges")}
              visible={managedRangesVisible}
              onToggle={() => setManagedRangesVisible((value) => !value)}
            />
          )}
          {scenario && (
            <Legend
              color={colors.background}
              label={t("vaults.explainer.legend.otherLps")}
            />
          )}
        </SLiquidityLegend>
      </Flex>
    </Flex>
  )
}

const TickStats = ({ bar, vault }: { bar: Bar; vault: VaultTable }) => {
  const { t } = useTranslation(["liquidity", "common"])
  const [token0, token1] = vault.tokens
  const { decimals: decimals0 } = token0
  const { decimals: decimals1 } = token1
  const { getAssetPrice } = useAssetsPrice([token0.id, token1.id])

  const low = priceAtTick(bar.rangeFrom, decimals0, decimals1)
  const high = priceAtTick(bar.rangeTo, decimals0, decimals1)
  const held = bar.side === "token0" ? token0 : token1
  const state = vault.vault
  const mid = (bar.rangeFrom + bar.rangeTo) / 2
  const managedBand = state ? getManagedBand(mid, state) : null

  const human = (raw: bigint, decimals: number) =>
    t("common:number", {
      value: scaleHuman(raw.toString(), decimals),
      threshold: true,
      thresholdMaximumFractionDigits: 2,
    })

  const usd = (assetId: string, amount: string | number) => {
    const price = getAssetPrice(assetId)
    if (!price?.isValid) return undefined

    return t("common:currency", {
      value: Big(amount).times(price.price).toString(),
    })
  }

  const vaultPosition =
    state && managedBand
      ? {
          label: t(
            managedBand === "base"
              ? "vaults.composition.base"
              : "vaults.composition.limit",
          ),
          ...state[managedBand],
        }
      : null

  const share =
    vaultPosition && bar.liquidity > 0
      ? (Number(vaultPosition.liquidity) / bar.liquidity) * 100
      : null

  return (
    <Flex direction="column" gap="s" p="m" minWidth="4xl">
      <Flex justify="space-between" align="center" gap="m">
        <Text
          fs="p5"
          color={getToken("text.high")}
          fontVariantNumeric="tabular-nums"
          whiteSpace="nowrap"
        >
          {t("common:number.range", { from: low, to: high })}
        </Text>
        <Flex align="center" gap="xs">
          {managedBand && (
            <Chip size="small" variant="blue">
              {t(
                managedBand === "base"
                  ? "vaults.chart.band.base"
                  : "vaults.chart.band.limit",
              )}
            </Chip>
          )}
          {bar.current && (
            <Chip size="small" variant="lime">
              {t("vaults.chart.tooltip.current")}
            </Chip>
          )}
        </Flex>
      </Flex>

      <Text fs="p6" color={getToken("text.medium")}>
        {t("vaults.chart.tooltip.locked")}
      </Text>
      <TickStatsRow
        label={held.symbol}
        isSymbolLabel={true}
        icon={<AssetLogo id={held.id} size="extra-small" />}
        value={t("common:number", {
          value: bar.locked,
          threshold: true,
          thresholdMaximumFractionDigits: 2,
        })}
        displayValue={usd(held.id, bar.locked)}
      />

      {vaultPosition && (
        <>
          <Text fs="p6" color={getToken("text.medium")} mt="xs">
            {share !== null
              ? t("vaults.chart.tooltip.vaultShare", {
                  label: vaultPosition.label,
                  value: share,
                })
              : vaultPosition.label}
          </Text>
          <TickStatsRow
            label={token0.symbol}
            isSymbolLabel={true}
            icon={<AssetLogo id={token0.id} size="extra-small" />}
            value={human(vaultPosition.amount0, decimals0)}
            displayValue={usd(
              token0.id,
              scaleHuman(vaultPosition.amount0.toString(), decimals0),
            )}
          />
          <TickStatsRow
            label={token1.symbol}
            isSymbolLabel={true}
            icon={<AssetLogo id={token1.id} size="extra-small" />}
            value={human(vaultPosition.amount1, decimals1)}
            displayValue={usd(
              token1.id,
              scaleHuman(vaultPosition.amount1.toString(), decimals1),
            )}
          />
        </>
      )}
    </Flex>
  )
}

const TickStatsRow = ({
  label,
  value,
  displayValue,
  icon,
  isSymbolLabel = false,
}: {
  label: string
  value: string
  displayValue?: string
  icon?: React.ReactNode
  isSymbolLabel?: boolean
}) => (
  <Flex justify="space-between" align="center" gap="xl">
    <Flex align="center" gap="xs">
      {icon}
      <Text
        fs="p6"
        color={getToken(isSymbolLabel ? "text.high" : "text.medium")}
        whiteSpace="nowrap"
      >
        {label}
      </Text>
    </Flex>
    <Flex direction="column" align="flex-end" gap="xxs">
      <Text
        fs="p6"
        lh={1}
        color={getToken("text.high")}
        fontVariantNumeric="tabular-nums"
        whiteSpace="nowrap"
      >
        {value}
      </Text>
      {displayValue && (
        <Text
          fs="p6"
          lh={1}
          color={getToken("text.low")}
          fontVariantNumeric="tabular-nums"
          whiteSpace="nowrap"
        >
          {displayValue}
        </Text>
      )}
    </Flex>
  </Flex>
)
