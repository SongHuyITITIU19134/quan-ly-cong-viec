import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { StatusBadge } from '@/components/ui'
import { vi } from '@/i18n/vi'
import { timelineTaskOrder } from '@/pages/Dashboard'
import { calendarTimelineTaskOrder } from '@/pages/Calendar'

const read=file=>readFileSync(resolve(file),'utf8')
const styles=readdirSync(resolve('src/styles')).filter(file=>file.endsWith('.css')).map(file=>read(`src/styles/${file}`)).join('\n')

describe('U3-fix3 visual polish',()=>{
  it('định nghĩa đúng type scale và không còn cỡ chữ dưới 13px',()=>{
    const tokens=read('src/styles/tokens.css')
    expect(tokens).toMatch(/--fs-xs:\s*13px/)
    expect(tokens).toMatch(/--fs-sm:\s*14px/)
    expect(tokens).toMatch(/--fs-base:\s*16px/)
    expect(tokens).toMatch(/--fs-md:\s*17px/)
    expect(tokens).toMatch(/--fs-lg:\s*20px/)
    expect(tokens).toMatch(/--fs-xl:\s*24px/)
    expect(styles).not.toMatch(/font-size\s*:\s*(?:[0-9]|1[0-2])px|font-size\s*:\s*0(?:[;}])/)
  })

  it('dark active nav dùng nền vàng và chữ đen',()=>{
    expect(read('src/styles/shell.css')).toMatch(/\[data-theme='dark'\] \.shell-nav-link\.active\s*\{[^}]*background:\s*var\(--accent\);[^}]*color:\s*var\(--on-accent\)/)
  })

  it('dark emphasis dùng nền đen và viền #3a3a40',()=>{
    const dashboard=read('src/styles/dashboard.css')
    expect(dashboard).toMatch(/\[data-theme='dark'\][^{]+is-emphasis[^}]*border:\s*1px solid #3a3a40;[^}]*background:\s*#000/)
  })

  it('cả tám status chip đều có icon và nhãn chữ',()=>{
    for(const value of ['todo','doing','waiting','paused','done','soon','today','overdue']){
      const{container}=render(createElement(StatusBadge,{value}))
      expect(screen.getByText(vi.status[value])).toBeInTheDocument()
      expect(container.querySelector('.badge-marker svg')).toBeInTheDocument()
      cleanup()
    }
  })

  it('timeline sắp theo ưu tiên, order rồi tiêu đề và có tên dự án',()=>{
    const tasks=[
      {title:'B',priority:'medium',order:1},
      {title:'A',priority:'high',order:2},
      {title:'C',priority:'high',order:1},
      {title:'A',priority:'high',order:1},
      {title:'D',priority:'urgent',order:9}
    ]
    const expected=['D','A','C','A','B']
    expect([...tasks].sort(timelineTaskOrder).map(task=>task.title)).toEqual(expected)
    expect([...tasks].sort(calendarTimelineTaskOrder).map(task=>task.title)).toEqual(expected)
    expect(read('src/pages/Dashboard.jsx')).toMatch(/project\.name/)
    expect(read('src/pages/Calendar.jsx')).toMatch(/project\.name/)
  })
})
