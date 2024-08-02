import { u32 } from "@polkadot/types"
import { Farm } from "api/farms"
import { Button } from "components/Button/Button"
import { Modal } from "components/Modal/Modal"
import { useModalPagination } from "components/Modal/Modal.utils"
import { ModalContents } from "components/Modal/contents/ModalContents"
import { Text } from "components/Typography/Text/Text"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { FarmDepositMutationType } from "utils/farms/deposit"
import { FarmDetailsCard } from "sections/pools/farms/components/detailsCard/FarmDetailsCard"
import { FarmDetailsModal } from "sections/pools/farms/modals/details/FarmDetailsModal"
import { SJoinFarmContainer } from "./JoinFarmsModal.styled"
import { useBestNumber } from "api/chain"
import { Alert } from "components/Alert/Alert"
import { Controller, useForm } from "react-hook-form"
import { scaleHuman } from "utils/balance"
import { WalletTransferAssetSelect } from "sections/wallet/transfer/WalletTransferAssetSelect"
import { useZodSchema } from "./JoinFarmsModal.utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { Spacer } from "components/Spacer/Spacer"
import { FormValues } from "utils/helpers"
import { FarmRedepositMutationType } from "utils/farms/redeposit"
import { TLPData } from "utils/omnipool"
import { usePoolData } from "sections/pools/pool/Pool"
import { TDeposit } from "api/deposits"

type JoinFarmModalProps = {
  onClose: () => void
  position?: TLPData
  farms: Farm[]
  mutation: FarmDepositMutationType | FarmRedepositMutationType
  depositNft?: TDeposit
}

export const JoinFarmModal = ({
  onClose,
  position,
  farms,
  mutation,
  depositNft,
}: JoinFarmModalProps) => {
  const { t } = useTranslation()
  const {
    pool: { meta, id: poolId },
  } = usePoolData()

  const [selectedFarmId, setSelectedFarmId] = useState<{
    yieldFarmId: u32
    globalFarmId: u32
  } | null>(null)

  const bestNumber = useBestNumber()
  const shouldValidate =
    !!position?.amount || (meta.isShareToken && !depositNft)

  const zodSchema = useZodSchema({
    id: meta.id,
    farms,
    position,
    enabled: shouldValidate,
  })

  const form = useForm<{ amount: string }>({
    mode: "onChange",
    defaultValues: {
      amount: position
        ? scaleHuman(position.shares, meta.decimals).toString()
        : undefined,
    },
    resolver: zodSchema ? zodResolver(zodSchema) : undefined,
  })

  const selectedFarm = farms.find(
    (farm) =>
      farm.globalFarm.id.eq(selectedFarmId?.globalFarmId) &&
      farm.yieldFarm.id.eq(selectedFarmId?.yieldFarmId),
  )

  const { page, direction, back, next } = useModalPagination()

  const onBack = () => {
    back()
    setSelectedFarmId(null)
  }

  const currentBlock = bestNumber.data?.relaychainBlockNumber
    .toBigNumber()
    .dividedToIntegerBy(
      selectedFarm?.globalFarm.blocksPerPeriod.toNumber() ?? 1,
    )
  const positionValue =
    position?.totalValueShifted ??
    (depositNft ? scaleHuman(depositNft.data.shares, meta.decimals) : undefined)

  const onSubmit = (values: FormValues<typeof form>) => {
    mutation.mutate({
      shares: values.amount,
      value: positionValue?.toString() ?? "",
    })
  }

  const error = form.formState.errors.amount?.message

  return (
    <Modal open onClose={onClose} disableCloseOutside>
      <ModalContents
        onClose={onClose}
        page={page}
        direction={direction}
        onBack={onBack}
        contents={[
          {
            title: t("farms.modal.join.title", {
              assetSymbol: meta.symbol,
            }),
            content: (
              <>
                {!!depositNft && (
                  <Text color="basic400" sx={{ mb: 12 }}>
                    {t("farms.modal.join.description", {
                      assets: meta.symbol,
                    })}
                  </Text>
                )}
                <div sx={{ flex: "column", gap: 8 }}>
                  {farms.map((farm, i) => {
                    return (
                      <FarmDetailsCard
                        key={i}
                        farm={farm}
                        onSelect={() => {
                          setSelectedFarmId({
                            globalFarmId: farm.globalFarm.id,
                            yieldFarmId: farm.yieldFarm.id,
                          })
                          next()
                        }}
                      />
                    )
                  })}
                </div>

                <form onSubmit={form.handleSubmit(onSubmit)} autoComplete="off">
                  <SJoinFarmContainer>
                    {positionValue ? (
                      <div
                        sx={{
                          flex: ["column", "row"],
                          justify: "space-between",
                          p: 30,
                          gap: [4, 120],
                        }}
                      >
                        <div sx={{ flex: "column", gap: 13 }}>
                          <Text>{t("farms.modal.footer.title")}</Text>
                        </div>
                        <Text
                          color="pink600"
                          fs={20}
                          css={{ whiteSpace: "nowrap" }}
                        >
                          {t("value.tokenWithSymbol", {
                            value: positionValue,
                            symbol: meta.symbol,
                          })}
                        </Text>
                      </div>
                    ) : (
                      <>
                        <Spacer size={20} />
                        <Controller
                          name="amount"
                          control={form.control}
                          render={({
                            field: { name, value, onChange },
                            fieldState: { error },
                          }) => (
                            <WalletTransferAssetSelect
                              title={t(
                                "wallet.assets.transfer.asset.label_mob",
                              )}
                              name={name}
                              value={value}
                              onChange={onChange}
                              asset={poolId}
                              error={error?.message}
                            />
                          )}
                        />
                        <Spacer size={20} />
                      </>
                    )}

                    {error && position && (
                      <Alert variant="error" css={{ margin: "20px 0" }}>
                        {error}
                      </Alert>
                    )}

                    <Button
                      fullWidth
                      variant="primary"
                      isLoading={mutation.isLoading}
                      disabled={shouldValidate ? !!error || !zodSchema : false}
                    >
                      {t("farms.modal.join.button.label", {
                        count: farms.length,
                      })}
                    </Button>
                  </SJoinFarmContainer>
                </form>
              </>
            ),
          },
          {
            title: t("farms.modal.details.title"),
            content: selectedFarm && (
              <FarmDetailsModal
                farm={selectedFarm}
                currentBlock={currentBlock?.toNumber()}
              />
            ),
          },
        ]}
      />
    </Modal>
  )
}
