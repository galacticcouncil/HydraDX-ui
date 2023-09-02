import { Dialog, DialogPortal } from "@radix-ui/react-dialog"
import { ReactComponent as CrossIcon } from "assets/icons/CrossIcon.svg"
import { Backdrop } from "components/Backdrop/Backdrop"
import { Spacer } from "components/Spacer/Spacer"
import { Heading } from "components/Typography/Heading/Heading"
import { Text } from "components/Typography/Text/Text"
import { useTranslation } from "react-i18next"
import { RemoveScroll } from "react-remove-scroll"
import { useToast } from "state/toasts"
import { useApiPromise } from "utils/api"
import { isApiLoaded } from "utils/helpers"
import { ToastContent } from "components/Toast/ToastContent"
import {
  SCloseButton,
  SDialogContent,
  SNoActivitiesContainer,
  SNoActivitiesIcon,
  SSidebarBody,
  SWrapper,
} from "./ToastSidebar.styled"
import { ToastSidebarGroup } from "./group/ToastSidebarGroup"
import { ToastSidebarReferendums } from "./referendums/ToastSidebarReferendums"

export function ToastSidebar() {
  const { t } = useTranslation()
  const api = useApiPromise()

  const store = useToast()
  const onClose = () => store.setSidebar(false)

  const sortedToasts = store.toasts.sort(
    (a, b) =>
      new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime(),
  )

  const pendingToasts = sortedToasts.filter((x) => x.variant === "progress")
  const completedToasts = sortedToasts.filter((x) => x.variant !== "progress")

  return (
    <Dialog open={store.sidebar}>
      <DialogPortal>
        <SWrapper>
          <Backdrop onClick={onClose} />

          <RemoveScroll enabled={store.sidebar}>
            <SDialogContent onEscapeKeyDown={onClose}>
              <div>
                <Heading fw={500} fs={15} tAlign="center" sx={{ py: 24 }}>
                  {t("toast.sidebar.title")}
                </Heading>
                <SCloseButton
                  name={t("toast.close")}
                  icon={<CrossIcon />}
                  onClick={onClose}
                />
              </div>
              <SSidebarBody>
                {isApiLoaded(api) && <ToastSidebarReferendums />}
                {!sortedToasts.length ? (
                  <SNoActivitiesContainer>
                    <SNoActivitiesIcon />
                    <Spacer size={16} />
                    <Text color="basic500">
                      {t("toast.sidebar.empty.text1")}
                    </Text>
                    <Text color="basic500">
                      {t("toast.sidebar.empty.text2")}
                    </Text>
                  </SNoActivitiesContainer>
                ) : (
                  <>
                    {pendingToasts.length > 0 && (
                      <ToastSidebarGroup title={t("toast.sidebar.pending")}>
                        <div sx={{ flex: "column", gap: 6 }}>
                          {pendingToasts.map((toast) => (
                            <ToastContent
                              key={toast.id}
                              variant={toast.variant}
                              title={
                                <div
                                  dangerouslySetInnerHTML={{
                                    __html: toast.title,
                                  }}
                                />
                              }
                              actions={toast.actions}
                              dateCreated={
                                typeof toast.dateCreated === "string"
                                  ? new Date(toast.dateCreated)
                                  : toast.dateCreated
                              }
                            />
                          ))}
                        </div>
                      </ToastSidebarGroup>
                    )}
                    {completedToasts.length > 0 && (
                      <ToastSidebarGroup title={t("toast.sidebar.completed")}>
                        <div sx={{ flex: "column", gap: 6 }}>
                          {completedToasts.map((toast) => (
                            <ToastContent
                              key={toast.id}
                              link={toast.link}
                              variant={toast.variant}
                              title={
                                <div
                                  dangerouslySetInnerHTML={{
                                    __html: toast.title,
                                  }}
                                />
                              }
                              actions={toast.actions}
                              dateCreated={
                                typeof toast.dateCreated === "string"
                                  ? new Date(toast.dateCreated)
                                  : toast.dateCreated
                              }
                            />
                          ))}
                        </div>
                      </ToastSidebarGroup>
                    )}
                  </>
                )}
              </SSidebarBody>
            </SDialogContent>
          </RemoveScroll>
        </SWrapper>
      </DialogPortal>
    </Dialog>
  )
}
