import { zodResolver } from "@hookform/resolvers/zod"
import { useCallback, useState } from "react"
import { useForm } from "react-hook-form"
import { useEvent } from "react-use"
import { MemepadFormStep3 } from "sections/memepad/form/MemepadFormStep3"
import { useAccount } from "sections/web3-connect/Web3Connect.utils"
import { required } from "utils/validators"
import { z } from "zod"
import { MemepadFormStep1 } from "./MemepadFormStep1"
import { MemepadFormStep2 } from "./MemepadFormStep2"

export type MemepadStep1Values = {
  name: string
  symbol: string
  supply: string
  creatorAccount: string
}

export type MemepadStep2Values = {
  asset: string
  address: string
}

export type MemepadStep3Values = {
  assetA: string
  assetB: string
}

export type MemepadSummaryValues = Partial<
  MemepadStep1Values & MemepadStep2Values & MemepadStep3Values
>

export const useMemepadStep1Form = () => {
  const { account } = useAccount()
  return useForm<MemepadStep1Values>({
    defaultValues: {
      name: "",
      symbol: "",
      supply: "",
      creatorAccount: account?.address ?? "",
    },
    resolver: zodResolver(
      z.object({
        name: required,
        symbol: required,
        supply: required,
        creatorAccount: required,
      }),
    ),
  })
}

export const useMemepadStep2Form = () => {
  return useForm<MemepadStep2Values>({
    defaultValues: {
      asset: "",
      address: "",
    },
    resolver: zodResolver(
      z.object({
        asset: required,
        address: required,
      }),
    ),
  })
}

export const useMemepadStep3Form = () => {
  return useForm<MemepadStep3Values>({
    defaultValues: {
      assetA: "",
      assetB: "",
    },
    resolver: zodResolver(
      z.object({
        assetA: required,
        assetB: required,
      }),
    ),
  })
}

export const useMemepadForms = () => {
  const [step, setStep] = useState(0)
  const [summary, setSummary] = useState<MemepadSummaryValues | null>(null)

  const formStep1 = useMemepadStep1Form()
  const formStep2 = useMemepadStep2Form()
  const formStep3 = useMemepadStep3Form()

  const reset = () => {
    setStep(0)
    setSummary(null)
    formInstances.forEach((form) => form.reset())
  }

  const formComponents = [
    <MemepadFormStep1 form={formStep1} />,
    <MemepadFormStep2 form={formStep2} />,
    <MemepadFormStep3 form={formStep3} />,
  ]

  const formInstances = [formStep1, formStep2, formStep3]

  const isDirty = formInstances.some((form) => form.formState.isDirty)
  const isSubmitted = formInstances.every((form) => form.formState.isSubmitted)

  const setNextStep = (values: MemepadSummaryValues) => {
    setStep((prev) => prev + 1)
    setSummary((prev) => ({ ...prev, ...values }))
  }

  const submitNext = () => {
    if (step === 0) {
      return formStep1.handleSubmit((values) => {
        console.log(values)
        setNextStep(values)
      })()
    }

    if (step === 1) {
      return formStep2.handleSubmit((values) => {
        console.log(values)
        setNextStep(values)
      })()
    }

    if (step === 2) {
      return formStep3.handleSubmit((values) => {
        console.log(values)
        setNextStep(values)
      })()
    }
  }

  const onBeforeUnload = useCallback(
    (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue =
          "Are you sure you want to cancel? All of the progress will be lost."
      }
    },
    [isDirty],
  )

  useEvent("beforeunload", onBeforeUnload)

  const currentForm = formComponents[step]
  const summaryStep = formComponents.length

  return {
    step,
    formStep1,
    formStep2,
    formStep3,
    currentForm,
    isFinalStep: step === summaryStep,
    isDirty,
    isSubmitted,
    summary,
    submitNext,
    reset,
  }
}
