import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read=file=>readFileSync(resolve(file),'utf8')

describe('U3-fix5 visual polish',()=>{
  it('tiêu đề dự án có tooltip, ellipsis và line-height không cắt glyph',()=>{
    expect(read('src/pages/Dashboard.jsx')).toMatch(/<strong title=\{project\.name\}>\{project\.name\}<\/strong>/)
    expect(read('src/styles/dashboard.css')).toMatch(/dashboard-project-card>strong\s*\{[^}]*line-height:1\.4;[^}]*text-overflow:ellipsis;[^}]*white-space:nowrap/)
  })

  it('hàng ghi chú dành cột co giãn và vùng hành động không bị cắt',()=>{
    const css=read('src/styles/notebooks.css')
    expect(css).toMatch(/\.note-row\{[^}]*grid-template-columns:minmax\(0,1fr\) auto;[^}]*overflow:visible/)
    expect(css).toMatch(/\.note-row-actions\{[^}]*overflow:visible/)
    expect(css).toMatch(/\.note-edit\{[^}]*min-height:44px/)
  })

  it('ngày và nút tạo nhiệm vụ luôn hiển thị một dòng',()=>{
    const css=read('src/styles/calendar.css')
    expect(css).toMatch(/\.day-agenda-head h2,\.day-agenda-head \.button\s*\{\s*white-space:nowrap/)
    expect(css).toContain('.day-agenda-head{grid-template-columns:1fr}')
  })

  it('thẻ hoàn thành không render tiến độ, thẻ đang làm vẫn giữ tiến độ',()=>{
    const taskCard=read('src/components/task/TaskCard.jsx')
    const dashboard=read('src/pages/Dashboard.jsx')
    expect(taskCard).toContain("task.status!=='done'&&<ProgressBar")
    expect(dashboard).toContain("task.status!=='done'&&<ProgressBar")
    expect(taskCard).toContain('<ProgressBar')
  })

  it('tiêu đề thẻ hoàn thành chỉ đổi màu, không còn đường gạch ngang',()=>{
    const tasks=read('src/styles/tasks.css'),dashboard=read('src/styles/dashboard.css')
    expect(tasks).toMatch(/\.task-card\.is-complete \.task-title\s*\{[^}]*background:none;[^}]*color:var\(--text-2\);[^}]*text-decoration:none;[^}]*animation:none/)
    expect(dashboard).toMatch(/\.dashboard-task-card\.is-done \.dashboard-task-title\s*\{\s*color:var\(--text-2\)/)
  })

  it('ô tháng chỉ lấy hai mục, có +N và không render nhãn trạng thái',()=>{
    const calendar=read('src/pages/Calendar.jsx')
    expect(calendar).toContain("].slice(0,2).map")
    expect(calendar).toContain('className="calendar-more"')
    expect(calendar).toContain("item.status==='done'?<Check")
    expect(calendar).not.toMatch(/mode==='month'[\s\S]*?<StatusBadge value=\{item\.status\}/)
  })

  it('ô ngày có aria-label đầy đủ và selected dùng ring không phủ nền',()=>{
    const calendar=read('src/pages/Calendar.jsx'),css=read('src/styles/calendar.css')
    expect(calendar).toContain('aria-label={ariaLabel}')
    expect(calendar).toContain("tasks.map(task=>task.title).join(', ')")
    expect(calendar).toContain("trips.map(trip=>trip.name).join(', ')")
    expect(css).toMatch(/\.calendar-day\.selected[^}]*background:var\(--surface\);[^}]*box-shadow:inset 0 0 0 2px var\(--ink\)/)
  })
})
