import { chainsMap } from "@galacticcouncil/xcm-cfg"
import { ChainLogo } from "components/AssetIcon/AssetIcon"
import { DisplayValue } from "components/DisplayValue/DisplayValue"
import { Icon } from "components/Icon/Icon"
import { Text } from "components/Typography/Text/Text"
import { useMemo } from "react"
import { Trans, useTranslation } from "react-i18next"
import { useRpcProvider } from "providers/rpcProvider"
import { SContainer, SLocksContainer } from "./WalletAssetsTableDetails.styled"
import {
  AssetsTableData,
  useLockedNativeTokens,
  useUnlockableTokens,
  useUnlockTokens,
} from "sections/wallet/assets/table/data/WalletAssetsTableData.utils"
import BN from "bignumber.js"
import { Button } from "components/Button/Button"
import { Separator } from "components/Separator/Separator"
import { BN_0 } from "utils/constants"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { TOAST_MESSAGES } from "state/toasts"
import { ToastMessage } from "state/store"
import Skeleton from "react-loading-skeleton"

const chains = Array.from(chainsMap.values())

export const WalletAssetsTableDetails = ({
  reserved,
  reservedDisplay,
  id,
}: AssetsTableData) => {
  const {
    assets: { native },
  } = useRpcProvider()

  const isNativeAsset = id === native.id

  if (isNativeAsset)
    return (
      <NativeAssetDetails
        reserved={reserved}
        reservedDisplay={reservedDisplay}
      />
    )

  return (
    <AssetDetails
      reserved={reserved}
      reservedDisplay={reservedDisplay}
      id={id}
    />
  )
}

