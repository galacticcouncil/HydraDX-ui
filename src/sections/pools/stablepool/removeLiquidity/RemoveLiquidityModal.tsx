import { TPoolFullData } from "sections/pools/PoolsPage.utils"
import { useTranslation } from "react-i18next"
import { useModalPagination } from "components/Modal/Modal.utils"
import { useState } from "react"
import { Modal } from "components/Modal/Modal"
import { Stepper } from "components/Stepper/Stepper"
import { ModalContents } from "components/Modal/contents/ModalContents"
import { RemoveLiquidityForm } from "sections/pools/modals/RemoveLiquidity/RemoveLiquidityForm"
import { RemoveStablepoolLiquidityForm } from "./RemoveLiquidityForm"
import { AssetsModalContent } from "sections/assets/AssetsModal"
import { RemoveOption, RemoveOptions } from "./RemoveOptions"
import { Button } from "components/Button/Button"
import { BN_0 } from "utils/constants"
import BigNumber from "bignumber.js"
import { Text } from "components/Typography/Text/Text"
import { useTokenBalance } from "api/balances"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { useRpcProvider } from "providers/rpcProvider"
import { TStableSwap } from "api/assetDetails"
import { Spinner } from "components/Spinner/Spinner"
import { TLPData } from "utils/omnipool"

enum RemoveStablepoolLiquidityPage {
  OPTIONS,
  REMOVE_FROM_OMNIPOOL,
  WAIT,
  REMOVE_FROM_STABLEPOOL,
  ASSETS,
}

type RemoveStableSwapAssetProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  pool: TPoolFullData
  position?: TLPData | TLPData[]
}

