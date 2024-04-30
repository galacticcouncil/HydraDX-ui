import { css, SerializedStyles } from "@emotion/react"
import styled from "@emotion/styled"
import { theme } from "theme"
import { ButtonProps, ButtonSize, ButtonVariant } from "./Button"

export const SButton = styled.button<ButtonProps>`
  cursor: pointer;
  text-transform: ${({ transform }) => transform ?? "uppercase"};

  font-family: "ChakraPetch";

  border: none;
  border-radius: 4px;

  transition: ${theme.transitions.slow};

  height: fit-content;

  ${({ variant }) => variant && variantStyles[variant]}
  ${({ size }) => size && sizeStyles[size]}
  ${({ active }) =>
    active &&
    css`
      background: ${theme.colors.brightBlue700};

      border: 1px solid ${theme.colors.brightBlue700};

      transition: all ${theme.transitions.default};
    `}

    ${({ fullWidth }) =>
    fullWidth &&
    css`
      width: 100%;
    `}

  &:disabled {
    cursor: not-allowed;
    box-shadow: unset;
    transform: none;

    color: ${theme.colors.darkBlue300};
    border: 1px solid ${theme.colors.darkBlue300};
    background: rgba(${theme.rgbColors.alpha0}, 0.06);

    opacity: 0.7;

    &::after,
    &::before {
      all: unset;
    }
  }

  ${({ isLoading }) =>
    isLoading &&
    css`
      background: rgba(218, 255, 238, 0.06);
    `}
`

export const SContent = styled.span<{ size: ButtonSize }>`
  display: flex;
  gap: ${({ size }) => (size === "compact" || size === "micro" ? "4" : "10")}px;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
`
export const SButtonTransparent = styled.button`
  background: transparent;
  margin: 0;
  padding: 0;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;

  cursor: pointer;

  &[disabled] {
    cursor: unset;
  }
`

