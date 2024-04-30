import { ExternalLinkIcon } from "@heroicons/react/outline"
import { CheckIcon } from "@heroicons/react/solid"

import { Box, Button, Link, SvgIcon, Typography } from "@mui/material"
import { ReactNode } from "react"
import { useModalContext } from "sections/lending/hooks/useModal"
import { useProtocolDataContext } from "sections/lending/hooks/useProtocolDataContext"

export type BaseSuccessTxViewProps = {
  txHash?: string
  children: ReactNode
}

const ExtLinkIcon = () => (
  <SvgIcon sx={{ ml: "2px", fontSize: "11px" }}>
    <ExternalLinkIcon />
  </SvgIcon>
)

export const BaseSuccessView = ({
  txHash,
  children,
}: BaseSuccessTxViewProps) => {
  const { close, mainTxState } = useModalContext()
  const { currentNetworkConfig } = useProtocolDataContext()

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            width: "48px",
            height: "48px",
            bgcolor: "success.200",
            borderRadius: "50%",
            mt: 14,
            mx: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SvgIcon sx={{ color: "success.main", fontSize: "32px" }}>
            <CheckIcon />
          </SvgIcon>
        </Box>

        <Typography sx={{ mt: 4 }} variant="h2">
          <span>All done!</span>
        </Typography>

        {children}
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <Link
          variant="helperText"
          href={currentNetworkConfig.explorerLinkBuilder({
            tx: txHash ? txHash : mainTxState.txHash,
          })}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "right",
            mt: 24,
            mb: 3,
          }}
          underline="hover"
          target="_blank"
          rel="noreferrer noopener"
        >
          <span>Review tx details</span>
          <ExtLinkIcon />
        </Link>
        <Button
          onClick={close}
          variant="contained"
          size="large"
          sx={{ minHeight: "44px" }}
          data-cy="closeButton"
        >
          <span>Ok, Close</span>
        </Button>
      </Box>
    </>
  )
}
