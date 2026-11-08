import { Button, Modal } from '@/components/ui'
import { formatDate } from '@/lib/dates'
import { vi } from '@/i18n/vi'

const summaryRows = briefing => [
  [vi.dailyBriefing.doing, briefing.summary.doing],
  [vi.dailyBriefing.overdue, briefing.summary.overdue],
  [vi.dailyBriefing.dueToday, briefing.summary.today],
  [vi.dailyBriefing.dueSoon, briefing.summary.soon],
  [vi.dailyBriefing.completedToday, briefing.summary.completedToday]
]

export default function DailyBriefingDialog({ briefing, date, unavailable, onClose, onEnableNotifications, canEnableNotifications }) {
  const actions = <>
    {canEnableNotifications && <Button variant="secondary" onClick={onEnableNotifications}>{vi.dailyBriefing.enableNotifications}</Button>}
    <Button onClick={onClose}>{vi.action.close}</Button>
  </>
  return <Modal title={vi.dailyBriefing.title(formatDate(date))} onClose={onClose} actions={actions}>
    {unavailable ? <p role="alert">{vi.dailyBriefing.unavailable}</p> : <div className="daily-briefing">
      <section aria-labelledby="daily-briefing-tasks">
        <h3 id="daily-briefing-tasks">{vi.dailyBriefing.todayTasks}</h3>
        {briefing.rows.length ? <div className="table-wrap"><table>
          <thead><tr><th>{vi.dailyBriefing.priority}</th><th>{vi.dailyBriefing.task}</th><th>{vi.dailyBriefing.project}</th><th>{vi.dailyBriefing.due}</th><th>{vi.dailyBriefing.status}</th></tr></thead>
          <tbody>{briefing.rows.map(task => <tr key={task.id}>
            <td>{vi.priority[task.priority] || vi.priority.medium}</td><td>{task.title}</td><td>{task.projectName || '—'}</td>
            <td>{task.dueDate ? formatDate(task.dueDate) : '—'}</td><td>{vi.dailyBriefing.states[task.briefingState]}</td>
          </tr>)}</tbody>
        </table></div> : <p>{vi.dailyBriefing.empty}</p>}
      </section>
      <section aria-labelledby="daily-briefing-summary">
        <h3 id="daily-briefing-summary">{vi.dailyBriefing.summary}</h3>
        <div className="table-wrap daily-summary"><table><tbody>{summaryRows(briefing).map(([label, count]) => <tr key={label}><th scope="row">{label}</th><td>{count}</td></tr>)}</tbody></table></div>
      </section>
      <section aria-labelledby="daily-briefing-priorities">
        <h3 id="daily-briefing-priorities">{vi.dailyBriefing.topPriorities}</h3>
        {briefing.priorities.length ? <ol>{briefing.priorities.map(task => <li key={task.id}>{task.title}</li>)}</ol> : <p>{vi.dailyBriefing.noPriorities}</p>}
      </section>
      <p className="muted daily-briefing-note">{vi.dailyBriefing.openAppNote}</p>
    </div>}
  </Modal>
}
