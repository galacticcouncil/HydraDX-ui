import { Text } from "components/Typography/Text/Text"
import { InputHTMLAttributes, forwardRef, ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { HYDRA_ADDRESS_PREFIX } from "utils/api"
import { safeConvertAddressSS58 } from "utils/formatting"
import { Maybe } from "utils/helpers"
import { SInput, SInputWrapper } from "./AddressInput.styled"
import { useAssets } from "providers/assets"

type InputProps = {
  onBlur?: () => void
  onChange?: (value: string) => void
  value: Maybe<string>
  disabled?: boolean
  type?: InputHTMLAttributes<HTMLInputElement>["type"]

  name: string
  label?: string
  error?: string
  placeholder?: string
  className?: string
  rightIcon?: ReactNode
}

export const AddressInput = forwardRef<HTMLInputElement, InputProps>(
  (props, ref) => {
    const { native } = useAssets()
    const { t } = useTranslation()

    const nativeAddress = safeConvertAddressSS58(
      props.value,
      HYDRA_ADDRESS_PREFIX,
    )

    return (
      <SInputWrapper disabled={props.disabled} className={props.className}>
        <div sx={{ flex: "column", width: "calc(100% - 34px)" }}>
          <SInput
            ref={ref}
            onChange={(e) => props.onChange?.(e.target.value)}
            onBlur={props.onBlur}
            value={props.value ?? ""}
            id={props.name}
            type={props.type}
            error={props.error}
            disabled={props.disabled}
            placeholder={props.placeholder}
            autoComplete="off"
          />
          {nativeAddress && nativeAddress !== props.value && (
            <Text
              color="brightBlue300"
              fs={12}
              lh={16}
              css={{ wordWrap: "break-word" }}
            >
              {t("address.input.native", {
                symbol: native.symbol,
                address: nativeAddress,
              })}
            </Text>
          )}
        </div>
        {props.rightIcon ?? null}
      </SInputWrapper>
    )
  },
)
