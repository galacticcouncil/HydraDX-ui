export function formatInputDisplay(value: string): string {
  if (!value) return ""
  const [intPart = "", ...rest] = value.split(".")
  return [intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " "), ...rest].join(".")
}

export function formatDays(days: number): string {
  if (days <= 0) return "Ready"
  if (days === 1) return "1 day"
  return `${Math.ceil(days)} days`
}
