import { useMemo } from "react"

import { accountIcon } from "@/components/AccountAvatar/emoji/accountIcon"
import { Flex, FlexProps } from "@/components/Flex"
import { Image } from "@/components/Image"
import { getToken } from "@/utils"

export type AccountEmojiProps = FlexProps & {
  address: string
  size: number
}

export const AccountEmoji: React.FC<AccountEmojiProps> = ({
  address,
  size,
  ...props
}) => {
  const icon = useMemo(() => accountIcon(address), [address])

  return (
    <Flex
      size={size}
      borderRadius="full"
      align="center"
      justify="center"
      bg={getToken("controls.dim.base")}
      sx={{ overflow: "hidden" }}
      {...props}
    >
      {icon && "image" in icon ? (
        <Image
          src={icon.image}
          alt=""
          width={size}
          height={size}
          sx={{ objectFit: "contain" }}
        />
      ) : (
        <span aria-hidden style={{ fontSize: size * 0.6, lineHeight: 1 }}>
          {icon?.emoji}
        </span>
      )}
    </Flex>
  )
}
