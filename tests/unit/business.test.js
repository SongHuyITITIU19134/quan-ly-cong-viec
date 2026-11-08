import { describe, expect, it } from 'vitest'
import { taskProgress, projectProgress, withManualProgress, withStatus } from '@/lib/progress'
import { applyFilters, getDueState } from '@/lib/tasks'
import { findTripOverlaps, getTripPhase } from '@/lib/trips'
import { between, needsRebalance, rebalance } from '@/lib/order'
import { formatDate, weekStart } from '@/lib/dates'

describe('nghiệp vụ cốt lõi',()=>{
  it('tính tiến độ checklist và nhiệm vụ hoàn thành',()=>{expect(taskProgress({status:'doing',progressMode:'auto',checklist:[{done:true},{done:false}]})).toBe(50);expect(taskProgress({status:'done',progress:10})).toBe(100)})
  it('giới hạn tiến độ thủ công và khi mở lại',()=>{expect(withManualProgress({status:'doing'},150).progress).toBe(99);expect(withStatus({status:'done',progress:100},'doing').progress).toBe(99)})
  it('tính trung bình tiến độ dự án',()=>expect(projectProgress([{projectId:'p',status:'done'},{projectId:'p',status:'doing',progressMode:'manual',progress:40},{projectId:'x',status:'done'}],'p')).toBe(70))
  it('phân loại hạn và bỏ qua việc đã xong',()=>{expect(getDueState({dueDate:'2026-10-22',status:'todo'},'2026-10-23')).toBe('overdue');expect(getDueState({dueDate:'2026-10-22',status:'done'},'2026-10-23')).toBe('ok')})
  it('tìm không dấu và kết hợp bộ lọc',()=>{const tasks=[{title:'Báo cáo quy hoạch',status:'doing',priority:'high',tags:['Khách hàng']},{title:'Khác',status:'todo',priority:'low',tags:[]}];expect(applyFilters(tasks,{q:'quy hoach',status:['doing'],priority:['high'],tags:['khách hàng']})).toEqual([tasks[0]])})
  it('phát hiện chuyến trùng và suy giai đoạn task',()=>{const trip={startDate:'2026-10-23',endDate:'2026-10-25'};expect(findTripOverlaps([trip,{startDate:'2026-10-25',endDate:'2026-10-26'}])).toHaveLength(1);expect(getTripPhase({dueDate:'2026-10-26'},trip)).toBe('after')})
  it('chèn và đánh số lại order',()=>{expect(between(1,3)).toBe(2);expect(needsRebalance(1,1.0000001)).toBe(true);expect(rebalance([{order:3},{order:1}]).map(item=>item.order)).toEqual([1,2])})
  it('định dạng ngày Việt Nam và tuần bắt đầu thứ Hai',()=>{expect(formatDate('2026-10-23')).toBe('23/10/2026');expect(weekStart('2026-10-25')).toBe('2026-10-19')})
})
