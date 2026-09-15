import { VaultState } from "@/api/gamma/vaults"
import { V3PoolBase } from "@/api/pools"

export const priceAtTick = (
  tick: number,
  decimals0: number,
  decimals1: number,
) => Math.pow(1.0001, tick) * Math.pow(10, decimals0 - decimals1)

const sqrtRatioAtTick = (tick: number) => Math.pow(1.0001, tick / 2)

const lockedAmount = (
  liquidity: number,
  lower: number,
  upper: number,
  side: "token0" | "token1",
  decimals0: number,
  decimals1: number,
) =>
  side === "token1"
    ? (liquidity * (sqrtRatioAtTick(upper) - sqrtRatioAtTick(lower))) /
      Math.pow(10, decimals1)
    : (liquidity * (1 / sqrtRatioAtTick(lower) - 1 / sqrtRatioAtTick(upper))) /
      Math.pow(10, decimals0)

const liquidityToChartScale = (value: bigint) => Number(value)

export type Bar = {
  key: string
  from: number
  to: number
  liquidity: number
  side: "token0" | "token1"
  rangeFrom: number
  rangeTo: number
  locked: number
  current: boolean
  /** explainer only: which illustrative tier the bar belongs to */
  tier?: "managed" | "limit" | "background"
  colorGroup: "token0" | "token1" | "background"
}

export type BandId = "active" | "previous" | "base" | "limit"

export type Band = {
  id: BandId
  lower: number
  upper: number
  height: number
}

export type RangeScenario =
  | "inRange"
  | "outOfRange"
  | "recentered"
  | "limitOrder"

export const RANGE_SCENARIOS = [
  "inRange",
  "outOfRange",
  "recentered",
  "limitOrder",
] as const satisfies ReadonlyArray<RangeScenario>

export const isRangeScenario = (value: string): value is RangeScenario =>
  RANGE_SCENARIOS.includes(value as RangeScenario)

export type LiquidityDistributionResult = {
  bars: Bar[]
  spotTick: number
  max: number
  lo: number
  hi: number
  bands: ReadonlyArray<Band>
}

export const BARS_ID = "liquidity-bars"

const SLICE_TARGET = 30
const DEFAULT_DOMAIN_PADDING_RATIO = 1
const ZOOMED_DOMAIN_PADDING_RATIO = 0.1
const MEANINGFUL_LIQUIDITY_PERCENT = 5n
/** keeps a tiny vault position visible as a range marker */
const MIN_BAND_HEIGHT = 0.02

const CHART_LAYOUT = {
  defaultTickPadding: 3000,
  fallbackBaseLowerRatio: 0.34,
  fallbackBaseUpperRatio: 0.7,
  outsideOffsetRatio: 0.12,
  outsideMarginRatio: 0.05,
  recenterEdgeInsetRatio: 0.02,
  scenarioBandHeight: 1.05,
} as const

const SCENARIO_TIER_SCALE = {
  managed: 0.8,
  background: 0.5,
} as const

type LiquidityInterval = {
  lower: number
  upper: number
  liquidity: bigint
}

type ChartBounds = {
  from: number
  to: number
  span: number
  base: { lower: number; upper: number }
  recentered: { lower: number; upper: number }
  outside: number
  inside: number
  marketSpot: number
}

type VaultBands = Pick<
  VaultState,
  "baseLower" | "baseUpper" | "limitLower" | "limitUpper" | "base" | "limit"
>

const barMidpoint = (bar: Bar) => (bar.from + bar.to) / 2

const barsExtent = (bars: Bar[]) => {
  if (!bars.length) return null

  return {
    lower: Math.min(...bars.map((bar) => bar.from)),
    upper: Math.max(...bars.map((bar) => bar.to)),
  }
}

export const isBarPoint = <TPoint extends { markId: string; datum: unknown }>(
  point: TPoint,
): point is TPoint & { datum: Bar } => point.markId === BARS_ID

export const isSameRange = (
  focused: { markId: string; datum: unknown },
  bar: Bar,
) =>
  !isBarPoint(focused) ||
  (focused.datum.rangeFrom === bar.rangeFrom &&
    focused.datum.rangeTo === bar.rangeTo)

export const hasBase = (state: VaultBands) =>
  state.baseUpper > state.baseLower && state.base.liquidity > 0n

export const hasLimit = (state: VaultBands) =>
  state.limitUpper > state.limitLower && state.limit.liquidity > 0n

