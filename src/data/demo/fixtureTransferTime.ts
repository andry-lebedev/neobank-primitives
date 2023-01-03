const DAY = 86_400_000

export function daysAgo(days: number): string {
  return new Date(Date.now() - days * DAY).toISOString()
}
