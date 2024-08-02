import { Modal } from "components/Modal/Modal"
import { useModalPagination } from "components/Modal/Modal.utils"
import { ModalContents } from "components/Modal/contents/ModalContents"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { AssetsModalContent } from "sections/assets/AssetsModal"
import { AddLiquidityForm } from "./AddLiquidityForm"
import { isXYKPoolType } from "sections/pools/PoolsPage.utils"

import { AddLiquidityFormXYK } from "./AddLiquidityFormXYK"
import { usePoolData } from "sections/pools/pool/Pool"

type Props = {
  isOpen: boolean
  onClose: () => void
}

export const AddLiquidity = ({ isOpen, onClose }: Props) => {
  const { pool } = usePoolData()
  const [assetId, setAssetId] = useState<string>(pool.id)
  const { t } = useTranslation()

  const { page, direction, back, next } = useModalPagination()

  const isXYK = isXYKPoolType(pool)

  return (
    <Modal open={isOpen} disableCloseOutside onClose={onClose}>
      <ModalContents
        disableAnimation
        page={page}
        direction={direction}
        onClose={onClose}
        onBack={back}
        contents={[
          {
            title: t("liquidity.add.modal.title"),
            content: isXYK ? (
              <AddLiquidityFormXYK
                pool={pool}
                assetId={assetId}
                onClose={onClose}
                onAssetOpen={next}
              />
            ) : (
              <AddLiquidityForm
                assetId={assetId}
                onClose={onClose}
                onAssetOpen={next}
              />
            ),
          },
          {
            title: t("selectAsset.title"),
            content: (
              <AssetsModalContent
                defaultSelectedAsssetId={pool.id}
                onSelect={(asset) => {
                  setAssetId(asset.id)
                  back()
                }}
              />
            ),
            noPadding: true,
            headerVariant: "GeistMono",
          },
        ]}
      />
    </Modal>
  )
}