export const getManagedBand = (
  tick: number,
  state: VaultBands,
): "base" | "limit" | null => {
  if (hasLimit(state) && tick >= state.limitLower && tick <= state.limitUpper)
    return "limit"

  if (hasBase(state) && tick >= state.baseLower && tick <= state.baseUpper)
    return "base"

  return null
}

export const sharesFocusGroup = (
  focused: { markId: string; datum: unknown },
  bar: Bar,
  state: VaultState | null,
) => {
  if (!isBarPoint(focused)) return true
  if (isSameRange(focused, bar)) return true
  if (!state) return false

  const focusedBand = getManagedBand(barMidpoint(focused.datum), state)
  const barBand = getManagedBand(barMidpoint(bar), state)

  return focusedBand !== null && focusedBand === barBand
}

const computeLiquidityIntervals = (
  pool: Pick<V3PoolBase, "tick" | "liquidity" | "ticks">,
) => {
  const ticks = [...(pool.ticks ?? [])].sort((a, b) => a.index - b.index)
  const marketSpot = pool.tick

  let running = pool.liquidity
  for (const tick of ticks) {
    if (tick.index <= marketSpot) running -= tick.liquidityNet
  }

  const intervals: LiquidityInterval[] = []

  for (let i = 0; i < ticks.length - 1; i++) {
    const tick = ticks[i]
    const next = ticks[i + 1]
    if (!tick || !next) continue

    running += tick.liquidityNet
    if (running > 0n) {
      intervals.push({
        lower: tick.index,
        upper: next.index,
        liquidity: running,
      })
    }
  }

  return { intervals, marketSpot }
}

const computeEdgeSpan = (marketSpot: number, state: VaultBands | null) => {
  const bandWidth = state ? state.baseUpper - state.baseLower : 0
  const edges = state
    ? [
        marketSpot,
        ...(bandWidth > 0 ? [state.baseLower, state.baseUpper] : []),
        ...(hasLimit(state) ? [state.limitLower, state.limitUpper] : []),
      ]
    : []

  const edgeSpan =
    edges.length > 1 ? Math.max(...edges) - Math.min(...edges) : 0
  const edgeLower = edges.length ? Math.min(...edges) : marketSpot
  const edgeUpper = edges.length ? Math.max(...edges) : marketSpot

  return { edges, edgeSpan, edgeLower, edgeUpper }
}

const hasMeaningfulOuterLiquidity = (
  intervals: LiquidityInterval[],
  edgeLower: number,
  edgeUpper: number,
  edgeSpan: number,
) => {
  const maxLiquidity = intervals.reduce(
    (value, interval) =>
      interval.liquidity > value ? interval.liquidity : value,
    0n,
  )
  const meaningfulLiquidity =
    (maxLiquidity * MEANINGFUL_LIQUIDITY_PERCENT) / 100n
  const wideLower = edgeLower - edgeSpan
  const wideUpper = edgeUpper + edgeSpan

  return intervals.some(
    (interval) =>
      interval.liquidity >= meaningfulLiquidity &&
      interval.upper > wideLower &&
      interval.lower < wideUpper &&
      (interval.lower < edgeLower || interval.upper > edgeUpper),
  )
}

const computeChartBounds = (
  marketSpot: number,
  state: VaultBands | null,
  paddingRatio: number,
): ChartBounds => {
  const { edges, edgeSpan, edgeLower, edgeUpper } = computeEdgeSpan(
    marketSpot,
    state,
  )
  const pad =
    edgeSpan > 0 ? edgeSpan * paddingRatio : CHART_LAYOUT.defaultTickPadding
  const from = edges.length
    ? edgeLower - pad
    : marketSpot - CHART_LAYOUT.defaultTickPadding
  const to = edges.length
    ? edgeUpper + pad
    : marketSpot + CHART_LAYOUT.defaultTickPadding
  const span = to - from
  const bandWidth = state ? state.baseUpper - state.baseLower : 0

  const base =
    state && bandWidth > 0
      ? { lower: state.baseLower, upper: state.baseUpper }
      : {
          lower: from + span * CHART_LAYOUT.fallbackBaseLowerRatio,
          upper: from + span * CHART_LAYOUT.fallbackBaseUpperRatio,
        }
  const halfBand = (base.upper - base.lower) / 2
  const outside = Math.min(
    to - span * CHART_LAYOUT.outsideMarginRatio,
    base.upper + span * CHART_LAYOUT.outsideOffsetRatio,
  )
  const inside =
    marketSpot >= base.lower && marketSpot <= base.upper
      ? marketSpot
      : base.lower + halfBand

  return {
    from,
    to,
    span,
    base,
    recentered: {
      lower: Math.max(
        from + span * CHART_LAYOUT.recenterEdgeInsetRatio,
        outside - halfBand,
      ),
      upper: Math.min(
        to - span * CHART_LAYOUT.recenterEdgeInsetRatio,
        outside + halfBand,
      ),
    },
    outside,
    inside,
    marketSpot,
  }
}

