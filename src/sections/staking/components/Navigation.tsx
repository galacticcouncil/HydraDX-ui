import { Text } from "components/Typography/Text/Text"
import { useTranslation } from "react-i18next"
import { ReactComponent as ChevronDownIcon } from "assets/icons/ChevronRight.svg"
import { useNavigate } from "@tanstack/react-location"
import { IconButton } from "components/IconButton/IconButton"

export const Navigation = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div sx={{ flex: "row", gap: 10, align: "center" }}>
      <IconButton
        name="Back"
        icon={<ChevronDownIcon />}
        onClick={() => navigate({ to: "" })}
        css={{
          borderColor: "rgba(114, 131, 165, 0.6)",
          color: "white",
          transform: "rotate(180deg)",
        }}
        size={24}
      />
      <Text fs={13} tTransform="uppercase" color="white">
        {t("voting.referenda.navigation.btn")}
      </Text>
    </div>
  )
}
