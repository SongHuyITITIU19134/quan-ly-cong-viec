import { beforeEach, describe, expect, it, vi } from 'vitest'
import { localRepo } from '@/data/localRepo'

describe('rollback batch local',()=>{
  beforeEach(()=>{localStorage.clear();let off=localRepo.subscribe('*',()=>{});off()})
  it('khôi phục mọi key nếu một ghi giữa batch lỗi quota',async()=>{
    const keys=['nhip-viec-v1','nhip-viec-notebooks','nhip-viec-notes','nhip-viec-tag-colors'],before=Object.fromEntries(keys.map(key=>[key,localStorage.getItem(key)])),original=Storage.prototype.setItem,spy=vi.spyOn(Storage.prototype,'setItem');let failed=false
    spy.mockImplementation(function(key,value){if(key==='nhip-viec-notes'&&!failed){failed=true;throw new DOMException('Quota exceeded','QuotaExceededError')}return original.call(this,key,value)})
    await expect(localRepo.batch([{type:'create',collection:'tasks',id:'t1',data:{title:'Việc',tags:[]}},{type:'create',collection:'notes',id:'n1',data:{notebookId:'notebook-welcome',title:'Ghi chú',body:'',tags:[],pinned:false,links:{}}}],{c:{}})).rejects.toThrow('Quota')
    expect(Object.fromEntries(keys.map(key=>[key,localStorage.getItem(key)]))).toEqual(before)
    spy.mockRestore()
  })
})
