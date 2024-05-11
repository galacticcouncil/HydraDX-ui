import {
  HYDRADX_PARACHAIN_ACCOUNT,
  useAssetHubTokenBalances,
} from "api/externalAssetRegistry"
import { useTotalIssuances } from "api/totalIssuance"
import { Alert } from "components/Alert/Alert"
import { AssetLogo } from "components/AssetIcon/AssetIcon"
import { Icon } from "components/Icon/Icon"
import { Text } from "components/Typography/Text/Text"
import { useRpcProvider } from "providers/rpcProvider"
import { useMemo } from "react"
import { isNotNil } from "utils/helpers"
import { zipArrays } from "utils/rx"

export const ExternalAssetsRugCheck = () => {
  const { assets } = useRpcProvider()

  const addedTokens = assets.external
    .filter(({ name, symbol }) => !!name && !!symbol)
    .filter(({ name }) => !["DED", "PINK", "DOTA"].includes(name))

  const addedTokensIds = addedTokens.map(({ id }) => id)
  const addedTokensGeneralIndexes = addedTokens.map(
    ({ generalIndex }) => generalIndex,
  )

  const issuanceQueries = useTotalIssuances(addedTokensIds)

  const balanceQueries = useAssetHubTokenBalances(
    HYDRADX_PARACHAIN_ACCOUNT,
    addedTokensGeneralIndexes,
  )

  console.log({ issuanceQueries, balanceQueries })

  const alerts = useMemo(() => {
    if (
      issuanceQueries.some((q) => !q.data) ||
      balanceQueries.some((q) => !q.data)
    ) {
      return []
    }

    const issuanceData = issuanceQueries.map((q) => q.data).filter(isNotNil)
    const balanceData = balanceQueries.map((q) => q.data).filter(isNotNil)

    return zipArrays(issuanceData, balanceData)
      .map(([issuance, balance]) => {
        // @TODO remove negation, this is for temporary debug purposes, should be balance.balance.gte(issuance.total)
        const isOK = !balance.balance.gte(issuance.total)
        if (isOK) return null
        return issuance.token
          ? assets.getAsset(issuance.token.toString())
          : null
      })
      .filter(isNotNil)
  }, [assets, balanceQueries, issuanceQueries])

  console.log({ alerts })

  if (alerts.length === 0) return null

  return (
    <>
      {alerts.map(({ name, id }) => (
        <Alert variant="error" key={id}>
          <Text
            fs={16}
            sx={{ flex: "row", justify: "center", align: "center" }}
          >
            <Icon sx={{ mr: 12 }} size={20} icon={<AssetLogo id={id} />} />{" "}
            {name} rugpull warning. Admin has burned tokens from HydraDX 💀
          </Text>
        </Alert>
      ))}
    </>
  )
}
