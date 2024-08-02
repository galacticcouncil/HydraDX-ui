import { theme } from "theme"
import {
  SFeeRangeContainer,
  SFeeRangeItem,
  SFeeRangeLine,
  SFullFeeRangeContainer,
  SFullFeeRangeItem,
  SFullRangeContainer,
  SLine,
  SRentagle,
} from "./FeeRange.styled"
import ChevronDown from "assets/icons/Chevron.svg?react"
import { Icon } from "components/Icon/Icon"
import BN from "bignumber.js"
import { Text } from "components/Typography/Text/Text"
import { useTranslation } from "react-i18next"
import { MAX_WITHDRAWAL_FEE } from "utils/constants"
import { useMemo, useState } from "react"
import { SummaryRow } from "components/Summary/SummaryRow"
import Skeleton from "react-loading-skeleton"
import { AccordionAnimation } from "components/AccordionAnimation/AccordionAnimation"
import { useAssets } from "providers/assets"

const FEE_RANGE_COLOR_CONFIG: Record<number, keyof typeof theme.colors> = {
  0: "green600",
  1: "warningYellow400",
  2: "alarmRed400",
}

type FeeRangeProps = {
  currentFee?: BN
  minFee?: BN
  lrnaFeeValue?: string
  assetFeeValue: string
  assetSymbol?: string
}

export const FeeRange = ({
  minFee,
  currentFee,
  lrnaFeeValue,
  assetFeeValue,
  assetSymbol,
}: FeeRangeProps) => {
  const { hub } = useAssets()
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  const { rangeNumbers, currentInterval } = useMemo(() => {
    if (minFee && currentFee) {
      const step = MAX_WITHDRAWAL_FEE.minus(minFee).div(3)

      const rangeNumbers = [step, step.multipliedBy(2), MAX_WITHDRAWAL_FEE]

      const currentIntervalIndex = rangeNumbers.findIndex((rangeNumber) =>
        currentFee.lte(rangeNumber),
      )

      const currentInterval =
        currentIntervalIndex !== -1
          ? currentIntervalIndex
          : Object.keys(FEE_RANGE_COLOR_CONFIG).length - 1

      return { rangeNumbers: [minFee, ...rangeNumbers], currentInterval }
    }

    return { rangeNumbers: undefined, currentInderval: undefined }
  }, [currentFee, minFee])

  return (
    <div>
      <SummaryRow
        label={t("liquidity.remove.modal.tokenFee.label")}
        content={
          currentInterval == null ? (
            <Skeleton height={14} width={130} />
          ) : (
            <div
              sx={{
                flex: "row",
                align: "center",
                justify: "flex-end",
                gap: 12,
              }}
              css={{ cursor: "pointer" }}
              onClick={() => setIsOpen((isOpen) => !isOpen)}
            >
              <Text color="graySoft" fs={14}>
                {t("value.percentage", { value: currentFee })}
              </Text>
              <SFeeRangeContainer>
                {Object.values(FEE_RANGE_COLOR_CONFIG).map((color, index) => (
                  <SFeeRangeItem
                    key={color}
                    color={color}
                    isActive={currentInterval === index}
                  />
                ))}
              </SFeeRangeContainer>
              <Icon
                icon={<ChevronDown />}
                css={{ rotate: !isOpen ? "180deg" : "0deg" }}
                sx={{ color: "white" }}
              />
            </div>
          )
        }
      />
      <AccordionAnimation isExpanded={isOpen}>
        <SFullRangeContainer>
          <div sx={{ flex: "row", justify: "space-between" }}>
            <Text fs={13} color="basic100">
              {t("liquidity.remove.modal.feeRange.label")}
            </Text>
            <Text color="green500" fs={13}>
              {t("value.tokenWithSymbol", {
                value: assetFeeValue,
                symbol: assetSymbol,
              })}
            </Text>
          </div>
          {lrnaFeeValue && (
            <div sx={{ flex: "row", justify: "end" }}>
              <Text color="green500" fs={13}>
                {lrnaFeeValue + " " + hub.symbol}
              </Text>
            </div>
          )}

          <div sx={{ mt: 8 }} css={{ position: "relative" }}>
            <SFullFeeRangeContainer>
              {Object.values(FEE_RANGE_COLOR_CONFIG).map((color, index) => (
                <SFullFeeRangeItem
                  key={color}
                  isActive={currentInterval === index}
                  color={color}
                >
                  <div />
                </SFullFeeRangeItem>
              ))}
            </SFullFeeRangeContainer>
            <SFeeRangeLine>
              <SRentagle />
              <SLine />
              <SRentagle />
            </SFeeRangeLine>
          </div>
          <div
            sx={{ flex: "row", justify: "space-evenly" }}
            css={{ position: "relative" }}
          >
            {rangeNumbers?.map((number, index) => {
              const isFirstEl = index === 0
              const isLastEl = index === rangeNumbers.length - 1
              const isFirstOrLastEl = isFirstEl || isLastEl
              return (
                <Text
                  key={number.toString()}
                  color="basic200"
                  fs={11}
                  css={
                    isFirstOrLastEl
                      ? {
                          position: "absolute",
                          ...(isFirstEl ? { left: 0 } : { right: 0 }),
                        }
                      : undefined
                  }
                >
                  {t("value.percentage", {
                    value: number,
                    numberPrefix: isFirstEl
                      ? "MIN "
                      : isLastEl
                        ? "MAX "
                        : undefined,
                  })}
                </Text>
              )
            })}
          </div>

          <Text color="basic400" fs={13}>
            {t("liquidity.remove.modal.feeRange.desc")}
          </Text>
        </SFullRangeContainer>
      </AccordionAnimation>
    </div>
  )
}
