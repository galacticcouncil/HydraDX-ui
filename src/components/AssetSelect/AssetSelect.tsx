import { css } from "@emotion/react"
import BigNumber from "bignumber.js"
import { SErrorMessage } from "components/AddressInput/AddressInput.styled"
import { AssetInput } from "components/AssetInput/AssetInput"
import { Text } from "components/Typography/Text/Text"
import { ReactNode, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { theme } from "theme"
import { getFloatingPointAmount } from "utils/balance"
import { useDisplayPrice } from "utils/displayAsset"
import { Maybe } from "utils/helpers"
import { SContainer, SMaxButton } from "./AssetSelect.styled"
import { useRpcProvider } from "providers/rpcProvider"
import { AssetSelectButton } from "./AssetSelectButton"
import { useMedia } from "react-use"
import { useDisplayShareTokenPrice } from "utils/displayAsset"

export const AssetSelect = (props: {
  name: string
  value: string
  error?: string

  title: ReactNode
  className?: string
  disabled?: boolean

  id: string
  balance: Maybe<BigNumber>
  balanceMax?: BigNumber
  balanceLabel: string
  withoutMaxValue?: boolean
  withoutMaxBtn?: boolean

  onBlur?: (v: string) => void
  onChange: (v: string) => void
  onSelectAssetClick?: () => void
}) => {
  const { t } = useTranslation()
  const { assets } = useRpcProvider()
  const asset = assets.getAsset(props.id)
  const { decimals, symbol } = asset

  const isAssetFound = !!asset?.id

  const isTablet = useMedia(theme.viewport.gte.sm)

  const spotPriceId =
    assets.isBond(asset) && !asset.isTradable ? asset.assetId : asset.id
  const isShareToken = asset.isShareToken

  const spotPriceAsset = useDisplayPrice(isShareToken ? undefined : spotPriceId)
  const spotPriceShareToken = useDisplayShareTokenPrice(
    isShareToken ? [spotPriceId] : [],
  )

  const spotPrice = isShareToken
    ? spotPriceShareToken.data?.[0]
    : spotPriceAsset.data

  const displayValue = useMemo(() => {
    if (!props.value) return 0
    if (spotPrice?.spotPrice == null) return null
    return spotPrice.spotPrice.times(props.value)
  }, [props.value, spotPrice])

  return (
    <>
      <SContainer
        className={props.className}
        htmlFor={props.name}
        error={!!props.error}
        disabled={props.disabled}
      >
        <div sx={{ flex: "row", justify: "space-between" }}>
          <Text
            fw={500}
            fs={12}
            lh={22}
            tTransform="uppercase"
            color="whiteish500"
          >
            {props.title}
          </Text>
          {!props.withoutMaxValue && (
            <div
              sx={{ flex: "row", align: "center", pt: [5, 0], justify: "end" }}
            >
              <Text
                fs={11}
                lh={16}
                sx={{ mr: 5 }}
                css={{ color: `rgba(${theme.rgbColors.white}, 0.7)` }}
              >
                {props.balanceLabel}
              </Text>
              <Text fs={11} lh={16} sx={{ mr: 5 }}>
                {t("selectAsset.balance.value", {
                  balance: props.balance,
                  fixedPointScale: decimals,
                  type: "token",
                })}
              </Text>

              {!props.withoutMaxBtn && (
                <SMaxButton
                  size="micro"
                  text={t("selectAsset.button.max")}
                  onClick={(e) => {
                    e.preventDefault()
                    if (props.balance != null) {
                      const value = getFloatingPointAmount(
                        props.balanceMax ?? props.balance,
                        decimals,
                      ).toString()
                      props.onChange(value)
                      props.onBlur?.(value)
                    }
                  }}
                />
              )}
            </div>
          )}
        </div>

        <div
          sx={{
            flex: "row",
            align: "center",
            justify: "space-between",
            gap: [12, 0],
            mt: [16, 0],
          }}
        >
          <AssetSelectButton
            assetId={props.id}
            onClick={props.onSelectAssetClick}
            sx={{ maxWidth: 280 }}
            css={{ pointerEvents: !props.onSelectAssetClick ? "none" : "auto" }}
          />
          <AssetInput
            disabled={props.disabled}
            value={props.value}
            name={props.name}
            label={t("selectAsset.input.label")}
            onBlur={props.onBlur}
            onChange={props.onChange}
            displayValue={displayValue}
            placeholder="0.00"
            unit={isTablet && isAssetFound ? symbol : ""}
            error={props.error}
            css={css`
              & > label {
                padding: 0;
              }
            `}
          />
        </div>
      </SContainer>
      {props.error && <SErrorMessage>{props.error}</SErrorMessage>}
    </>
  )
}
