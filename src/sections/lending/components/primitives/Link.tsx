import { Link as MuiLink, LinkProps as MuiLinkProps } from "@mui/material"
import { SxProps as MuiSxProps } from "@mui/system"
import { Link as RouterLink } from "@tanstack/react-location"
import { forwardRef } from "react"
import { CustomMarket } from "sections/lending/ui-config/marketsConfig"
import { withoutHexPrefix } from "sections/lending/utils/utils"

const RouterLinkComposed = forwardRef<HTMLAnchorElement, MuiLinkProps>(
  (props, ref) => (
    <RouterLink
      _ref={ref}
      to={props.href}
      title={props.title}
      className={props.className}
    >
      {props.children}
    </RouterLink>
  ),
)

export type LinkProps = MuiLinkProps

export const Link = forwardRef<HTMLAnchorElement, MuiLinkProps>(
  function Link(props, ref) {
    const { className, children, href, sx, ...other } = props

    const isExternal =
      typeof href === "string" &&
      (href.indexOf("http") === 0 || href.indexOf("mailto:") === 0)

    if (isExternal) {
      return (
        <MuiLink
          ref={ref}
          href={href}
          className={className}
          target="_blank"
          rel="noopener"
          sx={sx as MuiSxProps}
          underline="none"
          {...other}
        >
          {children}
        </MuiLink>
      )
    }

    return (
      <MuiLink
        ref={ref}
        href={href}
        className={className}
        component={RouterLinkComposed}
        sx={sx as MuiSxProps}
        underline="none"
        {...other}
      >
        {children}
      </MuiLink>
    )
  },
)

export const ROUTES = {
  dashboard: "/lending",
  markets: "/lending/markets",
  faucet: "/lending/faucet",
  migrationTool: "/lending/v3-migration",
  dynamicRenderedProposal: (proposalId: number) =>
    `/lending/governance/v3/proposal?proposalId=${proposalId}`,
  reserveOverview: (underlyingAsset: string, marketName: CustomMarket) =>
    `/lending/reserve-overview/?underlyingAsset=${withoutHexPrefix(
      underlyingAsset,
    )}&marketName=${marketName}`,
  history: "/lending/history",
}
