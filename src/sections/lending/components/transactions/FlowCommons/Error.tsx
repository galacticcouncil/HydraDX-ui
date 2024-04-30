import { DuplicateIcon, XIcon } from "@heroicons/react/outline"

import { Box, Button, Link, SvgIcon, Typography } from "@mui/material"
import { useModalContext } from "sections/lending/hooks/useModal"
import { TxErrorType } from "sections/lending/ui-config/errorMapping"

export const TxErrorView = ({ txError }: { txError: TxErrorType }) => {
  const { close } = useModalContext()

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          mb: "92px",
        }}
      >
        <Box
          sx={{
            width: "48px",
            height: "48px",
            backgroundColor: "error.200",
            borderRadius: "50%",
            mt: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SvgIcon sx={{ color: "error.main", fontSize: "32px" }}>
            <XIcon />
          </SvgIcon>
        </Box>

        <Typography sx={{ mt: 2 }} variant="h2">
          <span>Transaction failed</span>
        </Typography>

        <Typography>
          <span>
            You can report incident to our{" "}
            <Link href="https://discord.com/invite/aave">Discord</Link> or
            <Link href="https://github.com/aave/interface">Github</Link>.
          </span>
        </Typography>

        <Button
          variant="outlined"
          onClick={() =>
            navigator.clipboard.writeText(txError.rawError.message.toString())
          }
          size="small"
          sx={{ mt: 24 }}
        >
          <span>Copy error text</span>

          <SvgIcon sx={{ ml: 0.5, fontSize: "12px" }}>
            <DuplicateIcon />
          </SvgIcon>
        </Button>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", mt: 16 }}>
        <Button
          onClick={close}
          variant="contained"
          size="large"
          sx={{ minHeight: "44px" }}
        >
          <span>Close</span>
        </Button>
      </Box>
    </>
  )
}
