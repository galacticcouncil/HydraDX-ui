import { Separator } from "components/Separator/Separator"
import { Text } from "components/Typography/Text/Text"
import { ReactNode } from "react"
import Skeleton from "react-loading-skeleton"

export type RowModel = {
  label: string
  content: ReactNode | string
  description?: string
  isLoading?: boolean
}

type SummaryRowProps = RowModel & {
  withSeparator?: boolean
}

export const SummaryRow = ({
  label,
  content,
  isLoading,
  description,
  withSeparator,
}: SummaryRowProps) => {
  return (
    <>
      <div sx={{ my: 8 }}>
        <div
          sx={{
            flex: "row",
            justify: "space-between",
          }}
        >
          <Text color="basic400" fs={14} tAlign="left">
            {label}
          </Text>
          {isLoading ? (
            <Skeleton width={40} height={16} />
          ) : typeof content === "string" ? (
            <Text fs={14} color="white" tAlign="right">
              {content}
            </Text>
          ) : (
            content
          )}
        </div>
        {description && (
          <Text color="darkBlue300" fs={12} lh={15} sx={{ mt: 6 }}>
            {description}
          </Text>
        )}
      </div>
      {withSeparator && <Separator color="darkBlue401" />}
    </>
  )
}
