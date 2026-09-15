import { Flex } from "@galacticcouncil/ui/components"
import { useSearch } from "@tanstack/react-router"

import { VaultsValueTile } from "@/modules/liquidity/components/PoolsHeader/Vaults"

import { AllPools } from "./AllPools"
import { Isolated } from "./Isolated"
import { MyLiquidity } from "./MyLiquidity"
import { Omnipool } from "./Omnipool"

export const PoolsHeader = () => {
  const { myLiquidity, type } = useSearch({
    from: "/liquidity/",
  })
  const isIsolated = type === "isolated"

  return (
    <Flex
      gap={["l", isIsolated ? "5.625rem" : "xl"]}
      justify={isIsolated ? "flex-start" : "space-between"}
      pb="xxl"
      sx={{ overflowX: "auto" }}
    >
      {myLiquidity ? (
        <MyLiquidity />
      ) : type === "all" ? (
        <AllPools />
      ) : type === "vaults" ? (
        <VaultsValueTile withPoolValue />
      ) : isIsolated ? (
        <Isolated />
      ) : (
        <Omnipool />
      )}
    </Flex>
  )
}
