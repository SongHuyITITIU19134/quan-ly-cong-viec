import { buildDailyBriefing } from '@/lib/dailyBriefing'

const priorityRank = { urgent: 0, high: 1, medium: 2, low: 3 }

export function selectWorkingTasks(data, today) {
  return [...buildDailyBriefing(data, today).rows].sort((left, right) =>
    (left.dueDate || '9999-12-31').localeCompare(right.dueDate || '9999-12-31') ||
    (priorityRank[left.priority] ?? 4) - (priorityRank[right.priority] ?? 4) ||
    (left.order ?? 0) - (right.order ?? 0) ||
    (left.title || '').localeCompare(right.title || '', 'vi'))
}

export function workingDateGroup(date, today) {
  if (!date) return 'noDue'
  if (date < today) return 'overdue'
  if (date === today) return 'today'
  const next = new Date(`${today}T12:00:00`)
  next.setDate(next.getDate() + 1)
  if (date === `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`) return 'tomorrow'
  return date
}
