import { AssetAmount } from "@galacticcouncil/xcm-core"
import { zodResolver } from "@hookform/resolvers/zod"
import { ApiPromise } from "@polkadot/api"
import { Option } from "@polkadot/types"
import type { PalletAssetsAssetDetails } from "@polkadot/types/lookup"
import { useQuery } from "@tanstack/react-query"
import { TAsset } from "api/assetDetails"
import { useExternalApi } from "api/external"
import {
  assethub,
  assethubNativeToken,
  CreateTokenValues,
  getCreateAssetCalls,
  useAssetHubAssetRegistry,
  useAssetHubNativeBalance,
  useCreateAssetHubToken,
  useGetNextAssetHubId,
} from "api/external/assethub"
import { useAccountFeePaymentAssets } from "api/payments"
import { useRefetchProviderData } from "api/provider"
import { useSpotPrice } from "api/spotPrice"
import {
  createXcmAssetKey,
  syncAssethubXcmConfig,
  useCrossChainTransaction,
  wallet,
} from "api/xcm"
import BN from "bignumber.js"
import { useRpcProvider } from "providers/rpcProvider"
import { useCallback, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useCreateXYKPool } from "sections/pools/modals/CreateXYKPool/CreateXYKPoolForm.utils"
import {
  getInternalIdFromResult,
  useRegisterToken,
  useUserExternalTokenStore,
} from "sections/wallet/addToken/AddToken.utils"
import { externalAssetToRegisteredAsset } from "sections/wallet/addToken/modal/AddTokenFormModal.utils"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { BN_0, BN_1 } from "utils/constants"
import { getParachainInputData } from "utils/externalAssets"
import { QUERY_KEYS } from "utils/queryKeys"
import { noWhitespace, positive, required } from "utils/validators"
import { z } from "zod"
import { MemepadFormFields } from "./MemepadFormFields"

export const MEMEPAD_XCM_RELAY_CHAIN = "polkadot"
export const MEMEPAD_XCM_SRC_CHAIN = "assethub"
export const MEMEPAD_XCM_DST_CHAIN = "hydradx"

export const HYDRA_DOT_ASSET_ID = "5"
export const HYDRA_USDT_ASSET_ID = "10"

export const DOT_TRANSFER_FEE_BUFFER = 1.1

const MAX_NAME_LENGTH = 20
const MAX_SYMBOL_LENGTH = 6
const MAX_DECIMALS_COUNT = 20
const MIN_XYK_POOL_SUPPLY = 2

const DEFAULT_DECIMALS_COUNT = 12
const DEFAULT_EXISTENTIAL_DEPOSIT = 1
const DEFAULT_DOT_SUPPLY = 10

export type MemepadFormValues = CreateTokenValues & {
  internalId: string
  xykPoolAssetId: string
  xykPoolSupply: string
  origin: number
  allocatedSupply: string
}

export type MemepadAlert = {
  key: string
  text: string
  variant: "warning" | "error" | "info"
}

