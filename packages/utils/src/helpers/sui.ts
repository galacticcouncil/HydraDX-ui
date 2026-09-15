import { Buffer } from "buffer"
import { AccountId } from "polkadot-api"

const SUIVISION_URL = "https://suivision.xyz"

export const suivision = {
  account: (address: string) =>
    `${SUIVISION_URL}/account/${encodeURIComponent(address)}`,
}

export const safeConvertSuiAddressToSS58 = (
  address: string,
  ss58prefix = 0,
) => {
  try {
    return AccountId(ss58prefix).dec(address)
  } catch {
    return ""
  }
}
export function safeConvertSS58ToSuiAddress(ss58Addr: string) {
  try {
    const u8a = AccountId().enc(ss58Addr)
    return "0x" + Buffer.from(u8a).toString("hex")
  } catch {
    return ""
  }
}
