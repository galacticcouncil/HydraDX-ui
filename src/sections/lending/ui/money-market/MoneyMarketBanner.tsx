import { Button } from "components/Button/Button"
import { Text } from "components/Typography/Text/Text"
import { FC } from "react"
import {
  SContainer,
  SContent,
  SInnerContainer,
} from "./MoneyMarketBanner.styled"
import { useStore } from "state/store"
import { useRpcProvider } from "providers/rpcProvider"
import { useTranslation, Trans } from "react-i18next"

type MoneyMarketBannerProps = {
  className?: string
}

export const MoneyMarketBanner: FC<MoneyMarketBannerProps> = ({
  className,
}) => {
  const { t } = useTranslation()
  const { api } = useRpcProvider()
  const { createTransaction } = useStore()

  const onBind = () => {
    createTransaction(
      {
        tx: api.tx.evmAccounts.bindEvmAddress(),
      },
      {
        toast: {
          onLoading: <Trans t={t} i18nKey="lending.bind.toast.onLoading" />,
          onSuccess: <Trans t={t} i18nKey="lending.bind.toast.onSuccess" />,
          onError: <Trans t={t} i18nKey="lending.bind.toast.onError" />,
        },
      },
    )
  }

  return (
    <SContainer className={className}>
      <SInnerContainer>
        <SContent>
          <div sx={{ pr: [120, 0] }}>
            <Text font="ChakraPetchBold" sx={{ mb: 4 }}>
              {t("lending.bind.banner.title")}
            </Text>

            <Text
              fs={12}
              lh={16}
              sx={{ maxWidth: ["100%", 600], opacity: 0.7 }}
            >
              <Trans t={t} i18nKey="lending.bind.banner.description" />
            </Text>
          </div>
          <Button
            variant="primary"
            size="small"
            sx={{ ml: "auto" }}
            css={{ position: "relative", zIndex: 1 }}
            onClick={onBind}
          >
            {t("lending.bind.banner.button")}
          </Button>
        </SContent>
      </SInnerContainer>
    </SContainer>
  )
}
