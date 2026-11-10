import { useMemo, useState } from 'react'
import { addDays, addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, parseISO, startOfMonth, startOfWeek, subMonths } from 'date-fns'
import { AlertTriangle, ChevronLeft, ChevronRight, Plane } from 'lucide-react'
import { Page, Header } from '@/app/App'
import { Button, Card, Drawer, EmptyState, PriorityBadge, StatusBadge } from '@/components/ui'
import TaskForm from '@/components/task/TaskForm'
import { useActions, useDataState, useToast } from '@/hooks/useData'
import { formatDate, todayISO, toISODate } from '@/lib/dates'
import { vi } from '@/i18n/vi'
import { compareTrips, findTripOverlaps, formatTripRange, tripDaySession } from '@/lib/trips'
import { buildIndexes } from '@/lib/indexes'
import { getDueState } from '@/lib/tasks'

const priorityRank={urgent:0,high:1,medium:2,low:3}
export const calendarTimelineTaskOrder=(left,right)=>(priorityRank[left.priority]??4)-(priorityRank[right.priority]??4)||(left.order??0)-(right.order??0)||(left.title||'').localeCompare(right.title||'','vi')

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
  const monthRows=Math.ceil(days.length/7)
  const shift = amount => {setDirection(amount>0?'next':'previous');setCursor(date => mode === 'month' ? (amount > 0 ? addMonths(date, 1) : subMonths(date, 1)) : addDays(date, amount * (mode === 'week' ? 7 : 1)))}
  const dayTasks = date => [...(indexes.tasksByDue.get(date) || [])].sort(calendarTimelineTaskOrder)
  const dayTrips = date => indexes.tripsByDay.get(date) || []
  const move = async (task, date) => {
    const old = task.dueDate
    let startDate = task.startDate
    if (startDate && old) {
      const span = (parseISO(old) - parseISO(startDate)) / 86400000
      startDate = toISODate(addDays(parseISO(date), -span))
    }
    if (!await update('tasks', task.id, { dueDate: date, startDate })) return
    toast(vi.generated.Calendar_45_0(task.title,formatDate(date)), { label: vi.generated.Calendar_45_1, onClick: () => update('tasks', task.id, { dueDate: old, startDate: task.startDate }) })
  }
  const save = async form => {
    const result = editing.id
      ? await update('tasks', editing.id, form)
      : await create('tasks', { ...form, order: data.tasks.length + 1 })
    if (!result) return false
    setEditing(null)
    toast(vi.generated.Calendar_53_2)
    return true
  }
  const selectedTasks=dayTasks(selectedDay),nextAgendaId=selectedTasks.find(task=>task.status!=='done')?.id

  return <Page><div className="calendar-page">
    <Header title={vi.nav.calendar} description={vi.generated.Calendar_58_3}/>
    {!data.tasks.length&&!data.trips.length?<Card><EmptyState title={vi.generated.Calendar_59_4} description={vi.generated.Calendar_59_5} action={<Button onClick={()=>setEditing({dueDate:selectedDay,startDate:selectedDay})}>{vi.generated.Calendar_59_6}</Button>}/></Card>:<><div className="calendar-toolbar">
      <div className="segmented" aria-label={vi.generated.Calendar_60_7}><button className={mode === 'day' ? 'active' : ''} onClick={() => setMode('day')}>{vi.generated.Calendar_60_8}</button><button className={mode === 'week' ? 'active' : ''} onClick={() => setMode('week')}>{vi.generated.Calendar_60_9}</button><button className={mode === 'month' ? 'active' : ''} onClick={() => setMode('month')}>{vi.generated.Calendar_60_10}</button></div>
      <div className="calendar-nav"><Button variant="secondary" onClick={() => {setDirection('today');setCursor(parseISO(todayISO()))}}>{vi.generated.Calendar_61_11}</Button><button aria-label={vi.generated.Calendar_61_12} onClick={() => shift(-1)}><ChevronLeft/></button><strong>{format(cursor, mode === 'month' ? 'MM / yyyy' : 'dd / MM / yyyy')}</strong><button aria-label="Sau" onClick={() => shift(1)}><ChevronRight/></button></div>
    </div>
    <div className="calendar-workspace"><div className={`calendar-grid mode-${mode}`}>
      <div className="weekdays">{['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => <span key={day}>{day}</span>)}</div>
      <div className={`calendar-days slide-${direction}`} style={mode==='month'?{'--calendar-rows':monthRows}:undefined} key={`${mode}-${toISODate(range.start)}`}>{days.map(day => {
        const date = toISODate(day), outside = mode === 'month' && day.getMonth() !== cursor.getMonth(), tasks = dayTasks(date), trips = dayTrips(date), overlap = findTripOverlaps(trips,date).length > 0
        return <button className={`calendar-day ${outside ? 'outside' : ''} ${date === todayISO() ? 'today' : ''} ${selectedDay === date ? 'selected' : ''} ${overlap ? 'overlap' : ''}`} key={date} onClick={() => setSelectedDay(date)} onDoubleClick={() => setEditing({ dueDate: date, startDate: date })}>
          <span className="sr-only">{formatDate(date)}, {tasks.length}{vi.generated.Calendar_68_13}{trips.length}{vi.generated.Calendar_68_14}{overlap?vi.generated.Calendar_68_15:''}. </span><span className="day-number">{format(day, 'd')}</span>{overlap&&<AlertTriangle className="day-overlap-icon" size={15} aria-hidden="true"/>}
          {mode==='month'?<>{[...trips.map(item=>({type:'trip',item})),...tasks.map(item=>({type:'task',item}))].slice(0,2).map(({type,item})=>type==='trip'
            ?<span className={`trip-strip label-theme-${data.trips.indexOf(item)%8+1}`} key={`trip-${item.id}`}><Plane size={11}/>{item.location}{tripDaySession(item,date)&&` · ${tripDaySession(item,date)}`}</span>
            :<span className={`calendar-task status-${item.status} due-${getDueState(item)}`} key={`task-${item.id}`} onClick={event=>{event.stopPropagation();setEditing(item)}}><StatusBadge value={item.status}/><span>{item.title}</span></span>)}
          {tasks.length+trips.length>2&&<small>+{tasks.length+trips.length-2}{vi.calendar.moreItems}</small>}</>:<>{trips.map(trip=><span className={`trip-strip label-theme-${data.trips.indexOf(trip)%8+1}`} key={trip.id}><Plane size={11}/>{trip.location}{tripDaySession(trip,date)&&` · ${tripDaySession(trip,date)}`}</span>)}
          {tasks.slice(0,10).map(task=><span className={`calendar-task status-${task.status} due-${getDueState(task)}`} key={task.id} onClick={event=>{event.stopPropagation();setEditing(task)}}><StatusBadge value={task.status}/><span>{task.title}</span></span>)}</>}
        </button>
      })}</div>
    </div>
    <section className="day-agenda" aria-label={vi.generated.Calendar_75_17}><div className="section-row"><div><span className="eyebrow">{vi.generated.Calendar_75_17}</span><h2>{formatDate(selectedDay)}</h2></div><Button onClick={() => setEditing({ dueDate: selectedDay, startDate: selectedDay })}>{vi.generated.Calendar_75_18}</Button></div><div className="timeline-list">{dayTrips(selectedDay).map(trip=><div className="agenda-row agenda-trip" key={trip.id}><span><Plane size={15}/> {trip.name} · {formatTripRange(trip)}</span></div>)}{selectedTasks.map(task=>{const project=data.projects.find(item=>item.id===task.projectId),projectColor=project?.colorIndex||1;return <article className={`timeline-item ${task.id===nextAgendaId?'is-next':''} ${project?`label-theme-${projectColor}`:''}`} key={task.id}><button aria-label={task.title} onClick={()=>setEditing(task)}/><span><strong>{task.title}</strong><span className="timeline-meta">{project?<span className="project-chip">{project.name}</span>:<span className="project-chip is-empty">{vi.dashboard.noProject}</span>}<PriorityBadge value={task.priority}/><StatusBadge value={task.status}/></span><label>{vi.generated.Calendar_75_19}<input type="date" value={task.dueDate} onChange={event=>move(task,event.target.value)}/></label></span></article>})}</div>{!selectedTasks.length&&<p className="muted">{vi.generated.Calendar_75_20}</p>}</section></div></>}
    </div>{editing && <Drawer title={editing.id ? vi.generated.Calendar_76_21 : vi.generated.Calendar_76_22} onClose={() => setEditing(null)} actions={<><Button variant="secondary" onClick={()=>setEditing(null)}>{vi.generated.Calendar_76_23}</Button><Button type="submit" form={taskFormId}>{vi.generated.Calendar_76_24}</Button></>}><TaskForm formId={taskFormId} showActions={false} task={editing} projects={data.projects} contacts={data.contacts} trips={data.trips} onCancel={() => setEditing(null)} onSave={save}/></Drawer>}
  </Page>
}
