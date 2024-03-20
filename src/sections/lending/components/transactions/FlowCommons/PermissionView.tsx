import { Box, Button, Link, Typography } from "@mui/material"
import { useModalContext } from "sections/lending/hooks/useModal"

export const PermissionView = () => {
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
        <Typography sx={{ mt: 14 }} variant="h2">
          <span>Allowance required action</span>
        </Typography>
        <Typography sx={{ mt: "10px", textAlign: "center" }}>
          <span>
            To request access for this permissioned market, please visit:{" "}
            <Link href={"https://access-provider-url"}>
              Acces Provider Name
            </Link>
          </span>
        </Typography>
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