const scenarioSpotTick = (scenario: RangeScenario, bounds: ChartBounds) => {
  const staged: Record<RangeScenario, number> = {
    inRange: bounds.inside,
    outOfRange: bounds.outside,
    recentered: bounds.outside,
    limitOrder: bounds.inside,
  }

  return staged[scenario]
}

const getSliceWidth = (from: number, to: number) => (to - from) / SLICE_TARGET

const pushRealBarSlices = (
  out: Bar[],
  {
    left,
    right,
    liquidity,
    side,
    current,
    sliceWidth,
    decimals0,
    decimals1,
  }: {
    left: number
    right: number
    liquidity: number
    side: Bar["side"]
    current: boolean
    sliceWidth: number
    decimals0: number
    decimals1: number
  },
) => {
  const locked = lockedAmount(
    liquidity,
    left,
    right,
    side,
    decimals0,
    decimals1,
  )
  const count = Math.max(1, Math.round((right - left) / sliceWidth))
  const step = (right - left) / count

  for (let slice = 0; slice < count; slice++) {
    const sliceFrom = left + slice * step
    const sliceTo = left + (slice + 1) * step

    out.push({
      key: `${left}-${right}-${slice}`,
      from: sliceFrom,
      to: sliceTo,
      liquidity,
      side,
      rangeFrom: left,
      rangeTo: right,
      locked,
      current,
      colorGroup: side,
    })
  }
}

const buildRealBars = ({
  intervals,
  bounds,
  spot,
  decimals0,
  decimals1,
}: {
  intervals: LiquidityInterval[]
  bounds: ChartBounds
  spot: number
  decimals0: number
  decimals1: number
}) => {
  const out: Bar[] = []
  const { from, to } = bounds
  const sliceWidth = getSliceWidth(from, to)

  for (const interval of intervals) {
    const left = Math.max(interval.lower, from)
    const right = Math.min(interval.upper, to)
    if (right <= left) continue

    const liquidity = liquidityToChartScale(interval.liquidity)
    const current = left <= spot && right > spot

    if (left < spot && right > spot) {
      pushRealBarSlices(out, {
        left,
        right: spot,
        liquidity,
        side: "token1",
        current,
        sliceWidth,
        decimals0,
        decimals1,
      })
      pushRealBarSlices(out, {
        left: spot,
        right,
        liquidity,
        side: "token0",
        current,
        sliceWidth,
        decimals0,
        decimals1,
      })
    } else {
      pushRealBarSlices(out, {
        left,
        right,
        liquidity,
        side: right <= spot ? "token1" : "token0",
        current,
        sliceWidth,
        decimals0,
        decimals1,
      })
    }
  }

  return out
}

const buildScenarioBars = ({
  bounds,
  spot,
  liquidity,
  decimals0,
  decimals1,
}: {
  bounds: ChartBounds
  spot: number
  liquidity: bigint
  decimals0: number
  decimals1: number
}) => {
  const { from, to } = bounds
  const sliceWidth = getSliceWidth(from, to)
  const scaledLiquidity = liquidityToChartScale(liquidity)
  const out: Bar[] = []

  for (let slice = 0; slice < SLICE_TARGET; slice++) {
    const sliceFrom = from + slice * sliceWidth
    const sliceTo = from + (slice + 1) * sliceWidth
    const stagedSide = (sliceFrom + sliceTo) / 2 > spot ? "token0" : "token1"

    out.push({
      key: `scenario-${slice}`,
      from: sliceFrom,
      to: sliceTo,
      liquidity: scaledLiquidity,
      side: stagedSide,
      rangeFrom: sliceFrom,
      rangeTo: sliceTo,
      locked: lockedAmount(
        scaledLiquidity,
        sliceFrom,
        sliceTo,
        stagedSide,
        decimals0,
        decimals1,
      ),
      current: sliceFrom <= spot && sliceTo > spot,
      colorGroup: stagedSide,
    })
  }

  return out
}

