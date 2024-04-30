import { valueToBigNumber } from "@aave/math-utils"
import LinkIcon from "assets/icons/LinkIcon.svg?react"
import { BigNumber } from "bignumber.js"
import { DataValue, DataValueList } from "components/DataValue"
import { DisplayValue } from "components/DisplayValue/DisplayValue"
import { InfoTooltip } from "components/InfoTooltip/InfoTooltip"
import { SInfoIcon } from "components/InfoTooltip/InfoTooltip.styled"
import { Text } from "components/Typography/Text/Text"
import { Trans, useTranslation } from "react-i18next"
import { PercentageValue } from "components/PercentageValue"
import { CapsCircularStatus } from "sections/lending/components/caps/CapsCircularStatus"
import { ComputedReserveData } from "sections/lending/hooks/app-data-provider/useAppDataProvider"
import { AssetCapHookData } from "sections/lending/hooks/useAssetCaps"
import { IncentivesButton } from "sections/lending/ui/incentives/IncentivesButton"
import {
  MarketDataType,
  NetworkConfig,
} from "sections/lending/utils/marketsAndNetworksConfig"
import { ApyChartContainer } from "sections/lending/ui/reserve-overview/chart/ApyChartContainer"

interface BorrowInfoProps {
  reserve: ComputedReserveData
  currentMarketData: MarketDataType
  currentNetworkConfig: NetworkConfig
  renderCharts: boolean
  showBorrowCapStatus: boolean
  borrowCap: AssetCapHookData
}

export const BorrowInfo = ({
  reserve,
  currentMarketData,
  currentNetworkConfig,
  renderCharts,
  showBorrowCapStatus,
  borrowCap,
}: BorrowInfoProps) => {
  const { t } = useTranslation()
  const maxAvailableToBorrow = BigNumber.max(
    valueToBigNumber(reserve.borrowCap).minus(
      valueToBigNumber(reserve.totalDebt),
    ),
    0,
  ).toNumber()

  const maxAvailableToBorrowUSD = BigNumber.max(
    valueToBigNumber(reserve.borrowCapUSD).minus(
      valueToBigNumber(reserve.totalDebtUSD),
    ),
    0,
  ).toNumber()

  const hasBorrowCap = reserve.borrowCapUSD && reserve.borrowCapUSD !== "0"

  const CapProgress = () => (
    <CapsCircularStatus
      value={borrowCap.percentUsed}
      color="pink500"
      tooltipContent={t("lending.borrow.cap.tooltip", {
        value: maxAvailableToBorrow,
        symbol: reserve.symbol,
        usdValue: maxAvailableToBorrowUSD,
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
        {showBorrowCapStatus && (
          <div sx={{ display: ["none", "block"] }}>
            <CapProgress />
          </div>
        )}
        <div sx={{ width: ["100%", hasBorrowCap ? "60%" : "40%"], mb: 10 }}>
          <DataValueList separated>
            {showBorrowCapStatus ? (
              <>
                <DataValue
                  label={
                    <div sx={{ flex: "column", gap: 10 }}>
                      <Text
                        color="basic400"
                        fs={14}
                        sx={{ flex: "row", gap: 4, align: "center" }}
                      >
                        {t("lending.market.table.totalBorrowed")}{" "}
                        <InfoTooltip
                          text={
                            <Text fs={12}>
                              {t("lending.tooltip.borrowCap")}{" "}
                              <a
                                css={{ textDecoration: "underline" }}
                                target="_blank"
                                href="https://docs.aave.com/developers/whats-new/supply-borrow-caps"
                                rel="noreferrer"
                              >
                                {t("lending.learnMore")}
                              </a>
                            </Text>
                          }
                        >
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
                    valueA: reserve.totalDebt,
                    valueB: reserve.borrowCap,
                  })}
                  <Text
                    fs={12}
                    font="ChakraPetch"
                    color="basic500"
                    tAlign={["right", "left"]}
                  >
                    {t("lending.cap.range.usd", {
                      valueA: reserve.totalDebtUSD,
                      valueB: reserve.borrowCapUSD,
                    })}
                  </Text>
                </DataValue>
              </>
            ) : (
              <DataValue
                label={t("lending.market.table.totalBorrowed")}
                labelColor="basic400"
                font="ChakraPetchBold"
              >
                {t("value.compact", { value: Number(reserve.totalDebt) })}
                <Text
                  fs={12}
                  font="ChakraPetch"
                  color="basic500"
                  tAlign={["right", "left"]}
                >
                  <DisplayValue
                    value={Number(reserve.totalDebtUSD)}
                    isUSD
                    compact
                  />
                </Text>
              </DataValue>
            )}
            <DataValue
              label={t("lending.apyVariable")}
              labelColor="basic400"
              font="ChakraPetchBold"
            >
              <PercentageValue
                value={Number(reserve.variableBorrowAPY) * 100}
              />
              <div sx={{ mt: 2 }}>
                <IncentivesButton
                  symbol={reserve.symbol}
                  incentives={reserve.vIncentivesData}
                />
              </div>
            </DataValue>
            {hasBorrowCap && (
              <DataValue
                label={t("lending.borrowCap")}
                labelColor="basic400"
                font="ChakraPetchBold"
              >
                {t("value.compact", { value: Number(reserve.borrowCap) })}
                <Text
                  fs={12}
                  font="ChakraPetch"
                  color="basic500"
                  tAlign={["right", "left"]}
                >
                  <DisplayValue
                    value={Number(reserve.borrowCapUSD)}
                    isUSD
                    compact
                  />
                </Text>
              </DataValue>
            )}
          </DataValueList>
        </div>
      </div>
      {renderCharts && (
        <ApyChartContainer
          type="borrow"
          reserve={reserve}
          currentMarketData={currentMarketData}
        />
      )}
      {currentMarketData.addresses.COLLECTOR && (
        <>
          <div sx={{ mt: 20 }}>
            <Text
              fs={14}
              sx={{ mb: 10 }}
              css={{ textTransform: "uppercase" }}
              font="ChakraPetchSemiBold"
            >
              {t("lending.reserve.collectorInfo")}
            </Text>
          </div>
          <DataValueList>
            <DataValue
              label={t("lending.reserveFactor")}
              labelColor="basic400"
              font="ChakraPetch"
              size="small"
              tooltip={
                <Text fs={11}>
                  <Trans t={t} i18nKey="lending.tooltip.reserveFactor">
                    <a
                      target="_blank"
                      css={{ textDecoration: "underline" }}
                      href={currentMarketData.addresses.COLLECTOR}
                      rel="noreferrer"
                    >
                      &nbsp;
                    </a>
                  </Trans>
                </Text>
              }
            >
              <PercentageValue value={Number(reserve.reserveFactor) * 100} />
            </DataValue>
            <DataValue
              label={t("lending.reserve.collectorContract")}
              labelColor="basic400"
              font="ChakraPetch"
              size="small"
            >
              <a
                target="_blank"
                href={currentNetworkConfig.explorerLinkBuilder({
                  address: currentMarketData.addresses.COLLECTOR,
                })}
                rel="noreferrer"
                css={{ textDecoration: "underline" }}
              >
                {t("lending.viewContract")}
                <LinkIcon
                  width={10}
                  height={10}
                  sx={{ color: "basic500", ml: 4 }}
                />
              </a>
            </DataValue>
          </DataValueList>
        </>
      )}
    </>
  )
}
