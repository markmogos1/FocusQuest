import { supabase } from './supabaseClient'

export interface PlayerStats {
  user_id: string
  enemies_defeated: number
  last_enemy_round: number
  player_hp: number
  updated_at: string
}

/**
 * Ensure a row exists for this user and return it.
 * Uses the convenience RPC `ensure_player_stats` created in the migration.
 */
export async function getOrCreatePlayerStats(userId: string): Promise<PlayerStats | null> {
  try {
    const { data, error } = await supabase.rpc('ensure_player_stats', { p_user_id: userId })
    // debug/log the RPC response so browser console shows any Supabase error (helps debug RLS/permission issues)
    // eslint-disable-next-line no-console
    console.debug('ensure_player_stats rpc response', { data, error })
    if (error) {
      // eslint-disable-next-line no-console
      console.error('ensure_player_stats rpc error', error)
      return null
    }
    return (data && data[0]) ? data[0] as PlayerStats : null
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('getOrCreatePlayerStats failed', e)
    return null
  }
}

/**
 * Read the player's stats (simple select). If no row exists, returns null.
 */
export async function getPlayerStats(userId: string): Promise<PlayerStats | null> {
  try {
    const { data, error } = await supabase.from('player_stats').select('*').eq('user_id', userId).single()
    if (error) {
      // if row not found, return null (use getOrCreatePlayerStats to create)
      return null
    }
    return data as PlayerStats
  } catch (e) {
    console.error('getPlayerStats failed', e)
    return null
  }
}

/**
 * Atomically increment enemies_defeated by `delta` (use RPC for atomicity)
 * Returns the updated row or null.
 */
export async function incrementEnemiesDefeated(userId: string, delta = 1): Promise<PlayerStats | null> {
  try {
    const { data, error } = await supabase.rpc('increment_enemies_defeated', { p_user_id: userId, p_delta: delta })
    if (error) throw error
    return (data && data[0]) ? data[0] as PlayerStats : null
  } catch (e) {
    console.error('incrementEnemiesDefeated failed', e)
    return null
  }
}

/**
 * Set the player's HP (atomic upsert via RPC)
 */
export async function setPlayerHp(userId: string, hp: number): Promise<PlayerStats | null> {
  try {
    const { data, error } = await supabase.rpc('set_player_hp', { p_user_id: userId, p_hp: hp })
    if (error) throw error
    return (data && data[0]) ? data[0] as PlayerStats : null
  } catch (e) {
    console.error('setPlayerHp failed', e)
    return null
  }
}

/**
 * Set the player's current enemy HP (atomic upsert via RPC)
 */
export async function setEnemyHp(userId: string, hp: number): Promise<PlayerStats | null> {
  try {
    const { data, error } = await supabase.rpc('set_enemy_hp', { p_user_id: userId, p_hp: hp })
    if (error) throw error
    return (data && data[0]) ? data[0] as PlayerStats : null
  } catch (e) {
    console.error('setEnemyHp failed', e)
    return null
  }
}


/**
 * Set the player's last_enemy_round (simple update). Returns updated row or null.
 */
export async function setLastEnemyRound(userId: string, round: number): Promise<PlayerStats | null> {
  try {
    // Use upsert to ensure a row exists (avoids single-row update errors when table is empty)
    const payload = { user_id: userId, last_enemy_round: round, updated_at: new Date().toISOString() }
    const { data, error } = await supabase.from('player_stats').upsert(payload, { onConflict: 'user_id' }).select().single()
    if (error) {
      // eslint-disable-next-line no-console
      console.error('setLastEnemyRound failed', error)
      return null
    }
    return data as PlayerStats
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('setLastEnemyRound failed', e)
    return null
  }
}
