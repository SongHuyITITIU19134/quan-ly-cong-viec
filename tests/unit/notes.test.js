import { describe, expect, it } from 'vitest'
import { filterNotes, isNotebookNameUnique, normalizeNotebookName, noteCounts, snippet, sortNotes } from '@/lib/notes'
import { normalizeTags } from '@/tags/tagUtils'

describe('sổ tay',()=>{
  it('chuẩn hóa tên không dấu và khoảng trắng',()=>expect(normalizeNotebookName('  Sổ   Ý Tưởng ')).toBe('so y tuong'))
  it('kiểm tra tên duy nhất không phân biệt dấu và hoa thường',()=>expect(isNotebookNameUnique('so y tuong',[{id:'a',name:'Sổ Ý Tưởng'}])).toBe(false))
  it('tìm trong tiêu đề, nội dung và nhãn không dấu',()=>{const notes=[{title:'Cuộc họp',body:'Kế hoạch quý',tags:['Nội bộ']},{title:'Khác',body:'',tags:[]}];expect(filterNotes(notes,{q:'ke hoach'})).toEqual([notes[0]]);expect(filterNotes(notes,{q:'noi bo'})).toEqual([notes[0]])})
  it('lọc nhiều nhãn theo ANY',()=>expect(filterNotes([{id:1,tags:['A']},{id:2,tags:['B']},{id:3,tags:['C']}],{tags:['a','b']}).map(note=>note.id)).toEqual([1,2]))
  it('sắp xếp ổn định và hỗ trợ ghim trước',()=>{const notes=[{id:'a',title:'B',pinned:false,updatedAt:'2026-01-01'},{id:'b',title:'A',pinned:true,updatedAt:'2026-01-01'},{id:'c',title:'C',pinned:false,updatedAt:'2026-01-01'}];expect(sortNotes(notes).map(note=>note.id)).toEqual(['a','b','c']);expect(sortNotes(notes,'pinned').map(note=>note.id)).toEqual(['b','a','c'])})
  it('đếm ghi chú theo sổ',()=>expect(noteCounts([{notebookId:'a'},{notebookId:'a'},{notebookId:'b'}])).toEqual({a:2,b:1}))
  it('rút gọn nội dung ở 120 ký tự',()=>{const value='a'.repeat(130);expect(snippet(value)).toHaveLength(120);expect(snippet(value).endsWith('…')).toBe(true)})
  it('giữ tối đa năm nhãn hợp lệ',()=>expect(normalizeTags(['A','B','C','D','E','F'])).toEqual(['A','B','C','D','E']))
})
