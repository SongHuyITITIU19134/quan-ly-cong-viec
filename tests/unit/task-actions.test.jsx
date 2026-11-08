import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useTaskActions } from '@/pages/tasks/useTaskActions'

const noop=vi.fn()
const base={
  loading:false,create:noop,update:noop,params:new URLSearchParams(),setParams:noop,editing:null,setEditing:noop,confirm:null,setConfirm:noop,
  projectEditing:null,setProjectEditing:noop,projectConfirm:null,setProjectConfirm:noop,deleteTarget:'',setDeleteTarget:noop,moveTarget:'',
  setMoveTarget:noop,quickParsed:{title:'',tags:[]},setQuickText:noop,tagRegistry:{c:{}},tagFilters:[],toggleParamValue:noop,
}

describe('thao tác Kanban',()=>{
  it('move done cập nhật đủ trường và undo đúng snapshot',async()=>{
    const moving={id:'t1',title:'Việc',status:'doing',order:5,progress:35,completedAt:null,description:'Giữ nguyên'}
    const data={projects:[],contacts:[],trips:[],tasks:[moving,{id:'done',status:'done',order:2}]}
    const batch=vi.fn().mockResolvedValue(true),toast=vi.fn()
    const {result}=renderHook(()=>useTaskActions({...base,data,batch,toast}))
    await act(()=>result.current.changeStatus(moving,'done',0))
    const forward=batch.mock.calls[0][0]
    expect(forward).toEqual([expect.objectContaining({type:'update',collection:'tasks',id:'t1',data:expect.objectContaining({status:'done',order:1,progress:100,completedAt:expect.any(String)})})])
    await act(()=>toast.mock.calls[0][1].onClick())
    expect(batch.mock.calls[1][0]).toEqual([{type:'update',collection:'tasks',id:'t1',data:moving}])
  })
})
