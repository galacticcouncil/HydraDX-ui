import {
  Box,
  Button,
  Flex,
  Separator,
  Skeleton,
} from "@galacticcouncil/ui/components"
import { useTranslation } from "react-i18next"

import { AssetSelect } from "@/components/AssetSelect/AssetSelect"

export const GigaUnstakeSkeleton = () => {
  const { t } = useTranslation("staking")

  return (
    <>
      <Box px="l">
        <Box py="l" width="100%">
          <AssetSelect
            label={t("gigaStaking.gigaStake.input.label")}
            isDisabled
            isLoading
            assets={[]}
            selectedAsset={undefined}
          />
        </Box>
      </Box>

      <Separator />

      <Box px="l">
        <Flex align="center" justify="space-between" my="base">
          <Skeleton height={20} width="40%" />
          <Skeleton height={20} width="35%" />
        </Flex>
      </Box>

      <Separator />

      <Box p="l">
        <Button type="submit" size="large" width="100%" disabled>
          {t("gigaStaking.gigaUnstake.cta")}
        </Button>
      </Box>
    </>
  )
}
