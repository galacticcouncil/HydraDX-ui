import {
  AssetLabel,
  AssetLabelProps,
  AssetLogo as AssetLogoPrimitive,
  Flex,
  Skeleton,
  Stack,
} from "@galacticcouncil/ui/components"
import { FC, ReactNode } from "react"

import { TAssetData } from "@/api/assets"
import { AssetLogo } from "@/components/AssetLogo"
import { AutoManagedBadge } from "@/modules/liquidity/components/AutoManagedBadge"
import { StablepoolBadge } from "@/modules/liquidity/components/StablepoolBadge"

export const AssetLabelFull = ({
  asset,
  size,
  withName = true,
  loading = false,
  variant = "horizontal",
}: {
  asset?: TAssetData
  size?: AssetLabelProps["size"]
  withName?: boolean
  loading?: boolean
  variant?: AssetLabelFullVariant
}) => {
  if (loading && !asset) {
    return (
      <AssetLabelFullContainer variant={variant}>
        <Skeleton circle width={24} height={24} />
        <AssetLabel
          symbol={""}
          name={withName ? "" : undefined}
          size={size}
          loading
        />
      </AssetLabelFullContainer>
    )
  }

  if (!asset) return null

  const logoSize = size === "primary" ? "large" : size

  return (
    <AssetLabelFullContainer variant={variant}>
      {loading ? (
        <Skeleton circle width={24} height={24} />
      ) : asset.iconSrc ? (
        <AssetLogoPrimitive
          src={asset.iconSrc}
          chainSrc={asset.chainSrc}
          alt={asset.symbol}
          size={logoSize}
        />
      ) : (
        <AssetLogo id={asset.id} size={logoSize} />
      )}
      <AssetLabel
        symbol={asset.symbol}
        name={withName ? asset.name : undefined}
        size={size}
        loading={loading}
      />
    </AssetLabelFullContainer>
  )
}

export const AssetLabelXYK = ({
  iconIds,
  symbol,
  name,
  badge,
  size,
}: {
  iconIds: string[]
  symbol: string
  name?: string
  badge?: ReactNode
  size?: AssetLabelProps["size"]
}) => {
  return (
    <AssetLabelFullContainer>
      <AssetLogo id={iconIds} />
      <AssetLabel symbol={symbol} name={name} badge={badge} size={size} />
    </AssetLabelFullContainer>
  )
}

export const AssetLabelUniV3 = ({
  iconIds,
  symbol,
  name,
  size,
}: {
  iconIds: string[]
  symbol: string
  name?: string
  size?: AssetLabelProps["size"]
}) => {
  return (
    <AssetLabelFullContainer>
      <AssetLogo id={iconIds} />
      <Stack gap="xs">
        <AssetLabel symbol={symbol} name={name} size={size} />
        <AutoManagedBadge />
      </Stack>
    </AssetLabelFullContainer>
  )
}

export const AssetLabelStablepool = ({
  asset,
  size,
  withName = true,
}: {
  asset: TAssetData
  size?: AssetLabelProps["size"]
  withName?: boolean
}) => {
  return (
    <AssetLabelFullContainer>
      <AssetLogo id={asset.id} size={size === "primary" ? "large" : size} />
      <AssetLabel
        symbol={asset.symbol}
        name={withName ? asset.name : undefined}
        size={size}
        badge={<StablepoolBadge />}
      />
    </AssetLabelFullContainer>
  )
}

type AssetLabelFullVariant = "horizontal" | "vertical"

export const AssetLabelFullContainer: FC<{
  children: ReactNode
  variant?: AssetLabelFullVariant
}> = ({ children, variant = "horizontal" }) => {
  if (variant === "horizontal") {
    return (
      <Flex gap="base" align="center" minWidth={0}>
        {children}
      </Flex>
    )
  }

  return (
    <Flex gap="base" direction="column">
      {children}
    </Flex>
  )
}
