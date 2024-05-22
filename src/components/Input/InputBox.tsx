import { forwardRef } from "react"
import { InputProps } from "./Input"
import { SInputBoxContainer, SInputBox, SError } from "./Input.styled"
import { Text } from "components/Typography/Text/Text"

export const InputBox = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      onChange,
      value,
      label,
      type = "text",
      placeholder,
      name,
      withLabel,
      tooltip,
      ...p
    },
    ref,
  ) => (
    <>
      <SInputBoxContainer error={!!p.error} disabled={p.disabled}>
        <div
          sx={{
            flex: "row",
            align: "center",
            justify: "space-between",
            height: 18,
          }}
        >
          {withLabel && (
            <Text tTransform="uppercase" color="basic500" fs={11}>
              {label}
            </Text>
          )}
        </div>
        <div
          sx={{
            flex: "row",
            align: "center",
            justify: "space-between",
            height: 40,
          }}
        >
          <SInputBox
            ref={ref}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange(e.target.value)
            }
            value={value ?? ""}
            id={name}
            type={type}
            error={p.error}
            unit={p.unit}
            placeholder={placeholder}
            role="presentation"
            autoComplete="off"
            {...p}
          />
        </div>
      </SInputBoxContainer>
      {p.error && <SError>{p.error}</SError>}
    </>
  ),
)
