import { DisplayValue } from "components/DisplayValue/DisplayValue"
import { InfoTooltip } from "components/InfoTooltip/InfoTooltip"
import { SInfoIcon } from "components/InfoTooltip/InfoTooltip.styled"
import { LinearProgress } from "components/Progress"
import { Text } from "components/Typography/Text/Text"
import { AssetCapHookData } from "sections/lending/hooks/useAssetCaps"

type DebtCeilingTooltipProps = {
  debt: string
  ceiling: string
  usageData: AssetCapHookData
  className?: string
}

export const DebtCeilingStatus = ({
  debt,
  ceiling,
  usageData,
  className,
}: DebtCeilingTooltipProps) => {
  const determineColor = () => {
    if (usageData.isMaxed || usageData.percentUsed >= 99.99) {
      return "red400"
    } else if (usageData.percentUsed >= 98) {
      return "warning300"
    } else {
      return "green400"
    }
  }

  return (
    <div className={className}>
      <div sx={{ flex: "row", justify: "space-between", align: "center" }}>
        <div sx={{ flex: "row", align: "center" }}>
          <Text fs={13} color="basic400">
            <span>Isolated Debt Ceiling</span>
          </Text>
          <InfoTooltip
            text={
              <span sx={{ color: "white" }}>
                <span>
                  Debt ceiling limits the amount possible to borrow against this
                  asset by protocol users. Debt ceiling is specific to assets in
                  isolation mode and is denoted in USD.
                </span>{" "}
                <a
                  target="_blank"
                  href="https://docs.aave.com/faq/aave-v3-features#how-does-isolation-mode-affect-my-borrowing-power"
                  rel="noreferrer"
                  css={{ textDecoration: "underline" }}
                >
                  <span>Learn more</span>
                </a>
              </span>
            }
          >
            <SInfoIcon sx={{ ml: 4 }} />
          </InfoTooltip>
        </div>
        <Text fs={14}>
          <DisplayValue value={Number(debt)} isUSD compact />
          <span sx={{ display: "inline-block", mx: 4 }}>of</span>
          <DisplayValue value={Number(ceiling)} isUSD compact />
        </Text>
      </div>
      <LinearProgress
        sx={{ mt: 4 }}
        size="small"
        labelPosition="none"
        color={determineColor()}
        // We show at minimum, 1% color to represent small values
        percent={usageData.percentUsed <= 1 ? 1 : usageData.percentUsed}
      />
    </div>
  )
}
