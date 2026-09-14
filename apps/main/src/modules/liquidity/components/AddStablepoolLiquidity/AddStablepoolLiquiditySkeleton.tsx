import {
  Box,
  Button,
  Summary,
  Text,
  Toggle,
  ToggleGroup,
  ToggleGroupItem,
} from "@galacticcouncil/ui/components"
import { Flex } from "@galacticcouncil/ui/components/Flex"
import {
  ModalBody,
  ModalContentDivider,
  ModalHeader,
} from "@galacticcouncil/ui/components/Modal"
import { useTranslation } from "react-i18next"
import { doNothing } from "remeda"

import { AssetSelect } from "@/components/AssetSelect/AssetSelect"
import {
  TradeLimit,
  TradeLimitType,
} from "@/modules/liquidity/components/TradeLimitRow/TradeLimitRow"

import {
  AddStablepoolLiquidityProps,
  AddStablepoolLiquidityTooltip,
} from "./AddStablepoolLiquidity"
import { addStablepoolOptions } from "./AddStablepoolLiquidity.utils"

export const AddStablepoolLiquiditySkeleton = (
  props: AddStablepoolLiquidityProps,
) => {
  const { t } = useTranslation(["liquidity", "common"])

  return (
    <>
      <ModalHeader
        title={props.title ?? t("addLiquidity")}
        closable={props.closable}
        onBack={props.onBack}
        customHeader={
          <Flex align="center" mt="l" gap="m">
            <Flex flex={1}>
              <ToggleGroup
                type="single"
                fullWidth
                value={addStablepoolOptions[0]?.id}
                disabled
              >
                {addStablepoolOptions.map((option) => (
                  <ToggleGroupItem key={option.id} value={option.id}>
                    {option.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Flex>
            <AddStablepoolLiquidityTooltip />
          </Flex>
        }
      />
      <ModalBody sx={{ pt: 0 }}>
        <Flex align="center" justify="space-between" my="m">
          <Text fs="p3">
            {t("liquidity.add.stablepool.modal.proportionally")}
          </Text>
          <Toggle
            size="large"
            checked={true}
            onCheckedChange={doNothing}
            disabled
          />
        </Flex>

        <ModalContentDivider />

        <Box py="l" width="100%">
          <AssetSelect
            label={t("liquidity.add.modal.selectAsset")}
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
              loading: true,
              content: "",
            },
            {
              label: t("common:tradeLimit"),
              content: <TradeLimit type={TradeLimitType.Liquidity} disabled />,
            },
            {
              label: t("common:apy"),
              content: "",
              loading: true,
            },
            {
              label: t("common:price"),
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
