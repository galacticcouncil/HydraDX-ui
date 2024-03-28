import { u32 } from "@polkadot/types"
import { TAsset, useAcountAssets } from "api/assetDetails"
import { useTranslation } from "react-i18next"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { Maybe } from "utils/helpers"
import { Text } from "components/Typography/Text/Text"
import {
  SAssetsModalHeader,
  SAssetsModalSearchWrapper,
} from "./AssetsModal.styled"
import { AssetsModalRow } from "./AssetsModalRow"
import { AssetsModalRowSkeleton } from "./AssetsModalRowSkeleton"
import { useRpcProvider } from "providers/rpcProvider"
import BN from "bignumber.js"
import { TBond } from "api/assetDetails"
import { TToken } from "api/assetDetails"
import { Input } from "components/Input/Input"
import { useState } from "react"
import IconSearch from "assets/icons/IconSearch.svg?react"
import { Button } from "components/Button/Button"
import { ModalScrollableContent } from "components/Modal/Modal"

type Props = {
  allowedAssets?: Maybe<u32 | string>[]
  onSelect?: (asset: NonNullable<TAsset>) => void
  hideInactiveAssets?: boolean
  allAssets?: boolean
  withBonds?: boolean
  withExternal?: boolean
  withShareTokens?: boolean
  confirmRequired?: boolean
  defaultSelectedAsssetId?: string
}

type TBalance = ReturnType<typeof useAcountAssets>[number]["balance"]

