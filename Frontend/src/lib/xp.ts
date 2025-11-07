import { supabase } from './supabaseClient'

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