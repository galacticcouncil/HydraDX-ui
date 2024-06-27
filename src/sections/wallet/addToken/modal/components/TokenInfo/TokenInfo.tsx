import {
  PENDULUM_ID,
  useExternalTokensRugCheck,
  useParachainAmount,
} from "api/externalAssetRegistry"
import { Separator } from "components/Separator/Separator"
import { Text } from "components/Typography/Text/Text"
import { useTranslation } from "react-i18next"
import { TExternalAsset } from "sections/wallet/addToken/AddToken.utils"
import { useRpcProvider } from "providers/rpcProvider"
import { useMemo } from "react"
import { useGetXYKPools } from "api/xyk"
import { DisplayValue } from "components/DisplayValue/DisplayValue"
import { BN_0 } from "utils/constants"
import { MASTER_KEY_WHITELIST, useExternalXYKVolume } from "./TokenInfo.utils"
import Skeleton from "react-loading-skeleton"
import WarningIcon from "assets/icons/WarningIconRed.svg?react"
import { Icon } from "components/Icon/Icon"
import BN from "bignumber.js"
import { TToken } from "api/assetDetails"
import { TokenInfoRow } from "sections/wallet/addToken/modal/components/TokenInfo/TokenInfoRow"
import { TokenInfoValueDiff } from "sections/wallet/addToken/modal/components/TokenInfo/TokenInfoValueDiff"

