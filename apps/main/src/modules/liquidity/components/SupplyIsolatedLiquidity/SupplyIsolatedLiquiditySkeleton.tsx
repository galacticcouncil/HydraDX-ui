import {
  Button,
  ModalBody,
  ModalContentDivider,
  ModalFooter,
  ModalHeader,
  Summary,
  SummaryRow,
} from "@galacticcouncil/ui/components"
import { useTranslation } from "react-i18next"

import { AssetSelect } from "@/components/AssetSelect/AssetSelect"
import {
  TradeLimit,
  TradeLimitType,
} from "@/modules/liquidity/components/TradeLimitRow/TradeLimitRow"

export const SupplyIsolatedLiquiditySkeleton = () => {
  const { t } = useTranslation(["common", "borrow"])

  return (
    <>
      <ModalHeader title={t("borrow:supply")} closable />
      <ModalBody sx={{ py: 0 }}>
        <AssetSelect
          label={t("amount")}
          disabled
          loading
          assets={[]}
          selectedAsset={undefined}
        />

        <ModalContentDivider />

        <Summary separator={<ModalContentDivider />}>
          <SummaryRow label={t("supplyApy")} content="" loading />
          <SummaryRow
            label={t("tradeLimit")}
            content={<TradeLimit type={TradeLimitType.Trade} disabled />}
          />
          <SummaryRow label={t("minimumReceived")} content="" loading />
          <SummaryRow label={t("healthFactor")} content="" loading />
        </Summary>
      </ModalBody>
      <ModalFooter>
        <Button type="submit" size="large" width="100%" disabled>
          {t("borrow:supply")}
        </Button>
      </ModalFooter>
    </>
  )
}
