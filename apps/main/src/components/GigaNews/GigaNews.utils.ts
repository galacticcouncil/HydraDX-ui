export type GigaNewsToggleAction = "collapse" | "restore" | "expand"

export const gigaNewsToggleAction = (
  expanded: boolean,
  allClosed: boolean,
): GigaNewsToggleAction => {
  if (expanded) return "collapse"
  return allClosed ? "restore" : "expand"
}
