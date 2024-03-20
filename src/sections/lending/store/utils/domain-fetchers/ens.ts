import { DomainType, WalletDomain } from "sections/lending/store/walletDomains"
import { getENSProvider } from "sections/lending/utils/marketsAndNetworksConfig"
import { tFetch } from "sections/lending/utils/tFetch"

const mainnetProvider = getENSProvider()

const getEnsName = async (address: string): Promise<string | null> => {
  try {
    const name = await mainnetProvider.lookupAddress(address)
    return name
  } catch (error) {
    console.error("ENS name lookup error", error)
  }
  return null
}

const getEnsAvatar = async (name: string): Promise<string | undefined> => {
  try {
    const image = `https://metadata.ens.domains/mainnet/avatar/${name}/`
    await tFetch<never>(image, { method: "HEAD" })
    return image
  } catch (error) {
    console.error("ENS avatar lookup error", error)
  }
}

export const getEnsDomain = async (
  address: string,
): Promise<WalletDomain | null> => {
  const name = await getEnsName(address)
  if (!name) return null
  const avatar = await getEnsAvatar(name)
  return { name, avatar, type: DomainType.ENS }
}
