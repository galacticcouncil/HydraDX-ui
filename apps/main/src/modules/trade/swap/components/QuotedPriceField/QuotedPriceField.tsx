import { ArrowLeftRight } from "@galacticcouncil/ui/assets/icons"
import { Button, Flex, Icon, Text } from "@galacticcouncil/ui/components"
import { getToken } from "@galacticcouncil/ui/utils"
import { Pencil, X } from "lucide-react"
import { FC, MouseEvent, useRef, useState } from "react"
import { Trans, useTranslation } from "react-i18next"

import {
  SCustomPill,
  SInlineAssetLogo,
  SMarketButton,
  SMarketPrice,
  SPercentSuffix,
  SPillActions,
  SPillInlineInput,
  SPillSeparator,
  SPillSliceButton,
  SPillTrigger,
  SPriceInput,
} from "@/modules/trade/swap/components/QuotedPriceField/QuotedPriceField.styled"
import { QuotedPriceBinding } from "@/modules/trade/swap/lib/quotedPrice.hook"

type Props = {
  readonly binding: QuotedPriceBinding
  readonly baseAssetId?: string
  readonly baseSymbol: string
  readonly quoteSymbol: string
  readonly marketLabel: string
}

export const QuotedPriceField: FC<Props> = ({
  binding,
  baseAssetId,
  baseSymbol,
  quoteSymbol,
  marketLabel,
}) => {
  const { t } = useTranslation(["trade", "common"])
  const { view, dispatch } = binding

  const [isEditingPill, setIsEditingPill] = useState(false)
  const [lastPillValue, setLastPillValue] = useState("")
  const pillInputRef = useRef<HTMLInputElement>(null)

  const startEditingPill = () => {
    setIsEditingPill(true)
    setTimeout(() => pillInputRef.current?.focus(), 0)
  }

  const commitPill = (value: string) => {
    setIsEditingPill(false)
    dispatch({ type: "pct", value })
    setLastPillValue(value.trim())
  }

  const resetToMarket = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    event.preventDefault()
    setIsEditingPill(false)
    setLastPillValue("")
    dispatch({ type: "resetToMarket" })
  }

  const deviationPct = view.deviationPct ?? 0
  const deviationDisplay = t("common:percent", {
    value: deviationPct,
    prefix: deviationPct > 0 ? "+" : "",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const showResetAction = view.canReset && !isEditingPill

  return (
    <Flex direction="column" gap="xs" py="l">
      <Flex justify="space-between" align="center">
        <Flex asChild align="center">
          <Text
            as="div"
            fw={500}
            lh={1}
            fs="p5"
            gap="0.25em"
            color={getToken("text.medium")}
          >
            <Trans
              t={t}
              i18nKey={
                view.inverted
                  ? "trade:limit.priceLabelBelow"
                  : "trade:limit.priceLabelAbove"
              }
              values={{ symbol: baseSymbol }}
            >
              <Text as="span" fw={500} color={getToken("text.high")} />
              {baseAssetId ? (
                <SInlineAssetLogo id={baseAssetId} size="extra-small" />
              ) : (
                <span />
              )}
            </Trans>
          </Text>
        </Flex>
        <SCustomPill
          isActive={isEditingPill}
          tone={
            deviationPct > 0
              ? "positive"
              : deviationPct < 0
                ? "negative"
                : "neutral"
          }
        >
          {isEditingPill ? (
            <>
              <SPillInlineInput
                getInputRef={pillInputRef}
                defaultValue={lastPillValue}
                placeholder={t("common:number", {
                  value: deviationPct,
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                onFocus={(e) => e.target.select()}
                onValueChange={({ value }) => dispatch({ type: "pct", value })}
                onBlur={(e) => commitPill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    commitPill((e.target as HTMLInputElement).value)
                  }
                  if (e.key === "Escape") setIsEditingPill(false)
                }}
              />
              <SPercentSuffix>%</SPercentSuffix>
            </>
          ) : (
            <>
              <SPillTrigger
                type="button"
                onClick={startEditingPill}
                aria-label={t("trade:limit.deviation.editAria")}
              >
                {deviationDisplay}
              </SPillTrigger>
              <SPillActions>
                <SPillSeparator aria-hidden />
                {showResetAction ? (
                  <SPillSliceButton
                    type="button"
                    onClick={resetToMarket}
                    aria-label={t("trade:limit.deviation.resetAria")}
                  >
                    <X />
                  </SPillSliceButton>
                ) : (
                  <SPillSliceButton
                    type="button"
                    tabIndex={-1}
                    aria-hidden
                    onClick={(e) => {
                      e.preventDefault()
                      startEditingPill()
                    }}
                  >
                    <Pencil />
                  </SPillSliceButton>
                )}
              </SPillActions>
            </>
          )}
        </SCustomPill>
      </Flex>

      <Flex align="center" width="100%" gap="s">
        <Button
          variant="tertiary"
          size="medium"
          outline
          onClick={() => dispatch({ type: "flipDenomination" })}
          px="m"
          aria-label={t("trade:limit.invert")}
        >
          <Icon
            component={ArrowLeftRight}
            size="m"
            color={getToken("icons.onContainer")}
            sx={{
              transform: view.inverted ? "scaleX(1)" : "scaleX(-1)",
              transition: getToken("transitions.transform"),
            }}
          />
        </Button>
        <Flex align="center" flex={1} minWidth={0} gap="s" justify="flex-end">
          <SPriceInput
            variant="embedded"
            customSize="small"
            value={view.display}
            allowNegative={false}
            onValueChange={({ value }, { source }) => {
              if (source === "prop") return
              dispatch({ type: "typed", value })
            }}
            placeholder={t("trade:limit.pricePlaceholder")}
          />
          <Text
            fw={600}
            fs="p2"
            color={getToken("text.medium")}
            whiteSpace="nowrap"
          >
            {quoteSymbol}
          </Text>
        </Flex>
      </Flex>

      {view.marketDisplay && (
        <Flex justify="flex-end">
          <SMarketButton
            type="button"
            onClick={() => dispatch({ type: "resetToMarket" })}
          >
            {marketLabel} <SMarketPrice>{view.marketDisplay}</SMarketPrice>
          </SMarketButton>
        </Flex>
      )}
    </Flex>
  )
}
