import { ReactComponent as ChevronDown } from "assets/icons/ChevronDown.svg"
import { ReactComponent as PlusIcon } from "assets/icons/PlusIcon.svg"
import { Button } from "components/Button/Button"
import { Icon } from "components/Icon/Icon"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  SActionsContainer,
  SButtonOpen,
} from "sections/pools/pool/actions/PoolActions.styled"
import { useAccountStore } from "state/store"
import { TransferModal } from "../transfer/TransferModal"
import { AssetMetaById, BalanceByAsset } from "../../PoolsPage.utils"
import { u32 } from "@polkadot/types-codec"
import BigNumber from "bignumber.js"
import { useMedia } from "react-use"
import { theme } from "theme"
import { u8 } from "@polkadot/types"
import { LiquidityPositionButton } from "../positions/LiquidityPositionButton"

type PoolActionsProps = {
  poolId: u32
  assets: {
    id: string
    symbol: string
    decimals: u8 | u32
  }[]
  tradeFee: BigNumber
  balanceByAsset?: BalanceByAsset
  assetMetaById?: AssetMetaById
  className?: string
  onExpandClick: () => void
  isExpanded: boolean
  canExpand?: boolean
  refetchPositions: () => void
  reserves: { asset_id: number; amount: string }[]
  withdrawFee: BigNumber
  amount: BigNumber
}

export const PoolActions = ({
  poolId,
  className,
  balanceByAsset,
  assetMetaById,
  tradeFee,
  onExpandClick,
  isExpanded,
  canExpand,
  refetchPositions,
  assets,
  reserves,
  amount,
  withdrawFee,
}: PoolActionsProps) => {
  const { t } = useTranslation()
  const [openAdd, setOpenAdd] = useState(false)
  const { account } = useAccountStore()
  const isDesktop = useMedia(theme.viewport.gte.sm)

  const actionButtons = (
    <div sx={{ flexGrow: 1 }}>
      <div sx={{ flex: ["row", "column"], gap: 10, flexGrow: 1 }}>
        <Button
          fullWidth
          size="small"
          disabled={!account || account.isExternalWalletConnected}
          onClick={() => setOpenAdd(true)}
        >
          <div sx={{ flex: "row", align: "center", justify: "center" }}>
            <Icon icon={<PlusIcon />} sx={{ mr: 8, height: 16 }} />
            {t("liquidity.asset.actions.addLiquidity")}
          </div>
        </Button>
        {!isDesktop && (
          <LiquidityPositionButton
            poolId={poolId}
            assets={assets}
            reserves={reserves}
            amount={amount}
            withdrawFee={withdrawFee}
            refetchPosition={refetchPositions}
          />
        )}
      </div>
    </div>
  )

  return (
    <>
      <SActionsContainer className={className}>
        {actionButtons}
        {isDesktop && (
          <SButtonOpen
            name="Expand"
            icon={<ChevronDown />}
            isActive={isExpanded}
            onClick={onExpandClick}
            disabled={!account || !canExpand}
          />
        )}
      </SActionsContainer>
      {openAdd && (
        <TransferModal
          poolId={poolId}
          assets={assets}
          tradeFee={tradeFee}
          isOpen={openAdd}
          reserves={reserves}
          onClose={() => setOpenAdd(false)}
          balanceByAsset={balanceByAsset}
          assetMetaById={assetMetaById}
          refetchPositions={refetchPositions}
        />
      )}
    </>
  )
}
