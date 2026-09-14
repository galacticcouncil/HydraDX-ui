import { DcaStatus } from "@galacticcouncil/indexer/neckwork"

import { DcaScheduleStatus } from "@/modules/trade/orders/lib/types"

const DCA_SCHEDULE_STATUS_BY_API = {
  created: DcaScheduleStatus.Created,
  completed: DcaScheduleStatus.Completed,
  terminated: DcaScheduleStatus.Terminated,
  cancelled: DcaScheduleStatus.Cancelled,
} satisfies Record<DcaStatus, DcaScheduleStatus>

const API_STATUS_BY_DCA_SCHEDULE_STATUS = {
  [DcaScheduleStatus.Created]: "created",
  [DcaScheduleStatus.Completed]: "completed",
  [DcaScheduleStatus.Terminated]: "terminated",
  [DcaScheduleStatus.Cancelled]: "cancelled",
} satisfies Record<DcaScheduleStatus, DcaStatus>

export const toDcaScheduleStatus = (status: DcaStatus): DcaScheduleStatus =>
  DCA_SCHEDULE_STATUS_BY_API[status]

export const toApiDcaStatuses = (
  statuses: ReadonlyArray<DcaScheduleStatus>,
): ReadonlyArray<DcaStatus> =>
  statuses.map((status) => API_STATUS_BY_DCA_SCHEDULE_STATUS[status])
