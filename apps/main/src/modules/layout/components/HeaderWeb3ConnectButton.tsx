import { pxToRem } from "@galacticcouncil/ui/utils"
import { useAccount, Web3ConnectButton } from "@galacticcouncil/web3-connect"
import React, { useCallback, useRef, useState } from "react"

import { UserMenu } from "@/modules/layout/components/UserMenu"
import { SUserMenuAnchor } from "@/modules/layout/components/UserMenu/UserMenu.styled"
import { useRecentProviderAccountSync } from "@/states/recentProviderAccounts"

export const HeaderWeb3ConnectButton: React.FC<
  React.ComponentPropsWithoutRef<typeof Web3ConnectButton>
> = (props) => {
  useRecentProviderAccountSync()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const closeTimerRef = useRef<number | null>(null)

  const { account } = useAccount()
  const showUserMenu = !!account

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current === null) return

    window.clearTimeout(closeTimerRef.current)
    closeTimerRef.current = null
  }, [])

  const openMenu = useCallback(() => {
    clearCloseTimer()
    setIsMenuOpen(true)
  }, [clearCloseTimer])

  const scheduleCloseMenu = useCallback(() => {
    clearCloseTimer()
    closeTimerRef.current = window.setTimeout(() => {
      setIsMenuOpen(false)
      closeTimerRef.current = null
    }, 220)
  }, [clearCloseTimer])

  const onOpenChange = useCallback(
    (open: boolean) => {
      clearCloseTimer()
      setIsMenuOpen(open)
    },
    [clearCloseTimer],
  )

  const onBlur = useCallback(
    (event: React.FocusEvent<HTMLDivElement>) => {
      if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
        return
      }

      scheduleCloseMenu()
    },
    [scheduleCloseMenu],
  )

  const button = (
    <Web3ConnectButton
      {...props}
      size="large"
      variant="secondary"
      sx={{ height: pxToRem(36) }}
    />
  )

  if (!showUserMenu) return button

  return (
    <UserMenu
      open={isMenuOpen}
      onOpenChange={onOpenChange}
      onHoverStart={openMenu}
      onHoverEnd={scheduleCloseMenu}
      anchor={
        <SUserMenuAnchor
          onMouseEnter={openMenu}
          onMouseLeave={scheduleCloseMenu}
          onFocus={openMenu}
          onBlur={onBlur}
        >
          {button}
        </SUserMenuAnchor>
      }
    />
  )
}
