import { describe, expect, it } from 'vitest'
import { selectWorkingTasks, workingDateGroup } from './workingTasks'

const makeTask = (id, dueDate, priority = 'medium', order = 0, status = 'doing') => ({ id, title: id, dueDate, priority, order, status })

describe('working tasks UI selector', () => {
  it('uses the daily report working set and excludes unrelated future and completed tasks', () => {
    const tasks = [makeTask('doing', '', 'low'), makeTask('due', '2026-11-14', 'high', 0, 'todo'),
      makeTask('future', '2026-11-17', 'high', 0, 'todo'), makeTask('done', '2026-11-13', 'high', 0, 'done')]
    expect(selectWorkingTasks({ tasks }, '2026-11-14').map(task => task.id)).toEqual(['due', 'doing'])
  })
  it('sorts due date, priority, order and title, with no due date last', () => {
    const tasks = [makeTask('no due', '', 'urgent'), makeTask('later', '2026-11-15', 'urgent'),
      makeTask('b', '2026-11-14', 'high', 2), makeTask('a', '2026-11-14', 'high', 2),
      makeTask('urgent', '2026-11-14', 'urgent'), makeTask('earlier', '2026-11-13', 'low')]
    expect(selectWorkingTasks({ tasks }, '2026-11-14').map(task => task.id)).toEqual(['earlier', 'urgent', 'a', 'b', 'later', 'no due'])
  })
  it('groups overdue, today, tomorrow, later date and no due date', () => {
    expect(['2026-11-13', '2026-11-14', '2026-11-15', '2026-11-16', ''].map(date => workingDateGroup(date, '2026-11-14')))
      .toEqual(['overdue', 'today', 'tomorrow', '2026-11-16', 'noDue'])
  })
})
