import { useMutation } from "@tanstack/react-query"
import {
  useAssetHubApi,
  useAssetHubAssetRegistry,
} from "api/externalAssetRegistry"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { useStore } from "state/store"
import { TOAST_MESSAGES } from "state/toasts"
import { positive, required } from "utils/validators"
import { z } from "zod"

export type FormFields = {
  name: string
  decimals: string
  symbol: string
  deposit: string
  id: string
}

export const useCreateToken = () => {
  const { account } = useAccount()
  const { data: api } = useAssetHubApi()
  const { createTransaction } = useStore()
  const { t } = useTranslation()

  return useMutation(async (values: FormFields) => {
    if (!api) throw new Error("Asset Hub is not connected")
    if (!account) throw new Error("Account is not connected")

    return await createTransaction({
      tx: api.tx.utility.batchAll([
        api.tx.assets.create(values.id, account.address, values.deposit),
        api.tx.assets.setMetadata(
          values.id,
          values.name,
          values.symbol,
          values.decimals,
        ),
      ]),
    })
  })
}

export const useZodCreateToken = () => {
  const { t } = useTranslation()
  const { data } = useAssetHubAssetRegistry()

  if (!data) return undefined

  return z.object({
    name: required
      .max(20, "Max allowed characters is 20")
      .refine(
        (value) =>
          !data.some(
            (asset) => asset.name.toUpperCase() === value.toUpperCase(),
          ),
        {
          message: "Asset with this name already exist",
        },
      ),
    symbol: required
      .max(6, "Max allowed characters is 6")
      .refine(
        (value) =>
          !data.some(
            (asset) => asset.symbol.toUpperCase() === value.toUpperCase(),
          ),
        {
          message: "Asset with this symbol already exist",
        },
      ),
    decimals: required
      .pipe(positive)
      .transform((v) => Number(v))
      .pipe(z.number().max(20, "Max allowed via the UI is set to 20.")),
    deposit: required.pipe(positive),
    id: required,
  })
}

export const useCreateAssetId = () => {
  const { data } = useAssetHubAssetRegistry()

  const id = useMemo(() => {
    if (!data) return undefined

    const assets = [...data]

    let smallestId = 1

    assets.sort((a, b) => Number(a.id) - Number(b.id))

    for (let i = 0; i < assets.length; i++) {
      if (Number(assets[i].id) === smallestId) {
        smallestId++
      } else if (Number(assets[i].id) > smallestId) {
        break
      }
    }

    return smallestId
  }, [data])

  return id
}
