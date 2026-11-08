import { describe, expect, it } from 'vitest'
import { linkedNoteDraft } from '@/lib/notes'

describe('linkedNoteDraft',()=>{
  it('tạo bản nháp liên kết trong sổ đang hoạt động',()=>{
    const params=new URLSearchParams('new=note&projectId=p1&contactId=c1')
    expect(linkedNoteDraft(params,[{id:'old',archived:true},{id:'active'}])).toEqual({notebookId:'active',links:{projectId:'p1',contactId:'c1'}})
  })
  it('prefill đủ project, trip và contact từ backlink',()=>{
    const params=new URLSearchParams('new=note&projectId=p1&tripId=r1&contactId=c1')
    expect(linkedNoteDraft(params,[{id:'book'}]).links).toEqual({projectId:'p1',tripId:'r1',contactId:'c1'})
  })
})
