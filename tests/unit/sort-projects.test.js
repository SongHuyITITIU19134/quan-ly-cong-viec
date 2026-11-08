import { describe, expect, it } from 'vitest'
import { sortProjectsCompletedLast } from '@/lib/sortProjects'

describe('sortProjectsCompletedLast',()=>{
  it('giữ thứ tự dự án chưa hoàn thành và không sửa mảng gốc',()=>{
    const projects=Object.freeze([{id:'a',status:'paused'},{id:'b',status:'running'},{id:'c'}])
    expect(sortProjectsCompletedLast(projects)).toEqual(projects)
    expect(sortProjectsCompletedLast(projects)).not.toBe(projects)
  })
  it('đưa nhiều dự án done xuống cuối, giữ thứ tự trong cả hai nhóm',()=>{
    const projects=[{id:'a',status:'done'},{id:'b',status:'running'},{id:'c',status:'done'},{id:'d',status:'paused'}]
    expect(sortProjectsCompletedLast(projects).map(project=>project.id)).toEqual(['b','d','a','c'])
    expect(projects.map(project=>project.id)).toEqual(['a','b','c','d'])
  })
  it('không coi archived hoặc progress 100 là trạng thái done',()=>{
    const projects=[{id:'a',status:'done'},{id:'b',status:'archived'},{id:'c',status:'running',progress:100}]
    expect(sortProjectsCompletedLast(projects).map(project=>project.id)).toEqual(['b','c','a'])
  })
  it('trả mảng rỗng khi không có dự án',()=>expect(sortProjectsCompletedLast([])).toEqual([]))
})
