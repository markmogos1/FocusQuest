import { supabase } from './supabaseClient'

/**
 * Calculates the level based on XP using a progressive threshold system.
 * Each level requires more XP than the previous one.
 * Formula: Level N requires XP = 100 * (N-1) * N / 2 (triangular number pattern)
 */
function calculateLevelFromXp(xp: number): number {
  if (xp < 100) return 1
  
  // Using a formula where each level requires progressively more XP
  // Level 1: 0-99 XP
  // Level 2: 100-249 XP
  // Level 3: 250-449 XP
  // Level 4: 450-699 XP
  // Level 5: 700-999 XP
  // etc.
  
  let level = 1
  let xpRequired = 0
  let xpForNextLevel = 100
  
  while (xp >= xpRequired + xpForNextLevel) {
    xpRequired += xpForNextLevel
    level++
    xpForNextLevel += 50 // Each level requires 50 more XP than the previous threshold
  }
  
  return level
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