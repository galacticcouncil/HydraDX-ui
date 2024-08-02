import { u32 } from "@polkadot/types"
import { Modal } from "components/Modal/Modal"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Maybe } from "utils/helpers"
import { AssetsModalContent } from "./AssetsModal"
import { TAsset, TBond, useAssets } from "providers/assets"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { useDisplayPrices } from "utils/displayAsset"
import { BN_0 } from "utils/constants"
import BN from "bignumber.js"
import { useAcountAssets } from "api/assetDetails"

interface useAssetsModalProps {
  onSelect?: (asset: NonNullable<TAsset>) => void
  allowedAssets?: Maybe<u32 | string>[]
  title?: string
  hideInactiveAssets?: boolean
  allAssets?: boolean
  confirmRequired?: boolean
  defaultSelectedAsssetId?: string
}

export const useAssetsModal = ({
  onSelect,
  allowedAssets,
  title,
  hideInactiveAssets,
  allAssets,
  confirmRequired,
  defaultSelectedAsssetId,
}: useAssetsModalProps) => {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  const openModal = useCallback(() => {
    setIsOpen(true)
  }, [])

  const handleSelect = useCallback(
    (asset: NonNullable<TAsset>) => {
      setIsOpen(false)
      onSelect?.(asset)
    },
    [onSelect],
  )

  const modal = isOpen ? (
    <Modal
      open={isOpen}
      onClose={() => setIsOpen(false)}
      onBack={() => setIsOpen(false)}
      title={title || t("selectAsset.title")}
      headerVariant="GeistMono"
      noPadding
      disableCloseOutside
    >
      <AssetsModalContent
        onSelect={handleSelect}
        allowedAssets={allowedAssets}
        hideInactiveAssets={hideInactiveAssets}
        allAssets={allAssets}
        confirmRequired={confirmRequired}
        defaultSelectedAsssetId={defaultSelectedAsssetId}
      />
    </Modal>
  ) : null

  return {
    openModal,
    modal,
    isOpen,
  }
}

type TBalance = ReturnType<typeof useAcountAssets>[number]["balance"]

type TAssetSelector = {
  meta: TAsset
  balance: BN
  displayValue: BN
}

const getAssetBalances = (
  assets: TAsset[],
  assetsWithBalance: { meta: TAsset; balance: BN; displayValue: BN }[],
) =>
  assets.map((asset) => {
    const tokenWithBalance = assetsWithBalance.find(
      (token) => token.meta.id === asset.id,
    )

    return {
      meta: asset,
      balance: tokenWithBalance?.balance ?? BN_0,
      displayValue: tokenWithBalance?.displayValue ?? BN_0,
    }
  })

const getValidTokens = (
  assets: TAssetSelector[],
  allowedAssets?: Maybe<u32 | string>[],
  search?: string,
) => {
  return assets.reduce<{
    allowed: TAssetSelector[]
    notAllowed: TAssetSelector[]
  }>(
    (acc, token) => {
      if (
        search &&
        !token.meta.name.toLowerCase().includes(search.toLowerCase()) &&
        !token.meta.symbol.toLowerCase().includes(search.toLowerCase())
      ) {
        return acc
      }

      if (!allowedAssets) {
        return acc
      } else {
        allowedAssets.includes(token.meta.id)
          ? acc.allowed.push(token)
          : acc.notAllowed.push(token)

        return acc
      }
    },

    { allowed: [], notAllowed: [] },
  )
}

export const useAssetsData = ({
  search,
  withExternal,
  withBonds,
  allAssets,
  allowedAssets,
}: {
  search?: string
  withExternal?: boolean
  withBonds?: boolean
  allAssets?: boolean
  allowedAssets?: Maybe<u32 | string>[]
}) => {
  const {
    external,
    stableswap,
    bonds: bondAssets,
    isBond,
    tokens: tokenAssets,
  } = useAssets()
  const { account } = useAccount()
  const accountAssets = useAcountAssets(account?.address)

  const {
    tokensWithBalance,
    bondsWithBalance,
    tokensWithBalanceId,
    bondsWithBalanceId,
  } = useMemo(() => {
    return accountAssets.reduce<{
      tokensWithBalance: { balance: TBalance; asset: TAsset }[]
      tokensWithBalanceId: string[]
      bondsWithBalance: { balance: TBalance; asset: TAsset }[]
      bondsWithBalanceId: string[]
    }>(
      (acc, item) => {
        if (
          item.asset.isToken ||
          item.asset.isStableSwap ||
          (withExternal ? item.asset.isExternal && !!item.asset.name : false)
        ) {
          acc.tokensWithBalance.push(item)
          acc.tokensWithBalanceId.push(item.asset.id)
        } else if (isBond(item.asset)) {
          const meta = item.asset
          acc.bondsWithBalance.push(item)
          acc.bondsWithBalanceId.push(
            !meta.isTradable ? meta.underlyingAssetId : meta.id,
          )
        }

        return acc
      },
      {
        tokensWithBalance: [],
        tokensWithBalanceId: [],
        bondsWithBalance: [],
        bondsWithBalanceId: [],
      },
    )
  }, [accountAssets, isBond, withExternal])

  const spotPrices = useDisplayPrices([
    ...tokensWithBalanceId,
    ...(withBonds ? bondsWithBalanceId : []),
  ])

  const tokens = useMemo(() => {
    if (spotPrices.isInitialLoading) return { allowed: [], notAllowed: [] }

    const tokensData = tokensWithBalance.map(
      ({ asset, balance: { balance } }) => {
        const spotPrice = spotPrices.data?.find(
          (sp) => sp?.tokenIn === asset.id,
        )?.spotPrice

        const displayValue = balance
          .shiftedBy(-asset.decimals)
          .times(spotPrice ?? 1)

        return { meta: asset, balance, displayValue }
      },
    )

    const tokens = allAssets
      ? getAssetBalances(
          [...tokenAssets, ...stableswap, ...(withExternal ? external : [])],
          tokensData,
        )
      : tokensData

    return search || allowedAssets
      ? getValidTokens(tokens, allowedAssets, search)
      : { allowed: tokens, notAllowed: [] }
  }, [
    allAssets,
    allowedAssets,
    tokenAssets,
    external,
    search,
    spotPrices.data,
    spotPrices.isInitialLoading,
    stableswap,
    tokensWithBalance,
    withExternal,
  ])

  const bonds = useMemo(() => {
    if (spotPrices.isInitialLoading) return { allowed: [], notAllowed: [] }
    const bondsData = bondsWithBalance.map(
      ({ asset, balance: { balance } }) => {
        const meta = asset as TBond
        const id = !meta.isTradable ? meta.underlyingAssetId : meta.id
        const spotPrice = spotPrices.data?.find(
          (sp) => sp?.tokenIn === id,
        )?.spotPrice

        const displayValue = balance
          .shiftedBy(-asset.decimals)
          .times(spotPrice ?? 1)
        return { meta: asset, balance, displayValue }
      },
    )
    const bonds = allAssets
      ? getAssetBalances(bondAssets, bondsData)
      : bondsData

    return search || allowedAssets
      ? getValidTokens(bonds, allowedAssets, search)
      : { allowed: bonds, notAllowed: [] }
  }, [
    allAssets,
    allowedAssets,
    bondAssets,
    bondsWithBalance,
    search,
    spotPrices,
  ])

  return { tokens, bonds, isLoading: spotPrices.isInitialLoading }
}
