import * as React from "react"
import { AssetId } from "@galacticcouncil/ui"
import { Button } from "components/Button/Button"
import { FC, useMemo } from "react"
import { Controller, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { TExternalAsset } from "sections/wallet/addToken/AddToken.utils"
import { HydradxRuntimeXcmAssetLocation } from "@polkadot/types/lookup"
import DropletIcon from "assets/icons/DropletIcon.svg?react"
import PlusIcon from "assets/icons/PlusIcon.svg?react"
import { useRpcProvider } from "providers/rpcProvider"
import { Spacer } from "components/Spacer/Spacer"
import { InputBox } from "components/Input/InputBox"
import { TokenInfo } from "./components/TokenInfo/TokenInfo"
import { omit } from "utils/rx"
import { createComponent } from "@lit-labs/react"
import { Separator } from "components/Separator/Separator"
import { TokenInfoHeader } from "./components/TokenInfo/TokenInfoHeader"
import { useExternalTokensRugCheck } from "api/externalAssetRegistry"
import { useAddTokenFormModalActions } from "./AddTokenFormModal.utils"

export const UigcAssetId = createComponent({
  tagName: "uigc-asset-id",
  elementClass: AssetId,
  react: React,
})

type Props = {
  asset: TExternalAsset & { location?: HydradxRuntimeXcmAssetLocation }
  onClose: () => void
}

type FormFields = {
  name: string
  decimals: string
  symbol: string
}

enum TokenState {
  NotRegistered,
  Registered,
  UpdateRequired,
  RiskConsentRequired,
}

export const AddTokenFormModal: FC<Props> = ({ asset, onClose }) => {
  const { t } = useTranslation()
  const { assets } = useRpcProvider()

  const chainStored = assets.external.find(
    (chainAsset) =>
      chainAsset.externalId === asset.id &&
      chainAsset.parachainId === asset.origin.toString(),
  )

  const rugCheck = useExternalTokensRugCheck()
  const rugCheckData = rugCheck.tokensMap.get(chainStored?.id ?? "")

  const form = useForm<FormFields>({
    mode: "onSubmit",
    defaultValues: {
      name: asset.name,
      symbol: asset.symbol,
      decimals: asset.decimals.toString(),
    },
  })

  const { addTokenToUser, registerToken, addTokenConsent } =
    useAddTokenFormModalActions(asset)

  const tokenState = useMemo(() => {
    if (!chainStored) return TokenState.NotRegistered

    const warningTypes =
      rugCheckData?.warnings.map((warning) => warning.type) ?? []

    if (warningTypes.length) {
      if (warningTypes.includes("supply")) return TokenState.RiskConsentRequired
      return TokenState.UpdateRequired
    }

    return TokenState.Registered
  }, [chainStored, rugCheckData?.warnings])

  const onSubmit = async () => {
    if (chainStored) {
      if (tokenState === TokenState.RiskConsentRequired) {
        addTokenConsent(chainStored.id)
      }

      await addTokenToUser({
        ...omit(["location"], asset),
        internalId: chainStored.id,
      })
    } else {
      await registerToken()
    }

    onClose()
  }

  return (
    <>
      <TokenInfoHeader asset={asset} internalId={chainStored?.id} />
      <Separator sx={{ my: 10 }} color="darkBlue401" />
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        autoComplete="off"
        sx={{ height: "100%" }}
      >
        <div sx={{ flex: "column", gap: 8, height: "100%" }}>
          <div hidden>
            <Controller
              name="name"
              control={form.control}
              render={({ field }) => (
                <InputBox
                  placeholder={t("wallet.addToken.form.name")}
                  {...field}
                  disabled
                  label={t("wallet.addToken.form.name")}
                  withLabel
                />
              )}
            />
            <Controller
              name="symbol"
              control={form.control}
              render={({ field }) => (
                <InputBox
                  placeholder={t("wallet.addToken.form.symbol")}
                  {...field}
                  disabled
                  label={t("wallet.addToken.form.symbol")}
                  withLabel
                />
              )}
            />
            <Controller
              name="decimals"
              control={form.control}
              render={({ field }) => (
                <InputBox
                  placeholder={t("wallet.addToken.form.decimals")}
                  {...field}
                  disabled
                  label={t("wallet.addToken.form.decimals")}
                  withLabel
                />
              )}
            />
          </div>

          <Spacer size={0} />
          <TokenInfo externalAsset={asset} chainStoredAsset={chainStored} />
          <Spacer size={8} />
          <Button variant="primary" sx={{ mt: "auto" }} type="submit">
            {tokenState === TokenState.NotRegistered && (
              <DropletIcon width={18} height={18} />
            )}
            {tokenState === TokenState.Registered && (
              <PlusIcon width={18} height={18} />
            )}

            {tokenState === TokenState.NotRegistered &&
              t("wallet.addToken.form.button.register.hydra")}

            {tokenState === TokenState.Registered &&
              t("wallet.addToken.form.button.register.forMe")}

            {tokenState === TokenState.UpdateRequired &&
              t("wallet.addToken.form.button.register.update")}

            {tokenState === TokenState.RiskConsentRequired &&
              t("wallet.addToken.form.button.register.acceptRisk")}
          </Button>
        </div>
      </form>
    </>
  )
}
