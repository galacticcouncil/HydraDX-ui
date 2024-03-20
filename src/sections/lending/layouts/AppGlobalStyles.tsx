import { createTheme, ThemeProvider } from "@mui/material"
import { deepmerge } from "@mui/utils"
import { ReactNode } from "react"

import {
  getDesignTokens,
  getThemedComponents,
} from "sections/lending/utils/theme"

const themeCreate = createTheme(getDesignTokens("dark"))
const theme = deepmerge(themeCreate, getThemedComponents(themeCreate))

export function AppGlobalStyles({ children }: { children: ReactNode }) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>
}
