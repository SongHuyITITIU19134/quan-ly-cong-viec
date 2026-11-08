import { describe, expect, it } from 'vitest'
import { migrateData, projectDeleteOps, validateProject } from '@/lib/projects'
import { PROJECT_NAME_MAX } from '@/lib/limits'

describe('dự án',()=>{
 it('migration lặp lại không đổi và nối projectName cũ',()=>{const now='2026-01-01T00:00:00.000Z',legacy={projects:['Dự án Mới'],tasks:[{id:'t1',projectName:'Dự án Mới'}],contacts:[],trips:[]},once=migrateData(legacy,now);expect(migrateData(once,now)).toEqual(once);expect(once.tasks[0].projectId).toBe(once.projects[0].id);expect(once.projects[0].status).toBe('running')})
 it('chặn trống, trùng không dấu và ngày sai',()=>{const projects=[{id:'a',name:'Quy hoạch'}];expect(validateProject({name:''},projects)).toMatch(/nhập/);expect(validateProject({name:'quy hoach'},projects)).toMatch(/tồn tại/);expect(validateProject({name:'Khác',startDate:'2026-02-02',dueDate:'2026-01-01'},projects)).toMatch(/trước/)})
 it('tạo phép chuyển hoặc gỡ nhiệm vụ khi xóa',()=>{const tasks=[{id:'1',projectId:'a'},{id:'2',projectId:'b'}];expect(projectDeleteOps('a',tasks,'b')).toEqual([{type:'update',collection:'tasks',id:'1',data:{projectId:'b'}}]);expect(projectDeleteOps('a',tasks)[0].data.projectId).toBeNull()})
 it('dùng giới hạn tên dự án thống nhất',()=>{expect(validateProject({name:'a'.repeat(PROJECT_NAME_MAX)})).toBe('');expect(validateProject({name:'a'.repeat(PROJECT_NAME_MAX+1)})).toContain(String(PROJECT_NAME_MAX))})
})
