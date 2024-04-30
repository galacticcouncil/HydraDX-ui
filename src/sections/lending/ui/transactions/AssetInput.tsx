import ChevronDown from "assets/icons/ChevronDown.svg?react"
import { Button, ButtonTransparent } from "components/Button/Button"
import { DisplayValue } from "components/DisplayValue/DisplayValue"
import { Dropdown } from "components/Dropdown/Dropdown"
import { Text } from "components/Typography/Text/Text"
import React, { ReactNode, useState } from "react"
import { useTranslation } from "react-i18next"
import NumberFormat, { NumberFormatProps } from "react-number-format"
import { CapType } from "sections/lending/components/caps/helper"
import { TokenIcon } from "sections/lending/components/primitives/TokenIcon"
import { theme } from "theme"
import { SContainer } from "./AssetInput.styled"
import { Spinner } from "components/Spinner/Spinner"

interface CustomProps {
  onChange: (event: { target: { name: string; value: string } }) => void
  name: string
  value: string
  id: string
  placeholder: string
  disabled?: boolean
}

export const NumberFormatCustom = React.forwardRef<
  NumberFormatProps,
  CustomProps
>(function NumberFormatCustom(props, ref) {
  const { onChange, ...other } = props

  return (
    <NumberFormat
      {...other}
      getInputRef={ref}
      onValueChange={(values) => {
        if (values.value !== props.value)
          onChange({
            target: {
              name: props.name,
              value: values.value || "",
            },
          })
      }}
      thousandSeparator
      isNumericString
      allowNegative={false}
    />
  )
})

export interface Asset {
  balance?: string
  symbol: string
  iconSymbol?: string
  address?: string
  aToken?: boolean
  priceInUsd?: string
  decimals?: number
}

export interface AssetInputProps<T extends Asset = Asset> {
  name: string
  value: string
  usdValue: string
  symbol: string
  onChange?: (value: string) => void
  disabled?: boolean
  disableInput?: boolean
  onSelect?: (asset: T) => void
  assets: T[]
  capType?: CapType
  maxValue?: string
  isMaxSelected?: boolean
  inputTitle?: ReactNode
  balanceText?: ReactNode
  loading?: boolean
  className?: string
}

export const AssetInput = <T extends Asset = Asset>({
  name,
  value,
  usdValue,
  symbol,
  onChange,
  disabled,
  disableInput,
  onSelect,
  assets,
  maxValue,
  isMaxSelected,
  inputTitle,
  loading = false,
  className,
  balanceText,
}: AssetInputProps<T>) => {
  const { t } = useTranslation()
  const handleSelect = (symbol: string) => {
    setSelectedSymbol(symbol)
    const newAsset = assets.find((asset) => asset.symbol === symbol) as T
    onSelect && onSelect(newAsset)
    onChange && onChange("")
  }

  const [selectedSymbol, setSelectedSymbol] = useState<string>(symbol)

  const asset =
    assets.length === 1
      ? assets[0]
      : assets && (assets.find((asset) => asset.symbol === selectedSymbol) as T)

  return (
    <SContainer htmlFor={name} className={className}>
      <div
        sx={{
          flex: "row",
          align: "center",
          justify: "space-between",
          mb: 16,
        }}
      >
        <Text fs={12} color="whiteish500" css={{ textTransform: "uppercase" }}>
          {inputTitle ? inputTitle : <>Amount</>}
        </Text>
        {asset.balance && onChange && (
          <>
            <Text as="div" fs={12}>
              <span sx={{ opacity: 0.7 }}>{balanceText ?? "Balance"}: </span>{" "}
              <span>{t("value.token", { value: asset.balance })}</span>
              {!disableInput && (
                <Button
                  size="small"
                  sx={{
                    ml: 7,
                    px: 4,
                    py: 1,
                    color: "white",
                    fontSize: 11,
                  }}
                  css={{
                    borderColor: "transparent",
                    background: `rgba(${theme.rgbColors.primaryA0}, 0.35)`,
                  }}
                  onClick={() => onChange("-1")}
                  disabled={disabled || isMaxSelected}
                >
                  Max
                </Button>
              )}
            </Text>
          </>
        )}
      </div>

      <div
        sx={{
          flex: "row",
          align: "center",
          justify: "space-between",
        }}
      >
        {!onSelect || assets.length === 1 ? (
          <div sx={{ flex: "row", align: "center" }}>
            <TokenIcon
              aToken={asset.aToken}
              symbol={asset.iconSymbol || asset.symbol}
              sx={{ mr: 8, width: 28, height: 28 }}
            />
            <Text font="ChakraPetchSemiBold">{asset.symbol}</Text>
          </div>
        ) : (
          <Dropdown
            onSelect={(item) => handleSelect(item.key)}
            asChild
            items={assets.map((asset) => ({
              key: asset.symbol,
              label: (
                <span>
                  {asset.symbol}{" "}
                  {asset.balance && (
                    <span css={{ opacity: 0.7, display: "block" }}>
                      Balance:{" "}
                      {t("value.token", {
                        value: +asset.balance,
                      })}
                    </span>
                  )}
                </span>
              ),
              icon: (
                <TokenIcon
                  aToken={asset.aToken}
                  symbol={asset.iconSymbol || asset.symbol}
                  sx={{ mr: 8, width: 28, height: 28 }}
                />
              ),
            }))}
          >
            <ButtonTransparent
              sx={{ flex: "row", align: "center" }}
              css={{ '&[data-state="open"] > svg': { rotate: "180deg" } }}
            >
              <TokenIcon
                aToken={asset.aToken}
                symbol={asset.iconSymbol || asset.symbol}
                sx={{ mr: 8, width: 28, height: 28 }}
              />
              <Text font="ChakraPetchSemiBold">{asset.symbol}</Text>
              <ChevronDown sx={{ color: "white" }} />
            </ButtonTransparent>
          </Dropdown>
        )}

        {loading ? (
          <div sx={{ py: 2 }}>
            <Spinner size={25} />
          </div>
        ) : (
          <div sx={{ flex: "column", justify: "end" }}>
            <NumberFormatCustom
              id={name}
              name={name}
              placeholder="0.00"
              disabled={disabled || disableInput}
              value={value}
              onChange={(e) => {
                if (!onChange) return
                if (Number(e.target.value) > Number(maxValue)) {
                  onChange("-1")
                } else {
                  onChange(e.target.value)
                }
              }}
            />
            <Text tAlign="right" color="darkBlue200" fs={11}>
              <DisplayValue
                value={isNaN(Number(usdValue)) ? 0 : Number(usdValue)}
              />
            </Text>
          </div>
        )}
      </div>
    </SContainer>
  )
}
