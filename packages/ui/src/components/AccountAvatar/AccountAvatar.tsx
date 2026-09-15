import { Suspense, useMemo } from "react"

import { accountIcon } from "@/components/AccountAvatar/emoji/accountIcon"
import { AccountEmoji } from "@/components/AccountAvatar/identicons/AccountEmoji"
import { EmptyIdenticon } from "@/components/AccountAvatar/identicons/EmptyIdenticon"
import { Identican } from "@/components/AccountAvatar/identicons/Identican"
import { useAvatarStyleStore } from "@/components/AccountAvatar/store"
import { Box, BoxProps } from "@/components/Box"
import { useUiScale } from "@/styles/media"
import { getToken } from "@/utils"

export type AccountAvatarProps = BoxProps & {
  address: string
  size?: number
}

export const AccountAvatar: React.FC<AccountAvatarProps> = ({
  size = 42,
  ...props
}) => {
  const uiScale = useUiScale()
  const scaledSize = size * uiScale

  const avatarStyle = useAvatarStyleStore((state) => state.avatarStyle)
  // AccountInput passes the live input value, so the address is a partial
  // string on every keystroke — unresolvable means empty, not a fallback glyph.
  const icon = useMemo(() => accountIcon(props.address), [props.address])

  return (
    <Suspense
      fallback={
        <Box
          size={scaledSize}
          borderRadius="full"
          bg={getToken("surfaces.containers.dim.dimOnHigh")}
        />
      }
    >
      {!icon ? (
        <EmptyIdenticon size={scaledSize} {...props} />
      ) : avatarStyle === "emoji" ? (
        <AccountEmoji size={scaledSize} {...props} />
      ) : (
        <Identican size={scaledSize} {...props} />
      )}
    </Suspense>
  )
}
