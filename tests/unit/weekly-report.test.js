import { describe, expect, it } from 'vitest'
import { weeklyReport } from '@/lib/weeklyReport'

const data={tasks:[{title:'Xong',status:'done',completedAt:'2026-11-03'},{title:'Cũ',status:'done',completedAt:'2026-10-01'},{title:'Trễ',status:'doing',dueDate:'2026-11-01'},{title:'Tới',status:'todo',dueDate:'2026-11-06'}],trips:[{name:'Huế',startDate:'2026-11-05',endDate:'2026-11-06'}]}
describe('báo cáo tuần',()=>{
 const report=weeklyReport(data,'2026-11-04')
 it('có việc hoàn thành trong 7 ngày',()=>{expect(report).toContain('- Xong');expect(report).not.toContain('- Cũ')})
 it('có việc trễ',()=>expect(report).toContain('Trễ (2026-11-01)'))
 it('có việc sắp tới',()=>expect(report).toContain('Tới (2026-11-06)'))
 it('có chuyến công tác',()=>expect(report).toContain('Huế · 2026-11-05–2026-11-06'))
})
