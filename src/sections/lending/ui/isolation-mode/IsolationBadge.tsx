import { InfoTooltip } from "components/InfoTooltip/InfoTooltip"
import { Text } from "components/Typography/Text/Text"
import { ReactNode } from "react"
import { theme } from "theme"

const contentCss = {
  borderRadius: 4,
  display: "inline-flex",
  alignItems: "center",
  padding: "2px 4px",
  cursor: "pointer",
  "&:hover": { opacity: 0.6 },
}

const InfoIcon = () => (
  <span
    css={{
      display: "inline-flex",
      width: "1.2em",
      height: "1.2em",
      border: "1px solid currentColor",
      borderRadius: "50%",
      textAlign: "center",
      alignItems: "center",
      justifyContent: "center",
    }}
    sx={{
      ml: 3,
      fontSize: 10,
    }}
  >
    i
  </span>
)
export const IsolatedEnabledBadge = () => {
  return (
    <InfoTooltip
      asChild
      text={
        <IsolationModeTooltipTemplate
          content={
            <span>
              Isolated assets have limited borrowing power and other assets
              cannot be used as collateral.
            </span>
          }
        />
      }
    >
      <div
        css={{
          border: `1px solid ${theme.colors.warning300}`,
          color: theme.colors.warning300,
          ...contentCss,
        }}
      >
        <Text fs={14} color="warning300">
          Isolated
        </Text>
        <InfoIcon />
      </div>
    </InfoTooltip>
  )
}

export const IsolatedDisabledBadge = () => {
  return (
    <InfoTooltip
      asChild
      text={
        <IsolationModeTooltipTemplate
          content={
            <span>
              Asset can be only used as collateral in isolation mode with
              limited borrowing power. To enter isolation mode, disable all
              other collateral.
            </span>
          }
        />
      }
    >
      <div
        css={{
          border: `1px solid ${theme.colors.red400}`,
          color: theme.colors.red400,
          ...contentCss,
        }}
      >
        <Text fs={14} color="red400">
          Unavailable
        </Text>
        <InfoIcon />
      </div>
    </InfoTooltip>
  )
}

export const UnavailableDueToIsolationBadge = () => {
  return (
    <InfoTooltip
      asChild
      text={
        <IsolationModeTooltipTemplate
          content={
            <span>Collateral usage is limited because of isolation mode.</span>
          }
        />
      }
    >
      <div
        css={{
          border: `1px solid ${theme.colors.red400}`,
          color: theme.colors.red400,
          ...contentCss,
        }}
      >
        <Text fs={14} color="red400">
          Unavailable
        </Text>
        <InfoIcon />
      </div>
    </InfoTooltip>
  )
}

const IsolationModeTooltipTemplate = ({ content }: { content: ReactNode }) => {
  return (
    <div>
      <Text fs={12} lh={18} sx={{ mb: 6 }}>
        {content}
      </Text>
      <Text fs={12} lh={18}>
        <span>
          Learn more in our{" "}
          <a
            target="_blank"
            href="https://docs.aave.com/faq/aave-v3-features#isolation-mode"
            rel="noreferrer"
            css={{ textDecoration: "underline" }}
          >
            FAQ guide
          </a>
        </span>
      </Text>
    </div>
  )
}
