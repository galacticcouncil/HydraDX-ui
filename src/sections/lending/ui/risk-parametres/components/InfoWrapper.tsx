import { Text } from "components/Typography/Text/Text"
import { ReactNode } from "react"
import { theme } from "theme"

interface InfoWrapperProps {
  topValue: ReactNode
  topTitle: ReactNode
  topDescription: ReactNode
  children: ReactNode
  bottomText: ReactNode
  color: string
}

export const InfoWrapper = ({
  topValue,
  topTitle,
  topDescription,
  children,
  bottomText,
  color,
}: InfoWrapperProps) => {
  return (
    <div
      sx={{ px: 16, py: 20 }}
      css={{
        background: `rgba(${theme.rgbColors.alpha0}, 0.06)`,
        borderRadius: theme.borderRadius.medium,
        border: `1px solid rgba(${theme.rgbColors.primaryA0}, 0.35)`,
      }}
    >
      <div sx={{ flex: "row", justify: "space-between" }}>
        <div sx={{ width: "calc(100% - 90px)" }}>
          <Text fs={14} color="white" sx={{ mb: 16 }}>
            {topTitle}
          </Text>
          <Text fs={13} lh={17} color="basic300">
            {topDescription}
          </Text>
        </div>

        <div
          css={{
            width: 75,
            height: 75,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `radial-gradient(147.94% 147.94% at 50.5% -6.6%, ${color} 0%, rgba(255, 85, 89, 0.00) 100%)`,
          }}
        >
          <Text fs={13} font="ChakraPetchSemiBold">
            {topValue}
          </Text>
        </div>
      </div>

      <div>{children}</div>

      <Text fs={13} lh={17} color="basic300">
        {bottomText}
      </Text>
    </div>
  )
}
