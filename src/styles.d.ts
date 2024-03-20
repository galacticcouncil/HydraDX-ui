import { Theme } from "@mui/material"
import { SxProps as MuiSxProps } from "@mui/system"
import { SxProps } from "jsx/jsx-sx-convert"

declare module "react" {
  interface Attributes {
    sx?: SxProps | MuiSxProps<Theme>
  }
}
