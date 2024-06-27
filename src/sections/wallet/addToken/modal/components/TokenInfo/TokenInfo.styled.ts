import styled from "@emotion/styled"

export const STokenInfoRow = styled.div<{ expanded?: boolean }>`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;

  padding: 6px 0;

  height: ${({ expanded }) => (expanded ? "auto" : "26px")};
`

export const SLogoContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  position: relative;

  & > svg {
    position: absolute;
    width: 16px;
    height: 16px;
    bottom: 0px;
    right: 0px;
  }
`