export const useMemepadForm = () => {
  const { t } = useTranslation()
  const { account } = useAccount()
  const { assets, isLoaded } = useRpcProvider()

  const { data: ahRegistry } = useAssetHubAssetRegistry()
  const { data: fees } = useMemepadDryRun()

  const { symbols, names } = useMemo(() => {
    const assets = ahRegistry?.size ? [...ahRegistry.values()] : []
    return {
      names: assets.map((asset) => asset.name.toLowerCase()),
      symbols: assets.map((asset) => asset.symbol.toLowerCase()),
    }
  }, [ahRegistry])

  const dotMeta = isLoaded ? assets.getAsset(HYDRA_DOT_ASSET_ID) : null
  const { data: dotBalanceData } = useAssetHubNativeBalance(account?.address)
  const dotBalance = dotBalanceData?.balance ?? BN_0
  const dotBalanceShifted = dotBalance.shiftedBy(-(dotMeta?.decimals ?? 10))

  const feeBufferTotal = BN(fees?.feeBuffer.amount.toString() ?? 0)
    .shiftedBy(-(fees?.feeBuffer.decimals ?? 0))
    .plus(DOT_TRANSFER_FEE_BUFFER)

  return useForm<MemepadFormValues>({
    defaultValues: {
      id: "",
      name: "",
      symbol: "",
      deposit: DEFAULT_EXISTENTIAL_DEPOSIT.toString(),
      supply: "",
      allocatedSupply: "",
      decimals: DEFAULT_DECIMALS_COUNT,
      origin: assethub.parachainId,
      account: account?.address ?? "",
      internalId: "",
      xykPoolSupply: DEFAULT_DOT_SUPPLY.toString(),
      xykPoolAssetId: HYDRA_DOT_ASSET_ID,
    },
    mode: "onChange",
    resolver: (...args) => {
      const [values] = args

      const gt = createSupplyValidator("gt")
      const gte = createSupplyValidator("gte")

      return zodResolver(
        z.object({
          name: required
            .max(
              MAX_NAME_LENGTH,
              t("memepad.form.error.maxNameLength", { count: MAX_NAME_LENGTH }),
            )
            .refine(
              (value) => !names.includes(value.toLowerCase()),
              t("memepad.form.error.nameExists"),
            ),
          symbol: required
            .max(
              MAX_SYMBOL_LENGTH,
              t("memepad.form.error.maxSymbolLength", {
                count: MAX_SYMBOL_LENGTH,
              }),
            )
            .refine(
              (value) => !symbols.includes(value.toLowerCase()),
              t("memepad.form.error.symbolExists"),
            )
            .pipe(noWhitespace),
          deposit: required.pipe(positive),
          supply: gt(
            values.deposit,
            t("memepad.form.error.minSupply", {
              minDeposit: values.deposit,
            }),
          ),
          xykPoolSupply: gte(
            MIN_XYK_POOL_SUPPLY,
            t("memepad.form.error.minXykSupply", {
              value: MIN_XYK_POOL_SUPPLY,
              symbol: dotMeta?.symbol,
            }),
          ).refine(
            (value) => BN(value).plus(feeBufferTotal).lte(dotBalanceShifted),
            t("memepad.form.error.balance", {
              value: BN(values.xykPoolSupply).plus(feeBufferTotal),
              symbol: dotMeta?.symbol,
            }),
          ),
          allocatedSupply: gt(
            values.deposit,
            t("memepad.form.error.minAllocatedSupply", {
              minDeposit: values.deposit,
            }),
          ),
          decimals: z.number().min(0).max(MAX_DECIMALS_COUNT),
          origin: z.number().min(0),
          account: required,
        }),
      )(...args)
    },
  })
}

enum MemepadStep {
  CREATE_TOKEN,
  REGISTER_TOKEN,
  TRANSFER_TOKEN,
  CREATE_XYK_POOL,
  SUMMARY,
}

const useMemepadSteps = (step: MemepadStep) => {
  const { t } = useTranslation()
  return useMemo(() => {
    const stepLabels = [
      t("memepad.form.step1.title"),
      t("memepad.form.step2.title"),
      t("memepad.form.step3.title"),
      t("memepad.form.step4.title"),
    ]

    function getSteps(step: number) {
      return stepLabels.map(
        (label, index) =>
          ({
            label,
            state: step === index ? "active" : step > index ? "done" : "todo",
          }) as const,
      )
    }
    return {
      steps: getSteps(step),
      getSteps,
    }
  }, [step, t])
}

