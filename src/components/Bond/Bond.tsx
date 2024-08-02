import { Button } from "components/Button/Button"
import { Text } from "components/Typography/Text/Text"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { SBond, SItem } from "./Bond.styled"
import { Icon } from "components/Icon/Icon"
import { useBestNumber } from "api/chain"
import { BLOCK_TIME, BN_1 } from "utils/constants"
import { addSeconds, format } from "date-fns"
import { InfoTooltip } from "components/InfoTooltip/InfoTooltip"
import { customFormatDuration, formatDate } from "utils/formatting"
import { SSeparator } from "components/Separator/Separator.styled"
import { theme } from "theme"
import { useDisplayPrice } from "utils/displayAsset"
import { useMedia } from "react-use"
import Skeleton from "react-loading-skeleton"
import { useLbpPool } from "api/bonds"
import { useNavigate } from "@tanstack/react-location"
import { LINKS } from "utils/navigation"
import { AssetLogo } from "components/AssetIcon/AssetIcon"
import { TBond } from "providers/assets"
import { SInfoIcon } from "components/InfoTooltip/InfoTooltip.styled"

export type BondView = "card" | "list"

export type BondState = "active" | "upcoming" | "past"

export type BondProps = {
  view?: BondView
  bond: TBond
  pool?: NonNullable<ReturnType<typeof useLbpPool>["data"]>[number]
  state: BondState
}

const Discount = ({
  assetId,
  bondId,
  view,
}: {
  assetId: string
  bondId: string
  view?: BondView
}) => {
  const { t } = useTranslation()
  const isDesktop = useMedia(theme.viewport.gte.sm)
  const isCard = view === "card"

  const isColumnView = !isDesktop || isCard
  const spotPrice = useDisplayPrice(assetId)
  const spotPriceBond = useDisplayPrice(bondId)

  const isLoading = spotPrice.isLoading || spotPriceBond.isLoading

  const currentSpotPrice = spotPrice.data?.spotPrice ?? BN_1
  const currentBondPrice = spotPriceBond.data?.spotPrice ?? BN_1

  const isDiscount = currentSpotPrice.gt(currentBondPrice)

  const discount = currentSpotPrice
    .minus(currentBondPrice)
    .div(currentSpotPrice)
    .multipliedBy(100)
    .absoluteValue()

  return (
    <SItem>
      {isLoading ? (
        <>
          <Skeleton width={isColumnView ? 100 : 60} height={13} />
          <Skeleton width={isColumnView ? 100 : 60} height={13} />
        </>
      ) : (
        <>
          <div sx={{ flex: "row", gap: 6 }}>
            <Text color="basic400" fs={14}>
              {isDiscount ? t("bonds.discount") : t("bonds.premium")}
            </Text>
            {!isDiscount && (
              <InfoTooltip text={t("bonds.premium.desc")}>
                <SInfoIcon />
              </InfoTooltip>
            )}
          </div>
          <Text color={isDiscount ? "white" : "red300"}>
            {t("value.percentage", { value: discount })}
          </Text>
        </>
      )}
    </SItem>
  )
}

export const Bond = ({ view, bond, pool, state }: BondProps) => {
  const { t } = useTranslation()
  const bestNumber = useBestNumber()
  const navigate = useNavigate()
  const isDesktop = useMedia(theme.viewport.gte.sm)

  const { id: bondId, underlyingAssetId, symbol, name, maturity } = bond
  const { start, end, assets } = pool ?? {}

  const assetIn = assets?.find((asset: number) => asset !== Number(bondId))
  const maturityDate = format(new Date(maturity), "dd/MM/yyyy")

  const isActive = state === "active"
  const isPast = state === "past"

  const data = useMemo(() => {
    if (!bestNumber.data) return undefined
    const currentBLockNumber =
      bestNumber.data?.relaychainBlockNumber.toNumber() ?? 0

    if (end && start) {
      const diff = BLOCK_TIME.multipliedBy(
        Number(isActive || isPast ? end : start) - currentBLockNumber,
      ).toNumber()

      const date = addSeconds(new Date(), diff)

      const distance = customFormatDuration({
        end: diff * 1000,
        isShort: true,
      })

      return { distance, date }
    }

    return undefined
  }, [bestNumber.data, end, start, isActive, isPast])

  const headingFs = view === "card" ? ([19, 26] as const) : ([19, 16] as const)

  if (!data) return null

  return (
    <SBond view={view ?? "list"}>
      <div
        sx={{
          flex: "row",
          align: "center",
          gap: 16,
          mb: view === "card" ? 12 : [12, 0],
        }}
      >
        <Icon icon={<AssetLogo id={underlyingAssetId} />} size={30} />
        <div sx={{ flex: "column" }}>
          <Text
            fs={headingFs}
            lh={headingFs}
            sx={{ mt: 3 }}
            font="GeistSemiBold"
          >
            {symbol}
          </Text>
          <Text fs={13} sx={{ mt: 3 }} color={"whiteish500"}>
            {name}
          </Text>
        </div>
      </div>

      <div
        sx={{ flex: ["column", "row"], justify: "space-evenly" }}
        css={{ flex: "1 0 auto" }}
      >
        <SItem>
          <div sx={{ flex: "row", align: "center", gap: 6 }}>
            <Text color="basic400" fs={14}>
              {t(
                `bonds.${
                  isActive ? "endingIn" : isPast ? "ended" : "startingIn"
                }`,
              )}
            </Text>
            {!isPast && (
              <InfoTooltip text={formatDate(data.date, "dd/MM/yyyy HH:mm")}>
                <SInfoIcon />
              </InfoTooltip>
            )}
          </div>
          <Text color="white">
            {isPast
              ? formatDate(data.date, "dd/MM/yyyy HH:mm")
              : data.distance.duration}
          </Text>
        </SItem>

        <SSeparator
          orientation={isDesktop ? "vertical" : "horizontal"}
          css={{ background: `rgba(${theme.rgbColors.white}, 0.06)` }}
        />
        <SItem>
          <Text color="basic400" fs={14}>
            {t("bonds.maturity")}
          </Text>
          <Text color="white">{maturityDate}</Text>
        </SItem>
        {isActive && (
          <>
            <SSeparator
              orientation={isDesktop ? "vertical" : "horizontal"}
              css={{ background: `rgba(${theme.rgbColors.white}, 0.06)` }}
            />
            <Discount assetId={underlyingAssetId} bondId={bondId} view={view} />
          </>
        )}
      </div>

      {(isActive || isPast) && (
        <Button
          fullWidth
          onClick={() =>
            navigate({
              to: LINKS.bond,
              search: { assetIn: assetIn, assetOut: bondId },
            })
          }
          sx={{ mt: view === "card" ? 12 : [12, 0], maxWidth: ["none", 150] }}
        >
          {t(isActive ? "bonds.btn" : "bonds.details.btn")}
        </Button>
      )}
    </SBond>
  )
}
