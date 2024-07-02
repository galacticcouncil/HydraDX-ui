import { Button } from "components/Button/Button"
import { GradientText } from "components/Typography/GradientText/GradientText"
import { MemepadSummaryValues } from "sections/memepad/form/MemepadForm.utils"
import { SContainer, SHeading, SRowItem } from "./MemepadSummary.styled"
import { SBottleCaps } from "sections/memepad/components/MemepadVisual"
import { Text } from "components/Typography/Text/Text"
import DecorativeStarIcon from "assets/icons/DecorativeStarIcon.svg?react"
import { useTranslation } from "react-i18next"

type MemepadSummaryProps = {
  values: MemepadSummaryValues | null
  onReset: () => void
}

export const MemepadSummary: React.FC<MemepadSummaryProps> = ({
  values,
  onReset,
}) => {
  const { t } = useTranslation()
  return (
    <SContainer>
      <SBottleCaps
        sx={{ display: ["none", "block"] }}
        css={{ position: "absolute", left: "100%", top: 0 }}
      />
      <div>
        <SHeading>
          <DecorativeStarIcon />
          <Text
            fs={[12, 22]}
            lh={[20, 26]}
            tTransform="uppercase"
            tAlign="center"
            font="GeistMedium"
          >
            Congrats!
          </Text>
          <GradientText
            fs={[22, 34]}
            tTransform="uppercase"
            tAlign="center"
            sx={{ display: "block" }}
          >
            You've succesfully
            <br />
            created new asset!
          </GradientText>
          <DecorativeStarIcon />
        </SHeading>
        {values && (
          <div sx={{ mb: 20 }}>
            <Text sx={{ mb: 12 }} color="brightBlue300">
              Here is your summary:
            </Text>
            {Object.entries(values).map(([key, value]) => (
              <SRowItem>
                <Text fs={14} color="basic400">
                  {t(`wallet.addToken.form.${key}` as any)}
                </Text>
                <Text fs={14} color="brightBlue300">
                  {value.length > 10 ? value.slice(0, 10) : value}
                </Text>
              </SRowItem>
            ))}
          </div>
        )}
        <div
          sx={{ flex: ["column", "row"], gap: 12, justify: "space-between" }}
        >
          <Button size="small" onClick={onReset}>
            Create another asset
          </Button>
          <Button size="small" onClick={onReset}>
            Add logo through GitHub
          </Button>
        </div>
      </div>
      <SBottleCaps
        sx={{ display: ["none", "block"] }}
        css={{ position: "absolute", right: "100%", top: 0 }}
      />
    </SContainer>
  )
}
