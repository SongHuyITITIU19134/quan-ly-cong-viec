import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import DailyBriefingDialog from '@/components/layout/DailyBriefingDialog'
import { buildDailyBriefing } from '@/lib/dailyBriefing'
import { vi as labels } from '@/i18n/vi'

const date = '2026-11-14'
const projects = [{ id: 'p1', name: 'Dự án Mới', colorIndex: 2 }]
const tasks = [
  { id: 'a', title: 'Việc quá hạn', status: 'doing', priority: 'urgent', dueDate: '2026-11-13', projectId: 'p1' },
  { id: 'b', title: 'Việc hôm nay', status: 'todo', priority: 'high', dueDate: date },
  { id: 'c', title: 'Việc ngày mai', status: 'doing', priority: 'medium', dueDate: '2026-11-15' },
  { id: 'd', title: 'Việc chưa có hạn', status: 'doing', priority: 'low', dueDate: '' },
  { id: 'e', title: 'Việc đã xong', status: 'done', priority: 'low', dueDate: date, completedAt: `${date}T08:00:00` }
]
const show = (data = { tasks, projects }) => render(<DailyBriefingDialog data={data} briefing={buildDailyBriefing(data, date)} date={date}
  onClose={vi.fn()} onEnableNotifications={vi.fn()} canEnableNotifications={false}/> )

describe('báo cáo UI U3-fix7', () => {
  it('hiện danh sách nhóm hạn và vòng tròn chưa hoàn thành rỗng', () => {
    show()
    const section = screen.getByRole('heading', { name: labels.dailyBriefing.todayTasks }).closest('section')
    for (const name of ['Quá hạn', 'Hôm nay', 'Ngày mai', 'Chưa có hạn']) expect(within(section).getByRole('heading', { name })).toBeInTheDocument()
    expect(section.querySelector('.timeline-empty-circle svg')).toBeNull()
  })
  it('hiện đủ năm ô KPI với số và biểu tượng', () => {
    show()
    const grid = document.querySelector('.daily-summary-grid')
    expect(grid.querySelectorAll('.daily-kpi')).toHaveLength(5)
    expect([...grid.querySelectorAll('.daily-kpi')].map(item => item.querySelector('strong').textContent)).toEqual(['3', '1', '1', '1', '1'])
    expect([...grid.querySelectorAll('.daily-kpi')].every(item => item.querySelector('svg') && item.textContent.trim())).toBe(true)
  })
  it('hiện ba thẻ ưu tiên và ghi chú chân modal đầy đủ', () => {
    show()
    expect(document.querySelectorAll('.daily-priorities li')).toHaveLength(3)
    expect(screen.getByText(labels.dailyBriefing.openAppNote)).toBeInTheDocument()
  })
  it('hiện trạng thái rỗng thân thiện khi không có việc đang làm', () => {
    show({ tasks: [], projects: [] })
    expect(screen.getByText(labels.dailyBriefing.empty)).toBeInTheDocument()
  })
})
