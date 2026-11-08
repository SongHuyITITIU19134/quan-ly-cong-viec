import { describe, expect, it } from 'vitest'
import { buildDeleteOps, buildRestoreOps } from '@/lib/relations'

const data={
  projects:[{id:'p1',ownerId:'c1'}],
  tasks:[{id:'t1',projectId:'p1',tripId:'r1',tripPhase:'during',assignerId:'c1',assigneeId:'c1',collaboratorIds:['c1','c2']}],
  contacts:[{id:'self',isSelf:true},{id:'c1'}],
  trips:[{id:'r1',projectId:'p1',contactIds:['c1','c2']}],
  notebooks:[{id:'b1'}],
  notes:[{id:'n1',notebookId:'b1',links:{projectId:'p1',tripId:'r1',contactId:'c1'}}],
}
const applyOps=ops=>{const next=structuredClone(data);for(const op of ops){if(op.type==='update')next[op.collection]=next[op.collection].map(item=>item.id===op.id?{...item,...op.data}:item);if(op.type==='remove')next[op.collection]=next[op.collection].filter(item=>item.id!==op.id)}return next}

describe('toàn vẹn quan hệ khi xóa',()=>{
  it('xóa project gỡ task, trip và link ghi chú trong một batch ops',()=>{const ops=buildDeleteOps('project','p1',data);expect(ops).toEqual(expect.arrayContaining([{type:'update',collection:'tasks',id:'t1',data:{projectId:null}},{type:'update',collection:'trips',id:'r1',data:{projectId:null}},{type:'update',collection:'notes',id:'n1',data:{links:{tripId:'r1',contactId:'c1'}}},{type:'remove',collection:'projects',id:'p1'}]))})
  it('xóa trip gỡ task và link ghi chú trước khi remove',()=>{const ops=buildDeleteOps('trip','r1',data);expect(ops.at(-1)).toEqual({type:'remove',collection:'trips',id:'r1'});expect(ops).toContainEqual({type:'update',collection:'tasks',id:'t1',data:{tripId:null,tripPhase:null}})})
  it('xóa contact thay self và gỡ mọi mảng tham chiếu',()=>{const ops=buildDeleteOps('contact','c1',data);expect(ops).toContainEqual({type:'update',collection:'tasks',id:'t1',data:{assignerId:null,assigneeId:'self',collaboratorIds:['c2']}});expect(ops).toContainEqual({type:'update',collection:'trips',id:'r1',data:{contactIds:['c2']}});expect(ops).toContainEqual({type:'update',collection:'projects',id:'p1',data:{ownerId:null}})})
  it('không cho tạo ops xóa contact self',()=>expect(buildDeleteOps('contact','self',data)).toEqual([]))
  it('xóa notebook kèm notes và dựng được snapshot hoàn tác',()=>{const ops=buildDeleteOps('notebook','b1',data),undo=buildRestoreOps(ops,data);expect(ops).toEqual([{type:'remove',collection:'notes',id:'n1'},{type:'remove',collection:'notebooks',id:'b1'}]);expect(undo).toEqual([{type:'create',collection:'notebooks',id:'b1',data:data.notebooks[0]},{type:'create',collection:'notes',id:'n1',data:data.notes[0]}])})
  it.each([['project','p1','projectId'],['trip','r1','tripId'],['contact','c1','contactId']])('xóa %s không để link ghi chú mồ côi',(kind,id,key)=>{const next=applyOps(buildDeleteOps(kind,id,data));expect(next.notes[0].links).not.toHaveProperty(key);expect(next[`${kind}s`].some(item=>item.id===id)).toBe(false)})
})
