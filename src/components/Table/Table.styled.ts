import { css } from "@emotion/react"
import styled from "@emotion/styled"
import { theme } from "theme"

export const TableContainer = styled.div`
  background: ${theme.colors.darkBlue700};
  overflow: hidden;
  position: relative;

  margin: 0 -15px;

  border-top: 1px solid rgba(152, 176, 214, 0.27);

  @media ${theme.viewport.gte.sm} {
    border-radius: ${theme.borderRadius.medium}px;

    margin: unset;

    border-top: 0;

    :before {
      content: "";
      position: absolute;
      inset: 0;

      pointer-events: none;

      border-radius: 8px;
      padding: 1px; // a width of the border

      background: linear-gradient(
        180deg,
        rgba(152, 176, 214, 0.27) 0%,
        rgba(163, 177, 199, 0.15) 66.67%,
        rgba(158, 167, 180, 0.2) 100%
      );

      -webkit-mask:
        linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
    }
  }
`

export const StatsTableContainer = styled.div`
  overflow: hidden;
  position: relative;

  border-radius: ${theme.borderRadius.medium}px;
  border: 1px solid rgba(152, 176, 214, 0.27);
`

export const Table = styled.table`
  width: 100%;
  border-spacing: 0;
  border-collapse: collapse;
`

export const TableTitle = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 14px 20px;
  border-bottom: 1px solid rgba(${theme.rgbColors.white}, 0.06);

  @media ${theme.viewport.gte.sm} {
    padding: 24px 30px;
  }
`

export const StatsTableTitle = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 14px 20px;

  border-bottom: 1px solid #202135;

  @media ${theme.viewport.gte.sm} {
    padding: 24px 30px 0px;

    border-bottom: none;
  }
`

export const TableHeaderContent = styled.thead``

export const TableBodyContent = styled.tbody`
  position: relative;
`

export const TablePlaceholderContent = styled.div`
  position: absolute;
  top: 2px;
  left: 2px;
  right: 2px;
  bottom: 2px;
  z-index: ${theme.zIndices.tablePlaceholder};

  display: grid;
  place-items: center;

  background: rgba(11, 13, 25, 0.6);
  backdrop-filter: blur(8px);
`

export const TableRow = styled.tr<{
  header?: boolean
}>`
  transition: ${theme.transitions.slow};

  border-top: 1px solid rgba(32, 33, 53, 1);

  :hover {
    ${({ header }) =>
      !header && `background: rgba(${theme.rgbColors.white}, 0.06);`}
  }
`

export const TableRowStats = styled.tr<{
  isOdd?: boolean
  isSub?: boolean
  header?: boolean
}>`
  transition: ${theme.transitions.slow};

  border-bottom: 1px solid #202135;

  ${({ header }) =>
    !header &&
    css`
      :hover {
        background: rgba(${theme.rgbColors.white}, 0.06);
      }

      &:last-of-type {
        border-bottom: none;
      }
    `}
`

export const TableHeader = styled.th<{ canSort?: boolean }>`
  padding: 10px 0 10px 16px;

  font-size: 11px;
  line-height: 14px;
  font-family: "ChakraPetchSemiBold";

  text-transform: uppercase;
  text-align: start;
  color: rgba(${theme.rgbColors.white}, 0.7);
  color: ${theme.colors.basic600};

  ${({ canSort }) => canSort && "cursor:pointer;"}

  &:last-of-type {
    padding-right: 16px;
  }

  @media ${theme.viewport.gte.sm} {
    padding: 24px 32px;

    font-size: 12px;
    line-height: 16px;
    font-weight: 600;
  }
`

export const TableData = styled.td<{
  isExpanded?: boolean
  isSkeleton?: boolean
  sub?: boolean
}>`
  height: 56px;

  padding: 0 16px;

  ${({ isSkeleton }) => !isSkeleton && "padding-right: 0px;"}
  text-align: start;

  ${({ isExpanded }) =>
    isExpanded && `background: rgba(${theme.rgbColors.white}, 0.03);`}

  &:last-of-type {
    width: 1px;
    text-align: end;
  }

  @media ${theme.viewport.gte.sm} {
    height: 68px;

    ${({ sub }) => (sub ? `padding: 24px 32px` : "padding: 0 32px")};

    &:last-of-type {
      padding-right: 10px;
    }
  }
`
