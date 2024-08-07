import { Spinner } from "components/Spinner/Spinner"
import { Text } from "components/Typography/Text/Text"
import FullSuccessIcon from "assets/icons/FullSuccessIcon.svg?react"

export type MemepadSpinnerProps = {
  title?: string
  description?: string
  isSuccess?: boolean
}

export const MemepadSpinner: React.FC<MemepadSpinnerProps> = ({
  title,
  description,
  isSuccess = false,
}) => {
  return (
    <div sx={{ maxWidth: 500, mx: "auto", my: 50 }}>
      {isSuccess ? (
        <FullSuccessIcon
          width={120}
          height={120}
          sx={{ display: "flex", mx: "auto", mb: 30 }}
        />
      ) : (
        <Spinner size={120} sx={{ mx: "auto", mb: 30 }} />
      )}

      {title && (
        <Text tAlign="center" fs={20} font="GeistSemiBold" sx={{ mb: 10 }}>
          {title}
        </Text>
      )}
      {description && (
        <Text tAlign="center" color="basic400">
          {description}
        </Text>
      )}
    </div>
  )
}
