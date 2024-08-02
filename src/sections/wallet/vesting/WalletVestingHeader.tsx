import { css } from "@emotion/react"
import { useVestingScheduleEnd, useVestingTotalVestedAmount } from "api/vesting"
import { DisplayValue } from "components/DisplayValue/DisplayValue"
import { Heading } from "components/Typography/Heading/Heading"
import { Text } from "components/Typography/Text/Text"
import { addDays } from "date-fns"
import { useMemo } from "react"
import { Trans, useTranslation } from "react-i18next"
import Skeleton from "react-loading-skeleton"
import { theme } from "theme"
import { separateBalance } from "utils/balance"
import { useDisplayPrice } from "utils/displayAsset"
import { isApiLoaded } from "utils/helpers"
import { BN_0, BN_10, DAY_IN_MILLISECONDS } from "utils/constants"
import { SSeparator, STable } from "./WalletVestingHeader.styled"
import { useRpcProvider } from "providers/rpcProvider"
import { useAssets } from "providers/assets"

export const WalletVestingHeader = () => {
  const { t } = useTranslation()
  const { api } = useRpcProvider()

  return (
    <div
      sx={{
        flex: ["column", "row"],
        mb: 40,
        align: "center",
        justify: "space-between",
      }}
    >
      {isApiLoaded(api) ? (
        <WalletVestingHeaderContent />
      ) : (
        <div
          sx={{
            flex: ["row", "column"],
            justify: "space-between",
            width: "100%",
          }}
        >
          <Text color="brightBlue300">{t("wallet.vesting.total_vested")}</Text>
          <Skeleton sx={{ height: [19, 34], width: [180, 200] }} />
        </div>
      )}
    </div>
  )
}

const WalletVestingHeaderContent = () => {
  const { native } = useAssets()
  const { t } = useTranslation()

  const { data: totalVestedAmount } = useVestingTotalVestedAmount()
  const { data: vestingScheduleEnd } = useVestingScheduleEnd()

  const spotPrice = useDisplayPrice(native.id)

  const totalVestedValue = totalVestedAmount ?? BN_0

  const totalVestedDisplay = useMemo(() => {
    if (totalVestedValue && spotPrice.data) {
      return totalVestedValue
        .times(spotPrice.data.spotPrice)
        .div(BN_10.pow(native.decimals))
    }
    return null
  }, [totalVestedValue, spotPrice.data, native])

  return (
    <>
      <div
        sx={{
          flex: ["row", "column"],
          justify: "space-between",
          width: "100%",
        }}
      >
        <Text color="brightBlue300">{t("wallet.vesting.total_vested")}</Text>
        <div sx={{ flex: "row", align: "start" }}>
          <Heading as="h3" lh={[25, 42]} sx={{ fontSize: [19, 34] }}>
            <Trans
              t={t}
              i18nKey="wallet.vesting.total_vested.value"
              tOptions={{
                ...separateBalance(totalVestedValue, {
                  fixedPointScale: native.decimals,
                  type: "token",
                }),
                symbol: native.symbol,
              }}
            >
              <span
                sx={{ fontSize: [19, 21] }}
                css={css`
                  color: rgba(${theme.rgbColors.white}, 0.4);
                `}
              />
            </Trans>
          </Heading>
        </div>
        <Text
          sx={{
            display: ["none", "inherit"],
          }}
          css={{ color: `rgba(${theme.rgbColors.white}, 0.4);` }}
        >
          <DisplayValue value={totalVestedDisplay} />
        </Text>
      </div>

      {vestingScheduleEnd && (
        <SSeparator sx={{ display: ["none", "inherit"] }} />
      )}
      {vestingScheduleEnd && (
        <STable>
          <div>
            <Text color="pink500" fs={[14, 16]} sx={{ mb: 10 }}>
              {t("wallet.vesting.vesting_days_left")}
            </Text>
            <Text
              color="white"
              fs={[15, 19]}
              font="GeistMono"
              tTransform="uppercase"
            >
              {t("wallet.vesting.vesting_days_left_value", {
                count: vestingScheduleEnd.div(DAY_IN_MILLISECONDS).isLessThan(0)
                  ? 0
                  : Math.ceil(
                      vestingScheduleEnd.div(DAY_IN_MILLISECONDS).toNumber(),
                    ),
              })}
            </Text>
          </div>
          <SSeparator />
          <div>
            <Text color="pink500" fs={[14, 16]} sx={{ mb: 10 }}>
              {t("wallet.vesting.vesting_schedule_end")}
            </Text>
            <Text
              color="white"
              fs={[15, 19]}
              font="GeistMono"
              tTransform="uppercase"
            >
              {t("wallet.vesting.vesting_schedule_end_value", {
                date: addDays(
                  new Date(),
                  vestingScheduleEnd.div(DAY_IN_MILLISECONDS).toNumber(),
                ),
              })}
            </Text>
          </div>
        </STable>
      )}
    </>
  )
}
