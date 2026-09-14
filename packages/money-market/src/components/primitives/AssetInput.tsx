import {
  AssetInput as BaseAssetInput,
  AssetInputProps as BaseAssetInputProps,
  Box,
  Flex,
  Modal,
  ModalBody,
  ModalHeader,
  Stack,
  Text,
} from "@galacticcouncil/ui/components"
import { getToken } from "@galacticcouncil/ui/utils"
import { formatNumber, isValidBigSource } from "@galacticcouncil/utils"
import Big from "big.js"
import { useState } from "react"

import { ReserveLogo } from "@/components/primitives/ReserveLogo"
import { useAppFormatters } from "@/hooks/app-data-provider/useAppFormatters"

export interface Asset {
  balance?: string
  symbol: string
  iconSymbol?: string
  address: string
  aToken?: boolean
  priceInUsd?: string
  decimals?: number
}

export type AssetInputProps<T extends Asset = Asset> = Omit<
  BaseAssetInputProps,
  "asset" | "onAssetClick" | "balance" | "displayValue" | "label"
> & {
  symbol: string
  assets: T[]
  onSelect?: (asset: T) => void
  displayValue?: string
  maxButtonBalance?: string
  balanceLabel?: string
}

export const AssetInput = <T extends Asset = Asset>({
  symbol,
  assets,
  onSelect,
  displayValue,
  maxButtonBalance,
  balanceLabel,
  ...props
}: AssetInputProps<T>) => {
  const { formatCurrency } = useAppFormatters()
  const [isAssetSelectOpen, setIsAssetSelectOpen] = useState(false)
  const asset =
    assets.length === 1
      ? assets[0]
      : assets.find((asset) => asset.symbol === symbol)

  const hasMultipleAssets = assets.length > 1
  const max = maxButtonBalance || asset?.balance || "0"

  return (
    <>
      <Box py={0} pb="l" width="100%">
        <BaseAssetInput
          {...props}
          label="Amount"
          asset={{
            symbol,
            icon: asset && <ReserveLogo address={asset.address} />,
          }}
          onAssetClick={
            hasMultipleAssets ? () => setIsAssetSelectOpen(true) : undefined
          }
          displayValue={
            isValidBigSource(displayValue)
              ? formatCurrency(displayValue.toString())
              : undefined
          }
          balance={{
            label: balanceLabel ?? "Balance",
            value: asset?.balance ? formatNumber(asset.balance) : "",
            onMax: () => props.onChange?.(max),
            isMaxDisabled: !props.onChange || Big(max).lte(0),
          }}
        />
      </Box>
      <Modal open={isAssetSelectOpen} onOpenChange={setIsAssetSelectOpen}>
        <ModalHeader title="Select asset" />
        <ModalBody sx={{ p: 0 }}>
          <Stack separated>
            {assets.map((asset) => (
              <Flex
                align="center"
                justify="space-between"
                key={asset.address}
                py="m"
                px="var(--modal-content-padding)"
                sx={{ cursor: "pointer" }}
                onClick={() => {
                  onSelect?.(asset)
                  props.onChange?.("")
                  setIsAssetSelectOpen(false)
                }}
              >
                <Flex align="center" gap="base">
                  <ReserveLogo address={asset.address} />
                  <Text color={getToken("text.high")} fs="p5" fw={600} lh={1}>
                    {asset.symbol}
                  </Text>
                </Flex>
                <Flex direction="column" align="flex-end">
                  <Text fs="p4" fw={500} color={getToken("text.high")}>
                    {formatCurrency(asset.balance, { symbol: asset.symbol })}
                  </Text>
                </Flex>
              </Flex>
            ))}
          </Stack>
        </ModalBody>
      </Modal>
    </>
  )
}
