import { beforeEach, describe, expect, it, vi } from 'vitest'
import { localRepo } from '@/data/localRepo'
import { buildTagMutation } from '@/tags/tagMutations'

const items=[{id:'t1',collection:'tasks',tags:['Cũ','Đích']},{id:'n1',collection:'notes',notebookId:'b1',tags:['Cũ']}]

describe('batch quản lý nhãn task và note',()=>{
  beforeEach(()=>{localStorage.clear();const off=localRepo.subscribe('*',()=>{});off()})
  it.each([
    ['đổi tên',{type:'rename',key:'cũ',name:'Mới'}],
    ['gộp',{type:'rename',key:'cũ',name:'Đích'}],
    ['xóa',{type:'delete',key:'cũ'}],
  ])('%s dùng đúng một batch',async(_label,mutation)=>{
    const result=buildTagMutation(items,{c:{cũ:1,đích:2}},mutation)
    const batch=vi.spyOn(localRepo,'batch').mockResolvedValue(true)
    await localRepo.manageTags(result.updates,result.registry)
    expect(batch).toHaveBeenCalledOnce()
    expect(batch.mock.calls[0][0].map(op=>op.collection)).toEqual(['tasks','notes'])
    batch.mockRestore()
  })
  it('lỗi ghi note giữa chừng không để dữ liệu nhãn nửa vời',async()=>{
    await localRepo.batch([
      {type:'create',collection:'tasks',id:'t1',data:{title:'Việc',tags:['Cũ']}},
      {type:'create',collection:'notes',id:'n1',data:{notebookId:'b1',title:'Ghi chú',body:'',tags:['Cũ'],pinned:false,links:{}}},
    ],{c:{cũ:1}})
    const keys=['nhip-viec-v1','nhip-viec-notes','nhip-viec-tag-colors'],before=Object.fromEntries(keys.map(key=>[key,localStorage.getItem(key)]))
    const original=Storage.prototype.setItem,spy=vi.spyOn(Storage.prototype,'setItem');let failed=false
    spy.mockImplementation(function(key,value){if(key==='nhip-viec-notes'&&!failed){failed=true;throw new DOMException('Quota','QuotaExceededError')}return original.call(this,key,value)})
    await expect(localRepo.manageTags([{id:'t1',collection:'tasks',tags:['Mới']},{id:'n1',collection:'notes',tags:['Mới']}],{c:{mới:2}})).rejects.toThrow('Quota')
    expect(Object.fromEntries(keys.map(key=>[key,localStorage.getItem(key)]))).toEqual(before)
    spy.mockRestore()
  })
})
