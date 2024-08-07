import { RugSeverityLevel, getIconByRugSeverity } from "api/external"
import { InfoTooltip } from "components/InfoTooltip/InfoTooltip"
import { SInfoIcon } from "components/InfoTooltip/InfoTooltip.styled"
import { Text } from "components/Typography/Text/Text"
import React from "react"
import { STokenInfoRow } from "./TokenInfo.styled"

export type TokenInfoRowProps = {
  label: React.ReactNode
  value: React.ReactNode
  changedValue?: React.ReactNode
  warning?: React.ReactNode
  tooltip?: string
  severity?: RugSeverityLevel
}

export const TokenInfoRow: React.FC<TokenInfoRowProps> = ({
  label,
  value,
  warning,
  tooltip,
  severity = "medium",
}) => {
  const hasWarning = !!warning
  const SeverityIcon = getIconByRugSeverity(severity)
  return (
    <STokenInfoRow expanded={hasWarning}>
      <Text
        as="span"
        fs={12}
        color={hasWarning ? "alarmRed400" : "basic400"}
        sx={{ flex: "row", align: "center", gap: 4 }}
      >
        {hasWarning && <SeverityIcon width={12} height={12} />}
        {label}
        {tooltip && (
          <InfoTooltip text={tooltip}>
            <SInfoIcon />
          </InfoTooltip>
        )}
      </Text>
      <Text as="span" fs={12} fw={500} font="GeistMedium">
        {value}
      </Text>
      {hasWarning && (
        <Text
          as="span"
          fs={11}
          sx={{ ml: 16, mt: 4, width: "100%" }}
          color="basic500"
        >
          {warning}
        </Text>
      )}
    </STokenInfoRow>
  )
}
