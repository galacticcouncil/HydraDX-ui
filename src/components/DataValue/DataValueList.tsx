import { ResponsiveValue } from "utils/responsive"
import { SDataValueList } from "./DataValueList.styled"

export type DataValueListProps = {
  className?: string
  separated?: boolean
  gap?: ResponsiveValue<number>
  children: React.ReactNode
}

export const DataValueList: React.FC<DataValueListProps> = ({
  gap = [10, 40],
  ...props
}) => {
  return <SDataValueList {...props} sx={{ gap }} />
}
