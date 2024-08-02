import { Modal } from "components/Modal/Modal"
import { BondCell, BondTableItem, Config } from "./BondsTable.utils"
import { Text } from "components/Typography/Text/Text"
import { Separator } from "components/Separator/Separator"
import { theme } from "theme"
import { useTranslation } from "react-i18next"
import { formatDate } from "utils/formatting"
import { Button } from "components/Button/Button"
import { useClaimBond } from "sections/trade/sections/bonds/Bonds.utils"
import { useNavigate } from "@tanstack/react-location"
import { LINKS } from "utils/navigation"
import TransferIcon from "assets/icons/TransferIcon.svg?react"
import React from "react"
import { Icon } from "components/Icon/Icon"
import { AssetLogo } from "components/AssetIcon/AssetIcon"
import TradeIcon from "assets/icons/TradeTypeIcon.svg?react"
import SuccessIcon from "assets/icons/SuccessIcon.svg?react"
import { useAssets } from "providers/assets"

export const BondTableMobileDrawer = ({
  data,
  onClose,
  config,
}: {
  data: BondTableItem
  onClose: () => void
  config: Config
}) => {
  const { t } = useTranslation()
  const { getAsset } = useAssets()
  const claim = useClaimBond()
  const navigate = useNavigate()

  if (!data) return null

  const meta = getAsset(data.bondId)
  const { maturity, bondId, balance, isSale, assetIn, events } = data
  const isClaimDisabled =
    !bondId ||
    !balance ||
    claim.isLoading ||
    !maturity ||
    maturity >= new Date().getTime()

  return (
    <Modal
      open={!!data}
      onClose={onClose}
      title={meta?.symbol}
      headerVariant="GeistMono"
    >
      <div sx={{ flex: "column", gap: 24, pt: 24 }}>
        <BondCell bondId={data.bondId} />
        <div sx={{ flex: "row", justify: "space-between" }}>
          <div sx={{ flex: "column", gap: 6 }}>
            <Text fs={12} color="basic500">
              {t("bonds.maturity")}:
            </Text>
            <Text fs={14}>
              {data.maturity
                ? formatDate(new Date(data.maturity), "dd/MM/yyyy")
                : undefined}
            </Text>
          </div>
          <div sx={{ flex: "column", gap: 6 }}>
            <Text fs={12} color="basic500">
              {t("bonds.table.price")}:
            </Text>
            <Text fs={14}>
              {t("value.token", { value: data.averagePrice })}
            </Text>
          </div>
        </div>
        <div
          sx={{
            flex: "row",
            gap: 12,
            p: "12px 20px",
            mx: "-24px",
            flexWrap: "wrap",
          }}
          css={{
            borderTop: `1px solid rgba(${theme.rgbColors.alpha0}, 0.06)`,
            borderBottom: `1px solid rgba(${theme.rgbColors.alpha0}, 0.06)`,
          }}
        >
          <Button
            sx={{ minWidth: 162 }}
            css={{ flex: "1 0 0" }}
            variant="primary"
            disabled={isClaimDisabled}
          >
            {t("bonds.table.claim")}
          </Button>
          {config.showTransfer && (
            <Button
              sx={{ minWidth: 162 }}
              css={{ flex: "1 0 0" }}
              onClick={() =>
                navigate({
                  to: LINKS.bond,
                  search: { assetIn, assetOut: bondId },
                })
              }
              disabled={!isSale}
            >
              {t("bonds.btn")}
            </Button>
          )}
          {config.showTransfer && bondId && (
            <Button
              onClick={() => config.onTransfer(bondId)}
              sx={{ minWidth: 162 }}
              css={{ flex: "1 0 0" }}
            >
              <TransferIcon />
              {t("bonds.table.transfer")}
            </Button>
          )}
        </div>
        <Text>Past Transactions</Text>
        <Separator
          css={{ background: `rgba(${theme.rgbColors.alpha0}, 0.06)` }}
        />
        {events.map((event, index) => (
          <React.Fragment key={`${event.out.assetId}_${index}`}>
            <div sx={{ flex: "column", gap: 8 }}>
              <div sx={{ flex: "row", justify: "space-between" }}>
                <Text fs={11} color="darkBlue300">
                  {t("bonds.transactions.table.date")}
                </Text>
                <Text fs={12} color="basic400">
                  {event.date}
                </Text>
              </div>
              <div sx={{ flex: "row", justify: "space-between" }}>
                <Text fs={11} color="darkBlue300">
                  {t("bonds.transactions.table.price")}
                </Text>
                <Text fs={12} color="basic400">
                  {t("value.token", { value: event.price })}
                </Text>
              </div>
              <div sx={{ flex: "row", justify: "space-between" }}>
                <Text fs={11} color="darkBlue300">
                  {t("bonds.transactions.table.transaction")}
                </Text>
                <div
                  sx={{
                    flex: "row",
                    align: "center",
                    gap: 6,
                    justify: "center",
                  }}
                >
                  <Icon size={14} icon={<AssetLogo id={event.in.assetId} />} />
                  <Text fs={12} color="basic400">
                    {t("value.tokenWithSymbol", {
                      value: event.in.amount,
                      symbol: event.in.symbol,
                    })}
                  </Text>
                  <Icon
                    sx={{ color: "brightBlue600" }}
                    size={12}
                    icon={<TradeIcon />}
                  />
                  <Icon size={14} icon={<AssetLogo id={event.out.assetId} />} />
                  <Text fs={12} color="basic400">
                    {t("value.tokenWithSymbol", {
                      value: event.out.amount,
                      symbol: event.out.symbol,
                    })}
                  </Text>
                </div>
              </div>
              <div sx={{ flex: "row", justify: "space-between" }}>
                <Text fs={11} color="darkBlue300">
                  {t("bonds.transactions.table.status")}
                </Text>
                <div
                  sx={{
                    flex: "row",
                    gap: 4,
                    align: "center",
                    justify: "center",
                  }}
                >
                  <Icon icon={<SuccessIcon />} />
                  <Text fs={12} color="green600">
                    {t("complete")}
                  </Text>
                </div>
              </div>
            </div>
            <Separator
              css={{ background: `rgba(${theme.rgbColors.alpha0}, 0.06)` }}
            />
          </React.Fragment>
        ))}
      </div>
    </Modal>
  )
}
