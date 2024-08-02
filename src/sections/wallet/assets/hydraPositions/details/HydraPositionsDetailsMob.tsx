import { DisplayValue } from "components/DisplayValue/DisplayValue"
import { Modal } from "components/Modal/Modal"
import { Separator } from "components/Separator/Separator"
import { Text } from "components/Typography/Text/Text"
import { Trans, useTranslation } from "react-i18next"
import { theme } from "theme"
import { AssetTableName } from "components/AssetTableName/AssetTableName"
import {
  TXYKPosition,
  isXYKPosition,
} from "sections/wallet/assets/hydraPositions/data/WalletAssetsHydraPositionsData.utils"
import { TLPData } from "utils/omnipool"
import { useAssets } from "providers/assets"

type Props = {
  row?: TLPData | TXYKPosition
  onClose: () => void
}

export const HydraPositionsDetailsMob = ({ row, onClose }: Props) => {
  const { t } = useTranslation()

  const { getAsset } = useAssets()

  const meta = row?.assetId ? getAsset(row.assetId) : undefined

  if (!row) return null

  let firstRow
  let secondRow

  if (isXYKPosition(row)) {
    firstRow = (
      <div sx={{ flex: "row", gap: 4 }}>
        <Text fs={16} lh={16} fw={500} color="white">
          {row.balances
            ?.map((balance) =>
              t("value.tokenWithSymbol", {
                value: balance.amount,
                symbol: balance.symbol,
              }),
            )
            .join(" | ")}
        </Text>
      </div>
    )

    secondRow = (
      <div sx={{ flex: "column", gap: 6 }}>
        <Text fs={14} color="whiteish500">
          {t("liquidity.xyk.asset.position.availableShares")}
        </Text>
        <div>
          <Text>
            {t("value.token", {
              value: row.amount,
            })}
          </Text>
        </div>
      </div>
    )
  } else {
    const {
      symbol,
      lrnaShifted,
      amountShifted,
      valueShifted,
      totalValueShifted,
    } = row

    const tKey = lrnaShifted?.gt(0)
      ? "wallet.assets.hydraPositions.data.valueLrna"
      : "wallet.assets.hydraPositions.data.value"

    firstRow = (
      <>
        <Text fs={14} lh={14} fw={500} color="white">
          {t("value.tokenWithSymbol", {
            value: totalValueShifted,
            symbol: meta?.symbol,
          })}
        </Text>

        {lrnaShifted.gt(0) && (
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
                value: valueShifted,
                symbol,
                lrna: lrnaShifted,
                type: "token",
              }}
            >
              <br sx={{ display: ["none", "none"] }} />
            </Trans>
          </Text>
        )}
      </>
    )

    secondRow = (
      <div sx={{ flex: "column", gap: 4 }}>
        <Text fs={14} lh={16} color="whiteish500">
          {t("wallet.assets.hydraPositions.header.providedAmount")}
        </Text>
        <Text fs={14} lh={14} color="white">
          {t("value.tokenWithSymbol", { value: amountShifted, symbol })}
        </Text>
      </div>
    )
  }

  return (
    <Modal open={!!row} isDrawer onClose={onClose} title="">
      <div>
        <div sx={{ pb: 30 }}>
          <AssetTableName {...row} id={row.assetId} large />
        </div>
        <Separator
          css={{ background: `rgba(${theme.rgbColors.alpha0}, 0.06)` }}
        />
        <div
          sx={{
            flex: "column",
            justify: "space-between",
            gap: 12,
            py: 30,
            px: 8,
          }}
        >
          <div sx={{ flex: "column", gap: 4 }}>
            <Text fs={14} lh={16} color="whiteish500">
              {t("wallet.assets.hydraPositions.header.valueUSD")}
            </Text>
            {firstRow}
            <Text
              fs={12}
              lh={14}
              fw={500}
              css={{ color: `rgba(${theme.rgbColors.paleBlue}, 0.6)` }}
            >
              <DisplayValue value={row.valueDisplay} />
            </Text>
          </div>

          <Separator css={{ background: `rgba(158, 167, 186, 0.06)` }} />

          {secondRow}
        </div>
      </div>
    </Modal>
  )
}
