import { SInputBoxContainer } from "components/Input/Input.styled"
import { Text } from "components/Typography/Text/Text"
import BN from "bignumber.js"
import { useTranslation } from "react-i18next"
import { DisplayValue } from "components/DisplayValue/DisplayValue"
import { BN_0 } from "utils/constants"

export type MemepadTokenPriceProps = {
  label: string
  symbol?: string
  dotPrice?: BN
  xykPoolSupply?: BN
  allocatedSupply?: BN
}

export const MemepadTokenPrice: React.FC<MemepadTokenPriceProps> = ({
  label,
  symbol,
  dotPrice,
  xykPoolSupply,
  allocatedSupply,
}) => {
  const { t } = useTranslation()

  const dotPerTokenPrice =
    xykPoolSupply?.isFinite() && allocatedSupply?.gt(0)
      ? xykPoolSupply.dividedBy(allocatedSupply)
      : BN_0

  const tokenPrice =
    dotPrice?.isFinite() && allocatedSupply?.gt(0) && xykPoolSupply?.gt(0)
      ? dotPrice.dividedBy(allocatedSupply).multipliedBy(xykPoolSupply)
      : BN_0

  return (
    <SInputBoxContainer as="div" sx={{ flex: "column" }}>
      <Text tTransform="uppercase" fs={11} color="basic500">
        {label}
      </Text>
      <Text
        fs={[14, 16]}
        fw={500}
        font="GeistSemiBold"
        tAlign="center"
        sx={{
          flex: "row",
          align: "center",
          justify: ["start", "center"],
          flexGrow: 1,
          py: 10,
        }}
      >
        <DisplayValue value={tokenPrice} type="token" />
      </Text>
      <div sx={{ flex: "column", gap: 4, mt: "auto" }}>
        <div sx={{ flex: "row", justify: "space-between" }}>
          <Text fs={10} color="darkBlue200">
            {t("memepad.form.dotPrice")}
          </Text>
          <Text fs={10} color="darkBlue100">
            <DisplayValue value={dotPrice} type="token" />
          </Text>
        </div>
        <div sx={{ flex: "row", justify: "space-between" }}>
          <Text fs={10} color="darkBlue200">
            {t("value.tokenWithSymbol", {
              value: xykPoolSupply?.isFinite() ? xykPoolSupply : BN_0,
              symbol: "DOT",
            })}
            {" / "}
            {t("value.tokenWithSymbol", {
              value: allocatedSupply,
              symbol,
            })}
          </Text>
          <Text fs={10} color="darkBlue100">
            <DisplayValue value={dotPerTokenPrice} type="token" />
          </Text>
        </div>
      </div>
    </SInputBoxContainer>
  )
}
