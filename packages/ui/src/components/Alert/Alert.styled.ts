import { Icon } from "@/components/Icon"
import { createVariants, css, styled } from "@/utils"

export type AlertVariant = "info" | "error" | "success" | "warning"

const containerVariants = createVariants<AlertVariant>((theme) => ({
  info: css`
    background: ${theme.colors.azureBlue.alpha[500]};
  `,
  error: css`
    background: ${theme.accents.danger.dimBg};
  `,
  success: css`
    background: ${theme.accents.success.dim};
  `,
  warning: css`
    background: ${theme.accents.alert.dimBg};
  `,
}))

export const SAlertContainer = styled.div<{
  readonly variant?: AlertVariant
  readonly hasDescription?: boolean
}>(({ theme, variant = "info", hasDescription }) => [
  css`
    display: grid;
    grid-template-columns: auto 1fr;
    gap: ${theme.space.base};

    padding: ${theme.containers.paddings.quart};
    border-radius: ${theme.space.base};

    ${!hasDescription &&
    css`
      align-items: center;
    `}
  `,
  containerVariants(variant),
])

const textColorVariants = createVariants<AlertVariant>((theme) => ({
  info: css`
    color: ${theme.accents.info.onPrimary};
  `,
  error: css`
    color: ${theme.accents.danger.secondary};
  `,
  success: css`
    color: ${theme.accents.success.emphasis};
  `,
  warning: css`
    color: ${theme.accents.alertAlt.primary};
    filter: brightness(0.8);
  `,
}))

export const SAlertTitle = styled.span<{
  readonly variant?: AlertVariant
}>(({ theme, variant = "info" }) => [
  css`
    font-family: ${theme.fontFamilies1.secondary};
    font-weight: 500;
    font-size: ${theme.fontSizes.p4};
    line-height: 1;
  `,
  textColorVariants(variant),
])

export const SAlertIcon = styled(Icon)<{
  readonly variant: AlertVariant
}>(({ variant }) => textColorVariants(variant))
