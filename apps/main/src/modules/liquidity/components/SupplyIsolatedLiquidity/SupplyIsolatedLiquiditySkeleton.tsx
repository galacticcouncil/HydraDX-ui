import {
  Box,
  Button,
  ModalBody,
  ModalContentDivider,
  ModalFooter,
  ModalHeader,
  Stack,
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
        <Box py="l" width="100%">
          <AssetSelect
            label={t("amount")}
            isDisabled
            isLoading
            assets={[]}
            selectedAsset={undefined}
          />
        </Box>

        <ModalContentDivider />

        <Stack gap="m" py="m" separated separator={<ModalContentDivider />}>
          <SummaryRow
            label={t("supplyApy")}
            content=""
            loading
            sx={{ my: 0 }}
          />
          <SummaryRow
            label={t("tradeLimit")}
            content={<TradeLimit type={TradeLimitType.Trade} disabled />}
            sx={{ my: 0 }}
          />
          <SummaryRow
            label={t("minimumReceived")}
            content=""
            loading
            sx={{ my: 0 }}
          />
          <SummaryRow
            label={t("healthFactor")}
            content=""
            loading
            sx={{ my: 0 }}
          />
        </Stack>
      </ModalBody>
      <ModalFooter>
        <Button type="submit" size="large" width="100%" disabled>
          {t("borrow:supply")}
        </Button>
      </ModalFooter>
    </>
  )
}
