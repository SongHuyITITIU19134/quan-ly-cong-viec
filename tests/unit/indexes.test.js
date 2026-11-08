import { describe, expect, it } from 'vitest'
import { buildIndexes, indexById } from '@/lib/indexes'

const data = {
  projects: [{ id: 'p1', name: 'Một' }],
  contacts: [{ id: 'c1' }, { id: 'c2' }],
  tasks: [
    { id: 't1', dueDate: '2026-11-07', projectId: 'p1', assignerId: 'c1', collaboratorIds: ['c2'] },
    { id: 't2', dueDate: '2026-11-07', assigneeId: 'c1' },
  ],
  trips: [{ id: 'r1', startDate: '2026-11-07', endDate: '2026-11-09', contactIds: ['c1'] }],
  notes: [{ id: 'n1', links: { contactId: 'c1' } }],
}

describe('chỉ mục dữ liệu', () => {
  it('tra cứu item theo id', () => expect(indexById(data.tasks).get('t2')).toBe(data.tasks[1]))
  it('nhóm task theo hạn giống filter cũ', () => {
    const { tasksByDue } = buildIndexes(data)
    expect(tasksByDue.get('2026-11-07')).toEqual(data.tasks.filter(task => task.dueDate === '2026-11-07'))
  })
  it('nhóm task theo dự án giống filter cũ', () => {
    const { tasksByProject } = buildIndexes(data)
    expect(tasksByProject.get('p1')).toEqual(data.tasks.filter(task => task.projectId === 'p1'))
  })
  it('lập chỉ mục chuyến đi cho mọi ngày trong khoảng', () => {
    const { tripsByDay } = buildIndexes(data)
    expect([...tripsByDay.keys()]).toEqual(['2026-11-07', '2026-11-08', '2026-11-09'])
    expect(tripsByDay.get('2026-11-08')).toEqual(data.trips)
  })
  it('gom quan hệ contact giống các filter cũ', () => {
    const related = buildIndexes(data).contactRelations.get('c1')
    expect(related.assign).toEqual(data.tasks.filter(task => task.assignerId === 'c1'))
    expect(related.assignee).toEqual(data.tasks.filter(task => task.assigneeId === 'c1'))
    expect(related.trips).toEqual(data.trips)
    expect(related.notes).toEqual(data.notes)
  })
})
