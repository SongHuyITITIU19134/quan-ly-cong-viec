import { CalendarClock, CheckCircle2, CircleDotDashed, Clock3, TriangleAlert } from 'lucide-react'
import { Button, PriorityBadge, StatusBadge } from '@/components/ui'
import { Modal } from '@/components/ui'
import { formatDate } from '@/lib/dates'
import { getDueState } from '@/lib/tasks'
import { vi } from '@/i18n/vi'
import TaskTimeline from '@/pages/dashboard/TaskTimeline'
import { selectWorkingTasks } from '@/pages/dashboard/workingTasks'

const summaryRows = briefing => [
  { label: vi.dailyBriefing.doing, count: briefing.summary.doing, Icon: CircleDotDashed, tone: 'doing' },
  { label: vi.dailyBriefing.overdue, count: briefing.summary.overdue, Icon: TriangleAlert, tone: 'overdue' },
  { label: vi.dailyBriefing.dueToday, count: briefing.summary.today, Icon: CalendarClock, tone: 'today' },
  { label: vi.dailyBriefing.dueSoon, count: briefing.summary.soon, Icon: Clock3, tone: 'soon' },
  { label: vi.dailyBriefing.completedToday, count: briefing.summary.completedToday, Icon: CheckCircle2, tone: 'done' }
]

export default function DailyBriefingDialog({ briefing, data, date, unavailable, onClose, onEnableNotifications, canEnableNotifications }) {
  const actions = <>
    {canEnableNotifications && <Button variant="secondary" onClick={onEnableNotifications}>{vi.dailyBriefing.enableNotifications}</Button>}
    <Button onClick={onClose}>{vi.action.close}</Button>
  </>
  const projects = data.projects || []
  const workingTasks = selectWorkingTasks(data, date)
  return <Modal title={vi.dailyBriefing.title(formatDate(date))} onClose={onClose} actions={actions}>
    {unavailable ? <p role="alert">{vi.dailyBriefing.unavailable}</p> : <div className="daily-briefing">
      <section aria-labelledby="daily-briefing-tasks">
        <h3 id="daily-briefing-tasks">{vi.dailyBriefing.todayTasks}</h3>
        {workingTasks.length ? <TaskTimeline compact tasks={workingTasks} projects={projects} today={date}/> : <p>{vi.dailyBriefing.empty}</p>}
      </section>
      <section aria-labelledby="daily-briefing-summary">
        <h3 id="daily-briefing-summary">{vi.dailyBriefing.summary}</h3>
        <div className="daily-summary-grid">{summaryRows(briefing).map(({ label, count, Icon, tone }) => <div className={`daily-kpi status-${tone}`} key={label}>
          <strong>{count}</strong><span><Icon size={17} aria-hidden="true"/>{label}</span>
        </div>)}</div>
      </section>
      <section aria-labelledby="daily-briefing-priorities">
        <h3 id="daily-briefing-priorities">{vi.dailyBriefing.topPriorities}</h3>
        {briefing.priorities.length ? <ol className="daily-priorities">{briefing.priorities.map(task => {
          const project = projects.find(item => item.id === task.projectId), due = getDueState(task, date)
          return <li key={task.id}><strong>{task.title}</strong><span className="daily-priority-meta"><PriorityBadge value={task.priority}/>
            {project ? <span className={`project-chip label-theme-${project.colorIndex || 1}`}>{project.name}</span> : <span className="project-chip is-empty">{vi.dashboard.noProject}</span>}
            {['overdue', 'today', 'soon'].includes(due) ? <StatusBadge value={due}/> : <span className="daily-no-due">{task.dueDate ? formatDate(task.dueDate) : vi.dashboard.groupNoDue}</span>}
          </span></li>
        })}</ol> : <p>{vi.dailyBriefing.noPriorities}</p>}
      </section>
      <p className="muted daily-briefing-note">{vi.dailyBriefing.openAppNote}</p>
    </div>}
  </Modal>
}
