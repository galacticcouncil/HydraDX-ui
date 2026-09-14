import { ArrowDownUp, Repeat } from "@galacticcouncil/ui/assets/icons"
import { Button } from "@galacticcouncil/ui/components"
import { useNavigate } from "@tanstack/react-router"
import { FC } from "react"
import { useTranslation } from "react-i18next"

import { swapTabLink } from "@/config/navigation"
import { SAssetDetailMobileActions } from "@/modules/portfolio/overview/MyAssets/AssetDetailMobileActions.styled"
import {
  canDepositToHydration,
  DepositToHydrationButton,
} from "@/modules/portfolio/overview/MyAssets/DepositToHydrationAction"
import {
  AssetDetailModal,
  MyAsset,
} from "@/modules/portfolio/overview/MyAssets/MyAssetsTable.columns"

type Props = {
  readonly asset: MyAsset
  readonly onModalOpen?: (action: AssetDetailModal) => void
  readonly isReadOnly?: boolean
  readonly showDepositAction?: boolean
}

export const AssetDetailMobileActions: FC<Props> = ({
  asset,
  onModalOpen,
  isReadOnly = false,
  showDepositAction = true,
}) => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  if (isReadOnly) {
    if (!showDepositAction || !canDepositToHydration(asset)) return null

    return (
      <SAssetDetailMobileActions>
        <DepositToHydrationButton asset={asset} />
      </SAssetDetailMobileActions>
    )
  }

  return (
    <SAssetDetailMobileActions>
      <Button size="large" onClick={() => onModalOpen?.("transfer")}>
        <ArrowDownUp />
        {t("send")}
      </Button>
      <Button
        variant="secondary"
        size="large"
        disabled={!asset.isTradable}
        onClick={() =>
          navigate({
            ...swapTabLink("market"),
            search: { assetOut: asset.id },
          })
        }
      >
        <Repeat />
        {t("trade")}
      </Button>
    </SAssetDetailMobileActions>
  )
}
