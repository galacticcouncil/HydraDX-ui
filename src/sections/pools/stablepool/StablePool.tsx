import { SContainer, SGridContainer } from "sections/pools/pool/Pool.styled"
import { PoolDetails } from "./details/PoolDetails"
import { PoolValue } from "./details/PoolValue"
import { useState } from "react"
import { PoolActions } from "./actions/PoolActions"
import { useMedia } from "react-use"
import { theme } from "theme"
import { AnimatePresence, motion } from "framer-motion"
import { PoolFooter } from "sections/pools/pool/footer/PoolFooter"
import { PoolIncentives } from "./details/PoolIncentives"
import { usePoolPositions } from "sections/pools/pool/Pool.utils"
import { LiquidityPositionWrapper } from "sections/pools/pool/positions/LiquidityPositionWrapper"
import { FarmingPositionWrapper } from "../farms/FarmingPositionWrapper"
import { useAccountDeposits } from "api/deposits"
import { PoolFooterWithNoFarms } from "sections/pools/pool/footer/PoolFooterWithNoFarms"
import { useOmnipoolStablePools } from "../PoolsPage.utils"
import { BN_0, BN_1, BN_10 } from "../../../utils/constants"

type Props = ReturnType<typeof useOmnipoolStablePools>["data"][number]

const enabledFarms = import.meta.env.VITE_FF_FARMS_ENABLED === "true"

export const StablePool = ({ id, assets }: Props) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const isDesktop = useMedia(theme.viewport.gte.sm)

  const positions = usePoolPositions({ id } as any)
  const accountDeposits = useAccountDeposits(enabledFarms ? id : undefined)

  const hasExpandContent =
    !!positions.data?.length || !!accountDeposits.data?.length

  return (
    <SContainer id={id.toString()}>
      <SGridContainer>
        <PoolDetails
          assets={assets.map((asset) => ({
            symbol: asset.symbol,
            decimals: asset.decimals.toNumber(),
          }))}
          css={{ gridArea: "details" }}
        />

        {enabledFarms ? (
          <PoolIncentives poolId={id} css={{ gridArea: "incentives" }} />
        ) : (
          <div css={{ gridArea: "incentives" }} />
        )}
        {/* TODO: load total values */}
        <PoolValue
          id={id}
          omnipoolTotal={BN_10}
          stablepoolTotal={BN_1}
          css={{ gridArea: "values" }}
        />
        {/* TODO: type pool corretly */}
        <PoolActions
          pool={{ id } as any}
          refetch={positions.refetch}
          canExpand={!positions.isLoading && hasExpandContent}
          isExpanded={isExpanded}
          onExpandClick={() => setIsExpanded((prev) => !prev)}
          css={{ gridArea: "actions" }}
        />
      </SGridContainer>
      {/* TODO: show expanded content */}
      {/*{isDesktop && hasExpandContent && (*/}
      {/*  <AnimatePresence>*/}
      {/*    {isExpanded && (*/}
      {/*      <motion.div*/}
      {/*        initial={{ height: 0 }}*/}
      {/*        animate={{ height: "auto" }}*/}
      {/*        exit={{ height: 0 }}*/}
      {/*        transition={{ duration: 0.5, ease: "easeInOut" }}*/}
      {/*        css={{ overflow: "hidden" }}*/}
      {/*      >*/}
      {/*        <LiquidityPositionWrapper pool={pool} positions={positions} />*/}
      {/*        {enabledFarms && (*/}
      {/*          <FarmingPositionWrapper*/}
      {/*            pool={pool}*/}
      {/*            deposits={accountDeposits.data}*/}
      {/*          />*/}
      {/*        )}*/}
      {/*      </motion.div>*/}
      {/*    )}*/}
      {/*  </AnimatePresence>*/}
      {/*)}*/}
      {/*{isDesktop &&*/}
      {/*  (enabledFarms ? (*/}
      {/*    <PoolFooter pool={pool} />*/}
      {/*  ) : (*/}
      {/*    <PoolFooterWithNoFarms pool={pool} />*/}
      {/*  ))}*/}
    </SContainer>
  )
}