const NativeAssetDetails = ({
  reserved,
  reservedDisplay,
}: {
  reserved: BN
  reservedDisplay: BN
}) => {
  const { account } = useAccount()
  const { t } = useTranslation()
  const lockedTokens = useLockedNativeTokens()
  const unlocable = useUnlockableTokens()

  const toast = TOAST_MESSAGES.reduce((memo, type) => {
    const msType = type === "onError" ? "onLoading" : type
    memo[type] = (
      <Trans
        t={t}
        i18nKey={`wallet.assets.table.details.unlock.${msType}`}
        tOptions={{
          value: unlocable.value,
        }}
      >
        <span />
      </Trans>
    )
    return memo
  }, {} as ToastMessage)

  const unlock = useUnlockTokens({ ids: unlocable.ids, toast })

  return (
    <SContainer hasChain={false} isNativeAsset>
      <div>
        <Text fs={14} lh={14} fw={500} color="basic300">
          {t("wallet.assets.table.details.lockedStaking")}
        </Text>
        <Text fs={16} lh={18} fw={400} color="white" sx={{ mt: 4 }}>
          {lockedTokens.isLoading ? (
            <Skeleton height={14} width={30} />
          ) : (
            t("value.token", { value: lockedTokens.lockStaking })
          )}
        </Text>
        <Text fs={11} lh={14} fw={500} color="whiteish500">
          {lockedTokens.isLoading ? (
            <Skeleton height={10} width={20} />
          ) : (
            <DisplayValue value={lockedTokens.lockStakingDisplay} />
          )}
        </Text>
      </div>
      <div>
        <Text fs={14} lh={14} fw={500} color="basic300">
          {t("wallet.assets.table.details.lockedDemocracy")}
        </Text>
        <Text fs={16} lh={18} fw={400} color="white" sx={{ mt: 4 }}>
          {lockedTokens.isLoading ? (
            <Skeleton height={14} width={30} />
          ) : (
            t("value.token", { value: lockedTokens.lockDemocracy })
          )}
        </Text>
        <Text fs={11} lh={14} fw={500} color="whiteish500">
          {lockedTokens.isLoading ? (
            <Skeleton height={10} width={20} />
          ) : (
            <DisplayValue value={lockedTokens.lockDemocracyDisplay} />
          )}
        </Text>
        {unlocable.endDate?.isPositive ? (
          <SLocksContainer sx={{ width: "fit-content" }}>
            <Text fs={11} lh={15} color="darkBlue200">
              {t("wallet.assets.table.details.expiring", {
                duration: unlocable.endDate.duration,
              })}
            </Text>
          </SLocksContainer>
        ) : null}
      </div>
      <div sx={{ flex: "row", justify: "space-between", align: "center" }}>
        <div>
          <Text fs={14} lh={14} fw={500} color="basic300">
            {t("wallet.assets.table.details.unlockable")}
          </Text>

          <Text fs={16} lh={18} fw={400} color="white" sx={{ mt: 4 }}>
            {unlocable.isLoading ? (
              <Skeleton height={14} width={30} />
            ) : (
              t("value.token", { value: unlocable.value ?? BN_0 })
            )}
          </Text>
          <Text fs={11} lh={14} fw={500} color="whiteish500">
            {unlocable.isLoading ? (
              <Skeleton height={10} width={20} />
            ) : (
              <DisplayValue value={unlocable.displayValue ?? BN_0} />
            )}
          </Text>
          {unlocable.votesUnlocked ? (
            <SLocksContainer>
              <Text fs={11} lh={15} color="darkBlue200">
                {t("wallet.assets.table.details.expired", {
                  count: unlocable.votesUnlocked,
                })}
              </Text>
            </SLocksContainer>
          ) : null}
        </div>
        <Button
          variant="primary"
          size="compact"
          disabled={
            account?.isExternalWalletConnected ||
            !unlocable.ids.length ||
            unlock.isLoading
          }
          onClick={() => unlock.mutate()}
          isLoading={unlock.isLoading}
        >
          {t("wallet.assets.table.details.btn")}
        </Button>
      </div>
      <div css={{ gridColumn: "1/4", height: 1 }}>
        <Separator color="alpha0" opacity={0.06}>
          <p />
        </Separator>
      </div>
      <div>
        <p />
      </div>
      <div>
        <Text fs={14} lh={14} fw={500} color="basic300">
          {t("wallet.assets.table.details.reserved")}
        </Text>
        <Text fs={16} lh={18} fw={400} color="white" sx={{ mt: 4 }}>
          {t("value.token", { value: reserved })}
        </Text>
        <Text fs={11} lh={14} fw={500} color="whiteish500">
          <DisplayValue value={reservedDisplay} />
        </Text>
      </div>
      <div>
        <Text fs={14} lh={14} fw={500} color="basic300">
          {t("wallet.assets.table.details.lockedVesting")}
        </Text>
        <Text fs={16} lh={18} fw={400} color="white" sx={{ mt: 4 }}>
          {lockedTokens.isLoading ? (
            <Skeleton height={14} width={30} />
          ) : (
            t("value.token", { value: lockedTokens.lockVesting })
          )}
        </Text>
        <Text fs={11} lh={14} fw={500} color="whiteish500">
          {lockedTokens.isLoading ? (
            <Skeleton height={10} width={20} />
          ) : (
            <DisplayValue value={lockedTokens.lockVestingDisplay} />
          )}
        </Text>
      </div>
    </SContainer>
  )
}

const AssetDetails = ({
  reserved,
  reservedDisplay,
  id,
}: {
  reserved: BN
  reservedDisplay: BN
  id: string
}) => {
  const { t } = useTranslation()
  const { assets } = useRpcProvider()

  const origin = useMemo(() => {
    const assetDetails = assets.getAsset(id)

    const chain = chains.find(
      (chain) => chain.parachainId === Number(assetDetails.parachainId),
    )

    if (!chain) return undefined

    return {
      chain: chain.key,
      name: chain.name,
      symbol: assetDetails.symbol,
    }
  }, [assets, id])

  return (
    <SContainer hasChain={!!origin} isNativeAsset={false}>
      {origin && (
        <div>
          <Text fs={14} lh={14} fw={500} color="basic300">
            {t("wallet.assets.table.details.origin")}
          </Text>
          <div sx={{ flex: "row", gap: 4, mt: 12 }}>
            <Icon size={18} icon={<ChainLogo symbol={origin.chain} />} />
            <Text fs={14} color="white">
              {origin.name}
            </Text>
          </div>
        </div>
      )}
      <div>
        <Text fs={14} lh={14} fw={500} color="basic300">
          {t("wallet.assets.table.details.reserved")}
        </Text>
        <Text fs={16} lh={18} fw={400} color="white">
          {t("value.token", { value: reserved })}
        </Text>
        <Text fs={11} lh={14} fw={500} color="whiteish500">
          <DisplayValue value={reservedDisplay} />
        </Text>
      </div>
    </SContainer>
  )
}