export const AssetsModalContent = ({
  allowedAssets,
  onSelect,
  hideInactiveAssets,
  allAssets,
  withBonds,
  withShareTokens,
  confirmRequired,
  defaultSelectedAsssetId,
  withExternal,
}: Props) => {
  const { t } = useTranslation()
  const { assets } = useRpcProvider()
  const { account } = useAccount()
  const [search, setSearch] = useState("")
  const [selectedAssetId, setSelectedAssetId] = useState(
    defaultSelectedAsssetId,
  )

  const accountAssets = useAcountAssets(account?.address)

  const getAssetBalances = <T extends TAsset>(assets: T[]) => {
    return assets.reduce<{ asset: T; balance: TBalance }[]>((acc, asset) => {
      const balance = accountAssets.find(
        (accountAsset) => accountAsset.asset.id === asset.id,
      )?.balance ?? {
        accountId: account?.address ?? "",
        id: asset.id,
        balance: BN(0),
        total: BN(0),
        freeBalance: BN(0),
        reservedBalance: BN(0),
      }

      acc.push({ asset, balance })

      return acc
    }, [])
  }

  const tokens = allAssets
    ? getAssetBalances([
        ...assets.tokens,
        ...assets.stableswap,
        ...(withExternal ? assets.external : []),
        ...(withShareTokens ? assets.shareTokens : []),
      ])
    : accountAssets.filter(
        (accountAsset): accountAsset is { balance: TBalance; asset: TToken } =>
          accountAsset.asset.isToken ||
          accountAsset.asset.isStableSwap ||
          (withExternal ? accountAsset.asset.isExternal : false) ||
          (withShareTokens ? accountAsset.asset.isShareToken : false),
      )

  const bonds = allAssets
    ? getAssetBalances(assets.bonds)
    : accountAssets.filter(
        (accountAsset): accountAsset is { balance: TBalance; asset: TBond } =>
          accountAsset.asset.isBond,
      )

  const searchedTokens = tokens.filter((token) =>
    search
      ? token.asset.name?.toLowerCase().includes(search.toLowerCase()) ||
        token.asset.symbol?.toLowerCase().includes(search.toLowerCase())
      : true,
  )

  const searchedBonds = bonds.filter((token) =>
    search
      ? token.asset.name?.toLowerCase().includes(search.toLowerCase()) ||
        token.asset.symbol?.toLowerCase().includes(search.toLowerCase())
      : true,
  )

  const allowedTokens =
    allowedAssets != null
      ? searchedTokens.filter(({ asset }) => allowedAssets.includes(asset.id))
      : searchedTokens

  const allowedBonds =
    allowedAssets != null
      ? searchedBonds.filter(({ asset }) => allowedAssets.includes(asset.id))
      : searchedBonds

  const notAllowedTokens =
    allowedAssets != null
      ? searchedTokens.filter(({ asset }) => !allowedAssets.includes(asset.id))
      : []

  const onSelectHandler = (assetData: TAsset) => {
    if (confirmRequired) {
      setSelectedAssetId(assetData.id)
    } else {
      onSelect?.(assetData)
    }
  }

  const onSelectConfirm = () => {
    const asset = tokens.find((token) => token.asset.id === selectedAssetId)
    if (asset) {
      onSelect?.(asset.asset)
    }
  }

  const getIsAssetSelected = (asset: TAsset) => {
    if (confirmRequired) {
      return asset.id === selectedAssetId
    }
  }

  if (!tokens.length)
    return (
      <>
        <SAssetsModalHeader>
          <Text
            color="basic700"
            fw={500}
            fs={12}
            lh={12}
            tTransform="uppercase"
          >
            {t("selectAssets.asset")}
          </Text>
          <Text
            color="basic700"
            fw={500}
            fs={12}
            lh={12}
            tTransform="uppercase"
          >
            {t("selectAssets.your_balance")}
          </Text>
        </SAssetsModalHeader>
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <AssetsModalRowSkeleton key={n} />
        ))}
      </>
    )

  return (
    <>
      <SAssetsModalSearchWrapper sx={{ p: 12 }}>
        <IconSearch sx={{ mx: [0, 12] }} />
        <Input
          value={search}
          onChange={setSearch}
          name="search"
          label="x"
          placeholder={t("selectAssets.search")}
        />
      </SAssetsModalSearchWrapper>

      <ModalScrollableContent
        sx={{
          maxHeight: ["100%", 600],
          pr: 0,
          width: "100%",
        }}
        content={
          <>
            {!!allowedTokens?.length && (
              <>
                <SAssetsModalHeader>
                  <Text
                    color="basic700"
                    fw={500}
                    fs={12}
                    lh={12}
                    tTransform="uppercase"
                  >
                    {t("selectAssets.asset")}
                  </Text>
                  <Text
                    color="basic700"
                    fw={500}
                    fs={12}
                    lh={12}
                    tTransform="uppercase"
                  >
                    {t("selectAssets.your_balance")}
                  </Text>
                </SAssetsModalHeader>
                {allowedTokens.map(({ balance, asset }) => (
                  <AssetsModalRow
                    balance={balance.balance}
                    key={asset.id}
                    asset={asset}
                    spotPriceId={asset.id}
                    onClick={onSelectHandler}
                    isActive={getIsAssetSelected(asset)}
                  />
                ))}
              </>
            )}
            {withBonds && allowedBonds.length ? (
              <>
                <SAssetsModalHeader>
                  <Text
                    color="basic700"
                    fw={500}
                    fs={12}
                    lh={12}
                    tTransform="uppercase"
                  >
                    {t("bonds")}
                  </Text>
                  <Text
                    color="basic700"
                    fw={500}
                    fs={12}
                    lh={12}
                    tTransform="uppercase"
                  >
                    {t("selectAssets.your_balance")}
                  </Text>
                </SAssetsModalHeader>
                {allowedBonds.map(({ asset, balance }) => (
                  <AssetsModalRow
                    key={asset.id}
                    asset={asset}
                    balance={balance.balance}
                    spotPriceId={!asset.isTradable ? asset.assetId : asset.id}
                    onClick={onSelectHandler}
                    isActive={getIsAssetSelected(asset)}
                  />
                ))}
              </>
            ) : null}
            {!hideInactiveAssets && !!notAllowedTokens?.length && (
              <>
                <SAssetsModalHeader shadowed>
                  <Text
                    color="basic700"
                    fw={500}
                    fs={12}
                    lh={12}
                    tTransform="uppercase"
                  >
                    {t("selectAssets.asset_without_pair")}
                  </Text>
                </SAssetsModalHeader>
                {notAllowedTokens.map(({ balance, asset }) => (
                  <AssetsModalRow
                    balance={balance.balance}
                    key={asset.id}
                    asset={asset}
                    spotPriceId={asset.id}
                    isActive={getIsAssetSelected(asset)}
                  />
                ))}
              </>
            )}
          </>
        }
        footer={
          confirmRequired && (
            <div sx={{ p: 12, mt: "auto" }}>
              <Button
                fullWidth
                variant="primary"
                onClick={onSelectConfirm}
                disabled={defaultSelectedAsssetId === selectedAssetId}
              >
                {t("save")}
              </Button>
            </div>
          )
        }
      />
    </>
  )
}
