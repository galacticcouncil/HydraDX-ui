import { MakeGenerics, Navigate, useSearch } from "@tanstack/react-location"
import { useApiPromise } from "utils/api"
import { isApiLoaded } from "utils/helpers"
import { VotingSkeleton } from "./VotingSkeleton"
import { VotingData } from "./VotingData"

type SearchGenerics = MakeGenerics<{
  Search: { id: number }
}>

export const Voting = () => {
  const api = useApiPromise()
  const search = useSearch<SearchGenerics>()
  const id = search.id?.toString()

  if (!id) return <Navigate to="/staking" />

  if (!isApiLoaded(api)) return <VotingSkeleton />

  return <VotingData id={id} />
}