export const useMemepad = () => {
  const { api } = useRpcProvider()
  const [step, setStep] = useState(MemepadStep.CREATE_TOKEN)
  const [alerts, setAlerts] = useState<MemepadAlert[]>([])
  const [supplyPerc, setSupplyPerc] = useState(50)

  const { addToken } = useUserExternalTokenStore()
  const refetchProvider = useRefetchProviderData()

  const form = useMemepadForm()

  const { steps, getSteps } = useMemepadSteps(step)

  const createToken = useCreateAssetHubToken({
    steps: getSteps(MemepadStep.CREATE_TOKEN),
  })
  const registerToken = useRegisterToken({
    onSuccess: (internalId, asset) => {
      addToken(externalAssetToRegisteredAsset(asset, internalId))
      refetchProvider()
    },
    steps: getSteps(MemepadStep.REGISTER_TOKEN),
  })
  const xTransfer = useCrossChainTransaction({
    steps: getSteps(MemepadStep.TRANSFER_TOKEN),
  })
  const createXykPool = useCreateXYKPool({
    onSuccess: refetchProvider,
    steps: getSteps(MemepadStep.CREATE_XYK_POOL),
  })

  const { getNextAssetHubId } = useGetNextAssetHubId()

  const { data: fees } = useMemepadDryRun()
  const creationFeeBuffer = BN(
    fees?.feeBuffer.amount.toString() ?? 0,
  ).shiftedBy(-(fees?.feeBuffer.decimals ?? 0))

  const isDirty = form.formState.isDirty
  const isSubmitting = form.formState.isSubmitting

  const setNextStep = () => {
    setStep((prev) => prev + 1)
  }

  const formValues = form.getValues()

  const submit = () => {
    return form.handleSubmit(async (values) => {
      let currentStep = step
      let internalId = formValues?.internalId ?? ""
      const nextId = formValues?.id || (await getNextAssetHubId())
      const id = nextId.toString()
      const token = {
        ...values,
        id,
        isWhiteListed: false,
      }

      // Create token on Assethub
      if (currentStep === 0) {
        await createToken.mutateAsync({
          id: token.id,
          name: token.name,
          symbol: token.symbol,
          deposit: token.deposit,
          supply: token.supply,
          decimals: token.decimals,
          account: token.account,
          dotAmount: BN(token.xykPoolSupply)
            .plus(creationFeeBuffer)
            .plus(DOT_TRANSFER_FEE_BUFFER)
            .toString(),
        })
        await waitForBalance(api, values.account, HYDRA_USDT_ASSET_ID)
        form.setValue("id", id)
        setNextStep()
        currentStep++
      }

      // Register token on Hydration
      if (currentStep === 1) {
        const result = await registerToken.mutateAsync(token)

        // Sync registered token with assethub XCM config
        const { assetId } = getInternalIdFromResult(result)
        internalId = assetId?.toString() ?? ""
        const registeredAsset = externalAssetToRegisteredAsset(
          token,
          internalId,
        )
        syncAssethubXcmConfig(registeredAsset)

        form.setValue("internalId", internalId)
        setNextStep()
        currentStep++
      }

      if (currentStep === 2) {
        // Transfer DOT from AH to Hydration
        await xTransfer.mutateAsync({
          amount: token.xykPoolSupply,
          asset: "dot",
          srcAddr: values?.account ?? "",
          srcChain: MEMEPAD_XCM_RELAY_CHAIN,
          dstAddr: values?.account ?? "",
          dstChain: MEMEPAD_XCM_DST_CHAIN,
        })

        // Transfer created token to Hydration
        const xcmAssetKey = createXcmAssetKey(id, values.symbol)
        await xTransfer.mutateAsync({
          amount: values.allocatedSupply,
          asset: xcmAssetKey,
          srcAddr: values?.account ?? "",
          srcChain: MEMEPAD_XCM_SRC_CHAIN,
          dstAddr: values?.account ?? "",
          dstChain: MEMEPAD_XCM_DST_CHAIN,
        })

        await waitForBalance(api, values.account, internalId)
        setNextStep()
        currentStep++
      }

      // Create XYK Pool
      if (currentStep === 3) {
        await createXykPool.mutateAsync({
          assetAId: internalId,
          assetBId: HYDRA_DOT_ASSET_ID,
          assetAAmount: values.allocatedSupply,
          assetBAmount: values.xykPoolSupply,
        })

        setNextStep()
        currentStep++
      }
    })()
  }

  const reset = () => {
    setStep(MemepadStep.CREATE_TOKEN)
    form.reset()
  }

  const setAlert = useCallback((alert: MemepadAlert) => {
    setAlerts((prev) =>
      prev.some(({ key }) => key === alert.key) ? prev : [...prev, alert],
    )
  }, [])

  const clearAlert = useCallback((key: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.key !== key))
  }, [])

  const formComponent = <MemepadFormFields form={form} />
  const isFinalized = step === MemepadStep.SUMMARY

  const isLoading =
    isSubmitting ||
    createToken.isLoading ||
    registerToken.isLoading ||
    xTransfer.isLoading

  return {
    form,
    step,
    steps,
    formComponent,
    isFinalized,
    isDirty,
    supplyPerc,
    setSupplyPerc,
    submit,
    reset,
    alerts,
    setAlert,
    clearAlert,
    isLoading,
  }
}

