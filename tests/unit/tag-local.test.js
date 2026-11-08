import { beforeEach, describe, expect, it } from 'vitest'
import { localRepo } from '@/data/localRepo'

const readData=()=>{let value;const off=localRepo.subscribe('*',next=>{value=next});off();return value}
const readRegistry=()=>{let value;const off=localRepo.subscribeTagColors(next=>{value=next});off();return value}
describe('registry màu nhãn local',()=>{
 beforeEach(()=>localStorage.clear())
 it('task thiếu tags đọc thành mảng rỗng và registry sống qua lần đọc lại',async()=>{await localRepo.create('tasks',{id:'t1',title:'Việc'});expect(readData().tasks[0].tags).toEqual([]);await localRepo.saveTaskTags('t1',['#Họp']);const first=readRegistry();expect(first.c.họp).toBeTypeOf('number');expect(readRegistry()).toEqual(first);expect(readData().tasks[0].tags).toEqual(['Họp'])})
 it('JSON registry hỏng trở về rỗng mà không crash',()=>{localStorage.setItem('nhip-viec-tag-colors','{broken');expect(()=>readRegistry()).not.toThrow();expect(readRegistry()).toEqual({c:{}})})
 it('lưu sổ tay ở khóa riêng mà không đổi cấu trúc dữ liệu lõi',async()=>{readData();const before=localStorage.getItem('nhip-viec-v1');await localRepo.batch([{type:'create',collection:'notes',id:'n3',data:{notebookId:'notebook-welcome',title:'Mới',body:'',tags:['Ghi chú'],pinned:false,links:{}}}],{c:{}});expect(JSON.parse(localStorage.getItem('nhip-viec-notes')).some(note=>note.id==='n3')).toBe(true);expect(localStorage.getItem('nhip-viec-v1')).toBe(before)})
 it('batch chuẩn hóa và giới hạn nhãn',async()=>{await localRepo.batch([{type:'create',collection:'tasks',id:'t1',data:{title:'Việc',tags:[' A ','a','B','C','D','E','F']}}],{c:{}});expect(readData().tasks[0].tags).toEqual(['A','B','C','D','E']);expect(Object.keys(readRegistry().c)).toEqual(expect.arrayContaining(['a','b','c','d','e']))})
})
