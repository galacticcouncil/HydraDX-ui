import { Modal } from "components/Modal/Modal"
import { ModalContents } from "components/Modal/contents/ModalContents"
import { TransferOptions, Option } from "./TransferOptions"
import { useState } from "react"
import { Button } from "components/Button/Button"
import { useTranslation } from "react-i18next"
import { AddStablepoolLiquidity } from "./AddStablepoolLiquidity"
import { AssetsModalContent } from "sections/assets/AssetsModal"
import { Stepper } from "components/Stepper/Stepper"
import { AddLiquidityForm } from "sections/pools/modals/AddLiquidity/AddLiquidityForm"
import { Text } from "components/Typography/Text/Text"
import { useRpcProvider } from "providers/rpcProvider"
import { useModalPagination } from "components/Modal/Modal.utils"
import { TPoolFullData } from "sections/pools/PoolsPage.utils"
import { BN_0 } from "utils/constants"
import { TStableSwap } from "api/assetDetails"
import { useQueryClient } from "@tanstack/react-query"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { QUERY_KEYS } from "utils/queryKeys"
import { Spinner } from "components/Spinner/Spinner"

export enum Page {
  OPTIONS,
  ADD_LIQUIDITY,
  WAIT,
  MOVE_TO_OMNIPOOL,
  ASSETS,
}

type Props = {
  pool: Omit<
    TPoolFullData,
    "volumeDisplay" | "omnipoolNftPositions" | "miningNftPositions"
  >
  isOpen: boolean
  onClose: () => void
  defaultPage?: Page
}

export const TransferModal = ({
  pool,
  isOpen,
  onClose,
  defaultPage,
}: Props) => {
  const rpcProvider = useRpcProvider()
  const { account } = useAccount()
  const queryClient = useQueryClient()

  const { id: poolId, reserves, stablepoolFee: fee, canAddLiquidity } = pool

  const meta = rpcProvider.assets.getAsset(poolId) as TStableSwap

  const { t } = useTranslation()
  const [assetId, setAssetId] = useState<string | undefined>(meta.assets[0])
  const [sharesAmount, setSharesAmount] = useState<string>()

  const { page, direction, paginateTo } = useModalPagination(
    defaultPage ?? Page.OPTIONS,
  )

  const [selectedOption, setSelectedOption] = useState<Option>(
    canAddLiquidity ? "OMNIPOOL" : "STABLEPOOL",
  )

  const refetchPositions = () => {
    queryClient.refetchQueries(QUERY_KEYS.accountNFTPositions(account?.address))
  }

  const isStablepool = selectedOption === "STABLEPOOL"

  const steps = isStablepool
    ? [
        t("liquidity.stablepool.transfer.select"),
        t("liquidity.stablepool.transfer.provide"),
        t("liquidity.stablepool.transfer.confirm"),
      ]
    : [
        t("liquidity.stablepool.transfer.select"),
        t("liquidity.stablepool.transfer.provide"),
        t("liquidity.stablepool.transfer.adding"),
        t("liquidity.stablepool.transfer.move"),
      ]

  const getStepState = (stepPage: Page) => {
    if (stepPage === page) {
      return "active" as const
    }

    return page > stepPage ? ("done" as const) : ("todo" as const)
  }

  const goBack = () => {
    if (page === Page.ASSETS) {
      return paginateTo(Page.ADD_LIQUIDITY)
    }

    if (page === Page.MOVE_TO_OMNIPOOL) {
      return paginateTo(Page.ADD_LIQUIDITY)
    }

    paginateTo(page - 1)
  }

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      disableCloseOutside={true}
      topContent={
        !defaultPage && ![Page.OPTIONS, Page.ASSETS].includes(page) ? (
          <Stepper
            sx={{ px: [10] }}
            width={420}
            steps={steps.map((step, idx) => ({
              label: step,
              state: getStepState(idx),
            }))}
          />
        ) : undefined
      }
    >
      <ModalContents
        onClose={onClose}
        direction={direction}
        page={page}
        onBack={
          !defaultPage && ![Page.OPTIONS, Page.WAIT].includes(page)
            ? goBack
            : undefined
        }
        contents={[
          {
            title: t("liquidity.stablepool.transfer.options"),
            headerVariant: "gradient",
            content: (
              <>
                <TransferOptions
                  disableOmnipool={!canAddLiquidity}
                  onSelect={setSelectedOption}
                  selected={selectedOption}
                />
                <Button
                  variant="primary"
                  sx={{ mt: 21 }}
                  onClick={() => paginateTo(Page.ADD_LIQUIDITY)}
                >
                  {t("next")}
                </Button>
              </>
            ),
          },
          {
            title: t("liquidity.add.modal.title"),
            headerVariant: "gradient",
            content: (
              <AddStablepoolLiquidity
                isStablepoolOnly={isStablepool}
                poolId={poolId}
                onCancel={onClose}
                onClose={() => {
                  if (isStablepool) {
                    onClose()
                  }
                }}
                onSubmitted={(shares) => {
                  if (isStablepool) {
                    onClose()
                  }

                  setSharesAmount(shares)
                  paginateTo(Page.WAIT)
                }}
                onSuccess={() => {
                  if (isStablepool) {
                    queryClient.invalidateQueries(
                      QUERY_KEYS.tokenBalance(pool.id, account?.address),
                    )
                    return refetchPositions()
                  }

                  paginateTo(Page.MOVE_TO_OMNIPOOL)
                }}
                reserves={reserves}
                onAssetOpen={() => paginateTo(Page.ASSETS)}
                asset={rpcProvider.assets.getAsset(assetId ?? poolId)}
                fee={fee ?? BN_0}
              />
            ),
          },
          {
            title: t("liquidity.stablepool.addToOmnipool"),
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
                  {t("liquidity.stablepool.transfer.adding")}
                </Text>
              </div>
            ),
          },
          {
            title: t("liquidity.stablepool.addToOmnipool"),
            headerVariant: "gradient",
            content: (
              <AddLiquidityForm
                initialAmount={sharesAmount}
                assetId={poolId}
                onClose={onClose}
              />
            ),
          },
          {
            title: t("selectAsset.title"),
            headerVariant: "GeistMono",
            content: (
              <AssetsModalContent
                hideInactiveAssets={true}
                allAssets={true}
                allowedAssets={meta.assets}
                onSelect={(asset) => {
                  setAssetId(asset.id)
                  paginateTo(Page.ADD_LIQUIDITY)
                }}
              />
            ),
          },
        ]}
      />
    </Modal>
  )
}
