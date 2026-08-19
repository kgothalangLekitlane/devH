export function formatLocalDateTime(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value)
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

export function formatRelativeTime(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value)
  const diff = Date.now() - date.getTime()
  const seconds = Math.round(diff / 1000)
  if (seconds < 30) return "just now"
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatLocalDateTime(date)
}
