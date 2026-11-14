import { CalendarDays, Check, Plane } from 'lucide-react'
import { PriorityBadge, StatusBadge } from '@/components/ui'
import { formatDate } from '@/lib/dates'
import { getDueState } from '@/lib/tasks'
import { formatTripRange } from '@/lib/trips'
import { vi } from '@/i18n/vi'
import { workingDateGroup } from './workingTasks'

function groupLabel(key, today) {
  if (key === 'overdue') return vi.dashboard.groupOverdue
  if (key === 'today') return vi.dashboard.groupToday
  if (key === 'tomorrow') return vi.dashboard.groupTomorrow
  if (key === 'noDue') return vi.dashboard.groupNoDue
  const date = new Date(`${key}T12:00:00`)
  const weekday = new Intl.DateTimeFormat('vi-VN', { weekday: 'long' }).format(date)
  return `${weekday}, ${key.slice(8, 10)}/${key.slice(5, 7)}${key.slice(0, 4) === today.slice(0, 4) ? '' : `/${key.slice(0, 4)}`}`
}

export default function TaskTimeline({ mode = 'working', tasks, projects, today, compact = false, onToggle, onEdit, onMove, trips = [], nextId }) {
  if (mode === 'calendar') return <div className="timeline-list">{trips.map(trip => <div className="agenda-row agenda-trip" key={trip.id}>
    <span><Plane size={15}/> {trip.name} · {formatTripRange(trip)}</span></div>)}{tasks.map(task => {
    const project = projects.find(item => item.id === task.projectId), projectColor = project?.colorIndex || 1
    return <article className={`timeline-item ${task.id === nextId ? 'is-next' : ''} ${project ? `label-theme-${projectColor}` : ''}`} key={task.id}>
      <button aria-label={task.title} onClick={() => onEdit(task)}/><span><strong>{task.title}</strong><span className="timeline-meta">
        {project ? <span className="project-chip">{project.name}</span> : <span className="project-chip is-empty">{vi.dashboard.noProject}</span>}
        <PriorityBadge value={task.priority}/><StatusBadge value={task.status}/></span><label>{vi.generated.Calendar_75_19}
          <input type="date" value={task.dueDate} onChange={event => onMove(task, event.target.value)}/></label></span></article>
  })}</div>
  const groups = new Map()
  for (const task of tasks.slice(0, compact ? undefined : 30)) {
    const key = workingDateGroup(task.dueDate, today)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(task)
  }
  return <div className={`timeline-list working-timeline ${compact ? 'is-compact' : ''}`}>
    {[...groups].map(([key, items]) => <section className="working-timeline-group" key={key}>
      <h3>{groupLabel(key, today)}</h3>{items.map(task => {
        const project = projects.find(item => item.id === task.projectId), projectColor = project?.colorIndex || 1
        const dueState = getDueState(task, today), due = ['overdue', 'today', 'soon'].includes(dueState) ? dueState : null
        return <article className={`timeline-item ${task.id === nextId ? 'is-next' : ''} ${project ? `label-theme-${projectColor}` : ''}`} key={task.id}>
          {onToggle ? <button aria-label={task.status === 'done' ? vi.completeToggle.reopen(task.title) : vi.completeToggle.complete(task.title)}
            aria-pressed={task.status === 'done'} onClick={() => onToggle(task)}>{task.status === 'done' && <Check size={15}/>}</button>
            : <span className="timeline-empty-circle" aria-hidden="true"/>}
          <span><strong>{task.title}</strong><span className="timeline-meta">
            {project ? <span className="project-chip">{project.name}</span> : <span className="project-chip is-empty">{vi.dashboard.noProject}</span>}
            <PriorityBadge value={task.priority}/><StatusBadge value={task.status}/>{due ? <StatusBadge value={due}/>
              : <span className="badge status-todo"><CalendarDays size={15} aria-hidden="true"/>{task.dueDate ? formatDate(task.dueDate) : vi.dashboard.groupNoDue}</span>}</span>
            {compact && task.dueDate && <small>{formatDate(task.dueDate)}</small>}</span></article>
      })}</section>)}
  </div>
}