const variantStyles: Record<ButtonVariant, SerializedStyles> = {
  primary: css`
    background: ${theme.colors.pink700};
    color: ${theme.colors.white};

    position: relative;

    -webkit-transition:
      all 0.3s,
      background 0.1s,
      border 0.1s;
    transition:
      all 0.3s,
      background 0.1s,
      border 0.1s;

    box-shadow:
      rgb(246 40 124 / 45%) 0px 13px 40px -12px,
      rgb(195 145 199 / 30%) 0px 0px 0px -1px;

    border: 1px solid transparent;

    transform-style: preserve-3d;

    :before {
      content: "";
      position: absolute;
      inset: 0;

      height: 100%;
      width: 100%;

      background: linear-gradient(
        129deg,
        rgba(122, 96, 138, 0.25) 0%,
        rgba(255, 153, 202, 0.23) 100%
      );

      border-radius: 4px;

      transform: translate3d(0px, 0px, -1px);
      -webkit-transition: 0.3s;
      transition: 0.3s;
    }

    :hover:before {
      transform: translate3d(5px, 5px, -1px);
    }

    :hover {
      background: ${theme.colors.pink600};

      border: 1px solid rgba(255, 212, 222, 0.2);

      box-shadow: rgb(255 15 111 / 30%) 4px 10px 40px 0px;

      transform: translate(-5px, -5px);
      transform-style: preserve-3d;
    }

    :active {
      transform: translate3d(-3px, -3px, -1px);
      box-shadow: 0px 13px 40px -12px rgba(246, 41, 124, 0.45);
    }

    :active:before {
      transform: translate3d(3px, 3px, -1px);
    }
  `,
  secondary: css`
    border-radius: 4px;
    background: rgba(${theme.rgbColors.primaryA15}, 0.12);
    color: ${theme.colors.brightBlue300};
    border: 1px solid ${theme.colors.brightBlue300};
    box-shadow: unset;

    :hover {
      background: rgba(${theme.rgbColors.brightBlue500}, 0.9);
      color: ${theme.colors.white};
      border: 1px solid ${theme.colors.brightBlue100};
    }

    :active {
      background: ${theme.colors.brightBlue400};
      color: ${theme.colors.white};
      border: 1px solid ${theme.colors.brightBlue100};
    }
  `,
  mutedSecondary: css`
    font-weight: 500;
    border-radius: 4px;
    background: rgba(${theme.rgbColors.primaryA15}, 0.12);
    color: ${theme.colors.brightBlue300};
    border: 1px solid rgba(${theme.rgbColors.brightBlue300}, 0.4);
    box-shadow: unset;

    :hover {
      color: ${theme.colors.white};
      background: rgba(${theme.rgbColors.primaryA15}, 0.24);
      border: 1px solid rgba(${theme.rgbColors.brightBlue300}, 0.8);
    }

    :active {
      background: ${theme.colors.brightBlue400};
      color: ${theme.colors.white};
      border: 1px solid ${theme.colors.brightBlue100};
    }
  `,
  error: css`
    border-radius: 4px;
    background: rgba(${theme.rgbColors.red400}, 0.2);
    color: ${theme.colors.red400};
    border: 1px solid rgba(${theme.rgbColors.red400}, 0.5);
    box-shadow: unset;

    :hover {
      background: rgba(${theme.rgbColors.red100}, 0.5);
      color: ${theme.colors.red400};
      border: 1px solid ${theme.colors.red400};
    }

    :active {
      background: ${theme.colors.red100};
      color: ${theme.colors.red400};
      border: 1px solid ${theme.colors.red400};
    }
  `,
  mutedError: css`
    font-weight: 500;
    border-radius: 4px;
    background: rgba(${theme.rgbColors.red100}, 0.2);
    color: ${theme.colors.red400};
    border: 1px solid rgba(${theme.rgbColors.red400}, 0.5);
    box-shadow: unset;

    :hover {
      color: ${theme.colors.white};
      background: rgba(${theme.rgbColors.red100}, 0.4);
      border: 1px solid rgba(${theme.rgbColors.red400}, 0.8);
    }

    :active {
      background: ${theme.colors.red100};
      color: ${theme.colors.white};
      border: 1px solid ${theme.colors.red400};
    }
  `,
  gradient: css`
    background: ${theme.gradients.pinkLightPink};
    color: ${theme.colors.white};

    position: relative;
    overflow: hidden;

    :hover {
      &::after {
        content: "";

        width: 100%;
        height: 100%;

        position: absolute;
        top: 0;
        left: 0;

        background: rgba(${theme.rgbColors.white}, 0.2);
      }
    }
    :active {
      &::after {
        background: rgba(${theme.rgbColors.black}, 0.2);
      }
    }
  `,
  outline: css`
    background: rgba(${theme.rgbColors.white}, 0.03);
    color: ${theme.colors.white};

    border: 1px solid rgba(${theme.rgbColors.white}, 0.03);

    @media (avtive: avtive) {
      background: ${theme.colors.brightBlue700};
      border: 1px solid ${theme.colors.brightBlue700};
      transition: all ${theme.transitions.default};
    }

    @media ${theme.viewport.gte.sm} {
      :hover {
        background: ${theme.colors.brightBlue700};
        border: 1px solid ${theme.colors.brightBlue700};

        transition: all ${theme.transitions.default};
      }
    }
  `,
  transparent: css`
    background: transparent;
    color: ${theme.colors.brightBlue600};
  `,
  blue: css`
    background: ${theme.colors.brightBlue700};
    color: ${theme.colors.white};

    position: relative;

    -webkit-transition:
      all 0.3s,
      background 0.1s,
      border 0.1s;
    transition:
      all 0.3s,
      background 0.1s,
      border 0.1s;

    box-shadow: 0px 13px 40px -12px #29a0f673;

    border: 1px solid transparent;

    transform-style: preserve-3d;

    :before {
      content: "";
      position: absolute;
      inset: 0;

      height: 100%;
      width: 100%;

      background: rgba(1, 158, 255, 0.35);

      border-radius: 4px;

      transform: translate3d(0px, 0px, -1px);
      -webkit-transition: 0.3s;
      transition: 0.3s;
    }

    :hover:before {
      transform: translate3d(5px, 5px, -1px);
    }

    :hover {
      background: #23acff;

      border: 1px solid rgba(255, 212, 222, 0.2);

      transform: translate(-5px, -5px);
      transform-style: preserve-3d;
    }

    :active {
      transform: translate3d(-3px, -3px, -1px);
    }

    :active:before {
      transform: translate3d(3px, 3px, -1px);
    }
  `,
  green: css`
    border-radius: 4px;
    background: ${theme.colors.green500};
    color: ${theme.colors.darkBlue800};
    box-shadow: 3px -2px 13.4px 4px rgba(146, 250, 231, 0.27);

    :hover {
      background: #71f8c5;
      color: ${theme.colors.darkBlue800};
    }

    :active {
      background: #c0fbe5;
      color: ${theme.colors.darkBlue800};
    }
  `,
}

const sizeStyles: Record<ButtonSize, SerializedStyles> = {
  medium: css`
    padding: 16px 23px;
    font-size: 14px;
  `,
  small: css`
    padding: 12px 15px;
    font-size: 12px;
    line-height: 12px;
  `,
  compact: css`
    padding: 6px 12px;
    font-size: 12px;
    line-height: 16px;
  `,
  micro: css`
    padding: 2px 10px;
    font-size: 12px;
    line-height: 16px;
  `,
}
