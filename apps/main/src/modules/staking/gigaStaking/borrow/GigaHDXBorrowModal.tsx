import {
  HealthFactorChange,
  HealthFactorRiskWarning,
} from "@galacticcouncil/money-market/components"
import {
  Box,
  Button,
  Modal,
  ModalBody,
  ModalContentDivider,
  ModalFooter,
  ModalHeader,
  Separator,
  Summary,
} from "@galacticcouncil/ui/components"
import { useState } from "react"
import { FormProvider } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { TAssetData } from "@/api/assets"
import { AssetSelectFormField } from "@/form/AssetSelectFormField"

import { useGigaHDXBorrow } from "./GigaHDXBorrow.utils"

type GigaHDXBorrowModalProps = {
  open: boolean

  onClose: () => void
}

type GigaHDXBorrowFormValues = {
  amount: string
  asset: TAssetData
}

export const GigaHDXBorrowModal = ({
  open,
  ...props
}: GigaHDXBorrowModalProps) => {
  return (
    <Modal open={open} onOpenChange={(isOpen) => !isOpen && props.onClose()}>
      <GigaHDXBorrowForm {...props} />
    </Modal>
  )
}

export const GigaHDXBorrowForm = ({
  onClose,
}: Omit<GigaHDXBorrowModalProps, "open">) => {
  const { t } = useTranslation(["common", "borrow", "staking"])

  const [
    healthFactorRiskCheckboxAccepted,
    setHealthFactorRiskCheckboxAccepted,
  ] = useState(false)

  const {
    form,
    healthFactor,
    onSubmit,
    maxBorrowableWei,
    borrowableAmount,
    variableBorrowApy,
    mutation,
  } = useGigaHDXBorrow({
    onClose,
  })

  return (
    <FormProvider {...form}>
      <ModalHeader title={t("borrow:borrow")} />
      <form onSubmit={onSubmit} autoComplete="off">
        <ModalBody sx={{ pt: 0 }}>
          <Box py="l" width="100%">
            <AssetSelectFormField<GigaHDXBorrowFormValues>
              assetFieldName="asset"
              amountFieldName="amount"
              label={t("amount")}
              assets={[]}
              disabledAssetSelector
              balance={{ value: borrowableAmount, label: t("available") }}
            />
          </Box>
          <ModalContentDivider />
          <Summary
            separator={<ModalContentDivider />}
            rows={[
              {
                label: t("borrow:healthFactor"),
                content: <HealthFactorChange {...healthFactor} />,
              },
              {
                label: t("borrow:apy.variable"),
                content: t("percent", {
                  value: Number(variableBorrowApy) * 100,
                }),
              },
            ]}
          />

          {healthFactor?.isUserConsentRequired && (
            <HealthFactorRiskWarning
              message={t("staking:gigaStaking.borrow.healthFactorRiskWarning")}
              accepted={healthFactorRiskCheckboxAccepted}
              onAcceptedChange={setHealthFactorRiskCheckboxAccepted}
              isUserConsentRequired
            />
          )}
        </ModalBody>
        <Separator />
        <ModalFooter>
          <Button
            type="submit"
            size="large"
            width="100%"
            disabled={
              !form.formState.isValid ||
              mutation.isPending ||
              maxBorrowableWei <= 0n ||
              (healthFactor?.isUserConsentRequired &&
                !healthFactorRiskCheckboxAccepted)
            }
          >
            {t("borrow:borrow")}
          </Button>
        </ModalFooter>
      </form>
    </FormProvider>
  )
}
