import { useFarms } from "api/farms"
import { Button } from "components/Button/Button"
import { Icon } from "components/Icon/Icon"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import FPIcon from "assets/icons/PoolsAndFarms.svg?react"
import { JoinFarmModal } from "sections/pools/farms/modals/join/JoinFarmsModal"
import { useFarmDepositMutation } from "utils/farms/deposit"
import { TLPData } from "utils/omnipool"

export const JoinFarmsButton = (props: {
  poolId: string
  position?: TLPData
  onSuccess: () => void
}) => {
  const { t } = useTranslation()
  const { account } = useAccount()
  const [joinFarm, setJoinFarm] = useState(false)
  const farms = useFarms([props.poolId])

  const mutation = useFarmDepositMutation(
    props.poolId,
    props.position?.id ?? "",
    farms.data,
    () => setJoinFarm(false),
    props.onSuccess,
  )

  return (
    <>
      <Button
        variant="primary"
        size="compact"
        disabled={!farms.data?.length || account?.isExternalWalletConnected}
        onClick={() => setJoinFarm(true)}
        css={{ flex: "1 0 0" }}
      >
        <Icon size={12} icon={<FPIcon />} />
        {t("liquidity.asset.actions.joinFarms")}
      </Button>

      {joinFarm && farms.data && (
        <JoinFarmModal
          farms={farms.data}
          onClose={() => setJoinFarm(false)}
          position={props.position}
          mutation={mutation}
        />
      )}
    </>
  )
}
