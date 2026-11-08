import { describe, expect, it } from 'vitest'
import { briefingClock, buildDailyBriefing, shouldShowDailyBriefing } from '@/lib/dailyBriefing'

const tasks = [
  { id: 'overdue-low', title: 'Trễ thấp', status: 'todo', priority: 'low', dueDate: '2026-11-07', projectId: 'p1' },
  { id: 'overdue-high', title: 'Trễ cao', status: 'doing', priority: 'high', dueDate: '2026-11-06', projectId: 'p1' },
  { id: 'today', title: 'Hôm nay', status: 'todo', priority: 'urgent', dueDate: '2026-11-08' },
  { id: 'doing', title: 'Đang làm', status: 'doing', priority: 'medium', dueDate: '2026-11-20' },
  { id: 'soon', title: 'Sắp hạn', status: 'todo', priority: 'medium', dueDate: '2026-11-10' },
  { id: 'done', title: 'Đã xong', status: 'done', priority: 'high', dueDate: '2026-11-08', completedAt: '2026-11-08T02:00:00Z' }
]

describe('báo cáo 06:00', () => {
  it('dùng đúng ngày và giờ Việt Nam', () => {
    expect(briefingClock(new Date('2026-11-07T23:00:00Z'))).toEqual({ date: '2026-11-08', hour: 6 })
  })

  it('chỉ hiện từ 06:00 và một lần mỗi ngày', () => {
    expect(shouldShowDailyBriefing(new Date('2026-11-07T22:59:00Z'), '')).toBe(false)
    expect(shouldShowDailyBriefing(new Date('2026-11-07T23:00:00Z'), '')).toBe(true)
    expect(shouldShowDailyBriefing(new Date('2026-11-07T23:00:00Z'), '2026-11-08')).toBe(false)
  })

  it('lọc, sắp xếp và gắn tên dự án đúng', () => {
    const report = buildDailyBriefing({ tasks, projects: [{ id: 'p1', name: 'Ra mắt' }] }, '2026-11-08')
    expect(report.rows.map(task => task.id)).toEqual(['overdue-high', 'overdue-low', 'today', 'doing'])
    expect(report.rows[0]).toMatchObject({ projectName: 'Ra mắt', briefingState: 'overdue' })
  })

  it('đếm tổng quan và chọn tối đa ba ưu tiên', () => {
    const report = buildDailyBriefing({ tasks }, '2026-11-08')
    expect(report.summary).toEqual({ doing: 2, overdue: 2, today: 1, soon: 1, completedToday: 1 })
    expect(report.priorities.map(task => task.id)).toEqual(['overdue-high', 'overdue-low', 'today'])
  })
})
