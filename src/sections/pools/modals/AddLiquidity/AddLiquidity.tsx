import { Modal } from "components/Modal/Modal"
import { useModalPagination } from "components/Modal/Modal.utils"
import { ModalContents } from "components/Modal/contents/ModalContents"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { AssetsModalContent } from "sections/assets/AssetsModal"
import { AddLiquidityForm } from "./AddLiquidityForm"
import { TPool, TXYKPool, isXYKPoolType } from "sections/pools/PoolsPage.utils"
import { AddLiquidityFormXYK } from "./AddLiquidityFormXYK"
import { Farm } from "api/farms"
import { getStepState, LoadgingPage, Stepper } from "components/Stepper/Stepper"
import { useRpcProvider } from "providers/rpcProvider"
import { ISubmittableResult } from "@polkadot/types/types"
import { useJoinFarms } from "utils/farms/deposit"

export enum Page {
  ADD_LIQUIDITY,
  ASSET_SELECTOR,
  WAIT,
}

type Props = {
  pool: TPool | TXYKPool
  isOpen: boolean
  onClose: () => void
  farms: Farm[]
}

export const AddLiquidity = ({ pool, isOpen, onClose, farms }: Props) => {
  const { api } = useRpcProvider()
  const { t } = useTranslation()
  const { page, direction, back, paginateTo } = useModalPagination()

  const [assetId, setAssetId] = useState<string>(pool.id)
  const [currentStep, setCurrentStep] = useState(0)

  const isXYK = isXYKPoolType(pool)
  const isFarms = farms.length

  const joinFarms = useJoinFarms({
    poolId: pool.id,
    farms,
    deposit: {
      onClose,
      disableAutoClose: farms.length > 1,
      onSuccess: () => {
        setCurrentStep(2)
      },
    },
    redeposit: {
      onClose,
    },
  })

  const onSuccess = async (result: ISubmittableResult, value: string) => {
    if (isFarms) {
      setCurrentStep(1)

      for (const record of result.events) {
        if (api.events.omnipool.PositionCreated.is(record.event)) {
          const positionId = record.event.data.positionId.toString()
          joinFarms({ positionId, value })
        }
      }
    }
  }

  const onXykSuccess = async (result: ISubmittableResult) => {
    if (isFarms) {
      setCurrentStep(1)

      for (const record of result.events) {
        if (api.events.tokens.Deposited.is(record.event)) {
          if (record.event.data.currencyId.toString() === pool.id) {
            const shares = record.event.data.amount.toString()
            joinFarms({ shares })
          }
        }
      }
    }
  }

  const steps = [
    {
      id: 0,
      label: t("liquidity.add.modal.provideLiquidity"),
      loadingLabel: t("liquidity.add.modal.provideLiquidity.loading"),
    },
    {
      id: 1,
      label: t("farms.modal.join.first"),
      loadingLabel: t("farms.modal.join.first.loading"),
    },
    ...(farms.length > 1
      ? [
          {
            id: 2,
            label: t("farms.modal.join.rest"),
            loadingLabel: t("farms.modal.join.rest.loading"),
          },
        ]
      : []),
  ]

  return (
    <Modal
      open={isOpen}
      disableCloseOutside
      onClose={onClose}
      topContent={
        isFarms ? (
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
        disableAnimation
        page={page}
        direction={direction}
        onClose={onClose}
        contents={[
          {
            title: t("liquidity.add.modal.title"),
            content: isXYK ? (
              <AddLiquidityFormXYK
                pool={pool}
                onClose={onClose}
                farms={farms}
                onSuccess={onXykSuccess}
                onSubmitted={() => paginateTo(Page.WAIT)}
              />
            ) : (
              <AddLiquidityForm
                assetId={assetId}
                onClose={onClose}
                onAssetOpen={() => paginateTo(Page.ASSET_SELECTOR)}
                farms={farms}
                onSubmitted={() => paginateTo(Page.WAIT)}
                onSuccess={onSuccess}
              />
            ),
          },
          {
            title: t("selectAsset.title"),
            noPadding: true,
            headerVariant: "GeistMono",
            content: (
              <AssetsModalContent
                defaultSelectedAsssetId={pool.id}
                onSelect={(asset) => {
                  setAssetId(asset.id)
                  back()
                }}
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
