import {
  SortingState,
  VisibilityState,
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { DisplayValue } from "components/DisplayValue/DisplayValue"
import { Icon } from "components/Icon/Icon"
import { Text } from "components/Typography/Text/Text"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useMedia } from "react-use"
import { theme } from "theme"
import { useRpcProvider } from "providers/rpcProvider"
import { MultipleIcons } from "components/MultipleIcons/MultipleIcons"
import { AssetLogo } from "components/AssetIcon/AssetIcon"
import { TPool, TXYKPool, isXYKPoolType } from "sections/pools/PoolsPage.utils"
import { Farm, getMinAndMaxAPR, useFarmAprs, useFarms } from "api/farms"
import { GlobalFarmRowMulti } from "sections/pools/farms/components/globalFarm/GlobalFarmRowMulti"
import { Button, ButtonTransparent } from "components/Button/Button"
import ChevronRightIcon from "assets/icons/ChevronRight.svg?react"
import ManageIcon from "assets/icons/IconEdit.svg?react"
import { BN_0, BN_1 } from "utils/constants"
import Skeleton from "react-loading-skeleton"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import BN from "bignumber.js"
import { CellSkeleton } from "components/Skeleton/CellSkeleton"
import { InfoTooltip } from "components/InfoTooltip/InfoTooltip"
import { SInfoIcon } from "components/InfoTooltip/InfoTooltip.styled"
import { useTokenBalance } from "api/balances"
import { SStablepoolBadge } from "sections/pools/pool/Pool.styled"
import { LazyMotion, domAnimation } from "framer-motion"

