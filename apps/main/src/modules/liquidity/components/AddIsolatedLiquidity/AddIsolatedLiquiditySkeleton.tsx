import {
  Box,
  Button,
  ModalBody,
  ModalContentDivider,
  ModalHeader,
  Summary,
} from "@galacticcouncil/ui/components"
import { FC } from "react"
import { useTranslation } from "react-i18next"

import { AssetSelect } from "@/components/AssetSelect/AssetSelect"
import { AssetSwitcher } from "@/components/AssetSwitcher/AssetSwitcher"

type Props = {
  readonly closable?: boolean
}

export const AddIsolatedLiquiditySkeleton: FC<Props> = ({ closable }) => {
  const { t } = useTranslation(["liquidity", "common"])

  return (
    <>
      <ModalHeader title={t("addLiquidity")} closable={closable} />
      <ModalBody>
        <Box py="l" width="100%">
          <AssetSelect
            label={t("liquidity.createPool.modal.assetA")}
            isDisabled
            isLoading
            assets={[]}
            selectedAsset={undefined}
          />
        </Box>

        <AssetSwitcher
          assetInId=""
          assetOutId=""
          priceIn=""
          priceOut=""
          fallbackPrice=""
          isFallbackPriceLoading
        />

        <Box py="l" width="100%">
          <AssetSelect
            label={t("liquidity.createPool.modal.assetB")}
            isDisabled
            isLoading
            assets={[]}
            selectedAsset={undefined}
          />
        </Box>

        <ModalContentDivider />

        <Summary
          separator={<ModalContentDivider />}
          rows={[
            {
              label: t("common:minimumReceived"),
              content: "",
              loading: true,
            },
            {
              label: t("liquidity.add.modal.rewardsAPR"),
              content: "",
              loading: true,
            },
            {
              label: t("common:apy"),
              content: "",
              loading: true,
            },
          ]}
        />

        <ModalContentDivider />

        <Button type="submit" size="large" width="100%" mt="xxl" disabled>
          {t("liquidity.add.modal.submit")}
        </Button>
      </ModalBody>
    </>
  )
}
