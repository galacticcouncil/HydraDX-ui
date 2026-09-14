import { queryOptions } from "@tanstack/react-query"

import { fetchGrafana } from "@/api/grafana/fetchGrafana"

import dcaAmounts from "./dcaAmounts.sql?raw"

type GrafanaColumn = ReadonlyArray<number | string | null>
type GrafanaTable = ReadonlyArray<GrafanaColumn>

export type DcaAmounts = {
  readonly spent: string
  readonly received: string
}

const readAmount = (raw: number | string | null | undefined): string =>
  raw === null || raw === undefined ? "0" : raw.toString()

export const dcaAmountsQuery = (scheduleIds: ReadonlyArray<number>) =>
  queryOptions({
    queryKey: ["trade", "orders", "grafana", "dcaAmounts", scheduleIds],
    queryFn: async ({ signal }) => {
      const sql = dcaAmounts.replace(
        "$scheduleIds",
        scheduleIds.map((id) => `'{"id":${Number(id)}}'`).join(","),
      )

      const [ids = [], spent = [], received = []] = (await fetchGrafana(
        sql,
        "spent",
        signal,
      )) as GrafanaTable

      return new Map<number, DcaAmounts>(
        ids.map((id, index) => [
          Number(id),
          {
            spent: readAmount(spent[index]),
            received: readAmount(received[index]),
          },
        ]),
      )
    },
    enabled: scheduleIds.length > 0,
  })
