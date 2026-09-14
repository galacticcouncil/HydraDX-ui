import { HealthFactorChange } from "@galacticcouncil/money-market/components/primitives"
import { HealthFactorResult } from "@galacticcouncil/money-market/utils"
import {
  Alert,
  Box,
  Button,
  Flex,
  ModalBody,
  ModalContentDivider,
  ModalFooter,
  ModalHeader,
  Skeleton,
  Summary,
  Text,
  Toggle,
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
} from "@galacticcouncil/ui/components"
import { Fragment } from "@galacticcouncil/ui/jsx/jsx-runtime"
import { getToken } from "@galacticcouncil/ui/utils"
import { useQuery } from "@tanstack/react-query"
import {
  Controller,
  FormProvider,
  useFieldArray,
  useFormContext,
} from "react-hook-form"
import { useTranslation } from "react-i18next"

import { TAssetData } from "@/api/assets"
import { useAccountBalances } from "@/api/balances"
import { useBorrowAssetsApy } from "@/api/borrow"
import { Farm } from "@/api/farms"
import { spotPriceQuery } from "@/api/spotPrice"
import { useStableSwapTradability } from "@/api/stableswap"
import { Trade } from "@/api/trade"
import { AssetSelect } from "@/components/AssetSelect/AssetSelect"
import { TradeFee } from "@/components/TradeFee/TradeFee"
import { getCustomErrors } from "@/modules/liquidity/components/AddLiquidity/AddLiqudity.utils"
import { AddLiquiditySummary } from "@/modules/liquidity/components/AddLiquidity/AddLiquidity"
import { AddLiquidityYield } from "@/modules/liquidity/components/AddLiquidity/AddLiquidityYield"
import {
  TAddMoneyMarketLiquidityWrapperReturn,
  useAddMoneyMarketLiquidity,
  useAddMoneyMarketLiquidityWrapper,
} from "@/modules/liquidity/components/AddMoneyMarketLiquidity/AddMoneyMarketLiquidity.utils"
import {
  AddMoneyMarketLiquidity,
  AddMoneyMarketOmnipoolLiquidity,
} from "@/modules/liquidity/components/AddMoneyMarketLiquidity/AddMoneyMarketLiquidityWrapper"
import { StablepoolReserves } from "@/modules/liquidity/components/StablepoolReserves/StablepoolReserves"
import {
  TradeLimit,
  TradeLimitType,
} from "@/modules/liquidity/components/TradeLimitRow/TradeLimitRow"
import {
  TStablepoolDetails,
  useStablepoolReserves,
} from "@/modules/liquidity/Liquidity.utils"
import { useAssets } from "@/providers/assetsProvider"
import { useRpcProvider } from "@/providers/rpcProvider"
import { AddLiquidityProps } from "@/routes/liquidity/$id.add"

import {
  addStablepoolOptions,
  TAddStablepoolLiquidityFormValues,
  TAddStablepoolLiquidityOption,
  useStablepoolAddLiquidity,
} from "./AddStablepoolLiquidity.utils"
import { AddStablepoolLiquiditySkeleton } from "./AddStablepoolLiquiditySkeleton"

export type AddStablepoolLiquidityProps = AddLiquidityProps & {
  stableswapId: string
  title?: string
  initialOption?: TAddStablepoolLiquidityOption
}

export type AddMoneyMarketLiquidityWrapperProps =
  AddStablepoolLiquidityProps & {
    erc20Id: string
    stablepoolDetails: TStablepoolDetails
  }

type AddStablepoolLiquidityFormProps = AddStablepoolLiquidityProps &
  Omit<
    | ReturnType<typeof useStablepoolAddLiquidity>
    | (ReturnType<typeof useAddMoneyMarketLiquidity> &
        TAddMoneyMarketLiquidityWrapperReturn),
    "form"
  >

export const AddStablepoolLiquidityWrapper = (
  props: AddStablepoolLiquidityProps,
) => {
  const { stableswapId } = props
  const { data: stablepoolDetails } = useStablepoolReserves(stableswapId)
  const { isBalanceLoading } = useAccountBalances()
  const { isSuccess } = useStableSwapTradability()

  if (isBalanceLoading || !stablepoolDetails || !isSuccess)
    return <AddStablepoolLiquiditySkeleton {...props} />

  if (props.erc20Id) {
    return (
      <AddMoneyMarketLiquidityWrapper
        {...props}
        erc20Id={props.erc20Id}
        stablepoolDetails={stablepoolDetails}
      />
    )
  }

  return (
    <AddStablepoolLiquidity {...props} stablepoolDetails={stablepoolDetails} />
  )
}

