import { useEffect, useState } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../styles/calendar-theme.css';
import { supabase } from '../lib/supabaseClient';
import { isDueOnDate } from '../lib/recurrence';

const localizer = momentLocalizer(moment);

type MyEvent = { title: string; start: Date; end: Date; allDay?: boolean; original?: any };

export default function CalendarComponent() {
  const [events, setEvents] = useState<MyEvent[]>([])

  const DIFFICULTY_COLORS: Record<number, string> = {
    1: '#10B981', // green
    2: '#F59E0B', // amber
    3: '#F97316', // orange
    4: '#EF4444', // red
  }

  const eventStyleGetter = (event: any/*MyEvent*/, _start: Date, _end: Date, _isSelected: boolean) => {
    const diff = Number(event?.original?.difficulty) || 1
    const bg = DIFFICULTY_COLORS[diff] || '#6B7280'
    return {
      style: {
        backgroundColor: bg,
        borderRadius: '6px',
        color: '#fff',
        border: '0px',
        padding: '2px 6px',
      }
    }
  }

  // Demo fallback event (all-day)
  const demoStart = new Date()
  const demoEvent: MyEvent = {
    title: 'Demo task',
    start: new Date(demoStart.getFullYear(), demoStart.getMonth(), demoStart.getDate()),
    end: new Date(demoStart.getFullYear(), demoStart.getMonth(), demoStart.getDate() + 1),
    allDay: true,
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { data } = await supabase.auth.getUser()
        const user = data?.user
        if (!user) {
          if (mounted) setEvents([demoEvent])
          return
        }

        const { data: rows, error } = await supabase
          .from('taskitem')
          .select('*')
          .eq('user_id', user.id)
          .eq('active', true)
          .order('next_due', { ascending: true })

        if (error) throw error

        if (!rows || rows.length === 0) {
          if (mounted) setEvents([demoEvent])
          return
        }

  // show only tasks that have a next_due (i.e. tasks with a due date).
  // We intentionally include any next_due value so calendar shows scheduled tasks
  // in the future (or past) instead of recurring/daily tasks that lack a next_due.
  const dueRows = rows.filter((r: any) => !!r.next_due)
        if (!dueRows || dueRows.length === 0) {
          if (mounted) setEvents([demoEvent])
          return
        }

        const mapped: MyEvent[] = dueRows.map((r: any) => {
          const raw = new Date(r.next_due)
          // use UTC components from the ISO string so a stored midnight UTC maps to the intended date
          const start = new Date(raw.getUTCFullYear(), raw.getUTCMonth(), raw.getUTCDate())
          const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1)
          const titleParts = [r.name]
          if (r.xp) titleParts.push(`+${r.xp} XP`)
          if (r.recurrence) titleParts.push('(repeats)')
          return { title: titleParts.join(' '), start, end, allDay: true, original: r }
        })

        if (mounted) setEvents(mapped)
      } catch (e) {
        console.error('Failed to load calendar tasks', e)
        if (mounted) setEvents([demoEvent])
      }
    })()

    return () => { mounted = false }
  }, [])

  const onSelectEvent = (ev: MyEvent) => {
    // simple interaction: log details and show original payload in console
    console.log('Calendar event selected', ev)
    if (ev.original) {
      // eslint-disable-next-line no-alert
      alert(`Task: ${ev.original.name}\nNext due: ${ev.original.next_due || ev.original.created_at}`)
    }
  }

  return (
    <section className="min-h-screen w-full bg-gradient-to-br from-green-200 to-amber-400 py-16 px-4">
      <div className="container mx-auto max-w-5xl bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
        <h1 className="text-2xl font-semibold mb-3">Calendar</h1>
        <div className="flex items-center gap-2 text-sm mb-4">
          <span className="text-sm text-gray-600">Legend:</span>
          <span className="px-2 py-1 rounded text-white" style={{ backgroundColor: DIFFICULTY_COLORS[1] }}>Easy</span>
          <span className="px-2 py-1 rounded text-white" style={{ backgroundColor: DIFFICULTY_COLORS[2] }}>Medium</span>
          <span className="px-2 py-1 rounded text-white" style={{ backgroundColor: DIFFICULTY_COLORS[3] }}>Hard</span>
          <span className="px-2 py-1 rounded text-white" style={{ backgroundColor: DIFFICULTY_COLORS[4] }}>Very Hard</span>
        </div>

        {/* Calendar wrapper */}
        <div className="h-[70vh] fq-calendar"> 
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            views={["month","day","week"]}
            onSelectEvent={onSelectEvent}
            eventPropGetter={eventStyleGetter}
            style={{ height: '100%' }}  
          />
        </div>
      </div>
    </section>
  );
}
