import { useGetXYKPools } from "api/xyk"
import { Modal } from "components/Modal/Modal"
import { useModalPagination } from "components/Modal/Modal.utils"
import { ModalContents } from "components/Modal/contents/ModalContents"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { AssetsModalContent } from "sections/assets/AssetsModal"
import { CreateXYKPoolForm } from "./CreateXYKPoolForm"
import {
  createPoolExclusivityMap,
  filterIdsByExclusivity,
  useAllowedXYKPoolAssets,
} from "./CreateXYKPoolForm.utils"

type CreateXYKPoolProps = {
  isOpen: boolean
  onClose: () => void
}

enum ModalPage {
  FORM,
  ASSET_A_SELECT,
  ASSET_B_SELECT,
}

export const CreateXYKPool = ({ isOpen, onClose }: CreateXYKPoolProps) => {
  const { t } = useTranslation()

  const { data: xykPools } = useGetXYKPools()

  const allowedAssets = useAllowedXYKPoolAssets()
  const allowedAssetIds = allowedAssets.map(({ id }) => id)

  const { page, direction, paginateTo } = useModalPagination()
  const back = () => paginateTo(ModalPage.FORM)
  const onAssetASelect = () => paginateTo(ModalPage.ASSET_A_SELECT)
  const onAssetBSelect = () => paginateTo(ModalPage.ASSET_B_SELECT)

  const poolExclusivityMap = useMemo(
    () => createPoolExclusivityMap(xykPools?.map(({ assets }) => assets) ?? []),
    [xykPools],
  )

  const [assetA, setAssetA] = useState("")
  const [assetB, setAssetB] = useState("")

  const allowedAssetsA = useMemo(
    () => filterIdsByExclusivity(assetB, allowedAssetIds, poolExclusivityMap),
    [assetB, allowedAssetIds, poolExclusivityMap],
  )

  const allowedAssetsB = useMemo(
    () => filterIdsByExclusivity(assetA, allowedAssetIds, poolExclusivityMap),
    [assetA, allowedAssetIds, poolExclusivityMap],
  )

  return (
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
            content: (
              <CreateXYKPoolForm
                onClose={onClose}
                onAssetAOpen={onAssetASelect}
                onAssetBOpen={onAssetBSelect}
                assetA={assetA}
                assetB={assetB}
              />
            ),
          },
          {
            title: t("selectAsset.title"),
            content: (
              <AssetsModalContent
                allowedAssets={allowedAssetsA}
                allAssets
                withBonds
                withExternal
                hideInactiveAssets
                onSelect={(asset) => {
                  setAssetA(asset.id)
                  back()
                }}
              />
            ),
            noPadding: true,
            headerVariant: "FontOver",
          },
          {
            title: t("selectAsset.title"),
            content: (
              <AssetsModalContent
                allowedAssets={allowedAssetsB}
                allAssets
                withBonds
                withExternal
                hideInactiveAssets
                onSelect={(asset) => {
                  setAssetB(asset.id)
                  back()
                }}
              />
            ),
            noPadding: true,
            headerVariant: "FontOver",
          },
        ]}
      />
    </Modal>
  )
}
