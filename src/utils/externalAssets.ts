import { HydradxRuntimeXcmAssetLocation } from "@polkadot/types/lookup"
import { PENDULUM_ID } from "api/externalAssetRegistry"
import { Buffer } from "buffer"
import {
  InteriorProp,
  TExternalAssetInput,
} from "sections/wallet/addToken/AddToken.utils"
import { Option } from "@polkadot/types"

export const getPendulumInputData = (
  location: HydradxRuntimeXcmAssetLocation,
): TExternalAssetInput => {
  const interiorType = location.interior.type

  if (interiorType !== "Here") {
    const interior = location.interior[
      `as${interiorType}`
    ].toHuman() as InteriorProp[]

    const newInteriorType = `X${Number(interiorType.slice(1)) + 1}`

    return {
      parents: "1",
      interior: {
        [newInteriorType]: [{ Parachain: PENDULUM_ID.toString() }, ...interior],
      },
    }
  } else {
    return {
      parents: location.parents.toString(),
      interior: interiorType,
    }
  }
}

export const getPendulumAssetIdFromGeneralKey = (generalKey: {
  length?: number
  data?: string
}) => {
  if (!generalKey || !generalKey.length || !generalKey.data) return undefined

  const bytes = Buffer.from(generalKey.data.slice(2), "hex")

  return `0x${bytes.slice(0, generalKey.length).toString("hex")}`
}

export const getGeneralKey = (
  rawLocation: Option<HydradxRuntimeXcmAssetLocation>,
) => {
  const location = rawLocation.unwrap()

  const type = location.interior.type
  if (location.interior && type !== "Here") {
    const xcm = location.interior[`as${type}`]

    const generalKey = !Array.isArray(xcm)
      ? xcm.isGeneralKey
        ? {
            length: xcm.asGeneralKey.length.toNumber(),
            data: xcm.asGeneralKey.data.toString(),
          }
        : undefined
      : xcm.reduce<{ length: number; data: string }>(
          (acc, interior) => {
            if (interior.isGeneralKey) {
              const generalKey = interior.asGeneralKey
              const length = generalKey.length.toNumber()

              if (acc.length > length)
                acc = { length, data: generalKey.data.toString() }
            }
            return acc
          },
          { length: 32, data: "" },
        )

    if (!generalKey) return undefined

    return getPendulumAssetIdFromGeneralKey(generalKey)
  }
}

export const getGeneralIndex = (
  rawLocation: Option<HydradxRuntimeXcmAssetLocation>,
) => {
  const location = rawLocation.unwrap()

  const type = location.interior.type
  if (location.interior && type !== "Here") {
    const xcm = location.interior[`as${type}`]

    const generalIndex = !Array.isArray(xcm)
      ? xcm.isGeneralIndex
        ? xcm.asGeneralIndex.unwrap().toString()
        : undefined
      : xcm.filter((el) => el.isGeneralIndex).length > 1
        ? undefined
        : xcm
            .find((el) => el.isGeneralIndex)
            ?.asGeneralIndex.unwrap()
            .toString()

    return generalIndex
  }
}
