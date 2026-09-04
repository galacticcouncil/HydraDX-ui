import { describe, expect, it } from "vitest"

import { accountIcon } from "./accountIcon"

// Expectations pinned by running upstream snakewatch emojify.js once against
// each input's chain-native public key (see progress.txt US-004). This is a
// parity test: if the vendored array reorders or the derivation drifts, it fails.
describe("accountIcon", () => {
  it.each([
    ["ss58", "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY", "🐷"],
    ["h160", "0x222222ff7Be76052e023Ec1a306fCca8F9659D80", "🦌"],
    ["solana", "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM", "🦎"],
    [
      "sui",
      "0x0000000000000000000000000000000000000000000000000000000000000002",
      "🐒",
    ],
  ])("derives the glyph for a %s address", (_, address, emoji) => {
    expect(accountIcon(address)).toEqual({ emoji })
  })

  it("prefers a plain-glyph degen override", () => {
    expect(
      accountIcon("7Hsq5RH9xUtPWFZMGXtoVWNd4CEjpJWsidf7bcGwNwdxp9Ha"),
    ).toEqual({ emoji: "🍺" })
  })

  it("prefers a discord-image degen override", () => {
    const icon = accountIcon("7MsLP8yfa4dzCAyBX5jxDk2UR7DEATQYNcfpMxgnRDWx6Xin")
    expect(icon).toHaveProperty("image")
    expect((icon as { image: string }).image).toContain("989553819539103764")
  })

  it("returns null for an unresolvable address", () => {
    expect(accountIcon("7Hsq5RH9xUtPW")).toBeNull()
  })
})
