export type RecurrenceJson =
  | { type: 'one-time' }
  | { type: 'daily'; interval?: number; count?: number } // every N days (default 1)
  | { type: 'every_n_days'; interval: number; count?: number }
  | { type: 'weekly'; byweekday: number[]; count?: number } // byweekday: 0 (Sun) - 6 (Sat)

/**
 * Compute the next occurrence (ISO string) for a recurrence object strictly AFTER the provided "after" date.
 * - recurrence: recurrence JSON
 * - after: Date to compute the next occurrence after (exclusive)
 * - completedCount: how many times this task has already been completed (used when recurrence.count is set)
 * Returns null when no next occurrence exists (one-time already happened or count exhausted).
 */
export function computeNextDue(recurrence: RecurrenceJson | null, after: Date, completedCount = 0): string | null {
  if (!recurrence) return null

  // If the recurrence has a count and we've already reached it, return null
  const maxCount = (recurrence as any).count ?? (('count' in recurrence) ? (recurrence as any).count : undefined)
  if (typeof maxCount === 'number' && maxCount > 0 && completedCount >= maxCount) return null

  // Helper: return date at 00:00 of a given date
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)

  // One-time: no next occurrence after the event
  if (recurrence.type === 'one-time') return null

  if (recurrence.type === 'daily' || recurrence.type === 'every_n_days') {
    const interval = ('interval' in recurrence && (recurrence as any).interval) ? (recurrence as any).interval : 1

    // Start searching from the day after 'after'
    let cursor = startOfDay(new Date(after.getTime() + 24 * 60 * 60 * 1000))
    // If after is earlier than today and recurrence should include today, allow today's start
    const todayStart = startOfDay(new Date())
    if (startOfDay(after).getTime() < todayStart.getTime() && startOfDay(todayStart).getTime() === startOfDay(todayStart).getTime()) {
      cursor = todayStart
    }

    // Find next by advancing by interval days until we find one > after
    for (let i = 0; i < 3650; i++) { // safety cap ~10 years
      const candidate = new Date(cursor.getTime() + i * interval * 24 * 60 * 60 * 1000)
      if (candidate.getTime() > after.getTime()) return candidate.toISOString()
    }
    return null
  }

  if (recurrence.type === 'weekly') {
    const by = (recurrence as any).byweekday || []
    if (!by.length) return null

    // Start searching from the day after 'after'
    const start = startOfDay(new Date(after.getTime() + 24 * 60 * 60 * 1000))
    // search up to 8 weeks
    for (let d = 0; d < 7 * 8; d++) {
      const candidate = new Date(start.getFullYear(), start.getMonth(), start.getDate() + d, 0, 0, 0, 0)
      const weekday = candidate.getDay()
      if (by.includes(weekday) && candidate.getTime() > after.getTime()) {
        return candidate.toISOString()
      }
    }
    return null
  }

  return null
}

/**
 * Returns true if the given ISO nextDue string falls on the same local date as `date` (default today).
 */
export function isDueOnDate(nextDueIso: string | null | undefined, date = new Date()): boolean {
  if (!nextDueIso) return false
  try {
    const d = new Date(nextDueIso)
    // Compare using UTC components to avoid issues where stored ISO midnight shifts the local date
    return d.getUTCFullYear() === date.getUTCFullYear() && d.getUTCMonth() === date.getUTCMonth() && d.getUTCDate() === date.getUTCDate()
  } catch (e) {
    return false
  }
}
