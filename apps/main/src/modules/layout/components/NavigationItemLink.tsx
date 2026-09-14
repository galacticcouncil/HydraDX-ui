import { MoveUpRight } from "@galacticcouncil/ui/assets/icons"
import { ExternalLink, Flex, Icon } from "@galacticcouncil/ui/components"
import { Link, LinkProps } from "@tanstack/react-router"
import { FC, ReactNode } from "react"

import {
  ExternalNavigationItem,
  InternalNavigationItem,
  NavigationItem,
} from "@/config/navigation"

type NavigationItemLinkProps = {
  readonly item: NavigationItem
  readonly children: ReactNode
} & Omit<LinkProps, "to" | "search" | "children">

export const isExternalNavItem = (
  item: NavigationItem,
): item is ExternalNavigationItem => "href" in item

export const isInternalNavItem = (
  item: NavigationItem,
): item is InternalNavigationItem => "to" in item

export const NavigationItemLink: FC<NavigationItemLinkProps> = ({
  item,
  children,
  ...props
}) => {
  if (isExternalNavItem(item)) {
    return (
      <ExternalLink
        href={item.href}
        underlined={false}
        sx={{ textDecoration: "none" }}
        {...props}
      >
        {children}
      </ExternalLink>
    )
  }

  const linkTo = item.defaultChild ?? item.to

  return (
    <Link
      to={linkTo}
      params={item.params}
      search={item.search}
      sx={{ textDecoration: "none" }}
      {...props}
    >
      {children}
    </Link>
  )
}

type NavigationItemLabelProps = {
  readonly title: string
  readonly external?: boolean
}

export const NavigationItemLabel: FC<NavigationItemLabelProps> = ({
  title,
  external,
}) => (
  <Flex as="span" align="center" gap="xs">
    {title}
    {external && <Icon component={MoveUpRight} size="xs" aria-hidden />}
  </Flex>
)
