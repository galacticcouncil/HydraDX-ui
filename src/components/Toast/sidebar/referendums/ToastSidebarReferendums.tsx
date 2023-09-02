import { useReferendums } from "api/democracy"
import { ReferendumCard } from "components/ReferendumCard/ReferendumCard"
import { useTranslation } from "react-i18next"
import { ToastSidebarGroup } from "components/Toast/sidebar/group/ToastSidebarGroup"
import { useProviderRpcUrlStore } from "api/provider"
import { ReferendumCardRococo } from "components/ReferendumCard/ReferendumCardRococo"

export const ToastSidebarReferendums = () => {
  const { t } = useTranslation()
  const referendums = useReferendums("ongoing")
  const providers = useProviderRpcUrlStore()
  const rococoProvider = [
    "hydradx-rococo-rpc.play.hydration.cloud",
    "mining-rpc.hydradx.io",
  ].find(
    (rpc) =>
      (providers.rpcUrl ?? import.meta.env.VITE_PROVIDER_URL) ===
      `wss://${rpc}`,
  )

  if (!referendums.data?.length) return null

  return (
    <ToastSidebarGroup title={t("toast.sidebar.referendums.title")}>
      <div sx={{ flex: "column", gap: 8 }}>
        {referendums.data.map((referendum) =>
          rococoProvider ? (
            <ReferendumCardRococo
              key={referendum.id}
              type="toast"
              {...referendum}
            />
          ) : (
            <ReferendumCard key={referendum.id} type="toast" {...referendum} />
          ),
        )}
      </div>
    </ToastSidebarGroup>
  )
}