export const RemoveLiquidityModal = ({
  isOpen,
  onClose,
  onSuccess,
  pool,
  position,
}: RemoveStableSwapAssetProps) => {
  const { assets } = useRpcProvider()
  const id = pool.id
  const stableSwapMeta = assets.getAsset(id) as TStableSwap

  const isRemovingOmnipoolPosition = !!position

  const { account } = useAccount()
  const stablepoolPosition = useTokenBalance(id, account?.address)
  const stablepoolPositionAmount = stablepoolPosition?.data?.freeBalance ?? BN_0

  const { t } = useTranslation()
  const { page, direction, paginateTo } = useModalPagination(
    isRemovingOmnipoolPosition
      ? RemoveStablepoolLiquidityPage.OPTIONS
      : RemoveStablepoolLiquidityPage.REMOVE_FROM_STABLEPOOL,
  )

  const [assetId, setAssetId] = useState<string | undefined>(
    stableSwapMeta.assets[0],
  )
  const [selectedOption, setSelectedOption] = useState<RemoveOption>("SHARES")
  const [sharesAmount, setSharesAmount] = useState<string>()
  const [removeAll, setRemoveAll] = useState(false)

  const handleBack = () => {
    if (page === RemoveStablepoolLiquidityPage.ASSETS) {
      return paginateTo(RemoveStablepoolLiquidityPage.REMOVE_FROM_STABLEPOOL)
    }

    if (page === RemoveStablepoolLiquidityPage.REMOVE_FROM_STABLEPOOL) {
      return paginateTo(RemoveStablepoolLiquidityPage.REMOVE_FROM_OMNIPOOL)
    }

    paginateTo(page - 1)
  }

  const steps = [
    t("liquidity.stablepool.remove.options"),
    t("liquidity.stablepool.remove.omnipool"),
    t("liquidity.stablepool.remove.removing"),
    t("liquidity.stablepool.remove.stablepool"),
  ]

  const getStepState = (stepPage: RemoveStablepoolLiquidityPage) => {
    if (stepPage === page) {
      return "active" as const
    }

    return page > stepPage ? ("done" as const) : ("todo" as const)
  }

  const canGoBack =
    isRemovingOmnipoolPosition || page === RemoveStablepoolLiquidityPage.ASSETS

  if (!assetId || !pool.stablepoolFee || !stableSwapMeta.assets.length)
    return null

  return (
    <Modal
      open={isOpen}
      disableCloseOutside={true}
      onClose={onClose}
      topContent={
        page && selectedOption === "STABLE" ? (
          <Stepper
            sx={{ px: [10] }}
            width={420}
            steps={steps.map((step, idx) => ({
              label: step,
              state: getStepState(idx),
            }))}
          />
        ) : null
      }
    >
      <ModalContents
        direction={direction}
        onClose={() => {
          onClose()
          onSuccess()
        }}
        page={page}
        onBack={canGoBack ? handleBack : undefined}
        contents={[
          {
            title: t("liquidity.remove.modal.title"),
            headerVariant: "gradient",
            content: (
              <>
                <RemoveOptions
                  selected={selectedOption}
                  onSelect={setSelectedOption}
                />
                <Button
                  variant="primary"
                  sx={{ mt: 21 }}
                  onClick={() =>
                    paginateTo(
                      RemoveStablepoolLiquidityPage.REMOVE_FROM_OMNIPOOL,
                    )
                  }
                >
                  {t("next")}
                </Button>
              </>
            ),
          },
          {
            title: t("liquidity.remove.modal.title"),
            headerVariant: "gradient",
            content: position && (
              <RemoveLiquidityForm
                onClose={() => {
                  if (selectedOption === "STABLE") {
                    return
                  }
                  onSuccess()
                  onClose()
                }}
                position={position}
                onSubmitted={(shares) => {
                  if (selectedOption === "STABLE") {
                    if (stablepoolPositionAmount.isZero()) {
                      setRemoveAll(true)
                      setSharesAmount(shares)
                    } else {
                      setSharesAmount(shares)
                    }

                    paginateTo(RemoveStablepoolLiquidityPage.WAIT)
                  }
                }}
                onSuccess={() => {
                  if (selectedOption === "STABLE") {
                    stablepoolPosition.refetch()
                    paginateTo(
                      RemoveStablepoolLiquidityPage.REMOVE_FROM_STABLEPOOL,
                    )
                  } else {
                    onSuccess()
                  }
                }}
              />
            ),
          },
          {
            title: t("liquidity.stablepool.remove.removing"),
            headerVariant: "gradient",
            content: (
              <div
                sx={{
                  flex: "column",
                  gap: 50,
                  align: "center",
                  justify: "center",
                  height: 240,
                }}
              >
                <Spinner size={50} />
                <Text color="whiteish500">
                  {t("liquidity.stablepool.remove.removing")}
                </Text>
              </div>
            ),
          },
          {
            title: t("liquidity.remove.modal.title"),
            headerVariant: "gradient",
            content: (
              <RemoveStablepoolLiquidityForm
                defaultValue={isRemovingOmnipoolPosition ? 100 : 25}
                assetId={assetId}
                onClose={onClose}
                position={{
                  reserves: pool.reserves,
                  fee: pool.stablepoolFee,
                  poolId: pool.id,
                  amount:
                    isRemovingOmnipoolPosition && !removeAll
                      ? BigNumber(sharesAmount ?? 0)
                      : stablepoolPositionAmount,
                }}
                onSuccess={() => {
                  onSuccess()
                  stablepoolPosition.refetch()
                }}
                onAssetOpen={() =>
                  paginateTo(RemoveStablepoolLiquidityPage.ASSETS)
                }
              />
            ),
          },
          {
            title: t("selectAsset.title"),
            headerVariant: "gradient",
            content: (
              <AssetsModalContent
                allAssets={true}
                hideInactiveAssets={true}
                allowedAssets={stableSwapMeta.assets.map((asset) => asset)}
                onSelect={(asset) => {
                  setAssetId(asset.id)
                  handleBack()
                }}
              />
            ),
          },
        ]}
      />
    </Modal>
  )
}
