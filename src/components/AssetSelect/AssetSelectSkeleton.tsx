import { AssetInput } from "components/AssetInput/AssetInput"
import { useTranslation } from "react-i18next"
import { SContainer, SMaxButton } from "./AssetSelect.styled"
import { Text } from "components/Typography/Text/Text"
import Skeleton from "react-loading-skeleton"
import { ReactNode } from "react"
import { theme } from "theme"
import { css } from "@emotion/react"

export const AssetSelectSkeleton = (props: {
  name: string
  title: ReactNode
  balanceLabel: string
}) => {
  const { t } = useTranslation()
  return (
    <>
      <SContainer htmlFor={props.name}>
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
            <Skeleton height={10} width={20} sx={{ mr: 8 }} />
            <SMaxButton
              size="micro"
              text={t("selectAsset.button.max")}
              disabled
            />
          </div>
        </div>

        <div
          sx={{
            flex: ["column", "row"],
            align: ["flex-start", "center"],
            justify: "space-between",
            gap: [12, 0],
            mt: [16, 0],
          }}
        >
          <div sx={{ flex: "row", gap: 4 }}>
            <Skeleton circle height={30} width={30} />
            <div sx={{ flex: "column", justify: "space-between" }}>
              <Skeleton height={14} width={30} />
              <Skeleton height={10} width={30} />
            </div>
          </div>

          <AssetInput
            disabled
            value=""
            name={props.name}
            label={t("selectAsset.input.label")}
            onChange={() => null}
            displayValue={0}
            placeholder="0.00"
            unit="HDX"
            css={css`
              & > label {
                padding: 0;
              }
            `}
          />
        </div>
      </SContainer>
    </>
  )
}
