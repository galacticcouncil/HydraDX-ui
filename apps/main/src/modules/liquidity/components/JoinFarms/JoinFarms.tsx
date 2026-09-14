import {
  Amount,
  Box,
  Button,
  Flex,
  ModalBody,
  ModalContentDivider,
  ModalHeader,
  Text,
} from "@galacticcouncil/ui/components"
import { getToken } from "@galacticcouncil/ui/utils"
import { isSS58Address } from "@galacticcouncil/utils"
import { useEffect } from "react"
import { Controller } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { TAssetData } from "@/api/assets"
import { Farm, useOmnipoolActiveFarm } from "@/api/farms"
import { useXYKPoolWithLiquidity, XYKPoolWithLiquidity } from "@/api/xyk"
import { AssetSelect } from "@/components/AssetSelect/AssetSelect"
import { AvailableFarms } from "@/modules/liquidity/components/AvailableFarms"
import { TShareToken, useAssets, XYKPoolMeta } from "@/providers/assetsProvider"
import {
  AccountOmnipoolPosition,
  useAccountOmnipoolPositionsData,
} from "@/states/account"

import {
  TJoinFarmsForm,
  useJoinFarmsForm,
  useJoinIsolatedPoolFarms,
  useJoinOmnipoolFarms,
} from "./JoinFarms.utils"
import { JoinFarmsSkeleton } from "./JoinFarmsSkeleton"

export type JoinFarmsProps = {
  positionId?: string
  poolId: string
  closable?: boolean
  onBack?: () => void
  onSubmitted: () => void
}

export const JoinFarmsWrapper = (props: JoinFarmsProps) =>
  isSS58Address(props.poolId) ? (
    <IsolatedPoolJoinFarmsWrapper {...props} />
  ) : (
    <OmnipoolJoinFarmsWrapper {...props} />
  )

const OmnipoolJoinFarmsWrapper = (props: JoinFarmsProps) => {
  const { data: activeFarms } = useOmnipoolActiveFarm(props.poolId)
  const { getAssetPositions } = useAccountOmnipoolPositionsData()
  const farms = activeFarms?.filter((farm) => farm.apr !== "0") ?? []

  const position = getAssetPositions(props.poolId).all.find(
    (position) => position.positionId === props.positionId,
  )

  if (!farms || !position) {
    return <JoinFarmsSkeleton />
  }

  return <OmnipoolJoinFarms position={position} farms={farms} {...props} />
}

const IsolatedPoolJoinFarmsWrapper = (props: JoinFarmsProps) => {
  const { getShareTokenByAddress } = useAssets()
  const { data: pool } = useXYKPoolWithLiquidity(props.poolId)
  const meta = getShareTokenByAddress(props.poolId)

  if (!pool || !meta) {
    return <JoinFarmsSkeleton />
  }

  return <IsolatedPoolJoinFarms pool={pool} meta={meta} {...props} />
}

const OmnipoolJoinFarms = (
  props: JoinFarmsProps & {
    position: AccountOmnipoolPosition
    farms: Farm[]
  },
) => {
  const { position, farms, onSubmitted } = props
  const data = useJoinOmnipoolFarms({
    position,
    farms,
    onSubmitted,
  })

  if (!data) return <JoinFarmsSkeleton />

  return <JoinFarmsForm {...props} {...data} />
}

const IsolatedPoolJoinFarms = ({
  pool,
  meta,
  ...props
}: JoinFarmsProps & { pool: XYKPoolWithLiquidity; meta: TShareToken }) => {
  const data = useJoinIsolatedPoolFarms({ props, pool, meta })

  if (!data) return <JoinFarmsSkeleton />

  return <JoinFarmsForm {...props} {...data} />
}

const JoinFarmsForm = ({
  onSubmit,
  closable,
  onBack,
  availableFarms,
  meta,
  formValues,
  isEditable,
  displayValue,
}: JoinFarmsProps & {
  availableFarms: Farm[]
  onSubmit: (amount: string) => void
  meta: TAssetData | XYKPoolMeta
  formValues: TJoinFarmsForm
  isEditable?: boolean
  displayValue?: string
}) => {
  const { t } = useTranslation(["liquidity", "common"])

  const {
    control,
    formState: { isValid },
    handleSubmit,
    trigger,
  } = useJoinFarmsForm(formValues)

  useEffect(() => {
    trigger("amount")
  }, [trigger])

  return (
    <>
      <ModalHeader title={t("joinFarms")} closable={closable} onBack={onBack} />
      <ModalBody>
        <AvailableFarms farms={availableFarms} />
        <form
          autoComplete="off"
          onSubmit={handleSubmit((data) => onSubmit(data.amount))}
        >
          <ModalContentDivider sx={{ mt: "xxl" }} />

          <Flex direction="column" gap="base" py="l">
            {!isEditable && (
              <Text
                fs="p3"
                fw={500}
                font="primary"
                color={getToken("text.high")}
              >
                {t("liquidity.joinFarms.modal.currentPositionValue")}
              </Text>
            )}

            <Controller
              name="amount"
              control={control}
              render={({
                field: { value, onChange },
                fieldState: { error },
              }) =>
                isEditable ? (
                  <Box py={0} pb="l" width="100%">
                    <AssetSelect
                      assets={[]}
                      selectedAsset={meta}
                      balance={{ value: formValues.amount }}
                      value={value}
                      onChange={onChange}
                      amountError={error?.message}
                      displayValue={null}
                    />
                  </Box>
                ) : (
                  <Flex direction="column">
                    <Flex align="center" justify="space-between" gap="base">
                      <Text
                        color={getToken("text.medium")}
                        fs="p5"
                        fw={400}
                        width={220}
                      >
                        {t("liquidity.joinFarms.modal.description")}
                      </Text>
                      <Amount
                        value={t("common:currency", {
                          value: value,
                          symbol: meta.symbol,
                        })}
                        displayValue={
                          displayValue
                            ? t("common:currency", {
                                value: displayValue,
                              })
                            : undefined
                        }
                        variant="horizontalLabel"
                        size="large"
                      />
                    </Flex>
                    {error && (
                      <Text
                        fs="p5"
                        font="secondary"
                        color={getToken("accents.danger.secondary")}
                        pt="s"
                      >
                        {error.message}
                      </Text>
                    )}
                  </Flex>
                )
              }
            />
          </Flex>

          <ModalContentDivider />

          <Button
            type="submit"
            size="large"
            width="100%"
            mt="xxl"
            disabled={!isValid}
          >
            {t("liquidity.joinFarms.modal.submit.btn", {
              count: availableFarms.length,
            })}
          </Button>
        </form>
      </ModalBody>
    </>
  )
}
