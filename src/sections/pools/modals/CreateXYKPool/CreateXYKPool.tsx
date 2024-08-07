import { useGetXYKPools } from "api/xyk"
import { useMemo, useState } from "react"
import { AssetsModalContent } from "sections/assets/AssetsModal"
import { CreateXYKPoolForm } from "./CreateXYKPoolForm"
import {
  CreateXYKPoolFormData,
  createPoolExclusivityMap,
  filterIdsByExclusivity,
  useAllowedXYKPoolAssets,
  useCreateXYKPool,
  useCreateXYKPoolForm,
} from "./CreateXYKPoolForm.utils"
import { UseFormReturn } from "react-hook-form"
import { TAsset } from "api/assetDetails"

type CreateXYKPoolProps = {
  controlledForm?: UseFormReturn<CreateXYKPoolFormData>
  defaultAssetA?: string
  defaultAssetB?: string
  submitHidden?: boolean
  onTxClose?: () => void
  onAssetAOpen?: () => void
  onAssetBOpen?: () => void
  onAssetASelect?: (asset: TAsset) => void
  onAssetBSelect?: (asset: TAsset) => void
  onAssetSelectClose?: () => void
  children: (props: {
    form: JSX.Element
    assetsA: JSX.Element
    assetsB: JSX.Element
  }) => JSX.Element
}

export const CreateXYKPool = ({
  controlledForm,
  defaultAssetA = "",
  defaultAssetB = "",
  submitHidden,
  onTxClose,
  onAssetAOpen,
  onAssetBOpen,
  onAssetASelect,
  onAssetBSelect,
  onAssetSelectClose,
  children,
}: CreateXYKPoolProps) => {
  const { data: xykPools } = useGetXYKPools()

  const allowedAssets = useAllowedXYKPoolAssets()
  const allowedAssetIds = allowedAssets.map(({ id }) => id)

  const poolExclusivityMap = useMemo(
    () => createPoolExclusivityMap(xykPools?.map(({ assets }) => assets) ?? []),
    [xykPools],
  )

  const [assetA, setAssetA] = useState(defaultAssetA)
  const [assetB, setAssetB] = useState(defaultAssetB)

  const defaultForm = useCreateXYKPoolForm(assetA, assetB)
  const formInstance = controlledForm || defaultForm

  const allowedAssetsA = useMemo(
    () => filterIdsByExclusivity(assetB, allowedAssetIds, poolExclusivityMap),
    [assetB, allowedAssetIds, poolExclusivityMap],
  )

  const allowedAssetsB = useMemo(
    () => filterIdsByExclusivity(assetA, allowedAssetIds, poolExclusivityMap),
    [assetA, allowedAssetIds, poolExclusivityMap],
  )

  const createXykPool = useCreateXYKPool({
    onClose: onTxClose,
    onSubmitted: () => {
      onTxClose?.()
      formInstance.reset()
    },
  })

  const form = (
    <CreateXYKPoolForm
      form={formInstance}
      onSubmit={createXykPool.mutateAsync}
      onAssetAOpen={onAssetAOpen}
      onAssetBOpen={onAssetBOpen}
      submitHidden={submitHidden}
    />
  )

  const assetsA = (
    <AssetsModalContent
      allowedAssets={allowedAssetsA}
      allAssets
      withBonds
      withExternal
      hideInactiveAssets
      onSelect={(asset) => {
        formInstance.setValue("assetAId", asset.id)
        setAssetA(asset.id)
        onAssetASelect?.(asset)
        onAssetSelectClose?.()
      }}
    />
  )

  const assetsB = (
    <AssetsModalContent
      allowedAssets={allowedAssetsB}
      allAssets
      withBonds
      withExternal
      hideInactiveAssets
      onSelect={(asset) => {
        formInstance.setValue("assetBId", asset.id)
        setAssetB(asset.id)
        onAssetBSelect?.(asset)
        onAssetSelectClose?.()
      }}
    />
  )

  return children({
    form,
    assetsA,
    assetsB,
  })
}
