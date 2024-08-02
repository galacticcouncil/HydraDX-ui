import {
  TPool,
  TPoolFullData,
  TXYKPool,
  TXYKPoolFullData,
  usePoolDetails,
  useXYKPoolDetails,
} from "sections/pools/PoolsPage.utils"
import { PoolDetails } from "sections/pools/pool/details/PoolDetails"
import {
  MyPositions,
  MyXYKPositions,
} from "sections/pools/pool/myPositions/MyPositions"
import { isXYKPoolType } from "sections/pools/PoolsPage.utils"
import { PoolSkeleton } from "sections/pools/pool/PoolSkeleton"
import { SPoolContainer } from "./Pool.styled"
import { createContext, useContext } from "react"

const PoolContext = createContext<{
  pool: TPoolFullData | TXYKPoolFullData
  isXYK: boolean
}>({
  pool: {} as TPoolFullData,
  isXYK: false,
})

export const usePoolData = () => useContext(PoolContext)

export const PoolWrapper = ({ pool }: { pool: TPool | TXYKPool }) => {
  const isXYK = isXYKPoolType(pool)

  return isXYK ? <XYKPool pool={pool} /> : <Pool pool={pool} />
}

const Pool = ({ pool }: { pool: TPool }) => {
  const poolDetails = usePoolDetails(pool.id)

  if (poolDetails.isInitialLoading) return <PoolSkeleton />

  return (
    <PoolContext.Provider
      value={{ pool: { ...pool, ...poolDetails.data }, isXYK: false }}
    >
      <SPoolContainer>
        <PoolDetails />
        <MyPositions />
      </SPoolContainer>
    </PoolContext.Provider>
  )
}

const XYKPool = ({ pool }: { pool: TXYKPool }) => {
  const poolDetails = useXYKPoolDetails(pool)

  if (poolDetails.isInitialLoading) return <PoolSkeleton />

  return (
    <PoolContext.Provider
      value={{ pool: { ...pool, ...poolDetails.data }, isXYK: true }}
    >
      <SPoolContainer>
        <PoolDetails />
        <MyXYKPositions />
      </SPoolContainer>
    </PoolContext.Provider>
  )
}
