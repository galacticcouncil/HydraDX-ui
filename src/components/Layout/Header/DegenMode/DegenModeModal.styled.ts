import styled from "@emotion/styled"
import { Link } from "@tanstack/react-location"
import { theme } from "theme"

export const SLearnMoreLink = styled(Link)`
  font-weight: 500;
  color: ${theme.colors.brightBlue300};

  border-bottom: 1px solid ${theme.colors.brightBlue300};
  transition: all 0.15s ease-in-out;

  &:hover {
    opacity: 0.8;
  }

  svg {
    width: 10px;
    height: 10px;
    margin-left: 4px;
  }
`
