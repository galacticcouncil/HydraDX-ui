import { Modal } from "components/Modal/Modal"
import { useTranslation } from "react-i18next"
import { RemoveLiquidityForm } from "./RemoveLiquidityForm"
import { RemoveLiquidityModal as RemoveStablepoolLiquidityModal } from "sections/pools/stablepool/removeLiquidity/RemoveLiquidityModal"
import { TPoolFullData, isXYKPoolType } from "sections/pools/PoolsPage.utils"
import { TXYKPool } from "sections/pools/PoolsPage.utils"
import { RemoveXYKLiquidityForm } from "./RemoveXYKLiquidityForm"
import { TLPData } from "utils/omnipool"

type RemoveLiquidityProps = {
  isOpen: boolean
  onClose: () => void
  position?: TLPData | TLPData[]
  onSuccess: () => void
  pool: TPoolFullData | TXYKPool
}

export const RemoveLiquidity = ({
  isOpen,
  onClose,
  position,
  pool,
  onSuccess,
}: RemoveLiquidityProps) => {
  const { t } = useTranslation()

  const isXyk = isXYKPoolType(pool)
  const isStablepool = pool.meta.isStableSwap

  if (isStablepool && !isXyk) {
    return (
      <RemoveStablepoolLiquidityModal
        isOpen={isOpen}
        pool={pool}
        onClose={onClose}
        onSuccess={onSuccess}
        position={Array.isArray(position) ? position[0] : position}
      />
    )
  }

  return (
    <Modal
      open={isOpen}
      disableCloseOutside={true}
      title={t("liquidity.remove.modal.title")}
      onClose={onClose}
    >
      {isXyk ? (
        <RemoveXYKLiquidityForm
          onClose={onClose}
          onSuccess={onSuccess}
          pool={pool}
        />
      ) : position ? (
        <RemoveLiquidityForm
          onClose={onClose}
          position={position}
          onSuccess={onSuccess}
        />
      ) : null}
    </Modal>
  )
}