const AddMoneyMarketLiquidityWrapper = (
  props: AddMoneyMarketLiquidityWrapperProps,
) => {
  const { form, ...formData } = useAddMoneyMarketLiquidityWrapper(props)

  return (
    <FormProvider {...form}>
      {formData.defaultOption === "omnipool" ? (
        <AddMoneyMarketOmnipoolLiquidity formData={formData} props={props} />
      ) : (
        <AddMoneyMarketLiquidity formData={formData} props={props} />
      )}
    </FormProvider>
  )
}

const AddStablepoolLiquidity = (
  props: AddStablepoolLiquidityProps & {
    stablepoolDetails: TStablepoolDetails
  },
) => {
  const { stablepoolDetails, stableswapId, onSubmitted } = props
  const { form, ...addLiquidityData } = useStablepoolAddLiquidity({
    stablepoolDetails,
    stableswapId,
    onSubmitted,
  })

  return (
    <FormProvider {...form}>
      <AddStablepoolLiquidityForm {...props} {...addLiquidityData} />
    </FormProvider>
  )
}

export const AddStablepoolLiquidityForm = ({
  erc20Id,
  stableswapId,
  closable,
  onBack,
  getMaxBalance,
  assetsToSelect,
  minReceiveAmount,
  meta,
  activeFarms,
  mutation,
  joinFarmErrorMessage,
  isJoinFarms,
  healthFactor,
  reserveIds,
  poolShare,
  enabledSplit,
  isAddableToOmnipool,
  title,
  swap,
  ...props
}: AddStablepoolLiquidityFormProps) => {
  const { getAssetWithFallback } = useAssets()
  const { t } = useTranslation(["liquidity", "common"])
  const form = useFormContext<TAddStablepoolLiquidityFormValues>()

  const { control, watch, formState, setValue } = form
  const [split, selectedAssetId, option] = watch([
    "split",
    "selectedAssetId",
    "option",
  ])

  const { fields: activeFields } = useFieldArray({
    control,
    name: "activeFields",
  })

  const onSubmit = () => mutation.mutate()

  const customErrors = getCustomErrors(formState.errors.sharesAmount)

  const isSubmitDisabled = !formState.isValid

  if (!split && !selectedAssetId)
    return (
      <AddStablepoolLiquiditySkeleton
        closable={closable}
        onBack={onBack}
        stableswapId={stableswapId}
        {...props}
      />
    )

  const onSelectAsset = (asset: TAssetData) => {
    const field = form
      .getValues("fields")
      .find((field) => field.assetId === asset.id)
    const newValue = field ?? { amount: "", assetId: asset.id }

    setValue("selectedAssetId", asset.id)
    setValue("activeFields", [newValue])

    form.trigger("activeFields")
  }

  const onToggleClick = (checked: boolean) => {
    const fields = form.getValues("fields")
    form.setValue("split", checked)

    if (checked) {
      form.setValue(
        "activeFields",
        reserveIds.map(
          (reserveId) =>
            fields.find((field) => field.assetId === reserveId) ?? {
              amount: "",
              assetId: reserveId,
            },
        ),
      )
    } else if (selectedAssetId) {
      const prevField = fields.find(
        (field) => field.assetId === selectedAssetId,
      )

      form.setValue("activeFields", [
        prevField ?? { amount: "", assetId: selectedAssetId },
      ])
    }

    form.trigger("activeFields")
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} autoComplete="off">
      <ModalHeader
        title={title ?? t("addLiquidity")}
        onBack={onBack}
        closable={closable}
        sx={{
          borderBottom: "1px solid",
          borderColor: getToken("details.separators"),
        }}
        customHeader={
          !erc20Id &&
          isAddableToOmnipool && (
            <Flex align="center" mt="l" gap="m">
              <Controller
                control={form.control}
                name="option"
                render={({ field: { value, onChange, disabled } }) => (
                  <Flex flex={1}>
                    <ToggleGroup
                      type="single"
                      fullWidth
                      value={value}
                      onValueChange={(nextValue) =>
                        nextValue && onChange(nextValue)
                      }
                      disabled={disabled}
                    >
                      {addStablepoolOptions.map((option) => (
                        <ToggleGroupItem key={option.id} value={option.id}>
                          {option.label}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </Flex>
                )}
              />
              <AddStablepoolLiquidityTooltip />
            </Flex>
          )
        }
      />

      <ModalBody sx={{ pt: 0 }}>
        <Controller
          control={form.control}
          name="split"
          render={({ field }) => (
            <Flex align="center" justify="space-between" my="m">
              <Text fs="p3">
                {t("liquidity.add.stablepool.modal.proportionally")}
              </Text>
              <Toggle
                size="large"
                checked={field.value}
                onCheckedChange={onToggleClick}
                disabled={!enabledSplit}
              />
            </Flex>
          )}
        />

        <ModalContentDivider />

        {activeFields.map((field, index) => {
          const asset = getAssetWithFallback(field.assetId)

          return (
            <Fragment key={field.id}>
              <Controller
                name={`activeFields.${index}`}
                control={control}
                render={({
                  field: { value, onChange },
                  fieldState: { error },
                }) => (
                  <Box py="l" width="100%">
                    <AssetSelect
                      label={t("liquidity.add.modal.selectAsset")}
                      assets={[]}
                      sortedAssets={assetsToSelect}
                      balance={{ value: getMaxBalance(asset) }}
                      selectedAsset={getAssetWithFallback(value.assetId)}
                      amountError={error?.message}
                      value={value.amount}
                      onChange={(amount) => {
                        const updatedValue = { ...value, amount }
                        const allFields = form.getValues("fields")
                        const fieldIndex = allFields.findIndex(
                          (f) => f.assetId === field.assetId,
                        )

                        onChange(updatedValue)

                        const indexToUpdate =
                          fieldIndex === -1 ? allFields.length : fieldIndex

                        form.setValue(`fields.${indexToUpdate}`, updatedValue)
                      }}
                      setSelectedAsset={!split ? onSelectAsset : undefined}
                    />
                  </Box>
                )}
              />
              <ModalContentDivider />
            </Fragment>
          )
        })}

        <StablepoolReserves
          poolId={stableswapId}
          separator={<ModalContentDivider />}
        />

        <ModalContentDivider />

        <AddStablepoolLiquiditySummary
          farms={joinFarmErrorMessage ? [] : activeFarms}
          minReceiveAmount={minReceiveAmount}
          selectedAssetId={!split ? selectedAssetId : undefined}
          poolMeta={meta}
          limitType={
            erc20Id && !split ? TradeLimitType.Trade : TradeLimitType.Liquidity
          }
          healthFactor={healthFactor}
          erc20Id={erc20Id}
          option={option}
          poolShare={poolShare}
          swap={swap}
        />

        {customErrors?.cap ? (
          <Alert
            variant="warning"
            description={customErrors.cap.message}
            sx={{ my: "xxl" }}
          />
        ) : null}
        {customErrors?.circuitBreaker ? (
          <Alert
            variant="warning"
            description={customErrors.circuitBreaker.message}
            sx={{ my: "xxl" }}
          />
        ) : null}
        {joinFarmErrorMessage && (
          <Alert
            variant="warning"
            description={joinFarmErrorMessage}
            sx={{ my: "xxl" }}
          />
        )}

        {customErrors?.supplyCap && erc20Id ? (
          <Alert
            variant="warning"
            description={t("liquidity.add.modal.validation.supplyCap", {
              value: customErrors.supplyCap.message,
              symbol: getAssetWithFallback(erc20Id).symbol,
            })}
            sx={{ my: "xxl" }}
          />
        ) : null}

        <ModalContentDivider />
      </ModalBody>
      <ModalFooter sx={{ pt: 0 }}>
        <Button
          type="submit"
          size="large"
          width="100%"
          disabled={isSubmitDisabled}
        >
          {isJoinFarms
            ? t("liquidity.add.modal.submitAndjoinFarms")
            : (title ?? t("liquidity.add.modal.submit"))}
        </Button>
      </ModalFooter>
    </form>
  )
}

const AddStablepoolLiquiditySummary = ({
  farms,
  minReceiveAmount,
  selectedAssetId,
  poolMeta,
  limitType = TradeLimitType.Liquidity,
  healthFactor,
  erc20Id,
  option,
  poolShare,
  swap,
}: {
  farms: Farm[]
  minReceiveAmount: string
  selectedAssetId?: string
  poolMeta: TAssetData
  limitType?: TradeLimitType
  healthFactor?: HealthFactorResult
  erc20Id?: string
  option: TAddStablepoolLiquidityOption
  poolShare?: string
  swap?: Trade
}) => {
  const rpc = useRpcProvider()
  const { getAssetWithFallback, getErc20AToken } = useAssets()
  const { t } = useTranslation(["liquidity", "common", "trade"])

  const { data: spotPriceData, isLoading: isPriceLoading } = useQuery(
    spotPriceQuery(rpc, erc20Id ?? poolMeta.id, selectedAssetId ?? ""),
  )

  const erc20Meta = erc20Id ? getErc20AToken(erc20Id) : undefined
  const { data: borrowApy } = useBorrowAssetsApy(
    erc20Meta ? [erc20Meta.underlyingAssetId] : [],
  )

  const borrowApyData = borrowApy?.[0]

  if (erc20Meta && option === "omnipool") {
    return (
      <AddLiquiditySummary
        meta={poolMeta}
        poolShare={poolShare}
        minReceiveAmount={minReceiveAmount}
        farms={farms}
        healthFactor={healthFactor}
        stablepoolId={erc20Meta.underlyingAssetId}
        borrowApyData={borrowApyData}
        swap={swap}
      />
    )
  }

  return (
    <Summary
      separator={<ModalContentDivider />}
      rows={[
        {
          label: t("common:minimumReceived"),
          content: t("common:currency", {
            value: minReceiveAmount,
            symbol: erc20Meta?.symbol ?? poolMeta.symbol,
          }),
        },
        {
          label: t("common:tradeLimit"),
          content: <TradeLimit key={limitType} type={limitType} />,
        },
        ...(swap && erc20Meta
          ? [
              {
                label: t("trade:market.summary.estTradeFees"),
                content: (
                  <TradeFee
                    swap={swap}
                    receiveAsset={erc20Meta}
                    isLoading={false}
                  />
                ),
              },
            ]
          : []),
        {
          label: t("common:yield"),
          content: (
            <AddLiquidityYield
              stablepoolId={poolMeta.id}
              omnipoolId={option === "omnipool" ? poolMeta.id : undefined}
              farms={farms}
              borrowApyData={borrowApyData}
            />
          ),
        },
        ...(selectedAssetId
          ? [
              {
                label: t("common:price"),
                content: isPriceLoading ? (
                  <Skeleton width={50} height="100%" />
                ) : (
                  t("liquidity.remove.stablepool.modal.price", {
                    poolSymbol: erc20Meta?.symbol ?? poolMeta.symbol,
                    value: spotPriceData?.spotPrice,
                    symbol: getAssetWithFallback(selectedAssetId).symbol,
                  })
                ),
              },
            ]
          : []),
        ...(erc20Id && healthFactor
          ? [
              {
                label: t("common:healthFactor"),
                content: <HealthFactorChange {...healthFactor} fontSize="p5" />,
              },
            ]
          : []),
      ]}
    />
  )
}

export const AddStablepoolLiquidityTooltip = () => {
  const { t } = useTranslation("liquidity")

  return (
    <Tooltip
      text={
        <Flex direction="column" gap="m">
          <Text fs="p6" fw={500} color={getToken("text.high")}>
            {t("liquidity.add.modal.stablepool.tooltip.desc")}
          </Text>
          <Box>
            <Text
              transform="uppercase"
              fs="p6"
              fw={600}
              color={getToken("text.tint.primary")}
            >
              {t("liquidity.add.modal.option.omnipool")}
            </Text>
            <Text fs="p6" fw={500} color={getToken("text.high")}>
              {t("liquidity.add.modal.stablepool.tooltip.omnipool")}
            </Text>
          </Box>

          <Box>
            <Text
              transform="uppercase"
              fs="p6"
              fw={600}
              color={getToken("text.tint.secondary")}
            >
              {t("liquidity.add.modal.option.stablepool")}
            </Text>
            <Text fs="p6" fw={500} color={getToken("text.high")}>
              {t("liquidity.add.modal.stablepool.tooltip.stablepoolOnly")}
            </Text>
          </Box>
        </Flex>
      }
    />
  )
}
