import { afterEach, describe, expect, it, vi } from 'vitest'
import { dueReminders, loadReminderIds, pendingReminders, pruneReminderIds, rememberReminder, reminderId } from '@/lib/reminders'

describe('nhắc việc',()=>{
 afterEach(()=>{vi.useRealTimers();localStorage.clear()})
 it('nhắc đúng mốc 15 phút trước 9 giờ',()=>expect(dueReminders([{id:'t',dueDate:'2026-11-04',remindBefore:15,status:'todo'}],new Date(2026,10,4,8,45))).toHaveLength(1))
 it('không nhắc quá sớm',()=>expect(dueReminders([{id:'t',dueDate:'2026-11-04',remindBefore:60,status:'todo'}],new Date(2026,10,4,7,0))).toHaveLength(0))
 it('không nhắc việc đã xong hoặc mốc lạ',()=>expect(dueReminders([{id:'a',dueDate:'2026-11-04',remindBefore:0,status:'done'},{id:'b',dueDate:'2026-11-04',remindBefore:10,status:'todo'}],new Date(2026,10,4,9,0))).toEqual([]))
 it('tạo khóa ổn định',()=>expect(reminderId({id:'t',dueDate:'2026-11-04',remindBefore:60})).toBe('t:2026-11-04:60'))
 it('lưu và đọc lại mốc đã nhắc',()=>{const task={id:'t',dueDate:'2026-11-04',remindBefore:60};rememberReminder(localStorage,task);expect(loadReminderIds(localStorage)).toEqual(new Set(['t:2026-11-04:60']))})
 it('không nhắc lại sau khi mô phỏng mở lại app',()=>{vi.useFakeTimers();vi.setSystemTime(new Date(2026,10,4,8,45));const task={id:'t',title:'Họp',dueDate:'2026-11-04',remindBefore:15,status:'todo'};expect(pendingReminders([task],new Date(),localStorage)).toEqual([task]);rememberReminder(localStorage,task);expect(pendingReminders([task],new Date(),localStorage)).toEqual([])})
 it('khi mở app xóa mốc quá hạn hơn 30 ngày',()=>{for(const task of [{id:'old',dueDate:'2026-09-30',remindBefore:15},{id:'edge',dueDate:'2026-10-05',remindBefore:15},{id:'new',dueDate:'2026-11-01',remindBefore:60}])rememberReminder(localStorage,task);expect(pruneReminderIds(localStorage,'2026-11-04')).toEqual(new Set(['edge:2026-10-05:15','new:2026-11-01:60']));expect(loadReminderIds(localStorage)).not.toContain('old:2026-09-30:15')})
})
