import { createContext, useContext } from "react"
import { useMemepad } from "./MemepadForm.utils"

export type MemepadFormContextProps = {
  children?: React.ReactNode
}

type FormContext = ReturnType<typeof useMemepad>

const MemepadFormContext = createContext<FormContext>({} as FormContext)

export const useMemepadFormContext = () => {
  return useContext(MemepadFormContext)
}

export const MemepadFormProvider: React.FC<MemepadFormContextProps> = ({
  children,
}) => {
  const value = useMemepad()
  return (
    <MemepadFormContext.Provider value={value}>
      {children}
    </MemepadFormContext.Provider>
  )
}
