import { supabase } from './supabaseClient'

/**
 * Calculates the level based on XP using a progressive threshold system.
 * Each level requires more XP than the previous one.
 * Formula: Level N requires XP = 100 * (N-1) * N / 2 (triangular number pattern)
 */
/**
 * Calculate the level and progression info for a given XP amount.
 * Uses a base threshold (default 100) for level 1 -> 2, and increases the
 * per-level requirement by `increment` each level (default 25).
 * Example: 100, 125, 150, 175, ...
 */
function calculateLevelFromXp(xp: number, base = 100, increment = 25): number {
  return getLevelInfo(xp, base, increment).level
}

/**
 * Synchronous helper that returns detailed level information for a given XP.
 * - level: current level (starts at 1)
 * - xpIntoLevel: how much XP the user has towards the current level
 * - xpForNextLevel: how much XP is required to reach the next level from the start of this level
 * - xpAtLevelStart: total XP required to be at the start of this level
 */
export function getLevelInfo(xp: number, base = 100, increment = 25) {
  let level = 1
  let xpAtLevelStart = 0
  let xpForNextLevel = base

  while (xp >= xpAtLevelStart + xpForNextLevel) {
    xpAtLevelStart += xpForNextLevel
    level++
    xpForNextLevel += increment
  }

  const xpIntoLevel = xp - xpAtLevelStart
  return { level, xpIntoLevel, xpForNextLevel, xpAtLevelStart }
}

/**
 * Checks if the user should level up based on their XP and updates their level if needed.
 * @param userId - The user's ID
 * @param currentXp - The user's current XP amount
 * @returns An object with the new level and whether they leveled up
 */
export async function checkAndUpdateLevel(
  userId: string,
  currentXp: number
): Promise<{ level: number; leveledUp: boolean }> {
  // Get current level from profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('level')
    .eq('id', userId)
    .single()

  if (error) throw error

  const currentLevel = profile?.level || 1
  const calculatedLevel = calculateLevelFromXp(currentXp)

  // If calculated level is higher than current level, level up
  if (calculatedLevel > currentLevel) {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ level: calculatedLevel })
      .eq('id', userId)

    if (updateError) throw updateError

    return { level: calculatedLevel, leveledUp: true }
  }

  return { level: currentLevel, leveledUp: false }
}

export async function addXp(userId: string, amount: number): Promise<number> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('xp')
    .eq('id', userId)
    .single()

  if (error) throw error

  const newXp = (profile?.xp || 0) + amount

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ xp: newXp })
    .eq('id', userId)

  if (updateError) throw updateError

  return newXp
}

/**
 * Get the current XP for a user.
 * Returns 0 if no profile or xp field found.
 */
export async function getXp(userId: string): Promise<number> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('xp')
    .eq('id', userId)
    .single()

  if (error) throw error

  return profile?.xp || 0
}

/**
 * Add (or subtract) currency to the user's profile and return the new balance.
 * Works like addXp but targets the `currency` column. Returns the numeric balance.
 */
export async function addCurrency(userId: string, amount: number): Promise<number> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('currency')
    .eq('id', userId)
    .single()

  if (error) throw error

  const newCurrency = (profile?.currency || 0) + amount

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ currency: newCurrency })
    .eq('id', userId)

  if (updateError) throw updateError

  return newCurrency
}

/**
 * Get the current currency balance for a user. Returns 0 if unset.
 */
export async function getCurrency(userId: string): Promise<number> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('currency')
    .eq('id', userId)
    .single()

  if (error) throw error

  return profile?.currency || 0
}