export type MemepadDryRunResult = {
  xcmDstFeeED: AssetAmount
  xcmSrcFee: AssetAmount
  xcmDstFee: AssetAmount
  createTokenFee: AssetAmount
  registerTokenFee: AssetAmount
  createXYKPoolFee: AssetAmount
  feeBuffer: AssetAmount
}

const MEMEPAD_DRY_RUN_VALUES = {
  name: "DryRunToken",
  symbol: "DRT",
  deposit: "1",
  supply: "1000000",
  decimals: 12,
  origin: 1000,
  id: "1",
}

export const useMemepadDryRun = (
  options: { onSuccess?: (data: MemepadDryRunResult) => void } = {},
) => {
  const { isLoaded, api, assets } = useRpcProvider()
  const { data: assethubApi } = useExternalApi("assethub")
  const { account } = useAccount()
  const feePaymentAssets = useAccountFeePaymentAssets()

  const nativeAssetId = isLoaded ? assets.native.id : ""
  const { feePaymentAssetId } = feePaymentAssets

  const { data: feeSpotPrice, ...feeSpotPriceQuery } = useSpotPrice(
    nativeAssetId,
    feePaymentAssetId,
  )

  const { data: dotSpotPrice, ...dotSpotPriceQuery } = useSpotPrice(
    HYDRA_USDT_ASSET_ID,
    HYDRA_DOT_ASSET_ID,
  )

  const usdtDotSpotPrice = dotSpotPrice?.spotPrice ?? BN_1
  const hydraFeeSpotPrice = feeSpotPrice?.spotPrice ?? BN_1

  const address = account?.address ?? ""

  async function dryRun(): Promise<MemepadDryRunResult> {
    if (!api) throw new Error("API is not connected")
    if (!assethubApi) throw new Error("Asset Hub is not connected")
    if (!address) throw new Error("Missing account address")

    const hydraNativeAsset = assets.getAsset(nativeAssetId)
    const hydraFeePaymentAsset = assets.getAsset(
      feePaymentAssetId ?? nativeAssetId,
    )

    const token = {
      ...MEMEPAD_DRY_RUN_VALUES,
      account: address,
    }

    const createTokenTx = assethubApi.tx.utility.batchAll(
      getCreateAssetCalls(assethubApi, token),
    )
    const createTokenPaymentInfo = await createTokenTx.paymentInfo(address)

    const createTokenFee = new AssetAmount({
      amount: createTokenPaymentInfo.partialFee.toBigInt(),
      decimals: assethubNativeToken.decimals ?? 0,
      symbol: assethubNativeToken.asset.originSymbol,
      key: assethubNativeToken.asset.key,
      originSymbol: assethubNativeToken.asset.originSymbol,
    })

    const registerTokenTx = api.tx.assetRegistry.registerExternal(
      getParachainInputData({
        ...token,
        isWhiteListed: false,
      }),
    )

    const registerTokenPaymentInfo = await registerTokenTx.paymentInfo(address)

    const registerTokenFee = convertFeeToPaymentAsset({
      amount: registerTokenPaymentInfo.partialFee.toBigNumber(),
      nativeAsset: hydraNativeAsset,
      feePaymentAsset: hydraFeePaymentAsset,
      spotPrice: hydraFeeSpotPrice,
    })

    const xcmTransfer = await wallet.transfer(
      "ded",
      address,
      MEMEPAD_XCM_SRC_CHAIN,
      address,
      MEMEPAD_XCM_DST_CHAIN,
    )

    const xcmSrcFee = await xcmTransfer.estimateFee(1)

    const xcmDstChainFeeAssetId = xcmTransfer?.dstFee
      ? assethub.getAssetId(xcmTransfer.dstFee)
      : ""

    const xcmDstFeeEDResponse = await assethubApi.query.assets.asset<
      Option<PalletAssetsAssetDetails>
    >(xcmDstChainFeeAssetId)

    const xcmDstFeeEDAmount = xcmDstFeeEDResponse.unwrap().minBalance

    const xcmDstFeeED = new AssetAmount({
      amount: xcmDstFeeEDAmount.toBigInt(),
      decimals: xcmTransfer?.dstFee.decimals,
      symbol: xcmTransfer?.dstFee.symbol,
      key: xcmTransfer?.dstFee.key,
      originSymbol: xcmTransfer?.dstFee.symbol,
    })

    const createXYKPoolTx = api.tx.xyk.createPool("0", "1", "5", "1")
    const createXYKPoolPaymentInfo = await createXYKPoolTx.paymentInfo(address)

    const createXYKPoolFee = convertFeeToPaymentAsset({
      amount: createXYKPoolPaymentInfo.partialFee.toBigNumber(),
      nativeAsset: hydraNativeAsset,
      feePaymentAsset: hydraFeePaymentAsset,
      spotPrice: hydraFeeSpotPrice,
    })

    const feeBufferUsdtAmount = BN(0.5)
    const feeBufferSlippage = BN(1.05) // 5%
    const feeBufferAmount = feeBufferUsdtAmount
      .times(usdtDotSpotPrice)
      .times(feeBufferSlippage)
      .shiftedBy(assethubNativeToken.decimals ?? 0)
      .decimalPlaces(0)

    const feeBuffer = new AssetAmount({
      amount: BigInt(feeBufferAmount.toString()),
      decimals: assethubNativeToken.decimals ?? 0,
      symbol: assethubNativeToken.asset.originSymbol,
      key: assethubNativeToken.asset.key,
      originSymbol: assethubNativeToken.asset.originSymbol,
    })

    return {
      xcmDstFeeED,
      xcmSrcFee,
      xcmDstFee: xcmTransfer.dstFee,
      createTokenFee,
      registerTokenFee,
      createXYKPoolFee,
      feeBuffer,
    }
  }

  return useQuery(QUERY_KEYS.memepadDryRun(address), dryRun, {
    enabled:
      !!api &&
      !!assethubApi &&
      !!address &&
      feePaymentAssets.isSuccess &&
      feeSpotPriceQuery.isSuccess &&
      dotSpotPriceQuery.isSuccess,
    retry: false,
    ...options,
  })
}

