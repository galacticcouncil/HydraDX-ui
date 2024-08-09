import { Text } from "components/Typography/Text/Text"
import { SContainer, SJoinButton } from "./RedepositFarms.styled"
import { Trans, useTranslation } from "react-i18next"
import { JoinFarmModal } from "sections/pools/farms/modals/join/JoinFarmsModal"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { TMiningNftPosition } from "sections/pools/PoolsPage.utils"
import { GlobalFarmRowMulti } from "sections/pools/farms/components/globalFarm/GlobalFarmRowMulti"
import { useState } from "react"
import { Farm } from "api/farms"
import { useDepositShare } from "sections/pools/farms/position/FarmingPosition.utils"
import { omit } from "utils/rx"
import { useRpcProvider } from "providers/rpcProvider"

type RedepositFarmsProps = {
  depositNft: TMiningNftPosition
  poolId: string
  availableYieldFarms: Farm[]
}

export const RedepositFarms = ({
  depositNft,
  poolId,
  availableYieldFarms,
}: RedepositFarmsProps) => {
  const { t } = useTranslation()
  const { assets } = useRpcProvider()
  const { account } = useAccount()
  const [joinFarm, setJoinFarm] = useState(false)

  const isXyk = assets.getAsset(poolId).isShareToken
  const position = useDepositShare(poolId, depositNft.id)

  if (!availableYieldFarms.length) return null

  return (
    <SContainer>
      <div sx={{ flex: "column", gap: 4 }}>
        <Text fs={13} color="brightBlue300" tTransform="uppercase">
          <Trans t={t} i18nKey="farms.positions.redeposit.openFarms" />
        </Text>

        <GlobalFarmRowMulti
          farms={availableYieldFarms}
          fontSize={16}
          iconSize={24}
          css={{ flexDirection: "row-reverse" }}
        />
      </div>

      <SJoinButton
        onClick={() => setJoinFarm(true)}
        disabled={account?.isExternalWalletConnected}
      >
        <Text fs={12} color="basic900" tTransform="uppercase" tAlign="center">
          {t("farms.positions.join.button.label")}
        </Text>
      </SJoinButton>
      {joinFarm && (
        <JoinFarmModal
          farms={availableYieldFarms}
          poolId={poolId}
          position={
            !isXyk && position.data
              ? omit(["depositId"], position.data)
              : undefined
          }
          onClose={() => setJoinFarm(false)}
          depositNft={depositNft}
        />
      )}
    </SContainer>
  )
}
