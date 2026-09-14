import { Lock } from "@galacticcouncil/ui/assets/icons"
import {
  Box,
  Flex,
  Icon,
  LoadingButton,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Separator,
  Text,
} from "@galacticcouncil/ui/components"
import { getToken } from "@galacticcouncil/ui/utils"
import { useQuery } from "@tanstack/react-query"
import Big from "big.js"
import { millisecondsInDay } from "date-fns/constants"
import { FC } from "react"
import { Controller, FormProvider } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { useBondData } from "@/api/bonds"
import { AssetLabelFull } from "@/components/AssetLabelFull"
import { AssetPrice } from "@/components/AssetPrice"
import { AssetSelect } from "@/components/AssetSelect/AssetSelect"
import { AuthorizedAction } from "@/components/AuthorizedAction/AuthorizedAction"
import { useStableBondsForm } from "@/modules/strategies/stable-bonds/components/StableBondsDeposit.form"
import { useStableBondsRollover } from "@/modules/strategies/stable-bonds/hooks/useStableBondsRollover"
import { useSubmitStableBondsOrder } from "@/modules/strategies/stable-bonds/hooks/useSubmitStableBondsOrder"
import { getOtcBuyAmountFromSellAmount } from "@/modules/trade/otc/fill-order/FillOrder.utils"
import { otcTradeFeeQuery } from "@/modules/trade/otc/TradeFee.query"
import { useAssets } from "@/providers/assetsProvider"
import { useRpcProvider } from "@/providers/rpcProvider"

type Props = {
  readonly rollover: NonNullable<ReturnType<typeof useStableBondsRollover>>
  readonly onClose: () => void
}

export const StableBondsRolloverModalContent: FC<Props> = ({
  rollover,
  onClose,
}) => {
  const { t } = useTranslation(["common", "strategies"])
  const rpc = useRpcProvider()
  const { getAssetWithFallback } = useAssets()

  const { order, toBond } = rollover
  const { timeLeft } = useBondData(toBond.id)

  const { data: feePct = "0", isPending: isFeePending } = useQuery(
    otcTradeFeeQuery(rpc),
  )

  const { form, getMaxBalance } = useStableBondsForm([order])
  const submit = useSubmitStableBondsOrder({
    mode: "rollover",
    onSubmitted: onClose,
  })

  const { handleSubmit, watch } = form
  const [depositAsset, depositAmount] = watch(["depositAsset", "depositAmount"])

  const depositAssetBalance = getMaxBalance(depositAsset)
  const assetInMax = Big.min(
    order.assetAmountIn,
    depositAssetBalance,
  ).toString()

  const receiveAmount = getOtcBuyAmountFromSellAmount(
    order,
    depositAmount,
    feePct,
  )

  // Bonds redeem 1:1 into their underlying at maturity, so the amount of the
  // new bond is the amount of HOLLAR the user ends up with.
  const underlyingAsset = getAssetWithFallback(toBond.underlyingAssetId)

  return (
    <>
      <ModalHeader title={t("strategies:bonds.rollover.modal.title")} />
      <FormProvider {...form}>
        <form
          onSubmit={handleSubmit((values) =>
            submit.mutate({ values, order, receiveAmount }),
          )}
        >
          <ModalBody sx={{ p: 0 }}>
            <Box px="xl">
              {/* Plain Controller rather than AssetSelectFormField: the latter
                  marks the asset field RHF-disabled, which drops depositAsset
                  from the validated values the schema requires. */}
              <Controller
                control={form.control}
                name="depositAmount"
                render={({ field, fieldState }) => (
                  <Box py="l" width="100%">
                    <AssetSelect
                      label={t("strategies:bonds.rollover.modal.asset")}
                      value={field.value}
                      onChange={field.onChange}
                      assets={[]}
                      selectedAsset={order.assetIn}
                      balance={{ value: depositAssetBalance, max: assetInMax }}
                      amountError={fieldState.error?.message}
                    />
                  </Box>
                )}
              />
            </Box>
            <Separator />
            <Flex direction="column" gap="m" p="xl">
              <Text
                color={getToken("text.tint.secondary")}
                font="primary"
                fw={700}
              >
                {t("strategies:bonds.rollover.modal.receiveAtMaturity")}
              </Text>
              <Flex
                direction="column"
                gap="m"
                p="m"
                sx={{
                  borderRadius: "m",
                  backgroundColor: getToken(
                    "surfaces.containers.dim.dimOnHigh",
                  ),
                }}
              >
                <Flex gap="m" justify="space-between" align="center">
                  <AssetLabelFull asset={underlyingAsset} withName={false} />
                  <Flex direction="column" align="flex-end">
                    <Text fw={600} color={getToken("text.high")} fs="p2" lh={1}>
                      {t("number", { value: receiveAmount || "0" })}
                    </Text>
                    <AssetPrice
                      assetId={underlyingAsset.id}
                      value={Number(receiveAmount || "0")}
                      wrapper={<Text color={getToken("text.low")} fs="p5" />}
                    />
                  </Flex>
                </Flex>
                {timeLeft > 0 && (
                  <>
                    <Separator />
                    <Flex gap="m" justify="space-between" align="center">
                      <Flex align="center" gap="base">
                        <Icon component={Lock} size="xs" />
                        <Text fs="p5">
                          {t("strategies:bonds.deposit.maturityPeriod")}
                        </Text>
                      </Flex>
                      <Text fw={600} fs="p5" color={getToken("text.high")}>
                        {t("interval.remaining", {
                          value: timeLeft,
                          largest: 1,
                          ...(timeLeft > millisecondsInDay && { unit: "d" }),
                        })}
                      </Text>
                    </Flex>
                  </>
                )}
              </Flex>
            </Flex>
          </ModalBody>
          <ModalFooter>
            <AuthorizedAction size="large" width="100%">
              <LoadingButton
                isLoading={submit.isPending}
                type="submit"
                size="large"
                width="100%"
                disabled={
                  !form.formState.isValid || isFeePending || submit.isPending
                }
              >
                {t("strategies:bonds.rollover.modal.cta")}
              </LoadingButton>
            </AuthorizedAction>
          </ModalFooter>
        </form>
      </FormProvider>
    </>
  )
}
