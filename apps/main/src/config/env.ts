import z from "zod"

const coerceToBoolean = z.string().transform((v) => v === "true")

const schema = z.object({
  VITE_PROVIDER_URL: z.url(),
  VITE_INDEXER_URL: z.url(),
  VITE_NECKWORK_URL: z.url(),
  VITE_GRAFANA_URL: z.url(),
  VITE_GRAFANA_DSN: z.coerce.number().positive(),
  VITE_ENV: z.enum(["development", "production"]),
  VITE_TRSRY_ADDR: z.string(),
  VITE_EVM_CHAIN_ID: z.coerce.number().positive(),
  VITE_DISPLAY_ASSET_ID: z.string().regex(/^\d+$/),
  VITE_HSM_ENABLED: coerceToBoolean,
  VITE_DRY_RUN_ENABLED: coerceToBoolean,
  VITE_WORMHOLE_DISABLED: coerceToBoolean,
  VITE_BASEJUMP_DISABLED: coerceToBoolean,
})

export const ENV = schema.parse(import.meta.env)
