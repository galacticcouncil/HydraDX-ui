import { ApiPromise } from "@polkadot/api"
import { useQuery } from "@tanstack/react-query"
import { useApiPromise } from "utils/api"
import { QUERY_KEYS } from "utils/queryKeys"
import { isApiLoaded } from "utils/helpers"
import { useAccountStore } from "state/store"

const REFERENDUM_DATA_URL = import.meta.env.VITE_REFERENDUM_DATA_URL as string

export const useReferendums = (type?: "ongoing" | "finished") => {
  const api = useApiPromise()
  const { account } = useAccountStore()

  return useQuery(
    QUERY_KEYS.referendums(account?.address),
    getReferendums(api, account?.address),
    {
      enabled: !!isApiLoaded(api),
      select: (data) =>
        type
          ? data.filter(
              (r) =>
                r.referendum[type === "ongoing" ? "isOngoing" : "isFinished"],
            )
          : data,
    },
  )
}

export const useReferendumInfo = (referendumIndex?: string) => {
  return useQuery(
    QUERY_KEYS.referendumInfo(referendumIndex),
    getReferendumInfo(referendumIndex),
    { enabled: !!referendumIndex },
  )
}

export const getReferendums =
  (api: ApiPromise, accountId?: string) => async () => {
    const [referendumRaw, votesRaw] = await Promise.all([
      api.query.democracy.referendumInfoOf.entries(),
      accountId ? api.query.democracy.votingOf(accountId) : undefined,
    ])

    const referendums = referendumRaw.map(([key, codec]) => {
      const id = key.args[0].toString()
      const vote = votesRaw?.asDirect.votes.some(
        (vote) => vote[0].toString() === id,
      )

      return {
        id: key.args[0].toString(),
        referendum: codec.unwrap(),
        voted: !!vote,
      }
    })

    return referendums
  }

export const getReferendumInfo = (referendumIndex?: string) => async () => {
  const [info, votes] = await Promise.all([
    fetch(`${REFERENDUM_DATA_URL}/${referendumIndex}.json`),
    fetch(`${REFERENDUM_DATA_URL}/${referendumIndex}/votes`),
  ])
  if (!info.ok || !votes.ok) return null

  const infoJson: Referendum = await info.json()
  const votesJson: Array<Vote> = await votes.json()

  const { ayeCount, nayCount } = votesJson.reduce(
    (acc, vote) =>
      vote.aye
        ? { ...acc, ayeCount: acc.ayeCount + 1 }
        : { ...acc, nayCount: acc.nayCount + 1 },
    { ayeCount: 0, nayCount: 0 },
  )

  if (
    infoJson === null ||
    infoJson.referendumIndex === null ||
    infoJson.motionIndex === null ||
    infoJson.title === null
  )
    return null

  const authorAddress = infoJson.author.address

  const shortIds = await fetch("https://id.statescan.io/hydradx/short-ids", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      addresses: [authorAddress],
    }),
  })

  const ids = await shortIds.json()
  const authorInfo = ids?.[0]?.info ?? authorAddress
  const authorDisplay = {
    verified: authorInfo?.status === "VERIFIED",
    name: authorInfo?.display,
  }
  return { ...infoJson, ayeCount, nayCount, authorDisplay }
}

export type Referendum = {
  title: string
  content: string
  state: string
  lastActivityAt: string
  referendumIndex: number
  motionIndex: number
  author: {
    address: string
  }
  onchainData: {
    meta: {
      end: number
    }
  }
}

type Vote = {
  aye: boolean
}

export const useReferendumInfoOf = (id: string) => {
  const api = useApiPromise()

  return useQuery(
    QUERY_KEYS.referendumInfoOf(id),
    async () => {
      const res = await getReferendumInfoOf(api, id)
      return res.unwrapOr(null)
    },
    {
      enabled: !!isApiLoaded(api),
    },
  )
}

export const getReferendumInfoOf = async (api: ApiPromise, id: string) =>
  await api.query.democracy.referendumInfoOf(id)
