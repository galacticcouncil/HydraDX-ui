import { valueToBigNumber } from "@aave/math-utils"
import CheckIcon from "assets/icons/CheckIcon.svg?react"
import { Alert } from "components/Alert"
import { DataValue, DataValueList } from "components/DataValue"
import { DisplayValue } from "components/DisplayValue/DisplayValue"
import { InfoTooltip } from "components/InfoTooltip/InfoTooltip"
import { SInfoIcon } from "components/InfoTooltip/InfoTooltip.styled"
import { PercentageValue } from "components/PercentageValue"
import { Text } from "components/Typography/Text/Text"
import { useTranslation } from "react-i18next"
import { CapsCircularStatus } from "sections/lending/components/caps/CapsCircularStatus"
import { DebtCeilingStatus } from "sections/lending/components/caps/DebtCeilingStatus"
import { ComputedReserveData } from "sections/lending/hooks/app-data-provider/useAppDataProvider"
import { AssetCapHookData } from "sections/lending/hooks/useAssetCaps"
import { IncentivesButton } from "sections/lending/ui/incentives/IncentivesButton"
import { ApyChartContainer } from "sections/lending/ui/reserve-overview/chart/ApyChartContainer"
import { MarketDataType } from "sections/lending/utils/marketsAndNetworksConfig"

type SupplyInfoProps = {
  reserve: ComputedReserveData
  currentMarketData: MarketDataType
  renderCharts: boolean
  showSupplyCapStatus: boolean
  supplyCap: AssetCapHookData
  debtCeiling: AssetCapHookData
}

