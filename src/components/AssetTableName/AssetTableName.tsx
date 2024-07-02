import { useTranslation } from "react-i18next"
import { AssetLogo } from "components/AssetIcon/AssetIcon"
import { Text } from "components/Typography/Text/Text"
import { MultipleIcons } from "components/MultipleIcons/MultipleIcons"
import { useRpcProvider } from "providers/rpcProvider"
import { Icon } from "components/Icon/Icon"
import { useExternalTokenMeta } from "sections/wallet/addToken/AddToken.utils"
import { useShareTokenById } from "api/xyk"

export const AssetTableName = ({
  large,
  isPaymentFee,
  id,
}: {
  large?: boolean
  isPaymentFee?: boolean
  id: string
}) => {
  const { t } = useTranslation()
  const { assets } = useRpcProvider()

  const asset = assets.getAsset(id)

  const externalAsset = useExternalTokenMeta(id)
  const shareToken = useShareTokenById(id).data

  const iconIds = externalAsset?.id ?? shareToken?.meta.iconId ?? asset.iconId

  return (
    <div sx={{ width: ["max-content", "inherit"] }}>
      <div
        sx={{ flex: "row", gap: 8, align: "center", width: "fit-content" }}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
      >
        {typeof iconIds === "string" ? (
          <Icon
            size={[large ? 28 : 26, 26]}
            icon={<AssetLogo id={iconIds} />}
          />
        ) : (
          <MultipleIcons
            icons={iconIds.map((asset) => {
              const meta = assets.getAsset(asset)
              const isBond = assets.isBond(meta)
              const id = isBond ? meta.assetId : asset
              return {
                icon: (
                  <Icon
                    size={[large ? 28 : 26, 26]}
                    icon={<AssetLogo key={id} id={id} />}
                  />
                ),
              }
            })}
          />
        )}

        <div sx={{ flex: "column", width: "100%", gap: [0, 2] }}>
          <Text
            fs={large ? 18 : 14}
            lh={large ? 16 : 14}
            font="GeistMedium"
            color="white"
          >
            {externalAsset?.symbol ?? asset.symbol}
          </Text>
          <Text
            fs={large ? 14 : 12}
            lh={large ? 17 : 12}
            sx={{ display: !large ? ["none", "block"] : undefined }}
            color="whiteish500"
          >
            {asset.name}
          </Text>
        </div>
      </div>
      {isPaymentFee && (
        <Text
          fs={10}
          sx={{
            mt: 4,
            ml: large ? 30 : [32, 34],
          }}
          color="brightBlue300"
          tTransform="uppercase"
        >
          {t("wallet.assets.table.details.feePaymentAsset")}
        </Text>
      )}
    </div>
  )
}
