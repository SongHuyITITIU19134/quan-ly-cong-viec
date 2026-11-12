import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read=file=>readFileSync(resolve(file),'utf8')

describe('U3-fix6 dashboard polish',()=>{
  it('Tổng quan bỏ profile và chuông trùng nhưng giữ dòng ngày',()=>{
    const dashboard=read('src/pages/Dashboard.jsx')
    expect(dashboard).not.toContain('dashboard-profile')
    expect(dashboard).toContain('dashboard-date-head')
    expect(dashboard).toContain('vi.dashboard.addTask')
  })
})
