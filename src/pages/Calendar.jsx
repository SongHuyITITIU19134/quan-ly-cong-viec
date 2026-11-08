import { useMemo, useState } from 'react'
import { addDays, addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, parseISO, startOfMonth, startOfWeek, subMonths } from 'date-fns'
import { AlertTriangle, ChevronLeft, ChevronRight, Plane } from 'lucide-react'
import { Page, Header } from '@/app/App'
import { Button, Card, Drawer, EmptyState, StatusBadge } from '@/components/ui'
import TaskForm from '@/components/task/TaskForm'
import { useActions, useDataState, useToast } from '@/hooks/useData'
import { formatDate, todayISO, toISODate } from '@/lib/dates'
import { vi } from '@/i18n/vi'
import { compareTrips, findTripOverlaps, formatTripRange, tripDaySession } from '@/lib/trips'
import { buildIndexes } from '@/lib/indexes'

export default function Calendar() {
  const { data } = useDataState()
  const { create, update } = useActions()
  const toast = useToast()
  const [mode, setMode] = useState('month')
  const [cursor, setCursor] = useState(parseISO(todayISO()))
  const [direction, setDirection] = useState('next')
  const [selectedDay, setSelectedDay] = useState(todayISO())
  const [editing, setEditing] = useState(null)
  const taskFormId='calendar-task-form'
  const indexes=useMemo(()=>{
    const next=buildIndexes(data)
    for(const trips of next.tripsByDay.values())trips.sort(compareTrips)
    return next
  },[data.tasks,data.trips])
  const range = useMemo(() => {
    if (mode === 'day') return { start: cursor, end: cursor }
    if (mode === 'week') return { start: startOfWeek(cursor, { weekStartsOn: 1 }), end: endOfWeek(cursor, { weekStartsOn: 1 }) }
    return { start: startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 }) }
  }, [cursor, mode])
  const days = eachDayOfInterval(range)
  const shift = amount => {setDirection(amount>0?'next':'previous');setCursor(date => mode === 'month' ? (amount > 0 ? addMonths(date, 1) : subMonths(date, 1)) : addDays(date, amount * (mode === 'week' ? 7 : 1)))}
  const dayTasks = date => indexes.tasksByDue.get(date) || []
  const dayTrips = date => indexes.tripsByDay.get(date) || []
  const move = async (task, date) => {
    const old = task.dueDate
    let startDate = task.startDate
    if (startDate && old) {
      const span = (parseISO(old) - parseISO(startDate)) / 86400000
      startDate = toISODate(addDays(parseISO(date), -span))
    }
    if (!await update('tasks', task.id, { dueDate: date, startDate })) return
    toast(`Đã chuyển “${task.title}” sang ${formatDate(date)}.`, { label: 'Hoàn tác', onClick: () => update('tasks', task.id, { dueDate: old, startDate: task.startDate }) })
  }
  const save = async form => {
    const result = editing.id
      ? await update('tasks', editing.id, form)
      : await create('tasks', { ...form, order: data.tasks.length + 1 })
    if (!result) return false
    setEditing(null)
    toast('Đã lưu nhiệm vụ.')
    return true
  }

  return <Page>
    <Header title={vi.nav.calendar} description="Nhiệm vụ và chuyến công tác trên cùng một lịch"/>
    {!data.tasks.length&&!data.trips.length?<Card><EmptyState title="Chưa có lịch công việc" description="Tạo nhiệm vụ đầu tiên để hiển thị trên lịch." action={<Button onClick={()=>setEditing({dueDate:selectedDay,startDate:selectedDay})}>Tạo nhiệm vụ</Button>}/></Card>:<><div className="calendar-toolbar">
      <div className="segmented" aria-label="Kiểu lịch"><button className={mode === 'day' ? 'active' : ''} onClick={() => setMode('day')}>Ngày</button><button className={mode === 'week' ? 'active' : ''} onClick={() => setMode('week')}>Tuần</button><button className={mode === 'month' ? 'active' : ''} onClick={() => setMode('month')}>Tháng</button></div>
      <div className="calendar-nav"><Button variant="secondary" onClick={() => {setDirection('today');setCursor(parseISO(todayISO()))}}>Hôm nay</Button><button aria-label="Trước" onClick={() => shift(-1)}><ChevronLeft/></button><strong>{format(cursor, mode === 'month' ? 'MM / yyyy' : 'dd / MM / yyyy')}</strong><button aria-label="Sau" onClick={() => shift(1)}><ChevronRight/></button></div>
    </div>
    <div className={`calendar-grid mode-${mode}`}>
      <div className="weekdays">{['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => <span key={day}>{day}</span>)}</div>
      <div className={`calendar-days slide-${direction}`} key={`${mode}-${toISODate(range.start)}`}>{days.map(day => {
        const date = toISODate(day), outside = mode === 'month' && day.getMonth() !== cursor.getMonth(), tasks = dayTasks(date), trips = dayTrips(date), overlap = findTripOverlaps(trips,date).length > 0
        return <button className={`calendar-day ${outside ? 'outside' : ''} ${date === todayISO() ? 'today' : ''} ${selectedDay === date ? 'selected' : ''} ${overlap ? 'overlap' : ''}`} key={date} onClick={() => setSelectedDay(date)} onDoubleClick={() => setEditing({ dueDate: date, startDate: date })}>
          <span className="sr-only">{formatDate(date)}, {tasks.length} nhiệm vụ, {trips.length} chuyến công tác{overlap?', có lịch trùng':''}. </span><span className="day-number">{format(day, 'd')}</span>{overlap&&<AlertTriangle className="day-overlap-icon" size={15} aria-hidden="true"/>}
          {trips.map(trip => <span className={`trip-strip label-theme-${data.trips.indexOf(trip) % 8 + 1}`} key={trip.id}><Plane size={11}/>{trip.location}{tripDaySession(trip,date)&&` · ${tripDaySession(trip,date)}`}</span>)}
          {tasks.slice(0, mode === 'month' ? 3 : 10).map(task => <span className={`calendar-task status-${task.status}`} key={task.id} onClick={event => { event.stopPropagation(); setEditing(task) }}>{task.title}</span>)}
          {tasks.length > 3 && mode === 'month' && <small>+{tasks.length - 3} việc</small>}
        </button>
      })}</div>
    </div>
    <section className="day-agenda"><div className="section-row"><div><span className="eyebrow">Ngày đã chọn</span><h2>{formatDate(selectedDay)}</h2></div><Button onClick={() => setEditing({ dueDate: selectedDay, startDate: selectedDay })}>Tạo nhiệm vụ</Button></div>{dayTrips(selectedDay).map(trip=><div className="agenda-row" key={trip.id}><span><Plane size={15}/> {trip.name} · {formatTripRange(trip)}</span></div>)}{dayTasks(selectedDay).map(task => <div className="agenda-row" key={task.id}><button onClick={() => setEditing(task)}>{task.title}</button><StatusBadge value={task.status}/><label>Đổi ngày <input type="date" value={task.dueDate} onChange={event => move(task, event.target.value)}/></label></div>)}{!dayTasks(selectedDay).length && <p className="muted">Chưa có nhiệm vụ trong ngày này. Bấm đúp vào ô ngày để tạo nhanh.</p>}</section></>}
    {editing && <Drawer title={editing.id ? 'Chi tiết nhiệm vụ' : 'Tạo nhiệm vụ'} onClose={() => setEditing(null)} actions={<><Button variant="secondary" onClick={()=>setEditing(null)}>Hủy</Button><Button type="submit" form={taskFormId}>Lưu thay đổi</Button></>}><TaskForm formId={taskFormId} showActions={false} task={editing} projects={data.projects} contacts={data.contacts} trips={data.trips} onCancel={() => setEditing(null)} onSave={save}/></Drawer>}
  </Page>
}
