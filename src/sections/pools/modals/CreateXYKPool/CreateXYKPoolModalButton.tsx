import { Button, ButtonProps } from "components/Button/Button"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import PlusIcon from "assets/icons/PlusIcon.svg?react"
import { CreateXYKPoolModal } from "./CreateXYKPoolModal"

export const CreateXYKPoolModalButton: React.FC<ButtonProps> = (props) => {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  return (
    <>
      <Button
        variant="primary"
        size="compact"
        onClick={() => setIsOpen(true)}
        {...props}
      >
        <PlusIcon width={14} height={14} sx={{ mr: 4 }} />
        {t("liquidity.pool.xyk.create")}
      </Button>
      {isOpen && <CreateXYKPoolModal isOpen onClose={() => setIsOpen(false)} />}
    </>
  )
}
