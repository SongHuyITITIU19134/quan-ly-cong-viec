import { describe, expect, it } from 'vitest'
import { addCalendarDays, inferSeriesId, nextOccurrence, recurrenceCreateOp, recurrenceUndoOp, recurringTask } from '@/lib/recurrence'

const task=patch=>({id:'t1',title:'Lặp',dueDate:'2026-01-31',status:'doing',progress:70,projectId:'p1',tags:['A'],priority:'high',assigneeId:'self',checklist:[{id:'c1',text:'X',done:true}],repeat:{freq:'daily',interval:1},...patch})
describe('việc lặp',()=>{
 it('tăng ngày không dùng UTC',()=>expect(addCalendarDays('2026-12-31',1)).toBe('2027-01-01'))
 it('hỗ trợ lùi ngày cho báo cáo',()=>expect(addCalendarDays('2026-03-01',-1)).toBe('2026-02-28'))
 it('tính daily theo interval',()=>expect(nextOccurrence(task({dueDate:'2026-01-01',repeat:{freq:'daily',interval:3}}))).toBe('2026-01-04'))
 it('tính weekly theo interval',()=>expect(nextOccurrence(task({dueDate:'2026-01-01',repeat:{freq:'weekly',interval:2}}))).toBe('2026-01-15'))
 it('tháng ngắn lùi ngày 31 về cuối tháng thường',()=>expect(nextOccurrence(task({repeat:{freq:'monthly',interval:1}}))).toBe('2026-02-28'))
 it('tháng ngắn lùi ngày 31 về 29 trong năm nhuận',()=>expect(nextOccurrence(task({dueDate:'2028-01-31',repeat:{freq:'monthly',interval:1}}))).toBe('2028-02-29'))
 it('không sinh sau until',()=>expect(nextOccurrence(task({repeat:{freq:'daily',interval:1,until:'2026-01-31'}}))).toBe(''))
 it('reset trạng thái, tiến độ và checklist nhưng giữ liên kết',()=>expect(recurringTask(task(),[])).toMatchObject({id:'t1-r2026-02-01',status:'todo',progress:0,projectId:'p1',tags:['A'],priority:'high',assigneeId:'self',checklist:[{done:false}] }))
 it('idempotent khi id kế tiếp đã tồn tại',()=>expect(recurringTask(task(),[{id:'t1-r2026-02-01'}])).toBeNull())
 it('undo của create xóa đúng task đã sinh',()=>{const op=recurrenceCreateOp(task(),[]);expect(recurrenceUndoOp(op)).toEqual({type:'remove',collection:'tasks',id:'t1-r2026-02-01'})})
 it('neo ngày gốc qua 6 kỳ tháng bắt đầu ngày 31',()=>{const root=task({dueDate:'2026-01-31',repeat:{freq:'monthly',interval:1}}),items=[root],dates=[];let current=root;for(let index=0;index<6;index++){current=recurringTask(current,items);items.push(current);dates.push(current.dueDate)}expect(dates).toEqual(['2026-02-28','2026-03-31','2026-04-30','2026-05-31','2026-06-30','2026-07-31'])})
 it('task sinh ra tiếp tục dùng seriesId, không tạo id lồng nhau',()=>{const root=task({dueDate:'2026-01-31',repeat:{freq:'monthly',interval:1}}),feb=recurringTask(root,[root]),mar=recurringTask(feb,[root,feb]);expect(feb.seriesId).toBe('t1');expect(mar.id).toBe('t1-r2026-03-31');expect(mar.id).not.toContain(`${feb.id}-r`)})
 it('task cũ thiếu seriesId suy ra từ hậu tố ngày',()=>{expect(inferSeriesId({id:'chuoi-r2026-02-28'})).toBe('chuoi');expect(recurringTask(task({id:'t1-r2026-02-28',seriesId:undefined,dueDate:'2026-02-28',repeat:{freq:'monthly',interval:1}}),[task({id:'t1',dueDate:'2026-01-31'})]).id).toBe('t1-r2026-03-31')})
})
