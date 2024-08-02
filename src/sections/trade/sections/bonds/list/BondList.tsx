import { Bond, BondProps } from "components/Bond/Bond"
import { useLbpPool } from "api/bonds"
import { Text } from "components/Typography/Text/Text"
import { useTranslation } from "react-i18next"
import { useBestNumber } from "api/chain"
import { TBond } from "providers/assets"
import { PastBondList } from "./PastBondList"

type Props = {
  isLoading?: boolean
  bonds: TBond[]
}

export const BondList = ({ isLoading, bonds }: Props) => {
  const { t } = useTranslation()
  const lbpPool = useLbpPool()
  const bestNumber = useBestNumber()

  const currentBlockNumber = bestNumber.data?.relaychainBlockNumber.toNumber()

  const { active, upcoming, past } = currentBlockNumber
    ? bonds.reduce<{
        active: BondProps[]
        upcoming: BondProps[]
        past: BondProps[]
      }>(
        (acc, bond) => {
          const pool = lbpPool.data?.find((pool) =>
            pool.assets.some((assetId: number) => assetId === Number(bond.id)),
          )

          if (pool && pool.start && pool.end) {
            const state =
              currentBlockNumber > Number(pool.start)
                ? currentBlockNumber > Number(pool.end)
                  ? "past"
                  : "active"
                : "upcoming"

            acc[state].push({
              bond,
              pool,
              state: state,
            })
          } else {
            acc.past.push({
              bond,
              state: "past",
            })
          }
          return acc
        },
        { active: [], upcoming: [], past: [] },
      )
    : { active: [], upcoming: [], past: [] }

  if (isLoading || bestNumber.isLoading) {
    return null
  }

  return (
    <div sx={{ flex: "column", gap: 30 }}>
      {active.length ? (
        <div sx={{ flex: "column", gap: 12 }}>
          <Text color="brightBlue300" fs={15} font="GeistMono">
            {t("bonds.section.activeBonds")}
          </Text>
          {active.map((bond) => (
            <Bond key={bond.bond.id} {...bond} />
          ))}
        </div>
      ) : null}

      {upcoming.length ? (
        <div sx={{ flex: "column", gap: 12 }}>
          <Text color="brightBlue300" fs={15} font="GeistMono">
            {t("bonds.section.upcomingBonds")}
          </Text>
          {upcoming.map((bond) => (
            <Bond key={bond.bond.id} {...bond} />
          ))}
        </div>
      ) : null}

      {past.length ? <PastBondList bonds={past} /> : null}
    </div>
  )
}
