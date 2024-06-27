import { AssetId } from "@galacticcouncil/ui"
import { createComponent } from "@lit-labs/react"
import {
  getIconByRugSeverity,
  useExternalTokensRugCheck,
} from "api/externalAssetRegistry"
import { Icon } from "components/Icon/Icon"
import { Text } from "components/Typography/Text/Text"
import * as React from "react"
import { TExternalAsset } from "sections/wallet/addToken/AddToken.utils"
import { SLogoContainer } from "./TokenInfo.styled"

export const UigcAssetId = createComponent({
  tagName: "uigc-asset-id",
  elementClass: AssetId,
  react: React,
})

export type TokenHeaderProps = {
  asset: TExternalAsset
  internalId?: string
}

export const TokenInfoHeader: React.FC<TokenHeaderProps> = ({
  asset,
  internalId,
}) => {
  const rugCheck = useExternalTokensRugCheck()
  const rugCheckData = rugCheck.tokensMap.get(internalId ?? "")

  const SeverityIcon = rugCheckData?.severity
    ? getIconByRugSeverity(rugCheckData?.severity)
    : null

  return (
    <div sx={{ flex: "row", gap: 10 }}>
      <SLogoContainer>
        <Icon
          sx={{ flexShrink: 0 }}
          size={46}
          icon={
            <UigcAssetId
              symbol={asset.symbol}
              ref={(e) =>
                e?.shadowRoot
                  ?.querySelector("uigc-logo-asset")
                  ?.setAttribute("style", "width:100%;height:100%;")
              }
            />
          }
        />
        {SeverityIcon && <SeverityIcon sx={{ color: "alarmRed400" }} />}
      </SLogoContainer>
      <div>
        <Text fs={22} lh={28} font="GeistMono">
          {asset.symbol}
        </Text>
        <Text fs={13} color="darkBlue200">
          {asset.name}
        </Text>
      </div>
    </div>
  )
}
