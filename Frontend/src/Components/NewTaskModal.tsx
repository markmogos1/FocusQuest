import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { computeNextDue } from '../lib/recurrence'
import type { RecurrenceJson } from '../lib/recurrence'

type Props = {
  onClose: () => void
  onCreate: (task: any) => void
}

const NewTaskModal: React.FC<Props> = ({ onClose, onCreate }) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [difficulty, setDifficulty] = useState(1)
  const [recurrenceType, setRecurrenceType] = useState<'one-time'|'daily'|'every_n_days'|'weekly'>('one-time')
  const [interval, setInterval] = useState(1)
  const [weekdays, setWeekdays] = useState<number[]>([])
  const [repeats, setRepeats] = useState<number | null>(null)
  const [oneTimeDate, setOneTimeDate] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const toggleWeekday = (d: number) => {
    setWeekdays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData?.user?.id
      if (!userId) throw new Error('Not logged in')

      let recurrence: RecurrenceJson | null = null
      if (recurrenceType === 'one-time') recurrence = { type: 'one-time' }
      else if (recurrenceType === 'daily') recurrence = { type: 'daily', interval }
      else if (recurrenceType === 'every_n_days') recurrence = { type: 'every_n_days', interval }
      else if (recurrenceType === 'weekly') recurrence = { type: 'weekly', byweekday: weekdays }

      // attach repeats/count into recurrence if provided
      if (recurrence && repeats && repeats > 0) {
        ;(recurrence as any).count = repeats
      }

      // compute initial next_due.
      // For one-time tasks we respect an explicit date the user can pick. Otherwise use computeNextDue.
      let next_due: string | null = null
      if (recurrenceType === 'one-time') {
        if (oneTimeDate) {
          // interpret user-provided date as local midnight and convert to ISO
          const localMidnight = new Date(`${oneTimeDate}T00:00:00`)
          next_due = localMidnight.toISOString()
        } else {
          // no date provided: default to today at local midnight
          const today = new Date()
          const localMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0)
          next_due = localMidnight.toISOString()
        }
      } else {
        next_due = computeNextDue(recurrence, new Date(Date.now() - 24 * 60 * 60 * 1000), 0)
      }

      const insertObj = {
        user_id: userId,
        name,
        description,
        difficulty,
        recurrence: recurrence ? recurrence : null,
        next_due,
        start_at: new Date().toISOString(),
      }

      const { data, error } = await supabase.from('taskitem').insert([insertObj]).select()
      if (error) throw error
      onCreate(data?.[0])
      onClose()
    } catch (err) {
      console.error('Create task failed', err)
      alert('Failed to create task: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <form onSubmit={onSubmit} className="relative bg-white rounded-xl p-6 w-full max-w-lg shadow-lg">
        <h3 className="text-lg font-bold mb-4">New Task</h3>
        <label className="block mb-2 text-sm">Title</label>
        <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border rounded mb-3" required />

        <label className="block mb-2 text-sm">Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full px-3 py-2 border rounded mb-3" />

        <label className="block mb-2 text-sm">Difficulty</label>
        <select value={difficulty} onChange={e => setDifficulty(Number(e.target.value))} className="w-40 px-2 py-1 border rounded mb-3">
          <option value={1}>Easy</option>
          <option value={2}>Medium</option>
          <option value={3}>Hard</option>
          <option value={4}>Very Hard</option>
        </select>

        <div className="mt-3">
          <label className="block mb-2 text-sm">Recurrence</label>
          <div className="flex gap-2 mb-2">
            <button type="button" onClick={() => setRecurrenceType('one-time')} className={`px-2 py-1 rounded ${recurrenceType==='one-time'?'bg-amber-200':''}`}>One-time</button>
            <button type="button" onClick={() => setRecurrenceType('daily')} className={`px-2 py-1 rounded ${recurrenceType==='daily'?'bg-amber-200':''}`}>Daily</button>
            <button type="button" onClick={() => setRecurrenceType('every_n_days')} className={`px-2 py-1 rounded ${recurrenceType==='every_n_days'?'bg-amber-200':''}`}>Every N days</button>
            <button type="button" onClick={() => setRecurrenceType('weekly')} className={`px-2 py-1 rounded ${recurrenceType==='weekly'?'bg-amber-200':''}`}>Weekly</button>
          </div>

          {(recurrenceType === 'daily' || recurrenceType === 'every_n_days') && (
            <div className="flex items-center gap-2">
              <label className="text-sm">Interval</label>
              <input type="number" min={1} value={interval} onChange={e => setInterval(Number(e.target.value))} className="w-20 px-2 py-1 border rounded" />
            </div>
          )}

          {recurrenceType === 'weekly' && (
            <div className="flex gap-2 mt-2">
              {['S','M','T','W','T','F','S'].map((d, i) => (
                <button key={i} type="button" onClick={() => toggleWeekday(i)} className={`px-2 py-1 rounded ${weekdays.includes(i)?'bg-emerald-200':''}`}>{d}</button>
              ))}
            </div>
          )}

          {recurrenceType === 'one-time' && (
            <div className="mt-3">
              <label className="block mb-2 text-sm">When (date)</label>
              <input type="date" value={oneTimeDate} onChange={e => setOneTimeDate(e.target.value)} className="px-2 py-1 border rounded" />
              <div className="text-xs text-gray-500 mt-1">Leave empty to schedule for today.</div>
            </div>
          )}

          <div className="mt-3">
            <label className="block mb-2 text-sm">Repeats (optional)</label>
            <input type="number" min={1} placeholder="e.g. 5" value={repeats ?? ''} onChange={e => setRepeats(e.target.value ? Number(e.target.value) : null)} className="w-32 px-2 py-1 border rounded" />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-1 rounded border">Cancel</button>
          <button type="submit" disabled={loading} className="px-4 py-1 rounded bg-emerald-600 text-white">{loading? 'Creating...' : 'Create'}</button>
        </div>
      </form>
    </div>
  )
}

export default NewTaskModal
