import BN from "bignumber.js"
import { Separator } from "components/Separator/Separator"
import { Text } from "components/Typography/Text/Text"
import { useTranslation } from "react-i18next"
import { SConvertionContainer } from "./TokensConvertion.styled"
import Skeleton from "react-loading-skeleton"

type TokensConversionProps = {
  label?: string
  firstValue?: { amount: BN; symbol: string }
  secondValue?: { amount: BN; symbol: string }
  placeholderValue?: string
  onClick?: () => void
}

export const TokensConversion = ({
  label,
  firstValue,
  secondValue,
  placeholderValue,
  onClick,
}: TokensConversionProps) => {
  const { t } = useTranslation()

  return (
    <div
      sx={{
        flex: "row",
        height: 35,
        my: 16,
        align: "center",
        mx: "calc(var(--modal-content-padding) * -1)",
      }}
      css={{ position: "relative" }}
    >
      <Separator />
      <SConvertionContainer onClick={onClick}>
        <Text fs={11} lh={15}>
          {label ?? t("price")}
        </Text>
        {firstValue ? (
          <Text fs={11} lh={15} color="brightBlue300">
            {t("value.tokenWithSymbol", {
              value: firstValue.amount,
              symbol: firstValue.symbol,
            })}
          </Text>
        ) : (
          <>
            {placeholderValue ? (
              <Text fs={11} lh={15}>
                {placeholderValue}
              </Text>
            ) : (
              <Skeleton height={11} width={30} />
            )}
          </>
        )}
        <Text>=</Text>
        {secondValue ? (
          <Text fs={11} lh={15}>
            {t("value.tokenWithSymbol", {
              value: secondValue.amount,
              symbol: secondValue.symbol,
            })}
          </Text>
        ) : (
          <>
            {placeholderValue ? (
              <Text fs={11} lh={15}>
                {placeholderValue}
              </Text>
            ) : (
              <Skeleton height={11} width={30} />
            )}
          </>
        )}
      </SConvertionContainer>
    </div>
  )
}