const NonClickableContainer = ({
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) => {
  const isDesktop = useMedia(theme.viewport.gte.sm)

  return (
    <div
      onClick={(e) => {
        if (isDesktop) {
          e.preventDefault()
          e.stopPropagation()
        }
      }}
      sx={{ width: "fit-content", px: 8 }}
      css={{ cursor: "text" }}
      {...rest}
    >
      {children}
    </div>
  )
}

const AssetTableName = ({
  id,
  iconId,
  name,
  symbol,
}: {
  id: string
  name: string
  symbol: string
  iconId: string | string[]
}) => {
  const { assets } = useRpcProvider()
  const asset = assets.getAsset(id)

  const farms = useFarms([id])
  const iconIds = iconId

  return (
    <NonClickableContainer sx={{ flex: "row", gap: 8, align: "center" }}>
      {typeof iconIds === "string" ? (
        <Icon
          size={26}
          icon={<AssetLogo id={iconIds} />}
          css={{ flex: "1 0 auto" }}
        />
      ) : (
        <MultipleIcons
          size={26}
          icons={iconIds.map((asset) => {
            const meta = assets.getAsset(asset)
            const isBond = assets.isBond(meta)
            const id = isBond ? meta.assetId : asset
            return {
              icon: <AssetLogo key={id} id={id} />,
            }
          })}
        />
      )}

      <div sx={{ flex: "column", width: "100%", gap: [0, 4] }}>
        <div sx={{ flex: "row", gap: 4, width: "fit-content" }}>
          <Text
            fs={14}
            lh={16}
            fw={700}
            color="white"
            font="GeistMedium"
            css={{ whiteSpace: "nowrap" }}
          >
            {symbol}
          </Text>
          {asset.isStableSwap && (
            <div css={{ position: "relative" }}>
              <LazyMotion features={domAnimation}>
                <SStablepoolBadge
                  whileHover={{ width: "unset" }}
                  css={{
                    width: 14,
                    overflow: "hidden",
                    position: "absolute",
                  }}
                  transition={{
                    type: "spring",
                    mass: 1,
                    stiffness: 300,
                    damping: 20,
                    duration: 0.2,
                  }}
                />
              </LazyMotion>
            </div>
          )}
        </div>

        {asset.isStableSwap && (
          <Text fs={11} color="white" css={{ opacity: 0.61 }}>
            {name}
          </Text>
        )}
        {farms.data?.length ? <GlobalFarmRowMulti farms={farms.data} /> : null}
      </div>
    </NonClickableContainer>
  )
}

const AddLiqduidityButton = ({
  pool,
  onRowSelect,
}: {
  pool: TPool | TXYKPool
  onRowSelect: (id: string) => void
}) => {
  const { account } = useAccount()
  const { t } = useTranslation()
  const { assets } = useRpcProvider()

  const isXykPool = isXYKPoolType(pool)

  const assetMeta = assets.getAsset(pool.id)
  const isStablePool = assets.isStableSwap(assetMeta)

  const userStablePoolBalance = useTokenBalance(
    isStablePool ? pool.id : undefined,
    account?.address,
  )

  let positionsAmount: BN = BN_0

  if (isXykPool) {
    positionsAmount = BN(pool.miningPositions.length).plus(
      pool.shareTokenIssuance?.myPoolShare?.gt(0) ? 1 : 0,
    )
  } else {
    positionsAmount = BN(pool.omnipoolPositions.length)
      .plus(pool.miningPositions.length)
      .plus(userStablePoolBalance.data?.freeBalance.gt(0) ? 1 : 0)
  }

  const isPositions = positionsAmount.gt(0)

  const onClick = () => onRowSelect(pool.id)

  return (
    <div
      onClick={(e) => {
        e.stopPropagation()
      }}
      css={{ position: "relative" }}
    >
      <Button
        size="small"
        css={{
          borderColor: `rgba(${theme.rgbColors.brightBlue300}, 0.4)`,
          height: 26,
          padding: "6px 8px",
          width: 88,
          "& > span": {
            fontSize: 12,
            gap: 4,
            alignItems: "center",
          },
        }}
        onClick={onClick}
      >
        {isPositions ? <Icon icon={<ManageIcon />} size={12} /> : null}
        {isPositions ? t("manage") : t("details")}
      </Button>
      {isPositions && (
        <Text
          fs={9}
          css={{
            position: "absolute",
            bottom: "-14px",
            whiteSpace: "nowrap",
            width: "100%",
            textAlign: "center",
          }}
          color="whiteish500"
        >
          {t("liquidity.asset.actions.myPositions.amount", {
            count: positionsAmount.toNumber(),
          })}
        </Text>
      )}
    </div>
  )
}

const APYFarming = ({ farms, apy }: { farms: Farm[]; apy: number }) => {
  const { t } = useTranslation()

  const farmAprs = useFarmAprs(farms)

  const percentage = useMemo(() => {
    if (farmAprs.data?.length) {
      return getMinAndMaxAPR(farmAprs)
    }

    return {
      minApr: BN_0,
      maxApr: BN_0,
    }
  }, [farmAprs])

  const isLoading = farmAprs.isInitialLoading

  if (isLoading) return <CellSkeleton />

  return (
    <NonClickableContainer>
      <Text color="white" fs={14}>
        {percentage.maxApr.gt(0)
          ? t("value.percentage.range", {
              from: percentage.minApr.lt(apy) ? percentage.minApr : BN(apy),
              to: percentage.maxApr.plus(apy),
            })
          : t("value.percentage", { value: BN(apy) })}
      </Text>
    </NonClickableContainer>
  )
}

const APY = ({
  assetId,
  fee,
  isLoading,
}: {
  assetId: string
  fee: BN
  isLoading: boolean
}) => {
  const { t } = useTranslation()
  const {
    assets: { native },
  } = useRpcProvider()
  const farms = useFarms([assetId])

  if (isLoading || farms.isLoading) return <CellSkeleton />

  if (farms.data?.length)
    return <APYFarming farms={farms.data} apy={fee.toNumber()} />

  return (
    <NonClickableContainer>
      <Text color="white" fs={14}>
        {assetId === native.id ? "--" : t("value.percentage", { value: fee })}
      </Text>
    </NonClickableContainer>
  )
}

export const usePoolTable = (
  data: TPool[] | TXYKPool[],
  isXyk: boolean,
  onRowSelect: (id: string) => void,
) => {
  const { t } = useTranslation()

  const { accessor, display } = createColumnHelper<TPool | TXYKPool>()
  const [sorting, setSorting] = useState<SortingState>([])

  const isDesktop = useMedia(theme.viewport.gte.sm)

  const columnVisibility: VisibilityState = {
    name: true,
    spotPrice: isDesktop,
    tvlDisplay: isDesktop,
    apy: isDesktop,
    fee: isDesktop,
    volumeDisplay: true,
    actions: isDesktop,
  }

  const columns = useMemo(
    () => [
      accessor("name", {
        id: "name",
        header: t("liquidity.table.header.poolAsset"),
        sortingFn: (a, b) => a.original.name.localeCompare(b.original.name),
        cell: ({ row }) => <AssetTableName {...row.original} />,
      }),
      accessor("tvlDisplay", {
        id: "tvlDisplay",
        header: t("liquidity.table.header.tvl"),
        size: 220,
        sortingFn: (a, b) =>
          a.original.tvlDisplay.gt(b.original.tvlDisplay) ? 1 : -1,
        cell: ({ row }) => (
          <NonClickableContainer>
            <Text color="white" fs={14}>
              <DisplayValue value={row.original.tvlDisplay} />
            </Text>
          </NonClickableContainer>
        ),
      }),
      ...(!isXyk
        ? [
            display({
              id: "apy",
              //@ts-ignore
              header: (
                <div
                  sx={{
                    flex: "row",
                    align: "center",
                    gap: 4,
                  }}
                >
                  {t("stats.overview.table.assets.header.apy")}
                  <InfoTooltip
                    text={t("stats.overview.table.assets.header.apy.desc")}
                  >
                    <SInfoIcon />
                  </InfoTooltip>
                </div>
              ),
              cell: ({ row }) =>
                !isXYKPoolType(row.original) ? (
                  <APY
                    assetId={row.original.id}
                    fee={row.original.fee}
                    isLoading={row.original.isFeeLoading}
                  />
                ) : null,
            }),
          ]
        : []),
      isXyk
        ? accessor("fee", {
            id: "fee",
            header: t("fee"),
            sortingFn: (a, b) => (a.original.fee.gt(b.original.fee) ? 1 : -1),
            cell: ({ row }) => (
              <NonClickableContainer>
                <Text color="white" fs={14}>
                  {t("value.percentage", { value: row.original.fee })}
                </Text>
              </NonClickableContainer>
            ),
          })
        : accessor("spotPrice", {
            id: "spotPrice",
            header: t("liquidity.table.header.price"),
            sortingFn: (a, b) =>
              (a.original.spotPrice ?? BN_1).gt(b.original.spotPrice ?? 1)
                ? 1
                : -1,
            cell: ({ row }) => (
              <NonClickableContainer>
                <Text color="white" fs={14}>
                  <DisplayValue value={row.original.spotPrice} type="token" />
                </Text>
              </NonClickableContainer>
            ),
          }),

      accessor("id", {
        id: "volumeDisplay",
        header: t("liquidity.table.header.volume"),
        sortingFn: (a, b) => (a.original.volume.gt(b.original.volume) ? 1 : -1),
        cell: ({ row }) => {
          const pool = row.original

          if (pool.isVolumeLoading) return <Skeleton width={60} height={18} />
          return (
            <NonClickableContainer
              sx={{
                flex: "row",
                gap: 4,
                align: "center",
                justify: ["end", "start"],
                minWidth: [110, "auto"],
              }}
            >
              <Text color="white" fs={14}>
                <DisplayValue value={pool.volume} />
              </Text>

              <ButtonTransparent sx={{ display: ["inherit", "none"] }}>
                <Icon
                  sx={{ color: "darkBlue300" }}
                  icon={<ChevronRightIcon />}
                />
              </ButtonTransparent>
            </NonClickableContainer>
          )
        },
      }),
      display({
        id: "actions",
        cell: ({ row }) => (
          <div
            sx={{
              flex: "row",
              gap: 4,
              align: "center",
              justify: ["end", "start"],
            }}
          >
            <AddLiqduidityButton
              pool={row.original}
              onRowSelect={onRowSelect}
            />
          </div>
        ),
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isDesktop],
  )

  return useReactTable({
    data,
    columns,
    state: { sorting, columnVisibility },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })
}
