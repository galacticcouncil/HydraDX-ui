import { useExternalTokensRugCheck } from "api/externalAssetRegistry"
import { Modal } from "components/Modal/Modal"
import { ModalContents } from "components/Modal/contents/ModalContents"
import { useTranslation } from "react-i18next"
import { AddTokenFormModal } from "sections/wallet/addToken/modal/AddTokenFormModal"

type Props = {
  open: boolean
  assetId: string
  onClose: () => void
}

export const ExternalAssetUpdateModal: React.FC<Props> = ({
  open,
  assetId,
  onClose,
}) => {
  const { t } = useTranslation()

  const rugCheck = useExternalTokensRugCheck()

  const asset = rugCheck.tokensMap.get(assetId)?.externalToken

  if (!asset) return null

  return (
    <Modal open={open} disableCloseOutside={true} onClose={onClose}>
      <ModalContents
        onClose={onClose}
        contents={[
          {
            title: t("wallet.assets.table.updateToken"),
            headerVariant: "GeistMono",
            content: <AddTokenFormModal asset={asset} onClose={onClose} />,
          },
        ]}
      />
    </Modal>
  )
}
