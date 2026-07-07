/** Whole days from now until the given ISO date. Negative when the date is in the past. */
export function daysUntil(date: string): number {
  return Math.floor((new Date(date).getTime() - Date.now()) / 86_400_000)
}
