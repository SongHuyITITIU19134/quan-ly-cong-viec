import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ensureSelfContact } from '@/lib/contacts'
import { localRepo } from '@/data/localRepo'

const readData=()=>{let value;const off=localRepo.subscribe('*',next=>{value=next});off();return value}

describe('liên hệ self',()=>{
  beforeEach(()=>localStorage.clear())
  it('tạo self theo displayName và không đổi object khi đã đúng',()=>{const first=ensureSelfContact({contacts:[]},'An'),second=ensureSelfContact(first.data,'An');expect(first.data.contacts[0]).toEqual({id:'self',fullName:'An',isSelf:true});expect(first.changed).toBe(true);expect(second.changed).toBe(false);expect(second.data).toBe(first.data)})
  it('localRepo luôn khởi tạo self tên Tôi',()=>expect(readData().contacts).toContainEqual({id:'self',fullName:'Tôi',isSelf:true}))
  it('đọc lại không ghi đè core khi self đã tồn tại',()=>{readData();const spy=vi.spyOn(Storage.prototype,'setItem');readData();expect(spy.mock.calls.filter(([key])=>key==='nhip-viec-v1')).toHaveLength(0);spy.mockRestore()})
  it('localRepo từ chối xóa self',async()=>{readData();await expect(localRepo.remove('contacts','self')).rejects.toThrow('Không thể xóa');expect(readData().contacts.some(contact=>contact.id==='self')).toBe(true)})
})
