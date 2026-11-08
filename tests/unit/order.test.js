import { describe, expect, it } from 'vitest'
import { moveTaskOps } from '@/lib/order'

describe('sắp thứ tự Kanban',()=>{
 it('chuyển done đặt tiến độ và completedAt',()=>expect(moveTaskOps([{id:'t',status:'todo',order:1}],'t','done',0,'2026-01-01')).toEqual([{type:'update',collection:'tasks',id:'t',data:{status:'done',progress:100,completedAt:'2026-01-01',order:0}}]))
 it('chuyển khỏi done xóa completedAt',()=>expect(moveTaskOps([{id:'t',status:'done',order:1,completedAt:'old'}],'t','doing')[0].data).toMatchObject({status:'doing',completedAt:null}))
 it('rebalance khi hai order quá sát',()=>{const ops=moveTaskOps([{id:'a',status:'doing',order:1},{id:'b',status:'doing',order:1.0000001},{id:'t',status:'todo',order:9}],'t','doing',1);expect(ops).toHaveLength(3);expect(ops.map(op=>op.data.order)).toEqual([1,2,3]);expect(ops.find(op=>op.id==='t').data.status).toBe('doing')})
 it('chèn giữa nhiều lần vẫn giữ order tăng nghiêm ngặt',()=>{
  let tasks=[{id:'a',status:'doing',order:1},{id:'b',status:'doing',order:2}]
  for(let index=0;index<40;index++){
   const moving={id:`x${index}`,status:'todo',order:100+index};tasks.push(moving)
   for(const op of moveTaskOps(tasks,moving.id,'doing',1,'2026-01-01'))tasks=tasks.map(task=>task.id===op.id?{...task,...op.data}:task)
   const orders=tasks.filter(task=>task.status==='doing').sort((a,b)=>a.order-b.order).map(task=>task.order)
   expect(orders.every((order,position)=>position===0||order>orders[position-1])).toBe(true)
  }
 })
})
