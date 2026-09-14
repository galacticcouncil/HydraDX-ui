import { ArrowRight } from "@galacticcouncil/ui/assets/icons"
import {
  Flex,
  FlexProps,
  Icon,
  Skeleton,
  Text,
} from "@galacticcouncil/ui/components"
import { ThemeUICSSProperties } from "@galacticcouncil/ui/types"
import { getToken } from "@galacticcouncil/ui/utils"

import { HealthFactorNumber } from "@/components/primitives/HealthFactorNumber"
import { HealthFactorResult } from "@/utils"

export type HealthFactorChangeProps = FlexProps &
  HealthFactorResult & {
    loading?: boolean
    fontSize?: ThemeUICSSProperties["fontSize"]
  }

export const HealthFactorChange: React.FC<HealthFactorChangeProps> = ({
  current,
  future,
  isSignificantChange,
  isBelowRiskThreshold,
  loading = false,
  fontSize,
  ...props
}) => {
  const { isUserConsentRequired: _isUserConsentRequired, ...flexProps } = props
  return (
    <Flex direction="column" align="flex-end" {...flexProps}>
      <Flex gap="s" direction="row" align="center" justify="flex-end">
        {loading ? (
          <Skeleton height="1em" width={80} />
        ) : (
          <>
            <HealthFactorNumber value={current} fontSize={fontSize} />
            {isSignificantChange && (
              <>
                <Icon size="xs" component={ArrowRight} />
                <HealthFactorNumber
                  fontSize={fontSize}
                  value={isNaN(Number(future)) ? current : future}
                />
              </>
            )}
          </>
        )}
      </Flex>
      {isBelowRiskThreshold && (
        <Text fs="p6" lh={1} color={getToken("text.low")} mt={-2}>
          Liquidation at &lt;1.0
        </Text>
      )}
    </Flex>
  )
}
