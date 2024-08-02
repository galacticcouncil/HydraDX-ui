import { Button } from "components/Button/Button"
import { DollarAssetValue } from "components/DollarAssetValue/DollarAssetValue"
import { Text } from "components/Typography/Text/Text"
import { useState } from "react"
import { Trans, useTranslation } from "react-i18next"
import { useEnteredDate } from "utils/block"
import { BN_0 } from "utils/constants"
import { JoinedFarmsDetails } from "sections/pools/farms/modals/joinedFarmDetails/JoinedFarmsDetails"
import { SSeparator, SValueContainer } from "./FarmingPosition.styled"
import {
  isXYKDeposit,
  TDepositData,
  TOmniDepositData,
  TXYKDepositData,
} from "./FarmingPosition.utils"
import { JoinedFarms } from "./joined/JoinedFarms"
import { RedepositFarms } from "./redeposit/RedepositFarms"
import { DisplayValue } from "components/DisplayValue/DisplayValue"
import { LrnaPositionTooltip } from "sections/pools/components/LrnaPositionTooltip"
import { useFarmExitAllMutation } from "utils/farms/exit"
import { TOAST_MESSAGES } from "state/toasts"
import { ToastMessage } from "state/store"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import ExitIcon from "assets/icons/Exit.svg?react"
import { Icon } from "components/Icon/Icon"
import { Farm } from "api/farms"
import { usePoolData } from "sections/pools/pool/Pool"
import { TDeposit } from "api/deposits"

function FarmingPositionDetailsButton(props: {
  depositNft: TDeposit
  depositData: TDepositData
}) {
  const { t } = useTranslation()
  const [farmDetails, setFarmDetails] = useState(false)

  return (
    <>
      <Button
        size="compact"
        onClick={() => setFarmDetails(true)}
        css={{ flex: "1 0 0 " }}
      >
        {t("farms.positions.joinedFarms.button.label")}
      </Button>

      {farmDetails && (
        <JoinedFarmsDetails
          depositNft={props.depositNft}
          depositData={props.depositData}
          isOpen={farmDetails}
          onClose={() => setFarmDetails(false)}
        />
      )}
    </>
  )
}

const ExitFarmsButton = (props: { depositNft: TDeposit }) => {
  const { t } = useTranslation()
  const { pool } = usePoolData()
  const { account } = useAccount()

  const { meta, id: poolId } = pool

  const toast = TOAST_MESSAGES.reduce((memo, type) => {
    const msType = type === "onError" ? "onLoading" : type
    memo[type] = (
      <Trans
        t={t}
        i18nKey={`farms.modal.exit.toast.${msType}`}
        tOptions={{
          amount: props.depositNft.data.shares.toBigNumber(),
          fixedPointScale: meta.decimals,
        }}
      >
        <span />
        <span className="highlight" />
      </Trans>
    )
    return memo
  }, {} as ToastMessage)

  const exit = useFarmExitAllMutation([props.depositNft], poolId, toast)

  return (
    <Button
      size="compact"
      variant="error"
      onClick={() => exit.mutate()}
      isLoading={exit.isLoading}
      disabled={exit.isLoading || account?.isExternalWalletConnected}
      css={{ flex: "1 0 0 " }}
    >
      <Icon icon={<ExitIcon />} />
      {t("farms.positions.exitFarms.button.label")}
    </Button>
  )
}