function convertFeeToPaymentAsset({
  amount,
  nativeAsset,
  feePaymentAsset,
  spotPrice,
}: {
  amount: BN
  nativeAsset: TAsset
  feePaymentAsset: TAsset
  spotPrice: BN
}) {
  const paymentFeeNative = BN(amount).shiftedBy(-nativeAsset.decimals)
  const paymentAsset =
    nativeAsset.id === feePaymentAsset.id ? nativeAsset : feePaymentAsset

  const amountFmt = paymentFeeNative
    .multipliedBy(spotPrice)
    .shiftedBy(paymentAsset.decimals)
    .decimalPlaces(0)

  return new AssetAmount({
    amount: BigInt(amountFmt.toString()),
    decimals: paymentAsset.decimals,
    symbol: paymentAsset.symbol,
    key: paymentAsset.id,
    originSymbol: paymentAsset.symbol,
  })
}

function waitForBalance(
  api: ApiPromise,
  account: string,
  id: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const checkBalance = async () => {
      try {
        const res = await api.query.tokens.accounts(account, id)
        const balance = res.free.toBigNumber()

        if (balance.gt(0)) {
          resolve()
        } else {
          setTimeout(checkBalance, 2000)
        }
      } catch (error) {
        reject(error)
      }
    }

    checkBalance()
  })
}

function createSupplyValidator(method: "gt" | "gte" | "lt" | "lte") {
  return (amount: string | number, msg: string) =>
    required.pipe(positive).refine((value) => {
      const supply = BN(value)
      return supply.isFinite() && supply[method](amount)
    }, msg)
}
