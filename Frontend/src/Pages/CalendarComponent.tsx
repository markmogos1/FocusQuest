import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../styles/calendar-theme.css';
const localizer = momentLocalizer(moment);

type MyEvent = { title: string; start: Date; end: Date };

const taskList: MyEvent[] = [
  {
    title: 'Demo task',
    start: new Date(),                                
    end: new Date(Date.now() + 60 * 60 * 1000),      
  },
];

export default function CalendarComponent() {
  return (
    <section className="min-h-screen w-full bg-gradient-to-br from-green-200 to-amber-400 py-16 px-4">
      <div className="container mx-auto max-w-5xl bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
        <h1 className="text-2xl font-semibold mb-6">Calendar</h1>

        {/* Calendar wrapper */}
        <div className="h-[70vh] fq-calendar"> 
          <Calendar
            localizer={localizer}
            events={taskList}
            startAccessor="start"
            endAccessor="end"
            views={['month','day','week']}
            style={{ height: '100%' }}  
          />
        </div>
      </div>
    </section>
  );
}
