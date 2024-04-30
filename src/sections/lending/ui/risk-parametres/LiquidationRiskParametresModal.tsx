import { ModalContents } from "components/Modal/contents/ModalContents"
import { Spacer } from "components/Spacer/Spacer"
import { Text } from "components/Typography/Text/Text"
import { useTranslation } from "react-i18next"
import { PercentageValue } from "components/PercentageValue"
import { BasicModal } from "sections/lending/components/primitives/BasicModal"
import { getHealthFactorColor, getLtvColor } from "sections/lending/utils/utils"
import { HFContent } from "./components/HFContent"
import { InfoWrapper } from "./components/InfoWrapper"
import { LTVContent } from "./components/LTVContent"

interface LiquidationRiskParametresInfoModalProps {
  open: boolean
  setOpen: (value: boolean) => void
  healthFactor: string
  loanToValue: string
  currentLoanToValue: string
  currentLiquidationThreshold: string
}

export const LiquidationRiskParametresInfoModal = ({
  open,
  setOpen,
  healthFactor,
  loanToValue,
  currentLoanToValue,
  currentLiquidationThreshold,
}: LiquidationRiskParametresInfoModalProps) => {
  const { t } = useTranslation()
  const healthFactorColor = getHealthFactorColor(healthFactor)

  const ltvColor = getLtvColor(
    loanToValue,
    currentLoanToValue,
    currentLiquidationThreshold,
  )

  return (
    <BasicModal open={open} setOpen={setOpen}>
      <ModalContents
        onClose={() => setOpen(false)}
        sx={{ color: "white" }}
        contents={[
          {
            title: t("lending.risk.title"),
            content: (
              <>
                <Text color="basic400" fs={14} lh={20} sx={{ mb: 32 }}>
                  {t("lending.risk.description")}
                  <br />
                  <a
                    href="https://docs.aave.com/faq/"
                    css={{ textDecoration: "underline" }}
                    sx={{ color: "brightBlue100" }}
                  >
                    {t("lending.learnMore")}
                  </a>
                </Text>
                <InfoWrapper
                  topTitle={t("lending.risk.hf.title")}
                  topDescription={t("lending.risk.hf.description")}
                  topValue={t("value", { value: healthFactor })}
                  bottomText={t("lending.risk.hf.hint")}
                  color={healthFactorColor}
                >
                  <HFContent healthFactor={healthFactor} />
                </InfoWrapper>
                <Spacer size={20} />
                <InfoWrapper
                  topTitle={t("lending.risk.ltv.title")}
                  topDescription={t("lending.risk.ltv.description")}
                  topValue={
                    <PercentageValue value={Number(loanToValue) * 100} />
                  }
                  bottomText={t("lending.risk.ltv.hint")}
                  color={ltvColor}
                >
                  <LTVContent
                    loanToValue={loanToValue}
                    currentLoanToValue={currentLoanToValue}
                    currentLiquidationThreshold={currentLiquidationThreshold}
                    color={ltvColor}
                  />
                </InfoWrapper>
              </>
            ),
          },
        ]}
      />
    </BasicModal>
  )
}