const remapScenarioDisplayBars = ({
  bars,
  scenario,
  bounds,
  state,
}: {
  bars: Bar[]
  scenario: RangeScenario
  bounds: ChartBounds
  state: VaultBands | null
}) => {
  if (!bars.length) return bars

  const rawFloor = bars.reduce(
    (value, bar) => Math.min(value, bar.liquidity),
    Number.POSITIVE_INFINITY,
  )
  const managedValues = bars
    .filter((bar) => {
      const center = barMidpoint(bar)
      return center >= bounds.base.lower && center <= bounds.base.upper
    })
    .map((bar) => bar.liquidity)
  const reference = managedValues.reduce(
    (value, liquidity) => Math.max(value, liquidity),
    rawFloor,
  )
  const managed = reference * SCENARIO_TIER_SCALE.managed
  const background = reference * SCENARIO_TIER_SCALE.background
  // the surplus limit order is far denser than the base range
  const limit = reference
  const active = scenario === "recentered" ? bounds.recentered : bounds.base
  const stagedLimit =
    scenario === "limitOrder" && state && hasLimit(state)
      ? { lower: state.limitLower, upper: state.limitUpper }
      : null

  return bars.map((bar) => {
    const center = barMidpoint(bar)
    const isLimit =
      !!stagedLimit &&
      center >= stagedLimit.lower &&
      center <= stagedLimit.upper
    const isManaged = center >= active.lower && center <= active.upper
    const tier: Bar["tier"] = isLimit
      ? "limit"
      : isManaged
        ? "managed"
        : "background"
    // other LPs' liquidity is drawn in a neutral colour so the
    // token-side colours only ever mean "the vault's own ranges"
    const colorGroup: Bar["colorGroup"] =
      tier === "background" ? "background" : bar.side

    return {
      ...bar,
      liquidity: isLimit ? limit : isManaged ? managed : background,
      tier,
      colorGroup,
    }
  })
}

const bandHeightFromMax = (liquidity: bigint, max: number) =>
  max > 0
    ? Math.max(MIN_BAND_HEIGHT, liquidityToChartScale(liquidity) / max)
    : 1

const barInRange = (bar: Bar, lower: number, upper: number) => {
  const center = barMidpoint(bar)
  return center >= lower && center <= upper
}

const buildRealBands = ({
  state,
  bounds,
  bars,
}: {
  state: VaultBands | null
  bounds: ChartBounds
  bars: Bar[]
}) => {
  const max = bars.reduce((value, bar) => Math.max(value, bar.liquidity), 0)

  return [
    ...(state && hasBase(state)
      ? [
          {
            id: "base" as const,
            ...bounds.base,
            height: bandHeightFromMax(state.base.liquidity, max),
          },
        ]
      : []),
    ...(state && hasLimit(state)
      ? [
          {
            id: "limit" as const,
            lower: state.limitLower,
            upper: state.limitUpper,
            height: bandHeightFromMax(state.limit.liquidity, max),
          },
        ]
      : []),
  ]
}

const buildScenarioBands = ({
  scenario,
  bounds,
  bars,
  state,
}: {
  scenario: RangeScenario
  bounds: ChartBounds
  bars: Bar[]
  state: VaultBands | null
}) => {
  const scenarioBands: Band[] = [
    ...(scenario === "recentered"
      ? [
          {
            id: "previous" as const,
            ...bounds.base,
            height: CHART_LAYOUT.scenarioBandHeight,
          },
        ]
      : []),
    {
      id: "active",
      ...(scenario === "recentered" ? bounds.recentered : bounds.base),
      height: CHART_LAYOUT.scenarioBandHeight,
    },
    ...(scenario === "limitOrder" && state && hasLimit(state)
      ? [
          {
            id: "limit" as const,
            lower: state.limitLower,
            upper: state.limitUpper,
            height: CHART_LAYOUT.scenarioBandHeight,
          },
        ]
      : []),
  ]

  return scenarioBands.map((band) => {
    if (band.id === "limit") {
      const extent = barsExtent(bars.filter((bar) => bar.tier === "limit"))
      return extent ? { ...band, ...extent } : band
    }

    if (band.id === "active" && scenario === "recentered") {
      const extent = barsExtent(bars.filter((bar) => bar.tier === "managed"))
      return extent ? { ...band, ...extent } : band
    }

    if (band.id === "previous") {
      const extent = barsExtent(
        bars.filter((bar) =>
          barInRange(bar, bounds.base.lower, bounds.base.upper),
        ),
      )
      return extent ? { ...band, ...extent } : band
    }

    return band
  })
}