export const TokenInfo = ({
  externalAsset,
  chainStoredAsset,
}: {
  externalAsset: TExternalAsset
  chainStoredAsset?: TToken
}) => {
  const { assets } = useRpcProvider()
  const { t } = useTranslation()
  const parachains = useParachainAmount(externalAsset.id)
  const xykPools = useGetXYKPools()
  const rugCheck = useExternalTokensRugCheck()
  const rugCheckData = rugCheck.tokensMap.get(chainStoredAsset?.id ?? "")
  const { totalSupplyInternal, totalSupplyExternal } = rugCheckData ?? {}

  const isChainStored = !!chainStoredAsset

  const { isXYKPool, pools } = useMemo(() => {
    if (!isChainStored || !xykPools.data)
      return { isXYKPool: false, pools: undefined }

    const chainAsset = assets.external.find(
      (external) => external.externalId === externalAsset.id,
    )

    if (chainAsset) {
      const filteredXykPools = xykPools.data.filter((shareToken) =>
        shareToken.assets.includes(chainAsset.id),
      )

      return {
        chainAsset,
        isXYKPool: filteredXykPools.length,
        pools: filteredXykPools.map((pool) => pool.poolAddress),
      }
    }

    return { isXYKPool: false, pools: undefined }
  }, [externalAsset.id, assets.external, isChainStored, xykPools])

  const warningFlags = Object.fromEntries(
    rugCheckData?.warnings.map(({ type, diff }) => {
      const [from, to] = diff
      return [type, { from, to }]
    }) ?? [],
  )

  return (
    <div sx={{ flex: "column" }}>
      <Text fs={12} color="brightBlue300" sx={{ mb: 10 }}>
        {t("wallet.addToken.form.info.title")}
      </Text>

      {totalSupplyExternal && (
        <TokenInfoRow
          label={t("wallet.addToken.form.supply")}
          severity="high"
          value={
            <Text
              fs={12}
              fw={500}
              font="GeistMedium"
              color={warningFlags.supply ? "alarmRed400" : undefined}
            >
              {t("value", {
                value: totalSupplyExternal,
                fixedPointScale: externalAsset.decimals,
                decimalPlaces: 0,
              })}
            </Text>
          }
          warning={
            warningFlags.supply
              ? t("wallet.addToken.rugCheck.supply", {
                  name: rugCheckData?.externalToken.name,
                })
              : ""
          }
        />
      )}

      {totalSupplyInternal && (
        <>
          <Separator opacity={0.3} color="darkBlue400" />
          <TokenInfoRow
            label={t("wallet.addToken.form.hydrationSupply")}
            value={t("value", {
              value: totalSupplyInternal,
              fixedPointScale: externalAsset.decimals,
              decimalPlaces: 0,
            })}
          />
        </>
      )}
      <Separator opacity={0.3} color="darkBlue400" />
      <TokenInfoRow
        label={t("wallet.addToken.form.symbol")}
        value={
          warningFlags.symbol ? (
            <TokenInfoValueDiff
              before={warningFlags.symbol.from}
              after={warningFlags.symbol.to}
            />
          ) : (
            externalAsset.symbol
          )
        }
        warning={
          warningFlags.symbol ? t("wallet.addToken.rugCheck.symbol") : ""
        }
      />
      <Separator opacity={0.3} color="darkBlue400" />
      <TokenInfoRow
        label={t("wallet.addToken.form.decimals")}
        value={
          warningFlags.decimals ? (
            <TokenInfoValueDiff
              before={warningFlags.decimals.from}
              after={warningFlags.decimals.to}
            />
          ) : (
            externalAsset.decimals.toString()
          )
        }
        warning={
          warningFlags.decimals ? t("wallet.addToken.rugCheck.decimals") : ""
        }
      />
      <Separator opacity={0.3} color="darkBlue400" />
      <TokenInfoRow
        label={t("wallet.addToken.form.assetId")}
        value={externalAsset.id}
      />
      <Separator opacity={0.3} color="darkBlue400" />
      <TokenInfoRow
        tooltip={t("wallet.addToken.form.info.registered.tooltip", {
          value: isChainStored ? "is" : "is not",
        })}
        label={t("wallet.addToken.form.info.registered")}
        value={
          isChainStored ? (
            <Text fs={12} color="green600">
              {t("yes")}
            </Text>
          ) : (
            <Text fs={12} color="red500">
              {t("no")}
            </Text>
          )
        }
      />
      <Separator opacity={0.3} color="darkBlue400" />
      {externalAsset.origin !== PENDULUM_ID && (
        <TokenInfoRow
          tooltip={t("wallet.addToken.form.info.masterAccount.tooltip")}
          label={t("wallet.addToken.form.info.masterAccount")}
          value={
            <div sx={{ flex: "row", gap: 4, align: "center" }}>
              {MASTER_KEY_WHITELIST.some((id) => id === externalAsset.id) ? (
                <Text fs={12} color="green600">
                  {t("no")}
                </Text>
              ) : (
                <>
                  <Text fs={12} lh={14} color="red500">
                    {t("yes")}
                  </Text>
                  <Icon
                    size={14}
                    sx={{ color: "red500" }}
                    icon={<WarningIcon />}
                  />
                </>
              )}
            </div>
          }
        />
      )}
      <Separator opacity={0.3} color="darkBlue400" />
      <TokenInfoRow
        tooltip={t("wallet.addToken.form.info.availability.tooltip", {
          count: BN(parachains.amount).plus(1).toNumber(),
        })}
        label={t("wallet.addToken.form.info.availability")}
        value={BN(parachains.amount).plus(1).toString()}
      />
      {isChainStored && (
        <>
          <Separator opacity={0.3} color="darkBlue400" />
          <TokenInfoRow
            label={t("wallet.addToken.form.info.isolatedPool")}
            value={
              isXYKPool ? (
                <Text fs={12} color="green600">
                  {t("yes")}
                </Text>
              ) : (
                <Text fs={12} color="red500">
                  {t("no")}
                </Text>
              )
            }
          />
          <Separator opacity={0.3} color="darkBlue400" />
          {pools?.length ? (
            <>
              <TokenInfoRow
                label={t("wallet.addToken.form.info.volume")}
                value={<XYKVolume pools={pools} />}
              />
            </>
          ) : (
            <TokenInfoRow
              label={t("wallet.addToken.form.info.volume")}
              value={"-"}
            />
          )}
        </>
      )}
    </div>
  )
}

const XYKVolume = ({ pools }: { pools: string[] }) => {
  const volumes = useExternalXYKVolume(pools)
  const total = volumes.data?.reduce(
    (acc, value) => acc.plus(value.volume),
    BN_0,
  )

  return (
    <Text fs={12}>
      {volumes.isLoading ? (
        <Skeleton width={40} height={10} />
      ) : (
        <DisplayValue value={total?.div(2)} />
      )}
    </Text>
  )
}
