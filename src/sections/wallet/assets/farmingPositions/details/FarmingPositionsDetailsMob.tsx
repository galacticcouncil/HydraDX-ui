import { DisplayValue } from "components/DisplayValue/DisplayValue"
import { Modal } from "components/Modal/Modal"
import { Separator } from "components/Separator/Separator"
import { Text } from "components/Typography/Text/Text"
import { Trans, useTranslation } from "react-i18next"
import { theme } from "theme"
import { AssetTableName } from "components/AssetTableName/AssetTableName"
import { SActionButtonsContainer } from "sections/wallet/assets/table/actions/WalletAssetsTable.styled"
import { useRpcProvider } from "providers/rpcProvider"
import { useSpotPrice } from "api/spotPrice"
import { BN_0, BN_1 } from "utils/constants"
import { FarmingPositionsTableData } from "sections/wallet/assets/farmingPositions/WalletFarmingPositions.utils"

type Props = {
  row?: FarmingPositionsTableData
  onClose: () => void
}

export const FarmingPositionsDetailsMob = ({ row, onClose }: Props) => {
  const { t } = useTranslation()

  const { assets } = useRpcProvider()

  const meta = row?.assetId ? assets.getAsset(row.assetId) : undefined

  const lrnaSpotPrice = useSpotPrice(assets.getAsset("1").id, row?.assetId)

  const lrnaPositionPrice =
    row?.position.lrna?.multipliedBy(lrnaSpotPrice.data?.spotPrice ?? BN_1) ??
    BN_0

  if (!row) return null

  const {
    symbol,
    date,
    position: {
      lrna,
      providedAmount: amount,
      providedAmountDisplay,
      value,
      valueDisplay,
    },
  } = row

  const tKey = lrna?.gt(0)
    ? "wallet.assets.hydraPositions.data.valueLrna"
    : "wallet.assets.hydraPositions.data.value"

  return (
    <Modal open={!!row} isDrawer onClose={onClose} title="">
      <div>
        <div sx={{ pb: 30 }}>
          <AssetTableName {...row} id={row.assetId} large />
        </div>
        <Separator
          css={{ background: `rgba(${theme.rgbColors.alpha0}, 0.06)` }}
        />
        <div sx={{ flex: "row", justify: "space-between", py: 30, px: 8 }}>
          <div sx={{ flex: "column", gap: 4 }}>
            <Text fs={14} lh={16} color="whiteish500">
              {t("wallet.assets.hydraPositions.header.valueUSD")}
            </Text>

            <Text fs={14} lh={14} fw={500} color="white">
              {t("value.tokenWithSymbol", {
                value: lrnaPositionPrice.plus(value ?? BN_0),
                symbol: meta?.symbol,
              })}
            </Text>

            {lrnaPositionPrice.gt(0) && (
              <Text
                fs={14}
                lh={14}
                fw={500}
                color="brightBlue300"
                sx={{ flex: "row", align: "center", gap: 1 }}
              >
                <p sx={{ height: "min-content" }}>=</p>
                <Trans
                  i18nKey={tKey}
                  tOptions={{
                    value,
                    symbol,
                    lrna,
                    type: "token",
                  }}
                >
                  <br sx={{ display: ["none", "none"] }} />
                </Trans>
              </Text>
            )}
            <Text
              fs={12}
              lh={14}
              fw={500}
              css={{ color: `rgba(${theme.rgbColors.paleBlue}, 0.6)` }}
            >
              <DisplayValue value={valueDisplay} />
            </Text>
          </div>
        </div>
        <SActionButtonsContainer>
          <div sx={{ flex: "column", gap: 4, py: 20 }}>
            <Text fs={14} lh={16} color="whiteish500">
              {t("wallet.assets.hydraPositions.header.providedAmount")}
            </Text>
            <Text fs={14} lh={14} color="white">
              {t("value.tokenWithSymbol", { value: amount, symbol })}
            </Text>
            <Text fs={12} lh={17} color="whiteish500">
              <DisplayValue value={providedAmountDisplay} />
            </Text>
          </div>

          <Separator css={{ background: `rgba(158, 167, 186, 0.06)` }} />

          <div sx={{ flex: "column", gap: 4, py: 20 }}>
            <Text fs={14} lh={16} color="whiteish500">
              {t("wallet.assets.farmingPositions.header.date")}
            </Text>

            <Text fs={14} lh={14} fw={500} color="white">
              {t("wallet.assets.farmingPositions.data.date", {
                date,
              })}
            </Text>
          </div>
        </SActionButtonsContainer>
      </div>
    </Modal>
  )
}
