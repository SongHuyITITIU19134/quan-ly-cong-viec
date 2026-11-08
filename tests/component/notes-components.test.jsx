import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import NewNotebookRow from '@/components/notes/NewNotebookRow'
import NoteForm from '@/components/notes/NoteForm'
import NoteRow from '@/components/notes/NoteRow'
import NotebookCard from '@/components/notes/NotebookCard'
import NotebookForm from '@/components/notes/NotebookForm'

const wrap=component=>render(<MemoryRouter>{component}</MemoryRouter>)

describe('thành phần sổ tay',()=>{
  it('chọn mẫu sổ mới',async()=>{const choose=vi.fn();wrap(<NewNotebookRow onChoose={choose}/>);await userEvent.click(screen.getByRole('button',{name:/Họp/}));expect(choose.mock.calls[0][0].id).toBe('meeting')})
  it('validate và lưu sổ đã chuẩn hóa',async()=>{
    const save=vi.fn().mockResolvedValue(true);wrap(<NotebookForm notebooks={[]} onSave={save} onCancel={vi.fn()}/>)
    await userEvent.click(screen.getByRole('button',{name:'Lưu sổ'}));expect(screen.getByRole('alert')).toHaveTextContent('Vui lòng nhập tên sổ')
    await userEvent.type(screen.getByLabelText('Tên sổ *'),'  Sổ   dự án  ');await userEvent.click(screen.getByLabelText('Màu sổ 3'));await userEvent.click(screen.getByLabelText('Ghim sổ này'));await userEvent.click(screen.getByRole('button',{name:'Lưu sổ'}))
    expect(save).toHaveBeenCalledWith(expect.objectContaining({name:'Sổ dự án',color:2,pinned:true}))
  })
  it('validate và lưu ghi chú cùng backlinks',async()=>{
    const save=vi.fn().mockResolvedValue(true);wrap(<NoteForm notebooks={[{id:'b1',name:'Sổ'}]} projects={[{id:'p1',name:'Dự án'}]} trips={[{id:'r1',name:'Đi xa'}]} contacts={[{id:'c1',fullName:'An'}]} tagCatalog={[]} tagRegistry={{c:{}}} onSave={save} onCancel={vi.fn()}/>)
    await userEvent.click(screen.getByRole('button',{name:'Lưu ghi chú'}));expect(screen.getByRole('alert')).toHaveTextContent('Vui lòng nhập tiêu đề')
    await userEvent.type(screen.getByLabelText('Tiêu đề *'),' Ghi chú ');await userEvent.type(screen.getByLabelText('Nội dung'),'Nội dung thử')
    await userEvent.selectOptions(screen.getByLabelText('Dự án'),'p1');await userEvent.selectOptions(screen.getByLabelText('Chuyến công tác'),'r1');await userEvent.selectOptions(screen.getByLabelText('Liên hệ'),'c1');await userEvent.click(screen.getByLabelText('Ghim ghi chú'));await userEvent.click(screen.getByRole('button',{name:'Lưu ghi chú'}))
    expect(save).toHaveBeenCalledWith(expect.objectContaining({title:'Ghi chú',pinned:true,links:{projectId:'p1',tripId:'r1',contactId:'c1'}}))
  })
  it('card và row gọi đúng hành động chính',()=>{
    const open=vi.fn(),pin=vi.fn();wrap(<><NotebookCard notebook={{id:'b1',name:'Sổ',color:1,createdAt:'2026-11-01'}} count={2} onOpen={open} onEdit={vi.fn()} onPin={pin} onArchive={vi.fn()} onDelete={vi.fn()}/><NoteRow note={{id:'n1',title:'Ghi chú',body:'Nội dung',tags:[],links:{projectId:'p1'},updatedAt:'2026-11-01'}} tagRegistry={{c:{}}} projects={[{id:'p1',name:'Dự án'}]} trips={[]} contacts={[]} onOpen={open} onPin={pin} onMove={vi.fn()} onDelete={vi.fn()}/></>)
    fireEvent.click(screen.getByRole('button',{name:'Sổ, 2 ghi chú'}));fireEvent.click(screen.getByRole('button',{name:'Ghim Ghi chú'}))
    expect(open).toHaveBeenCalledOnce();expect(pin).toHaveBeenCalledOnce();expect(screen.getByText('Dự án: Dự án')).toBeInTheDocument()
  })
})
