import { accountPublicKey } from "@galacticcouncil/utils"

import { DEGENS, EMOJIS } from "./snakewatch"

export type AccountIcon = { emoji: string } | { image: string }

export const accountIcon = (address: string): AccountIcon | null => {
  const publicKey = accountPublicKey(address)
  if (!publicKey) return null

  // ponytail: the lossy Number() is the spec, matching snakewatch's emojify.js.
  // The double is m*2^e with e~202, so both the halving and the modulo are exact
  // — no BigInt, no Math.floor.
  return (
    DEGENS[publicKey] ?? {
      emoji: EMOJIS[(Number(publicKey) / 2) % EMOJIS.length],
    }
  )
}
