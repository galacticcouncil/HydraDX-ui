import styled from "@emotion/styled"
import { theme } from "theme"

export const SContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;

  margin-top: 20px;

  @media ${theme.viewport.gte.sm} {
    position: fixed;
    bottom: 0;
    left: 0;

    width: 100%;
    padding: 10px 0;
    margin-top: 0;

    background: rgba(0, 0, 0, 0.3);
  }
`