const toDistributionResult = ({
  bars,
  spotTick,
  bounds,
  bands,
  maxBars = bars,
}: {
  bars: Bar[]
  spotTick: number
  bounds: ChartBounds
  bands: ReadonlyArray<Band>
  /** pre-remap bars used for the chart liquidity scale (scenario tiers) */
  maxBars?: Bar[]
}): LiquidityDistributionResult => {
  const max = maxBars.reduce((value, bar) => Math.max(value, bar.liquidity), 0)

  return {
    bars,
    spotTick,
    max,
    lo: bounds.from,
    hi: bounds.to,
    bands,
  }
}

export const getLiquidityDistribution = ({
  pool,
  state,
  decimals0,
  decimals1,
}: {
  pool: Pick<V3PoolBase, "tick" | "liquidity" | "ticks">
  state: VaultBands | null
  decimals0: number
  decimals1: number
}): LiquidityDistributionResult => {
  const { intervals, marketSpot } = computeLiquidityIntervals(pool)
  const { edgeSpan, edgeLower, edgeUpper } = computeEdgeSpan(marketSpot, state)
  const paddingRatio = hasMeaningfulOuterLiquidity(
    intervals,
    edgeLower,
    edgeUpper,
    edgeSpan,
  )
    ? DEFAULT_DOMAIN_PADDING_RATIO
    : ZOOMED_DOMAIN_PADDING_RATIO
  const bounds = computeChartBounds(marketSpot, state, paddingRatio)
  const bars = buildRealBars({
    intervals,
    bounds,
    spot: bounds.marketSpot,
    decimals0,
    decimals1,
  })

  return toDistributionResult({
    bars,
    spotTick: bounds.marketSpot,
    bounds,
    bands: buildRealBands({ state, bounds, bars }),
  })
}

const buildScenarioLiquidityDistribution = ({
  pool,
  state,
  scenario,
  decimals0,
  decimals1,
}: {
  pool: Pick<V3PoolBase, "tick" | "liquidity" | "ticks">
  state: VaultBands | null
  scenario: RangeScenario
  decimals0: number
  decimals1: number
}): LiquidityDistributionResult => {
  const bounds = computeChartBounds(
    pool.tick,
    state,
    DEFAULT_DOMAIN_PADDING_RATIO,
  )
  const spotTick = scenarioSpotTick(scenario, bounds)
  const rawBars = buildScenarioBars({
    bounds,
    spot: spotTick,
    liquidity: pool.liquidity,
    decimals0,
    decimals1,
  })
  const bars = remapScenarioDisplayBars({
    bars: rawBars,
    scenario,
    bounds,
    state,
  })

  return toDistributionResult({
    bars,
    spotTick,
    bounds,
    bands: buildScenarioBands({ scenario, bounds, bars, state }),
    maxBars: rawBars,
  })
}

export const SCENARIO_POOL = {
  spot: 182706,
  lower: 182040,
  upper: 183300,
  spacing: 60,
  liquidity: 11046262071882846000n,
  decimals0: 10,
  decimals1: 18,
}

export const getScenarioDistribution = (
  scenario: RangeScenario,
  overrides: Partial<typeof SCENARIO_POOL> = {},
) => {
  const { spot, lower, upper, spacing, liquidity, decimals0, decimals1 } = {
    ...SCENARIO_POOL,
    ...overrides,
  }
  const width = upper - lower
  // limit order: a narrow one-sided range placed just above the staged price,
  // mirroring how the keeper parks surplus token0 (see Hypervisor.rebalance)
  const limitLower = Math.floor(spot / spacing) * spacing + spacing
  const limitUpper = limitLower + 2 * spacing
  const hasStagedLimit = scenario === "limitOrder"
  // initialized ticks: the band edges, the pair straddling spot, the limit
  // order edges (when staged) and the padding
  const indexes = [
    lower - width,
    lower,
    Math.floor(spot / spacing) * spacing,
    Math.ceil(spot / spacing) * spacing,
    ...(hasStagedLimit ? [limitLower, limitUpper] : []),
    upper,
    upper + width,
  ]

  return {
    ...buildScenarioLiquidityDistribution({
      pool: {
        tick: spot,
        liquidity,
        ticks: [...new Set(indexes)].map((index) => ({
          index,
          liquidityNet: 0n,
          liquidityGross: 0n,
        })),
      },
      state: {
        baseLower: lower,
        baseUpper: upper,
        limitLower: hasStagedLimit ? limitLower : 0,
        limitUpper: hasStagedLimit ? limitUpper : 0,
        base: { liquidity, amount0: 0n, amount1: 0n },
        limit: {
          liquidity: hasStagedLimit ? liquidity : 0n,
          amount0: 0n,
          amount1: 0n,
        },
      },
      decimals0,
      decimals1,
      scenario,
    }),
    decimals0,
    decimals1,
  }
}
