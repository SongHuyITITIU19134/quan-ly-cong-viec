import { addCalendarDays } from './recurrence'

export const DAILY_BRIEFING_HOUR = 6
export const DAILY_BRIEFING_STORAGE_KEY = 'nhip-viec-daily-briefing-date'

const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }

export function briefingClock(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', hourCycle: 'h23'
  }).formatToParts(now)
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]))
  return { date: `${values.year}-${values.month}-${values.day}`, hour: Number(values.hour) }
}

export function shouldShowDailyBriefing(now = new Date(), shownDate = '') {
  const clock = briefingClock(now)
  return clock.hour >= DAILY_BRIEFING_HOUR && shownDate !== clock.date
}

export function buildDailyBriefing({ tasks = [], projects = [] } = {}, today) {
  const unfinished = tasks.filter(task => task.status !== 'done')
  const projectNames = new Map(projects.map(project => [project.id, project.name]))
  const rows = unfinished.filter(task => task.status === 'doing' || (task.dueDate && task.dueDate <= today)).map(task => ({
    ...task,
    projectName: projectNames.get(task.projectId) || '',
    briefingState: task.dueDate < today ? 'overdue' : task.dueDate === today ? 'today' : 'doing'
  })).sort((left, right) => {
    const overdue = Number(right.briefingState === 'overdue') - Number(left.briefingState === 'overdue')
    if (overdue) return overdue
    const priority = (priorityOrder[left.priority] ?? 2) - (priorityOrder[right.priority] ?? 2)
    return priority || (left.dueDate || '9999-12-31').localeCompare(right.dueDate || '9999-12-31')
  })
  const completedToday = tasks.filter(task => task.status === 'done' && String(task.completedAt || task.updatedAt || '').slice(0, 10) === today).length
  return {
    rows,
    priorities: rows.slice(0, 3),
    summary: {
      doing: tasks.filter(task => task.status === 'doing').length,
      overdue: unfinished.filter(task => task.dueDate && task.dueDate < today).length,
      today: unfinished.filter(task => task.dueDate === today).length,
      soon: unfinished.filter(task => task.dueDate > today && task.dueDate <= addCalendarDays(today, 3)).length,
      completedToday
    }
  }
}
