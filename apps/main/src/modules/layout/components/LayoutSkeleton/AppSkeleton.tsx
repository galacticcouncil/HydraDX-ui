import {
  AssetInput,
  Box,
  Flex,
  Paper,
  Separator,
  Skeleton,
} from "@galacticcouncil/ui/components"
import { pxToRem } from "@galacticcouncil/ui/utils"

const AssetSectionSkeleton = () => {
  return (
    <Box py="l" px="xl" width="100%">
      <Flex justify="space-between" align="center" mb="m">
        <Skeleton width={100} height={pxToRem(12)} />
        <Skeleton width={70} height={pxToRem(12)} />
      </Flex>
      <AssetInput isLoading />
    </Box>
  )
}

const SwitcherSkeleton = () => {
  return (
    <Flex align="center" justify="space-between">
      <Separator sx={{ flexShrink: 0, width: 32 }} />
      <Skeleton
        width={34}
        height={34}
        circle
        sx={{ display: "inline-flex", flexShrink: 0 }}
      />
      <Separator sx={{ flex: 1 }} />
      <Skeleton
        width={150}
        height={28}
        sx={{ borderRadius: "full", flexShrink: 0 }}
      />
      <Separator sx={{ flexShrink: 0, width: "m" }} />
    </Flex>
  )
}

export const AppSkeleton = () => {
  return (
    <Paper>
      <Flex justify="space-between" align="center" p="xl">
        <Flex gap="l">
          <Skeleton width={50} height={20} />
          <Skeleton width={50} height={20} />
        </Flex>
        <Skeleton width={24} height={24} circle />
      </Flex>
      <Separator />
      <AssetSectionSkeleton />
      <SwitcherSkeleton />
      <AssetSectionSkeleton />
      <Separator />
      <Box p="l">
        <Skeleton
          height="3.125rem"
          sx={{ display: "flex", borderRadius: "full" }}
        />
      </Box>
    </Paper>
  )
}
