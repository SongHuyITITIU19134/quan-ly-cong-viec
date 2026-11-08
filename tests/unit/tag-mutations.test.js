import { describe, expect, it } from 'vitest'
import { buildTagMutation } from '@/tags/tagMutations'

const tasks=[{id:'1',tags:['Nguồn','Đích']},{id:'2',tags:['nguồn','Khác']},{id:'3',tags:['Đích']}],registry={c:{nguồn:2,đích:7,khác:4}}
describe('quản lý nhãn hàng loạt',()=>{
  it('đổi nhãn trên task và note trong cùng kết quả',()=>{const result=buildTagMutation([{id:'t1',collection:'tasks',tags:['Cũ']},{id:'n1',collection:'notes',tags:['Cũ','Khác']}],{c:{cũ:2,khác:3}},{type:'rename',key:'cũ',name:'Mới'});expect(result.updates).toEqual([{id:'t1',collection:'tasks',tags:['Mới']},{id:'n1',collection:'notes',tags:['Mới','Khác']}]);expect(result.count).toBe(2)})
  it('gộp nhãn cập nhật mỗi task chứa nguồn đúng một lần và giữ màu đích',()=>{const result=buildTagMutation(tasks,registry,{type:'rename',key:'nguồn',name:'Đích'});expect(result.merged).toBe(true);expect(result.updates.map(item=>item.id)).toEqual(['1','2']);expect(new Set(result.updates.map(item=>item.id)).size).toBe(2);expect(result.updates[0].tags).toEqual(['Đích']);expect(result.registry.c).toEqual({đích:7,khác:4})})
  it('xóa nhãn khỏi mọi task và registry',()=>{const result=buildTagMutation(tasks,registry,{type:'delete',key:'nguồn'});expect(result.updates).toHaveLength(2);expect(result.updates.every(item=>item.tags.every(name=>name.toLocaleLowerCase('vi')!=='nguồn'))).toBe(true);expect(result.registry.c).not.toHaveProperty('nguồn')})
  it('đổi màu chỉ thay registry',()=>{const result=buildTagMutation(tasks,registry,{type:'recolor',key:'nguồn',color:11});expect(result.updates).toEqual([]);expect(result.registry.c.nguồn).toBe(11)})
})