export const SupplyInfo = ({
  reserve,
  currentMarketData,
  renderCharts,
  showSupplyCapStatus,
  supplyCap,
  debtCeiling,
}: SupplyInfoProps) => {
  const { t } = useTranslation()

  const hasUnbacked = reserve.unbacked && reserve.unbacked !== "0"

  const CapProgress = () => (
    <CapsCircularStatus
      value={supplyCap.percentUsed}
      tooltipContent={t("lending.supply.cap.tooltip", {
        value:
          valueToBigNumber(reserve.supplyCap).toNumber() -
          valueToBigNumber(reserve.totalLiquidity).toNumber(),
        symbol: reserve.symbol,
        usdValue:
          valueToBigNumber(reserve.supplyCapUSD).toNumber() -
          valueToBigNumber(reserve.totalLiquidityUSD).toNumber(),
      })}
    />
  )

  return (
    <>
      <div
        sx={{
          flex: ["column", "row"],
          align: ["start", "center"],
          gap: [20, 40],
          mb: 20,
        }}
      >
        {showSupplyCapStatus && (
          <div sx={{ display: ["none", "block"] }}>
            <CapProgress />
          </div>
        )}
        <div sx={{ width: ["100%", hasUnbacked ? "60%" : "40%"], mb: 10 }}>
          <DataValueList separated>
            {showSupplyCapStatus ? (
              <DataValue
                label={
                  <div sx={{ flex: "column", gap: 10 }}>
                    <Text
                      color="basic400"
                      fs={14}
                      sx={{ flex: "row", gap: 4, align: "center" }}
                    >
                      {t("lending.market.table.totalSupplied")}{" "}
                      <InfoTooltip text={t("lending.tooltip.supplyCap")}>
                        <SInfoIcon />
                      </InfoTooltip>
                    </Text>
                    <div sx={{ display: ["block", "none"] }}>
                      <CapProgress />
                    </div>
                  </div>
                }
                labelColor="basic400"
                font="ChakraPetchBold"
              >
                {t("lending.cap.range", {
                  valueA: reserve.totalLiquidity,
                  valueB: reserve.supplyCap,
                })}
                <Text
                  fs={12}
                  font="ChakraPetch"
                  color="basic500"
                  tAlign={["right", "left"]}
                >
                  {t("lending.cap.range.usd", {
                    valueA: reserve.totalLiquidityUSD,
                    valueB: reserve.supplyCapUSD,
                  })}
                </Text>
              </DataValue>
            ) : (
              <DataValue
                label={t("lending.market.table.totalSupplied")}
                labelColor="basic400"
                font="ChakraPetchBold"
              >
                {t("value.compact", { value: Number(reserve.totalLiquidity) })}
                <Text
                  fs={12}
                  font="ChakraPetch"
                  color="basic500"
                  tAlign={["right", "left"]}
                >
                  <DisplayValue
                    value={Number(reserve.totalLiquidityUSD)}
                    isUSD
                    compact
                  />
                </Text>
              </DataValue>
            )}
            <DataValue
              label={t("lending.apy")}
              labelColor="basic400"
              font="ChakraPetchBold"
            >
              <PercentageValue value={Number(reserve.supplyAPY) * 100} />
              <div sx={{ mt: 2 }}>
                <IncentivesButton
                  symbol={reserve.symbol}
                  incentives={reserve.aIncentivesData}
                />
              </div>
            </DataValue>
            {hasUnbacked && (
              <DataValue
                label={t("lending.supply.unbacked")}
                font="ChakraPetchBold"
                labelColor="basic400"
              >
                {t("value.displaySymbol", {
                  value: Number(reserve.unbacked),
                  symbol: reserve.symbol,
                })}
                <Text fs={12} font="ChakraPetch" color="basic500">
                  <DisplayValue
                    value={Number(reserve.unbackedUSD)}
                    isUSD
                    compact
                  />
                </Text>
              </DataValue>
            )}
          </DataValueList>
        </div>
      </div>
      {renderCharts &&
        (reserve.borrowingEnabled || Number(reserve.totalDebt) > 0) && (
          <ApyChartContainer
            type="supply"
            reserve={reserve}
            currentMarketData={currentMarketData}
          />
        )}
      <div sx={{ mb: 10, mt: 20 }}>
        {reserve.isIsolated ? (
          <div>
            <Text
              fs={14}
              sx={{ mb: 10 }}
              css={{ textTransform: "uppercase" }}
              font="ChakraPetchSemiBold"
            >
              {t("lending.collateralUsage")}
            </Text>
            <Alert variant="warning" sx={{ color: "white" }}>
              <Text fs={14} font="ChakraPetchSemiBold" sx={{ mb: 4 }}>
                {t("lending.supply.isolatedCollateral.title")}
              </Text>
              <span>
                {t("lending.supply.isolatedCollateral.description")}{" "}
                <a
                  target="_blank"
                  href="https://docs.aave.com/faq/aave-v3-features#isolation-mode"
                  rel="noreferrer"
                >
                  {t("lending.learnMore")}
                </a>
              </span>
            </Alert>
          </div>
        ) : reserve.reserveLiquidationThreshold !== "0" ? (
          <div sx={{ flex: "row", justify: "space-between", align: "center" }}>
            <Text
              fs={14}
              css={{ textTransform: "uppercase" }}
              font="ChakraPetchSemiBold"
            >
              {t("lending.collateralUsage")}
            </Text>
            <Text
              fs={14}
              color="green400"
              sx={{ flex: "row", align: "center" }}
            >
              <CheckIcon width={14} height={14} sx={{ mr: 4 }} />
              {t("lending.supply.table.canBeCollateral")}
            </Text>
          </div>
        ) : (
          <div>
            <Text
              fs={14}
              sx={{ mb: 10 }}
              css={{ textTransform: "uppercase" }}
              font="ChakraPetchSemiBold"
            >
              {t("lending.collateralUsage")}
            </Text>
            <Alert size="small" variant="warning">
              <Text fs={14}>{t("lending.supply.assetCannotBeCollateral")}</Text>
            </Alert>
          </div>
        )}
      </div>
      {reserve.reserveLiquidationThreshold !== "0" && (
        <>
          <DataValueList sx={{ mt: 20 }}>
            <DataValue
              label={t("lending.maxLTV")}
              labelColor="basic400"
              font="ChakraPetch"
              size="small"
              tooltip={t("lending.tooltip.maxLTV")}
            >
              <PercentageValue
                value={Number(reserve.formattedBaseLTVasCollateral) * 100}
              />
            </DataValue>
            <DataValue
              label={t("lending.risk.liquidationThreshold")}
              labelColor="basic400"
              font="ChakraPetch"
              size="small"
              tooltip={t("lending.tooltip.liquidationThreshold")}
            >
              <PercentageValue
                value={
                  Number(reserve.formattedReserveLiquidationThreshold) * 100
                }
              />
            </DataValue>
            <DataValue
              label={t("lending.risk.liquidationPenalty")}
              labelColor="basic400"
              font="ChakraPetch"
              size="small"
              tooltip={t("lending.tooltip.liquidationPenalty")}
            >
              <PercentageValue
                value={Number(reserve.formattedReserveLiquidationBonus) * 100}
              />
            </DataValue>
          </DataValueList>
          {reserve.isIsolated && (
            <DebtCeilingStatus
              sx={{ mt: 16 }}
              debt={reserve.isolationModeTotalDebtUSD}
              ceiling={reserve.debtCeilingUSD}
              usageData={debtCeiling}
            />
          )}
        </>
      )}
    </>
  )
}