export const FarmingPosition = ({
  index,
  depositNft,
  availableYieldFarms,
  depositData,
}: {
  index: number
  depositNft: TDeposit
  depositData: TDepositData
  availableYieldFarms: Farm[]
}) => {
  const { t } = useTranslation()

  // use latest entry date
  const enteredDate = useEnteredDate(
    depositNft.data.yieldFarmEntries.reduce(
      (acc, curr) =>
        acc.lt(curr.enteredAt.toBigNumber())
          ? curr.enteredAt.toBigNumber()
          : acc,
      BN_0,
    ),
  )

  return (
    <>
      <div
        sx={{ flex: ["column", "row"], gap: [6, 0], justify: "space-between" }}
      >
        <Text fw={[500, 400]}>
          {t("farms.positions.position.title", { index })}
        </Text>
        <div sx={{ flex: "row", gap: 8 }}>
          <ExitFarmsButton depositNft={depositNft} />
          <FarmingPositionDetailsButton
            depositNft={depositNft}
            depositData={depositData}
          />
        </div>
      </div>

      <div
        sx={{
          flex: "row",
          justify: "space-between",
          align: "center",
          py: [0, 10],
        }}
      >
        <JoinedFarms depositNft={depositNft} />
      </div>
      <SSeparator sx={{ width: "70%", mx: "auto" }} />

      <div
        sx={{
          flex: "column",
          gap: 10,
          py: 10,
        }}
      >
        <SValueContainer>
          <Text color="basic500" fs={14} lh={16}>
            {t("farms.positions.labels.enterDate")}
          </Text>
          <Text fs={14}>
            {t("farms.positions.labels.enterDate.value", {
              date: enteredDate.data,
            })}
          </Text>
        </SValueContainer>
        <SSeparator />
        {isXYKDeposit(depositData) ? (
          <XYKFields depositData={depositData} />
        ) : (
          <OmnipoolFields depositData={depositData} />
        )}
      </div>

      {availableYieldFarms.length ? (
        <RedepositFarms
          depositNft={depositNft}
          availableYieldFarms={availableYieldFarms}
          depositData={depositData}
        />
      ) : null}
    </>
  )
}

const OmnipoolFields = ({ depositData }: { depositData: TOmniDepositData }) => {
  const { t } = useTranslation()

  const { meta, amountShifted, amountDisplay, valueShifted, lrnaShifted } =
    depositData ?? {}

  return (
    <>
      <SValueContainer>
        <Text color="basic500" fs={14} lh={16}>
          {t("farms.positions.labels.initialValue")}
        </Text>
        <div sx={{ flex: "column", align: "flex-end" }}>
          <Text fs={14}>
            {t("value.tokenWithSymbol", {
              value: amountShifted,
              symbol: meta?.symbol,
            })}
          </Text>
          <Text fs={11} css={{ color: "rgba(221, 229, 255, 0.61)" }}>
            <DisplayValue value={amountDisplay} />
          </Text>
        </div>
      </SValueContainer>
      <SSeparator />
      <SValueContainer>
        <div sx={{ flex: "row" }}>
          <Text color="basic500" fs={14} lh={16}>
            {t("farms.positions.labels.currentValue")}
          </Text>
          <LrnaPositionTooltip
            assetId={meta?.id}
            tokenPosition={valueShifted}
            lrnaPosition={lrnaShifted}
          />
        </div>

        <div sx={{ flex: "column", align: "flex-end" }}>
          <Text fs={14}>
            {t("value.tokenWithSymbol", {
              value: depositData.totalValueShifted,
              symbol: meta?.symbol,
            })}
          </Text>
          <DollarAssetValue
            value={depositData.valueDisplay}
            wrapper={(children) => (
              <Text fs={11} lh={12} color="whiteish500">
                {children}
              </Text>
            )}
          >
            <DisplayValue value={depositData.valueDisplay} />
          </DollarAssetValue>
        </div>
      </SValueContainer>
    </>
  )
}

const XYKFields = ({ depositData }: { depositData: TXYKDepositData }) => {
  const { t } = useTranslation()
  const { amountUSD, assetA, assetB } = depositData

  return (
    <SValueContainer>
      <Text color="basic500" fs={14} lh={16}>
        {t("farms.positions.labels.currentValue")}
      </Text>
      <div sx={{ flex: "column", align: "flex-end" }}>
        <Text fs={14}>
          {t("value.tokenWithSymbol", {
            value: assetA.amount,
            symbol: assetA.symbol,
          })}{" "}
          |{" "}
          {t("value.tokenWithSymbol", {
            value: assetB.amount,
            symbol: assetB.symbol,
          })}
        </Text>
        <Text fs={11} css={{ color: "rgba(221, 229, 255, 0.61)" }}>
          <DisplayValue value={amountUSD} />
        </Text>
      </div>
    </SValueContainer>
  )
}
