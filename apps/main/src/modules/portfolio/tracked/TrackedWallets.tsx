import { Search, WalletIcon } from "@galacticcouncil/ui/assets/icons"
import TrackedWalletImage from "@galacticcouncil/ui/assets/images/TrackedWallet.webp"
import {
  Button,
  Flex,
  Icon,
  Input,
  Modal,
  Paper,
  Text,
} from "@galacticcouncil/ui/components"
import { FC, useState } from "react"
import { useTranslation } from "react-i18next"

import { EmptyState } from "@/components/EmptyState"
import { SortingProps } from "@/hooks/useDataTableUrlSorting"
import { ManageTrackedWalletsModal } from "@/modules/portfolio/tracked/ManageTrackedWalletsModal"
import { TrackedWalletCard } from "@/modules/portfolio/tracked/TrackedWalletCard"
import { TrackedWalletGlyph } from "@/modules/portfolio/tracked/TrackedWalletGlyph"
import { useTrackedWallets } from "@/states/trackedWallets"

type Props = {
  readonly searchPhrase: string
  readonly onSearchPhraseChange?: (searchPhrase: string) => void
  readonly sortingProps: SortingProps
}

export const TrackedWallets: FC<Props> = ({
  searchPhrase,
  onSearchPhraseChange,
  sortingProps,
}) => {
  const { t } = useTranslation(["wallet", "common"])

  const wallets = useTrackedWallets()
  const [isManageOpen, setIsManageOpen] = useState(false)

  return (
    <Flex direction="column" gap="xl">
      <Flex
        align={["stretch", null, "center"]}
        justify="space-between"
        gap="base"
        direction={["column", null, "row"]}
      >
        <Flex align="center" gap="s">
          <TrackedWalletGlyph size={20} />
          <Text as="h2" font="primary" fs="h7" fw={500} color="text.high">
            {t("myAssets.tracked.title")}
          </Text>
        </Flex>
        <Flex
          align={["stretch", null, "center"]}
          gap="l"
          direction={["column-reverse", null, "row"]}
          width={["100%", null, "auto"]}
        >
          <Button
            size="small"
            variant="muted"
            outline
            onClick={() => setIsManageOpen(true)}
          >
            <Icon size="xs" component={WalletIcon} />
            {t("myAssets.tracked.manage")}
          </Button>
          {onSearchPhraseChange && (
            <Input
              value={searchPhrase}
              placeholder={t("common:search.placeholder.assets")}
              iconStart={Search}
              width={["100%", null, "4xl"]}
              onChange={(e) => onSearchPhraseChange(e.target.value)}
            />
          )}
        </Flex>
      </Flex>

      {wallets.length === 0 ? (
        <Paper overflow="hidden">
          <EmptyState
            image={TrackedWalletImage}
            header={t("myAssets.tracked.empty.title")}
            description={t("myAssets.tracked.empty.description")}
            action={
              <Button
                size="medium"
                variant="secondary"
                onClick={() => setIsManageOpen(true)}
              >
                {t("myAssets.tracked.empty.addAddress")}
              </Button>
            }
          />
        </Paper>
      ) : (
        <Flex direction="column" gap="l">
          {wallets.map((wallet) => (
            <TrackedWalletCard
              key={wallet.publicKey}
              wallet={wallet}
              searchPhrase={searchPhrase}
              sortingProps={sortingProps}
            />
          ))}
        </Flex>
      )}

      <Modal
        variant="popup"
        open={isManageOpen}
        onOpenChange={() => setIsManageOpen(false)}
      >
        <ManageTrackedWalletsModal
          onSaved={(address) => {
            setIsManageOpen(false)
            setTimeout(() => {
              document
                .querySelector(`[data-address="${CSS.escape(address)}"]`)
                ?.scrollIntoView({ behavior: "smooth", block: "start" })
            }, 250)
          }}
        />
      </Modal>
    </Flex>
  )
}
