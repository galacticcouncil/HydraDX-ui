import { AssetSkeleton } from "components/Skeleton/AssetSkeleton"
import React from "react"
import Skeleton from "react-loading-skeleton"

const AssetInputSkeleton: React.FC<{ className?: string }> = ({
  className,
}) => (
  <div className={className}>
    <div sx={{ flex: "row", justify: "space-between", mb: 15 }}>
      <Skeleton width={120} />
      <Skeleton width={200} />
    </div>
    <div sx={{ flex: "row", justify: "space-between", mb: 30 }}>
      <AssetSkeleton />
      <Skeleton width={26} height={26} />
    </div>
  </div>
)

export const SwapAppSkeleton: React.FC<{ className?: string }> = ({
  className,
}) => {
  return (
    <div
      className={className}
      sx={{ p: [20, 30] }}
      css={{
        border: "1px solid rgba(152, 176, 214, 0.15)",
        borderRadius: 8,
        background: "rgba(0,0,0,0.15)",
      }}
    >
      <div sx={{ flex: "row", justify: "space-between", mb: 30 }}>
        <Skeleton width={160} height={30} />
        <Skeleton width={30} height={30} />
      </div>
      <AssetInputSkeleton />
      <div sx={{ flex: "row", align: "center", mb: 30, gap: 5 }}>
        <div
          sx={{ height: 1, flexGrow: "1" }}
          css={{
            borderBottom: "1px solid rgba(152, 176, 214, 0.15)",
          }}
        />
        <Skeleton width={100} height={20} />
      </div>
      <AssetInputSkeleton />
      <Skeleton width="100%" height={50} />
    </div>
  )
}
