import { DataValue, DataValueList } from "components/DataValue"
import { DataValueProps } from "components/DataValue/DataValue"
import Skeleton from "react-loading-skeleton"

export type HeaderValuesSkeletonProps = {
  className?: string
  size?: DataValueProps["size"]
  count?: number
}

export const HeaderValuesSkeleton: React.FC<HeaderValuesSkeletonProps> = ({
  className,
  size = "medium",
  count = 4,
}) => {
  return (
    <DataValueList separated className={className}>
      {Array(count)
        .fill({})
        .map((_, index) => (
          <DataValue
            key={index}
            size={size}
            label={<Skeleton width={40} />}
            isLoading
          />
        ))}
    </DataValueList>
  )
}
