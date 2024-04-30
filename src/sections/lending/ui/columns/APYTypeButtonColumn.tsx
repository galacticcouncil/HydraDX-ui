import { InterestRate } from "@aave/contract-helpers"
import CheckIcon from "assets/icons/CheckIcon.svg?react"
import ChevronDown from "assets/icons/ChevronDown.svg?react"
import LinkIcon from "assets/icons/LinkIcon.svg?react"
import { ButtonTransparent } from "components/Button/Button"
import { Dropdown } from "components/Dropdown/Dropdown"
import { Text } from "components/Typography/Text/Text"
import { useMemo } from "react"
import { PercentageValue } from "components/PercentageValue"
import { ROUTES } from "sections/lending/components/primitives/Link"
import { CustomMarket } from "sections/lending/ui-config/marketsConfig"
import { useTranslation } from "react-i18next"

interface ListItemAPYButtonProps {
  stableBorrowRateEnabled: boolean
  borrowRateMode: string
  disabled: boolean
  onClick: () => void
  stableBorrowAPY: string
  variableBorrowAPY: string
  underlyingAsset: string
  currentMarket: CustomMarket
}

export const APYTypeButtonColumn = ({
  stableBorrowRateEnabled,
  borrowRateMode,
  disabled,
  onClick,
  stableBorrowAPY,
  variableBorrowAPY,
  underlyingAsset,
  currentMarket,
}: ListItemAPYButtonProps) => {
  const { t } = useTranslation()
  const items = useMemo(() => {
    const items = disabled
      ? []
      : [
          {
            icon: <CheckIcon width={12} height={12} />,
            key: InterestRate.Variable,
            label: (
              <span>
                <span>{t("lending.apyVariable")}</span> -{" "}
                <PercentageValue value={Number(variableBorrowAPY) * 100} />
              </span>
            ),
          },
          {
            icon: <CheckIcon width={12} height={12} />,
            key: InterestRate.Stable,
            label: (
              <span>
                <span>{t("lending.apyStable")}</span> -{" "}
                <PercentageValue value={Number(stableBorrowAPY) * 100} />
              </span>
            ),
          },
        ]

    return items.map((item) => ({
      ...item,
      icon:
        borrowRateMode === item.key ? (
          <CheckIcon width={12} height={12} />
        ) : (
          <span sx={{ width: 12, height: 12, display: "block" }} />
        ),
    }))
  }, [t, borrowRateMode, disabled, stableBorrowAPY, variableBorrowAPY])

  return (
    <div css={{ display: "inline-flex" }}>
      <Dropdown
        asChild
        onSelect={(key) => {
          if (key.key !== borrowRateMode) {
            onClick()
          }
        }}
        items={items}
        header={
          <Text
            fs={12}
            color="pink100"
            sx={{ p: 10 }}
            css={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            {t("lending.apyType.switch.title")}
          </Text>
        }
        footer={
          <Text fs={14} css={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <a
              target="_blank"
              href={ROUTES.reserveOverview(underlyingAsset, currentMarket)}
              rel="noreferrer"
              sx={{ p: 10, flex: "row", align: "center", gap: 4 }}
            >
              {t("lending.apyType.switch.charts")}{" "}
              <LinkIcon width={12} height={12} />
            </a>
          </Text>
        }
      >
        <ButtonTransparent
          disabled
          sx={{ color: disabled ? "basic500" : "white" }}
          css={{
            '&[data-state="open"] > svg': { rotate: "180deg" },
            border: disabled ? "none" : "1px solid rgba(255, 255, 255, 0.2)",
            cursor: disabled ? "auto" : "pointer!important",
            padding: disabled ? 0 : "2px 6px",
            borderRadius: 4,
          }}
        >
          {borrowRateMode}
          {stableBorrowRateEnabled && <ChevronDown width={20} height={20} />}
        </ButtonTransparent>
      </Dropdown>
    </div>
  )
}
