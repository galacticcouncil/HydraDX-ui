import { Typography } from "@mui/material"
import { ReactNode } from "react"

export type TxModalTitleProps = {
  title: ReactNode
  symbol?: string
}

export const TxModalTitle = ({ title, symbol }: TxModalTitleProps) => {
  return (
    <Typography variant="h2" sx={{ mb: 24 }}>
      {title} {symbol ?? ""}
    </Typography>
  )
}
