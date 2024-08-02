import { u32 } from "@polkadot/types"
import { useTranslation } from "react-i18next"
import { Maybe, sortAssets } from "utils/helpers"
import { Text } from "components/Typography/Text/Text"
import {
  SAssetsModalHeader,
  SAssetsModalSearchWrapper,
} from "./AssetsModal.styled"
import { AssetsModalRow } from "./AssetsModalRow"
import { Input } from "components/Input/Input"
import { useMemo, useState } from "react"
import IconSearch from "assets/icons/IconSearch.svg?react"
import { Button } from "components/Button/Button"
import { ModalScrollableContent } from "components/Modal/Modal"
import { useAssetsData } from "./AssetsModal.utils"
import { AssetsModalRowSkeleton } from "./AssetsModalRowSkeleton"
import { TAsset } from "providers/assets"

type Props = {
  allowedAssets?: Maybe<u32 | string>[]
  onSelect?: (asset: NonNullable<TAsset>) => void
  hideInactiveAssets?: boolean
  allAssets?: boolean
  withBonds?: boolean
  withExternal?: boolean
  confirmRequired?: boolean
  defaultSelectedAsssetId?: string
}

export const AssetsModalContent = ({
  allowedAssets,
  onSelect,
  hideInactiveAssets,
  allAssets,
  withBonds,
  confirmRequired,
  defaultSelectedAsssetId,
  withExternal,
}: Props) => {
  const { t } = useTranslation()
  const [search, setSearch] = useState("")
  const [selectedAssetId, setSelectedAssetId] = useState(
    defaultSelectedAsssetId,
  )

  const { tokens, bonds, isLoading } = useAssetsData({
    search,
    withBonds,
    allAssets,
    withExternal,
    allowedAssets,
  })

  const onSelectHandler = (assetData: TAsset) => {
    if (confirmRequired) {
      setSelectedAssetId(assetData.id)
    } else {
      onSelect?.(assetData)
    }
  }

  const onSelectConfirm = () => {
    const asset = tokens.allowed.find(
      (token) => token.meta.id === selectedAssetId,
    )
    if (asset) {
      onSelect?.(asset.meta)
    }
  }

  const getIsAssetSelected = (asset: TAsset) => {
    if (confirmRequired) {
      return asset.id === selectedAssetId
    }
  }

  const sortedTokens = useMemo(
    () => sortAssets(tokens.allowed, "displayValue", defaultSelectedAsssetId),
    [defaultSelectedAsssetId, tokens.allowed],
  )
  const sortedBonds = useMemo(
    () =>
      [...bonds.allowed].sort((a, b) => {
        return b.displayValue.minus(a.displayValue).toNumber()
      }),
    [bonds.allowed],
  )

  if (isLoading)
    return (
      <>
        <ListHeader
          titles={[t("selectAssets.asset"), t("selectAssets.your_balance")]}
        />
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
            {!!sortedTokens?.length && (
              <>
                <ListHeader
                  titles={[
                    t("selectAssets.asset"),
                    t("selectAssets.your_balance"),
                  ]}
                />
                {sortedTokens.map(({ balance, meta, displayValue }) => (
                  <AssetsModalRow
                    balance={balance}
                    key={meta.id}
                    asset={meta}
                    displaValue={displayValue}
                    onClick={onSelectHandler}
                    isActive={getIsAssetSelected(meta)}
                    isSelected={meta.id === selectedAssetId}
                  />
                ))}
              </>
            )}
            {withBonds && sortedBonds.length ? (
              <>
                <ListHeader
                  titles={[t("bonds"), t("selectAssets.your_balance")]}
                />
                {sortedBonds.map(({ meta, balance, displayValue }) => (
                  <AssetsModalRow
                    key={meta.id}
                    asset={meta}
                    balance={balance}
                    displaValue={displayValue}
                    onClick={onSelectHandler}
                    isActive={getIsAssetSelected(meta)}
                    isSelected={meta.id === selectedAssetId}
                  />
                ))}
              </>
            ) : null}
            {!hideInactiveAssets && !!tokens.notAllowed.length ? (
              <>
                <ListHeader
                  titles={[t("selectAssets.asset_without_pair")]}
                  shadowed
                />
                {tokens.notAllowed.map(({ balance, meta, displayValue }) => (
                  <AssetsModalRow
                    balance={balance}
                    key={meta.id}
                    asset={meta}
                    displaValue={displayValue}
                    isActive={getIsAssetSelected(meta)}
                  />
                ))}
              </>
            ) : null}
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

const ListHeader = ({
  titles,
  shadowed,
}: {
  titles: string[]
  shadowed?: boolean
}) => {
  return (
    <SAssetsModalHeader shadowed={shadowed}>
      {titles.map((title, i) => (
        <Text
          key={i}
          color="basic700"
          fw={500}
          fs={12}
          lh={12}
          tTransform="uppercase"
        >
          {title}
        </Text>
      ))}
    </SAssetsModalHeader>
  )
}
