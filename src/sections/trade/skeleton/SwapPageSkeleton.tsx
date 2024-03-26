import Skeleton from "react-loading-skeleton"
import { SwapAppSkeleton } from "./SwapAppSkeleton"

export const SwapPageSkeleton = () => {
  return (
    <div sx={{ flex: "row", gap: 20 }}>
      <div
        sx={{ p: [20, 30], display: ["none", "block"] }}
        css={{
          flex: "1",
          border: "1px solid rgba(152, 176, 214, 0.15)",
          borderRadius: 8,
          background: "rgba(0,0,0,0.15)",
        }}
      >
        <div sx={{ flex: "row", justify: "space-between" }}>
          <div>
            <Skeleton width={100} height={24} sx={{ mb: 10 }} />
            <Skeleton width={60} height={16} />
          </div>
          <Skeleton width={140} height={24} />
        </div>
      </div>
      <div sx={{ width: 478, mx: "auto" }}>
        <SwapAppSkeleton />
      </div>
    </div>
  )
}
