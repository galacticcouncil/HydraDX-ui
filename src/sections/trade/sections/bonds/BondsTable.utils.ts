import { useTokensBalances } from "api/balances"
import { useBondsEvents, useLbpPool } from "api/bonds"
import { useBestNumber } from "api/chain"
import { useState } from "react"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { arraySearch, isNotNil } from "utils/helpers"
import { pluck } from "utils/rx"
import { BondTableItem } from "./table/BondsTable.utils"
import { BN_0 } from "utils/constants"
import { format } from "date-fns"
import BN from "bignumber.js"
import { Transaction } from "./table/transactions/Transactions.utils"
import { useAssets } from "providers/assets"

export const useBondsTableData = ({
  id,
  search,
}: {
  id?: string
  search?: string
}) => {
  const { bonds, isBond, getBond, getAssetWithFallback } = useAssets()
  const { account } = useAccount()

  const [isAllAssets, setAllAssets] = useState(false)

  const bestNumber = useBestNumber()
  const lbpPools = useLbpPool()
  const bondsData = (id ? bonds.filter((bond) => bond.id === id) : bonds) ?? []

  const balances = useTokensBalances(pluck("id", bondsData), account?.address)

  const bondsBalances = balances.filter((balance) => balance.data?.total.gt(0))

  const bondEvents = useBondsEvents(
    bondsBalances.map((bondBalance) => bondBalance.data?.assetId.toString()) ??
      [],
    true,
  )

  const isLoading =
    pluck("isLoading", balances).some(Boolean) ||
    lbpPools.isLoading ||
    bondEvents.some((event) => event.isLoading)

  const isAccount = !!account

  if (isLoading || !isAccount) {
    return { data: [], isLoading, isAccount, isAllAssets, setAllAssets }
  }

  const bondMap = new Map(bondsData.map((bond) => [bond.id, bond]))

  const currentBlockNumber =
    bestNumber.data?.relaychainBlockNumber.toNumber() ?? 0

  let data: BondTableItem[]

  const bondsWithBalance = bondsBalances
    .map((bondBalance) => {
      const id = bondBalance.data?.assetId.toString() ?? ""
      const bond = bondMap.get(id)

      const isLoaded = bondEvents.every((bondEvent) => bondEvent.data)

      if (!bond || !isLoaded) return undefined

      const eventsQuery = bondEvents.find(
        (bondEvent) => bondEvent.data?.bondId === id,
      )
      let accumulatedAssetId: string | undefined

      const events =
        eventsQuery?.data?.events.reduce((acc, event) => {
          const date = format(
            new Date(event.block.timestamp),
            "dd/MM/yyyy HH:mm",
          )

          const assetInId = event.args.assetIn
          const assetOutId = event.args.assetOut

          const metaIn = getAssetWithFallback(assetInId.toString())
          const metaOut = getAssetWithFallback(assetOutId.toString())

          const isBuy = event.name === "LBP.BuyExecuted"
          const amountIn = BN(event.args.amount).shiftedBy(-metaIn.decimals)

          const amountOut = BN(
            event.args[isBuy ? "buyPrice" : "salePrice"],
          ).shiftedBy(-metaOut.decimals)

          const price =
            event.args.assetOut !== Number(id)
              ? amountOut.div(amountIn)
              : amountIn.div(amountOut)

          const assetIn = {
            assetId: metaIn.iconId as string,
            symbol: metaIn.symbol,
            amount: amountIn.toString(),
          }

          const assetOut = {
            assetId: metaOut.iconId as string,
            symbol: metaOut.symbol,
            amount: amountOut.toString(),
          }

          const link = `https://hydration.subscan.io/extrinsic/${event.extrinsic.hash}`

          accumulatedAssetId = isBond(metaIn) ? metaOut.id : metaIn.id

          acc.push({
            date,
            in: assetIn,
            out: assetOut,
            isBuy,
            price,
            link,
          })

          return acc
        }, [] as Transaction[]) ?? []

      const averagePrice = events
        ?.reduce((acc, event) => acc.plus(event.price), BN_0)
        .div(events.length)

      const bondAssetId = bond.underlyingAssetId
      const lbpPool = lbpPools.data?.find((lbpPool) =>
        lbpPool.assets.some((asset: number) => asset === Number(bond?.id)),
      )

      const isSale = lbpPool
        ? currentBlockNumber > Number(lbpPool.start) &&
          currentBlockNumber < Number(lbpPool.end)
        : false

      return {
        assetId: bondAssetId,
        assetIn: accumulatedAssetId,
        maturity: bondMap.get(id)?.maturity,
        balance: bondBalance.data?.total,
        balanceHuman: bondBalance.data?.total
          ?.shiftedBy(-bond.decimals)
          .toString(),
        price: "",
        bondId: bond.id,
        isSale,
        averagePrice,
        events,
        name: getBond(bond.id)?.name ?? "",
        symbol: getBond(bond.id)?.symbol ?? "",
      }
    })
    .filter(isNotNil)

  data = bondsWithBalance

  if (isAllAssets) {
    const bondsWithoutBalance = bonds.reduce<BondTableItem[]>((acc, bond) => {
      const isBalance = bondsWithBalance.some(
        (bondWithBalance) => bondWithBalance.bondId === bond.id,
      )

      if (!isBalance) {
        const id = bond.id
        const lbpPool = lbpPools.data?.find((lbpPool) =>
          lbpPool.assets.some((asset: number) => asset === Number(bond?.id)),
        )

        const isSale = lbpPool
          ? currentBlockNumber > Number(lbpPool.start) &&
            currentBlockNumber < Number(lbpPool.end)
          : false

        const assetIn = lbpPool?.assets
          .find((asset: number) => asset !== Number(bond?.id))
          ?.toString()

        acc.push({
          assetId: bond.underlyingAssetId,
          assetIn,
          maturity: bondMap.get(id)?.maturity,
          balance: BN_0,
          balanceHuman: "0",
          price: "",
          bondId: id,
          isSale,
          averagePrice: BN_0,
          events: [],
          name: getBond(bond.id)?.name ?? "",
          symbol: getBond(bond.id)?.symbol ?? "",
        })
      }

      return acc
    }, [])

    data = [...bondsWithBalance, ...bondsWithoutBalance]
  }

  const filteredData = search
    ? arraySearch(data, search, ["symbol", "name"])
    : data

  return { data: filteredData, isLoading, isAccount, isAllAssets, setAllAssets }
}
