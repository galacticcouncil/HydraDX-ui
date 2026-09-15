import { HDX_ERC20_ASSET_ID } from "@galacticcouncil/money-market/ui-config"
import {
  AssetLogo as AssetLogoPrimitive,
  AssetLogoDecoration,
  AssetLogoProps as AssetLogoPrimitiveProps,
  MultipleAssetLogoWrapper,
} from "@galacticcouncil/ui/components"
import {
  GDOT_ERC20_ID,
  GETH_ERC20_ID,
  GSOL_ERC20_ID,
} from "@galacticcouncil/utils"
import { useMemo } from "react"

import {
  isBond,
  isErc20AToken,
  isStableSwap,
  TAsset,
  useAssets,
} from "@/providers/assetsProvider"

type LogoMetadata = {
  id: string
  assetSrc: string | undefined
  chainSrc: string | undefined
  alt: string
  decoration: AssetLogoDecoration
}

type AssetLogoProps = Omit<AssetLogoPrimitiveProps, "id"> & {
  id: string | string[]
  isLoading?: boolean
  hideChain?: boolean
}

const ATOKEN_DECOR_BLACKLIST = [
  GDOT_ERC20_ID,
  GETH_ERC20_ID,
  GSOL_ERC20_ID,
  GETH_ERC20_ID,
  HDX_ERC20_ASSET_ID,
]

export const AssetLogo: React.FC<AssetLogoProps> = ({
  id,
  size = "medium",
  className,
  isLoading,
  hideChain = false,
}) => {
  const { getAssetWithFallback } = useAssets()

  const logoMetadata = useMemo(() => {
    if (Array.isArray(id)) {
      return id
        .map((assetId) => getLogoMetadata(assetId, getAssetWithFallback))
        .flat()
    } else {
      return getLogoMetadata(id, getAssetWithFallback)
    }
  }, [getAssetWithFallback, id])

  if (isLoading) {
    return <AssetLogoPrimitive size={size} isLoading />
  }

  if (logoMetadata.length > 1) {
    const isATokenPool = logoMetadata.every(
      (data) => data.decoration === "atoken",
    )
    return (
      <MultipleAssetLogoWrapper
        size={size}
        decoration={isATokenPool ? "atoken" : "none"}
      >
        {logoMetadata.map((data, index) => (
          <AssetLogoPrimitive
            key={`${data.id}-${index}`}
            alt={data.alt}
            src={data.assetSrc}
            chainSrc={hideChain ? undefined : data.chainSrc}
            decoration={data.decoration}
          />
        ))}
      </MultipleAssetLogoWrapper>
    )
  }

  const singleIconMetadata = logoMetadata[0]

  return (
    <AssetLogoPrimitive
      className={className}
      alt={singleIconMetadata?.alt}
      src={singleIconMetadata?.assetSrc}
      chainSrc={hideChain ? undefined : singleIconMetadata?.chainSrc}
      size={size}
      decoration={singleIconMetadata?.decoration}
    />
  )
}

function getLogoMetadata(
  id: string,
  getAsset: (id: string) => TAsset,
): LogoMetadata[] {
  const asset = getAsset(id)
  if (!asset) return []

  if (asset.iconSrc) {
    const isAToken =
      isErc20AToken(asset) && !ATOKEN_DECOR_BLACKLIST.includes(asset.id)
    return [buildMetadata(asset, isAToken)]
  }

  if (isErc20AToken(asset) || isBond(asset) || isStableSwap(asset)) {
    const { underlyingAssetId } = asset
    if (!underlyingAssetId) return []

    const underlying = resolveUnderlyingAsset(asset, getAsset)

    const isAToken =
      isErc20AToken(asset) && !ATOKEN_DECOR_BLACKLIST.includes(asset.id)

    const isATokenPool = isAToken && isStableSwap(underlying)

    const iconId = isATokenPool
      ? underlying.underlyingAssetId
      : underlyingAssetId

    if (!iconId) return []

    if (typeof iconId === "string") {
      return [buildMetadata(underlying, isAToken)]
    }

    return iconId.map((id) => {
      const childAsset = getAsset(id)
      const isAToken =
        isErc20AToken(childAsset) &&
        !ATOKEN_DECOR_BLACKLIST.includes(childAsset.id)
      const underlying = isAToken
        ? getAsset(childAsset.underlyingAssetId)
        : childAsset
      return buildMetadata(underlying, isAToken || isATokenPool)
    })
  }

  return []
}

function buildMetadata(asset: TAsset, isAToken: boolean): LogoMetadata {
  return {
    id: asset.id,
    assetSrc: asset.iconSrc,
    chainSrc: asset.chainSrc,
    alt: asset.symbol,
    decoration: isAToken ? "atoken" : "none",
  }
}

function resolveUnderlyingAsset(
  asset: TAsset,
  getAsset: (id: string) => TAsset,
): TAsset {
  return isErc20AToken(asset) ? getAsset(asset.underlyingAssetId) : asset
}
