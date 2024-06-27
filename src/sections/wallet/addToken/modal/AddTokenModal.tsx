import { useState } from "react"
import { Modal } from "components/Modal/Modal"
import { useModalPagination } from "components/Modal/Modal.utils"
import { ModalContents } from "components/Modal/contents/ModalContents"
import { useTranslation } from "react-i18next"
import {
  SELECTABLE_PARACHAINS_IDS,
  TExternalAsset,
} from "sections/wallet/addToken/AddToken.utils"
import { AddTokenFormModal } from "sections/wallet/addToken/modal/AddTokenFormModal"
import { AddTokenListModal } from "sections/wallet/addToken/modal/AddTokenListModal"

enum ModalPage {
  List,
  Form,
}

const DEFAULT_PARACHAIN_ID = SELECTABLE_PARACHAINS_IDS[0]

export const AddTokenModal = ({
  onClose,
  className,
}: {
  onClose: () => void
  className?: string
}) => {
  const { t } = useTranslation()
  const [selectedAsset, selectedAssetSet] = useState<
    TExternalAsset | undefined
  >()
  const [search, setSearch] = useState("")
  const [parachainId, setParachainId] = useState(DEFAULT_PARACHAIN_ID)

  const { page, direction, paginateTo } = useModalPagination(ModalPage.List)

  if (selectedAsset && page !== 1) paginateTo(ModalPage.Form)
  if (!selectedAsset && page !== 0) paginateTo(ModalPage.List)

  return (
    <Modal open disableCloseOutside onClose={onClose} className={className}>
      <ModalContents
        onClose={onClose}
        page={page}
        direction={direction}
        onBack={() => selectedAssetSet(undefined)}
        contents={[
          {
            title: t("wallet.addToken.header.addCustom"),
            headerVariant: "GeistMono",
            noPadding: true,
            content: (
              <AddTokenListModal
                onCustomAssetClick={() => paginateTo(ModalPage.Form)}
                onAssetSelect={(asset) => selectedAssetSet(asset)}
                search={search}
                setSearch={setSearch}
                parachainId={parachainId}
                setParachainId={setParachainId}
              />
            ),
          },
          {
            title: t("wallet.addToken.header.addCustom"),
            headerVariant: "GeistMono",
            content: selectedAsset && (
              <AddTokenFormModal asset={selectedAsset} onClose={onClose} />
            ),
          },
        ]}
      />
    </Modal>
  )
}
