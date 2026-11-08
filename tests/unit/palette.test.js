import { describe, expect, it } from 'vitest'
import { filterPalette, paletteItems, searchText, shouldOpenPalette } from '@/lib/palette'

describe('command palette',()=>{
  it('tìm không dấu',()=>{const items=paletteItems({tasks:[{id:'1',title:'Kiểm tra quy hoạch'}]});expect(filterPalette(items,'quy hoach')[0].id).toBe('task-1')})
  it('chuẩn hóa chữ đ',()=>{expect(searchText('Đổi giao diện')).toBe('doi giao dien')})
  it('có điều hướng, tạo mới và item dữ liệu',()=>{const ids=paletteItems({projects:[{id:'p1',name:'Alpha'}]}).map(item=>item.id);expect(ids).toContain('nav-settings');expect(ids).toContain('create-task');expect(ids).toContain('project-p1')})
  it('Ctrl+K mở ở vùng thường',()=>{expect(shouldOpenPalette({ctrlKey:true,metaKey:false,key:'k',target:{tagName:'DIV',isContentEditable:false}})).toBe(true)})
  it('không giành phím trong textarea hoặc editor',()=>{expect(shouldOpenPalette({ctrlKey:true,key:'k',target:{tagName:'TEXTAREA'}})).toBe(false);expect(shouldOpenPalette({metaKey:true,key:'k',target:{tagName:'DIV',isContentEditable:true}})).toBe(false)})
})
