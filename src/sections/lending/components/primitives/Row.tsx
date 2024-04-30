import styled from "@emotion/styled"
import { ReactNode } from "react"
import { theme } from "theme"

type RowProps = {
  captionColor?: keyof typeof theme.colors
  align?: "center" | "start" | "end"
  className?: string
  caption?: ReactNode
  children: ReactNode
}

const SRow = styled.div`
  display: flex;
  justify-content: space-between;

  font-size: 14px;

  margin-bottom: 8px;

  &:last-of-type {
    margin-bottom: 0;
  }
`

export const Row = ({
  caption,
  children,
  captionColor,
  align = "start",
  className,
}: RowProps) => {
  return (
    <SRow
      className={className}
      sx={{
        align,
      }}
    >
      {caption && <span sx={{ mr: 8, color: captionColor }}>{caption}</span>}
      {children}
    </SRow>
  )
}
