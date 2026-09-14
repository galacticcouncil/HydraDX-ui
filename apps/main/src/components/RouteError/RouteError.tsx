import { DiscordLogo } from "@galacticcouncil/ui/assets/icons"
import Caution3D from "@galacticcouncil/ui/assets/images/Caution3D.webp"
import {
  Alert,
  Button,
  ExternalLink,
  Flex,
  Icon,
  Image,
  Stack,
  Text,
  TextButton,
} from "@galacticcouncil/ui/components"
import { getToken } from "@galacticcouncil/ui/utils"
import { useCopy } from "@galacticcouncil/utils"
import { useAccount } from "@galacticcouncil/web3-connect"
import { ErrorRouteComponent } from "@tanstack/react-router"
import { CheckIcon, CopyIcon, RefreshCwIcon } from "lucide-react"
import { Trans, useTranslation } from "react-i18next"
import { isNumber } from "remeda"

import { useBestNumber } from "@/api/chain"
import { useChainSpecData } from "@/api/chainSpec"
import { useAccountFeePaymentAssetId } from "@/api/payments"
import { DISCORD_INVITE_LINK } from "@/config/links"
import { useAssets } from "@/providers/assetsProvider"
import { stringifyErrorContext } from "@/utils/errors"

export const RouteError: ErrorRouteComponent = ({ error }) => {
  const { t } = useTranslation()
  const { copied, copy } = useCopy(5000)
  const { account } = useAccount()
  const { getAssetWithFallback } = useAssets()

  const { data: chain } = useChainSpecData()
  const { data: bestNumber } = useBestNumber()
  const { data: feeAssetId } = useAccountFeePaymentAssetId()

  const errorMessage = stringifyErrorContext({
    message: error?.message ?? "",
    address: account?.rawAddress ?? "",
    wallet: account?.provider ?? "",
    feePaymentAsset: isNumber(feeAssetId)
      ? `${getAssetWithFallback(feeAssetId).symbol} (${feeAssetId})`
      : "",
    specVersion: chain?.lastRuntimeUpgrade?.spec_version?.toString() ?? "",
    blockNumber: bestNumber?.parachainBlockNumber?.toString() ?? "",
    path: window.location.pathname,
  })

  return (
    <Flex height={["auto", "50vh"]} justify="center" align="center" p="xl">
      <Stack gap="l" align="center" maxWidth="6xl">
        <Image
          src={Caution3D}
          alt={t("routeError.title")}
          sx={{ size: ["2xl", null, "3xl"] }}
        />
        <Stack gap="base">
          <Text as="h1" font="primary" fs="h6" align="center">
            {t("routeError.title")}
          </Text>

          <Text
            align="center"
            fs="p4"
            color={getToken("text.medium")}
            sx={{ textWrap: "balance" }}
          >
            <Trans t={t} i18nKey="routeError.description">
              <Text as="span" fw={600} color={getToken("text.high")} />
            </Trans>
          </Text>
        </Stack>

        <Flex gap="base">
          <Button
            variant="tertiary"
            size="medium"
            title={errorMessage}
            onClick={() => copy(errorMessage)}
          >
            <Icon component={copied ? CheckIcon : CopyIcon} size="m" />
            {t("copyError")}
          </Button>
          <Button
            variant="tertiary"
            size="medium"
            asChild
            sx={{ bg: "#5865F2", color: "white" }}
          >
            <ExternalLink href={DISCORD_INVITE_LINK}>
              <Icon component={DiscordLogo} size="l" />
              {t("routeError.reportDiscord")}
            </ExternalLink>
          </Button>
        </Flex>

        {import.meta.env.DEV && error instanceof Error && (
          <Alert variant="error" description={error.toString()} />
        )}

        <TextButton onClick={() => window.location.reload()}>
          <Icon component={RefreshCwIcon} size="s" sx={{ mr: "s" }} />
          {t("routeError.reloadPage")}
        </TextButton>
      </Stack>
    </Flex>
  )
}
