import {
  Box,
  Flex,
  Paper,
  PositionCard,
  Separator,
  Text,
  ValueStats,
} from "@galacticcouncil/ui/components"
import { millisecondsInDay } from "date-fns/constants"
import { useTranslation } from "react-i18next"

import { useAccountBalances } from "@/api/balances"
import { useBondData } from "@/api/bonds"
import { AssetLogo } from "@/components/AssetLogo"
import { useDisplayAssetPrice } from "@/components/AssetPrice"
import { BondRedeemButton } from "@/components/BondRedeemButton"
import { StableBondsRolloverButton } from "@/modules/strategies/stable-bonds/components/StableBondsRolloverButton"
import { STABLE_BONDS } from "@/modules/strategies/stable-bonds/config/bonds"
import { useAssets } from "@/providers/assetsProvider"
import { scaleHuman } from "@/utils/formatting"

const PositionRow = ({ bondId }: { bondId: string }) => {
  const { t } = useTranslation(["common", "strategies"])

  const { getAssetWithFallback, isBond } = useAssets()
  const { isBalanceLoading: isAccountBalanceLoading } = useAccountBalances()
  const { balance, maturity, timeLeft } = useBondData(bondId)

  const asset = getAssetWithFallback(bondId)

  const balanceHuman = scaleHuman(balance, asset.decimals)
  const underlyingAssetId = isBond(asset) ? asset.underlyingAssetId : ""
  const underlyingAsset = getAssetWithFallback(underlyingAssetId)
  const [balanceUsdDisplay] = useDisplayAssetPrice(
    underlyingAssetId,
    balanceHuman,
  )

  return (
    <PositionCard
      logo={<AssetLogo id={bondId} size="medium" hideChain />}
      symbol={asset.symbol}
      columns={2}
      stats={
        <>
          <ValueStats
            wrap
            size="small"
            font="secondary"
            label={t("strategies:bonds.position.value")}
            isLoading={isAccountBalanceLoading}
            customValue={
              <Text fs="p3" fw={500} lh={1}>
                {t("currency", {
                  value: balanceHuman,
                  symbol: underlyingAsset.symbol,
                })}
              </Text>
            }
            bottomLabel={balanceUsdDisplay}
          />
          {maturity > 0 && (
            <ValueStats
              wrap
              size="small"
              font="secondary"
              label={t("strategies:bonds.position.maturityDate")}
              customValue={
                <Text fs="p3" fw={500} lh={1}>
                  {t("date.date", {
                    value: new Date(maturity),
                  })}
                </Text>
              }
              bottomLabel={
                timeLeft > 0
                  ? t("interval.remaining", {
                      value: timeLeft,
                      largest: 1,
                      ...(timeLeft > millisecondsInDay && { unit: "d" }),
                    })
                  : undefined
              }
            />
          )}
        </>
      }
      cta={
        <Flex gap="s">
          <StableBondsRolloverButton bondId={bondId}>
            {t("strategies:bonds.rollover.ctaShort")}
          </StableBondsRolloverButton>
          <BondRedeemButton bondId={bondId} />
        </Flex>
      }
    />
  )
}

export type StableBondsPositionProps = {
  bondIds?: string[]
}

export const StableBondsPosition: React.FC<StableBondsPositionProps> = ({
  bondIds: filter,
}) => {
  const { t } = useTranslation(["common", "strategies"])
  const { getBond } = useAssets()
  const { getTransferableBalance } = useAccountBalances()

  const bondIds = (filter ?? Object.keys(STABLE_BONDS))
    .filter((bondId) => getTransferableBalance(bondId) > 0n)
    .sort((a, b) => (getBond(a)?.maturity ?? 0) - (getBond(b)?.maturity ?? 0))

  if (bondIds.length === 0) return null

  return (
    <Paper>
      <Box p="l">
        <Text as="h2" font="primary" fs="base" fw={500}>
          {t("strategies:position.title", { count: bondIds.length })}
        </Text>
      </Box>
      <Separator />
      <Flex direction="column" gap="m" p="m">
        {bondIds.map((bondId) => (
          <PositionRow key={bondId} bondId={bondId} />
        ))}
      </Flex>
    </Paper>
  )
}
