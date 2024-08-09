import { Farm } from "api/farms"
import { Modal } from "components/Modal/Modal"
import { useModalPagination } from "components/Modal/Modal.utils"
import { ModalContents } from "components/Modal/contents/ModalContents"
import { Text } from "components/Typography/Text/Text"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { TJoinFarmsInput, useJoinFarms } from "utils/farms/deposit"
import { FarmDetailsCard } from "sections/pools/farms/components/detailsCard/FarmDetailsCard"
import { FarmDetailsModal } from "sections/pools/farms/modals/details/FarmDetailsModal"
import { useBestNumber } from "api/chain"
import { useRpcProvider } from "providers/rpcProvider"
import { TLPData } from "utils/omnipool"
import { TMiningNftPosition } from "sections/pools/PoolsPage.utils"
import { JoinFarmsForm } from "./JoinFarmsForm"
import { getStepState, LoadgingPage, Stepper } from "components/Stepper/Stepper"

type JoinFarmModalProps = {
  onClose: () => void
  poolId: string
  position?: TLPData
  farms: Farm[]
  depositNft?: TMiningNftPosition
}

export enum Page {
  JOIN_FARM,
  FARM_DETAILS,
  WAIT,
}

export const JoinFarmModal = ({
  onClose,
  poolId,
  position,
  farms,
  depositNft,
}: JoinFarmModalProps) => {
  const { t } = useTranslation()
  const { assets } = useRpcProvider()
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null)
  const [currentStep, setCurrentStep] = useState(0)

  const bestNumber = useBestNumber()
  const { page, direction, paginateTo } = useModalPagination()

  const meta = assets.getAsset(poolId)
  const isMultipleFarms = farms.length > 1

  const joinFarms = useJoinFarms({
    poolId,
    farms,
    deposit: {
      onClose,
      disableAutoClose: isMultipleFarms,
      onSuccess: () => setCurrentStep(1),
      onSubmitted: () => (isMultipleFarms ? paginateTo(Page.WAIT) : null),
    },
    redeposit: {
      onClose,
    },
  })

  const onSubmit = (input: TJoinFarmsInput) => {
    joinFarms(input)
  }

  const onBack = () => {
    paginateTo(Page.JOIN_FARM)
    setSelectedFarm(null)
  }

  const currentBlock = bestNumber.data?.relaychainBlockNumber
    .toBigNumber()
    .dividedToIntegerBy(
      selectedFarm?.globalFarm.blocksPerPeriod.toNumber() ?? 1,
    )

  const steps = [
    {
      id: 0,
      label: t("farms.modal.join.first"),
      loadingLabel: t("farms.modal.join.first.loading"),
    },
    ...(isMultipleFarms
      ? [
          {
            id: 1,
            label: t("farms.modal.join.rest"),
            loadingLabel: t("farms.modal.join.rest.loading"),
          },
        ]
      : []),
  ]

  return (
    <Modal
      open
      onClose={onClose}
      disableCloseOutside
      topContent={
        isMultipleFarms ? (
          <Stepper
            steps={steps.map((step) => ({
              label: step.label,
              state: getStepState(step.id, currentStep),
            }))}
          />
        ) : undefined
      }
    >
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
                  {farms.map((farm, i) => (
                    <FarmDetailsCard
                      key={i}
                      poolId={poolId}
                      farm={farm}
                      onSelect={() => {
                        setSelectedFarm(farm)
                        paginateTo(Page.FARM_DETAILS)
                      }}
                    />
                  ))}
                </div>
                <JoinFarmsForm
                  poolId={poolId}
                  position={position}
                  farms={farms}
                  depositNft={depositNft}
                  onSubmit={onSubmit}
                />
              </>
            ),
          },
          {
            title: t("farms.modal.details.title"),
            content: selectedFarm && (
              <FarmDetailsModal
                poolId={poolId}
                farm={selectedFarm}
                currentBlock={currentBlock?.toNumber()}
              />
            ),
          },
          {
            title: steps[currentStep].label,
            headerVariant: "gradient",
            content: <LoadgingPage title={steps[currentStep].loadingLabel} />,
          },
        ]}
      />
    </Modal>
  )
}
