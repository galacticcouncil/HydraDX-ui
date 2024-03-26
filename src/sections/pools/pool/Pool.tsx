import {
  TPool,
  TXYKPool,
  usePoolDetails,
  useXYKPoolDetails,
} from "sections/pools/PoolsPage.utils"
import { PoolDetails } from "sections/pools/pool/details/PoolDetails"
import { AvailableFarms } from "sections/pools/pool/availableFarms/AvailableFarms"
import {
  MyPositions,
  MyXYKPositions,
} from "sections/pools/pool/myPositions/MyPositions"
import { isXYKPoolType } from "sections/pools/PoolsPage.utils"
import { PoolSkeleton } from "sections/pools/pool/PoolSkeleton"
import { SPoolContainer } from "./Pool.styled"

export const PoolWrapper = ({ pool }: { pool: TPool | TXYKPool }) => {
  const isXYK = isXYKPoolType(pool)

  return isXYK ? <XYKPool pool={pool} /> : <Pool pool={pool} />
}

const Pool = ({ pool }: { pool: TPool }) => {
  const poolDetails = usePoolDetails(pool.id)

  if (poolDetails.isInitialLoading) return <PoolSkeleton />

  return (
    <SPoolContainer sx={{ mt: [-22, "inherit"] }}>
      <PoolDetails pool={{ ...pool, ...poolDetails.data }} />
      <MyPositions pool={{ ...pool, ...poolDetails.data }} />
      <AvailableFarms pool={pool} />
    </SPoolContainer>
  )
}

const XYKPool = ({ pool }: { pool: TXYKPool }) => {
  const poolDetails = useXYKPoolDetails(pool)

  if (poolDetails.isInitialLoading) return <PoolSkeleton />

  return (
    <SPoolContainer sx={{ mt: [-22, "inherit"] }}>
      <PoolDetails pool={{ ...pool, ...poolDetails.data }} />
      <MyXYKPositions pool={{ ...pool }} />
    </SPoolContainer>
  )
}
