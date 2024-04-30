import { valueToBigNumber } from "@aave/math-utils"
import BigNumber from "bignumber.js"
import { Text } from "components/Typography/Text/Text"
import { useTranslation } from "react-i18next"
import { theme } from "theme"

interface LTVContentProps {
  loanToValue: string
  currentLoanToValue: string
  currentLiquidationThreshold: string
  color: string
}

export const LTVContent = ({
  loanToValue,
  currentLoanToValue,
  currentLiquidationThreshold,
  color,
}: LTVContentProps) => {
  const { t } = useTranslation()
  const LTVLineWidth = valueToBigNumber(loanToValue)
    .multipliedBy(100)
    .precision(20, BigNumber.ROUND_UP)
    .toNumber()

  const CurrentLTVLineWidth = valueToBigNumber(currentLoanToValue)
    .multipliedBy(100)
    .precision(20, BigNumber.ROUND_UP)
    .toNumber()

  const currentLiquidationThresholdLeftPosition = valueToBigNumber(
    currentLiquidationThreshold,
  )
    .multipliedBy(100)
    .precision(20, BigNumber.ROUND_UP)
    .toNumber()

  const liquidationThresholdPercent = Number(currentLiquidationThreshold) * 100

  return (
    <div css={{ position: "relative" }} sx={{ my: 50 }}>
      <div
        css={{
          position: "absolute",
          top: "calc(100% + 6px)",
          left: `${
            currentLiquidationThresholdLeftPosition > 100
              ? 100
              : currentLiquidationThresholdLeftPosition
          }%`,
          zIndex: 2,
        }}
      >
        <div
          css={{
            position: "relative",
            whiteSpace: "nowrap",
            "&:after": {
              content: "''",
              position: "absolute",
              left: liquidationThresholdPercent > 75 ? "auto" : "50%",
              transform:
                liquidationThresholdPercent > 75
                  ? "translateX(0)"
                  : "translateX(-50%)",
              right: liquidationThresholdPercent > 75 ? 0 : "auto",
              bottom: "100%",
              height: "10px",
              width: "2px",
              backgroundColor: theme.colors.red400,
            },
          }}
        >
          <div
            css={{
              display: "flex",
              position: "absolute",
              left: liquidationThresholdPercent > 75 ? "auto" : "50%",
              transform:
                liquidationThresholdPercent > 75
                  ? "translateX(0)"
                  : "translateX(-50%)",
              right: liquidationThresholdPercent > 75 ? 0 : "auto",
              flexDirection: "column",
              alignItems:
                liquidationThresholdPercent > 75 ? "flex-end" : "center",
              textAlign: liquidationThresholdPercent > 75 ? "right" : "center",
            }}
          >
            <Text
              fs={13}
              font="ChakraPetchSemiBold"
              color="red400"
              tAlign="right"
            >
              {(Number(currentLiquidationThreshold) * 100).toFixed(2)}%
            </Text>
            <Text fs={13} color="red400" tAlign="right">
              {t("lending.risk.liquidationThreshold")}
            </Text>
          </div>
        </div>
      </div>

      <div
        css={{
          position: "absolute",
          bottom: "calc(100% + 6px)",
          left: `${LTVLineWidth > 100 ? 100 : LTVLineWidth}%`,
          zIndex: 3,
        }}
      >
        <div
          css={{
            position: "relative",
            whiteSpace: "nowrap",
            "&:after": {
              width: 0,
              height: 0,
              borderStyle: "solid",
              borderWidth: "6px 4px 0 4px",
              borderColor: "white transparent transparent transparent",
              content: "''",
              position: "absolute",
              left: LTVLineWidth > 75 ? "auto" : "50%",
              right: LTVLineWidth > 75 ? 0 : "auto",
              transform:
                LTVLineWidth > 75 ? "translateX(0)" : "translateX(-50%)",
            },
          }}
        >
          <div
            css={{
              display: "flex",
              position: "absolute",
              left:
                LTVLineWidth > 75 ? "auto" : LTVLineWidth < 15 ? "0" : "50%",
              transform:
                LTVLineWidth > 75 || LTVLineWidth < 15
                  ? "translateX(0)"
                  : "translateX(-50%)",
              right: LTVLineWidth > 75 ? 0 : "auto",
              flexDirection: "column",
              alignItems:
                LTVLineWidth > 75
                  ? "flex-end"
                  : LTVLineWidth < 15
                  ? "flex-start"
                  : "center",
              textAlign:
                LTVLineWidth > 75
                  ? "right"
                  : LTVLineWidth < 15
                  ? "left"
                  : "center",
              bottom: "calc(100% + 2px)",
            }}
          >
            <Text fs={13} font="ChakraPetchSemiBold">
              {(Number(loanToValue) * 100).toFixed(2)}%
            </Text>
            <div css={{ display: "inline-flex", alignItems: "center" }}>
              <Text fs={11} color="basic500" sx={{ mr: 2 }}>
                <span>MAX</span>
              </Text>
              <Text fs={11} color="basic500">
                {(Number(currentLoanToValue) * 100).toFixed(2)}%
              </Text>
            </div>
          </div>
        </div>
      </div>

      <div
        css={{
          height: "4px",
          width: "100%",
          borderRadius: "1px",
          position: "relative",
          backgroundColor: theme.colors.basic800,
        }}
      >
        <div
          css={{
            position: "absolute",
            left: 0,
            height: "4px",
            borderRadius: "1px",
            width: `${LTVLineWidth > 100 ? 100 : LTVLineWidth}%`,
            maxWidth: "100%",
            backgroundColor: color,
            zIndex: 2,
          }}
        />

        {LTVLineWidth < CurrentLTVLineWidth && (
          <div
            css={{
              position: "absolute",
              left: 0,
              height: "4px",
              borderRadius: "1px",
              width: `${
                CurrentLTVLineWidth > 100 ? 100 : CurrentLTVLineWidth
              }%`,
              maxWidth: "100%",
              background: `repeating-linear-gradient(-45deg, ${theme.colors.basic800}, ${theme.colors.basic800} 4px, ${color} 4px, ${color} 7px)`,
            }}
          />
        )}
      </div>
    </div>
  )
}
