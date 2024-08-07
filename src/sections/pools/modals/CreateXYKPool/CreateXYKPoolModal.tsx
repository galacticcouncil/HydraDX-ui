import { Modal } from "components/Modal/Modal"
import { useModalPagination } from "components/Modal/Modal.utils"
import { ModalContents } from "components/Modal/contents/ModalContents"
import { useTranslation } from "react-i18next"
import { CreateXYKPool } from "sections/pools/modals/CreateXYKPool/CreateXYKPool"

type CreateXYKPoolProps = {
  isOpen: boolean
  onClose: () => void
}

enum ModalPage {
  FORM,
  ASSET_A_SELECT,
  ASSET_B_SELECT,
}

export const CreateXYKPoolModal = ({ isOpen, onClose }: CreateXYKPoolProps) => {
  const { t } = useTranslation()

  const { page, direction, paginateTo } = useModalPagination()
  const back = () => paginateTo(ModalPage.FORM)
  const onAssetAOpen = () => paginateTo(ModalPage.ASSET_A_SELECT)
  const onAssetBOpen = () => paginateTo(ModalPage.ASSET_B_SELECT)

  return (
    <CreateXYKPool
      onAssetAOpen={onAssetAOpen}
      onAssetBOpen={onAssetBOpen}
      onAssetSelectClose={back}
      onTxClose={onClose}
    >
      {({ form, assetsA, assetsB }) => (
        <Modal open={isOpen} disableCloseOutside={true} onClose={onClose}>
          <ModalContents
            disableAnimation
            page={page}
            direction={direction}
            onClose={onClose}
            onBack={back}
            contents={[
              {
                title: t("liquidity.pool.xyk.create"),
                content: form,
              },
              {
                title: t("selectAsset.title"),
                content: assetsA,
                noPadding: true,
                headerVariant: "GeistMono",
              },
              {
                title: t("selectAsset.title"),
                content: assetsB,
                noPadding: true,
                headerVariant: "GeistMono",
              },
            ]}
          />
        </Modal>
      )}
    </CreateXYKPool>
  )
}
