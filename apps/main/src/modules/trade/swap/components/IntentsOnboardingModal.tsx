import {
  Button,
  Modal,
  ModalCloseTrigger,
  ModalFooter,
  ModalHeader,
  Stack,
  Text,
} from "@galacticcouncil/ui/components"
import { getToken } from "@galacticcouncil/ui/utils"
import { FC, useEffect } from "react"
import { Trans, useTranslation } from "react-i18next"

import {
  SIntentsOnboardingHeader,
  SIntentsOnboardingHeaderContent,
} from "@/modules/trade/swap/components/IntentsOnboardingModal.styled"
import { useRpcProvider } from "@/providers/rpcProvider"
import { useBannersStore } from "@/states/banners"
import { useIntentsStore } from "@/states/intents"

export const IntentsOnboardingModal: FC = () => {
  const { t } = useTranslation("trade")
  const { featureFlags } = useRpcProvider()
  const hasSeenModal = useIntentsStore((state) => state.hasSeenModal)
  const setEnabled = useIntentsStore((state) => state.setEnabled)
  const dismissModal = useIntentsStore((state) => state.dismissModal)
  const deferGigaNews = useBannersStore((state) => state.deferGigaNews)

  const isOpen = featureFlags.isIceEnabled && !hasSeenModal

  useEffect(() => {
    if (isOpen) deferGigaNews()
  }, [isOpen, deferGigaNews])

  const onOpenChange = (open: boolean) => {
    if (!open) {
      dismissModal()
    }
  }

  if (!featureFlags.isIceEnabled) {
    return null
  }

  return (
    <Modal
      open={isOpen}
      onOpenChange={onOpenChange}
      disableInteractOutside
      centered
    >
      <ModalHeader
        title=""
        customHeader={
          <SIntentsOnboardingHeader>
            <SIntentsOnboardingHeaderContent>
              <Stack justify="center" align="center" gap="m" mb="-l">
                <Text
                  as="h2"
                  align="center"
                  fs={["h6", "h5"]}
                  lh={[1.2, 1]}
                  font="primary"
                  fw={500}
                  textWrap="balance"
                >
                  <Trans i18nKey="intents.onboarding.title" t={t} />
                </Text>
                <Text
                  align="center"
                  fs="p4"
                  color={getToken("text.high")}
                  textWrap="balance"
                >
                  {t("intents.onboarding.description")}
                </Text>
                <Text
                  as="p"
                  align="center"
                  fs="p4"
                  fw={500}
                  color={getToken("text.tint.secondary")}
                  textWrap="balance"
                >
                  {t("intents.onboarding.hint")}
                </Text>
              </Stack>
            </SIntentsOnboardingHeaderContent>
          </SIntentsOnboardingHeader>
        }
      />

      <ModalFooter justify="space-between">
        <ModalCloseTrigger asChild>
          <Button size="large" variant="tertiary">
            {t("intents.onboarding.cta.dismiss")}
          </Button>
        </ModalCloseTrigger>
        <ModalCloseTrigger asChild>
          <Button size="large" onClick={() => setEnabled(true)} width="100%">
            {t("intents.onboarding.cta.confirm")}
          </Button>
        </ModalCloseTrigger>
      </ModalFooter>
    </Modal>
  )
}
