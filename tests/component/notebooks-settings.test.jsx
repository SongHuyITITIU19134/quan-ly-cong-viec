import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks=vi.hoisted(()=>({batch:vi.fn(),update:vi.fn(),saveSettings:vi.fn(),reset:vi.fn(),toast:vi.fn(),navigate:vi.fn()}))
const data={projects:[{id:'p1',name:'Dự án'}],tasks:[],contacts:[{id:'self',fullName:'Tôi'}],trips:[],notebooks:[{id:'b1',name:'Sổ dự án',color:1,pinned:false,archived:false,createdAt:'2026-11-01'}],notes:[{id:'n1',notebookId:'b1',title:'Biên bản họp',body:'Nội dung',tags:[],pinned:false,links:{projectId:'p1'},updatedAt:'2026-11-02'}]}
vi.mock('@/hooks/useData',()=>({useData:()=>({data,loading:false,mode:'local',batch:mocks.batch,update:mocks.update,toast:mocks.toast,tagCatalog:[],tagRegistry:{c:{}},settings:{theme:'system',defaultView:'dashboard',reportPeriod:'week'},saveSettings:mocks.saveSettings,reset:mocks.reset})}))
vi.mock('@/hooks/useTransitionNavigate',()=>({useTransitionNavigate:()=>mocks.navigate}))
import Notebooks from '@/pages/Notebooks'
import Settings from '@/pages/Settings'

const show=(component,path='/')=>render(<MemoryRouter initialEntries={[path]}><Routes><Route path="/so-tay" element={component}/><Route path="/so-tay/:notebookId" element={component}/><Route path="*" element={component}/></Routes></MemoryRouter>)

describe('trang sổ tay và cài đặt',()=>{
  beforeEach(()=>{Object.values(mocks).forEach(mock=>mock.mockReset?.());mocks.batch.mockResolvedValue(true);mocks.update.mockResolvedValue(true);mocks.saveSettings.mockResolvedValue(true);mocks.reset.mockResolvedValue(true)})
  it('lọc sổ, đổi dạng xem và mở tạo sổ',async()=>{
    show(<Notebooks/>,'/so-tay');expect(screen.getByRole('heading',{name:'Sổ tay'})).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Tìm kiếm sổ tay'),'Biên bản');expect(screen.getByText('Biên bản họp')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button',{name:'Dạng danh sách'}));expect(localStorage.getItem('nhip-viec-notebooks-view')).toBe('list')
    await userEvent.click(screen.getByRole('button',{name:'Tạo sổ'}));expect(screen.getByRole('dialog',{name:'Tạo sổ'})).toBeInTheDocument()
  })
  it('thêm nhanh và mở ghi chú trong chi tiết sổ',async()=>{
    show(<Notebooks/>,'/so-tay/b1');expect(screen.getByRole('heading',{name:'Sổ dự án'})).toBeInTheDocument()
    expect(screen.getByRole('button',{name:'Sửa: Biên bản họp'})).toHaveTextContent('Sửa')
    const quick=screen.getByLabelText('Thêm nhanh ghi chú');await userEvent.type(quick,'Việc mới{Enter}')
    expect(mocks.batch).toHaveBeenCalledWith([expect.objectContaining({type:'create',collection:'notes',data:expect.objectContaining({title:'Việc mới',notebookId:'b1'})})])
    await userEvent.click(screen.getByRole('button',{name:/^Biên bản họp/}));expect(screen.getByRole('dialog',{name:'Sửa'})).toBeInTheDocument()
  })
  it('lưu settings và xác nhận xóa local hai bước',async()=>{
    show(<Settings/>,'/cai-dat');await userEvent.selectOptions(screen.getByLabelText('Giao diện'),'dark')
    expect(mocks.saveSettings).toHaveBeenCalledWith(expect.objectContaining({theme:'dark'}))
    await userEvent.click(screen.getByRole('button',{name:'Xóa dữ liệu local'}));const confirm=screen.getByLabelText('Mã xác nhận')
    expect(screen.getByRole('button',{name:'Tải bản sao lưu và xóa'})).toBeDisabled();await userEvent.type(confirm,'XOA');expect(screen.getByRole('button',{name:'Tải bản sao lưu và xóa'})).toBeEnabled()
  })
})
