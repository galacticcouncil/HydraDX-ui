import { valueToBigNumber } from "@aave/math-utils"
import BigNumber from "bignumber.js"
import { Text } from "components/Typography/Text/Text"
import { useTranslation } from "react-i18next"
import { theme } from "theme"

interface HFContentProps {
  healthFactor: string
}

export const HFContent = ({ healthFactor }: HFContentProps) => {
  const { t } = useTranslation()
  const formattedHealthFactor = Number(
    valueToBigNumber(healthFactor).toFixed(2, BigNumber.ROUND_DOWN),
  )

  const dotPosition = +healthFactor > 10 ? 100 : +healthFactor * 10

  return (
    <div css={{ position: "relative" }} sx={{ mt: 40, mb: 16 }}>
      <div
        css={{
          height: 4,
          background: `linear-gradient(90deg, ${theme.colors.green400} 60%, ${theme.colors.warning300} 80%, ${theme.colors.red500} 100%)`,
          borderRadius: 4,
          transform: "matrix(-1, 0, 0, 1, 0, 0)",
        }}
      />

      <div
        css={{
          position: "absolute",
          bottom: "calc(100% + 6px)",
          left: `${dotPosition > 100 ? 100 : dotPosition}%`,
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
              borderColor: `white transparent transparent transparent`,
              content: "''",
              position: "absolute",
              left: dotPosition > 75 ? "auto" : "50%",
              right: dotPosition > 75 ? 0 : "auto",
              transform:
                dotPosition > 75 ? "translateX(0)" : "translateX(-50%)",
            },
          }}
        >
          <div
            css={{
              display: "flex",
              position: "absolute",
              left: dotPosition > 75 ? "auto" : dotPosition < 15 ? "0" : "50%",
              transform:
                dotPosition > 75 || dotPosition < 15
                  ? "translateX(0)"
                  : "translateX(-50%)",
              right: dotPosition > 75 ? 0 : "auto",
              flexDirection: "column",
              alignItems:
                dotPosition > 75
                  ? "flex-end"
                  : dotPosition < 15
                  ? "flex-start"
                  : "center",
              textAlign:
                dotPosition > 75
                  ? "right"
                  : dotPosition < 15
                  ? "left"
                  : "center",
              bottom: "calc(100% + 2px)",
            }}
          >
            <Text fs={13} font="ChakraPetchSemiBold">
              {formattedHealthFactor}
            </Text>
          </div>
        </div>
      </div>
      <div
        sx={{ pt: 6 }}
        css={{
          maxWidth: "20%",
          textAlign: "center",
          "&:after": {
            content: "''",
            position: "absolute",
            bottom: "85%",
            left: "10%",
            transform: "translateX(-50%)",
            height: "10px",
            width: "2px",
            backgroundColor: theme.colors.red400,
          },
        }}
      >
        <Text fs={13} font="ChakraPetchSemiBold" color="red400" tAlign="center">
          1.00
        </Text>
        <Text fs={13} color="red400" tAlign="center">
          {t("lending.risk.liquidationValue")}
        </Text>
      </div>
    </div>
  )
}
