import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks=vi.hoisted(()=>({navigate:vi.fn(),saveSettings:vi.fn(),install:vi.fn(),toast:vi.fn()}))
const data={tasks:[{id:'t1',title:'Họp khách hàng',status:'todo',dueDate:'2020-01-01'}],projects:[{id:'p1',name:'Dự án Mới'}],trips:[],notes:[]}

vi.mock('@/hooks/useData',()=>({useData:()=>({data,loading:false,error:null,setError:vi.fn(),mode:'local',user:null,logout:vi.fn(),readOnly:false,emailNeedsVerification:false,resendEmail:vi.fn(),confirmEmail:vi.fn(),importOffer:false,importBusy:false,importLocal:vi.fn(),skipImport:vi.fn(),toast:mocks.toast,settings:{theme:'system',defaultView:'dashboard',onboardingSeen:true},saveSettings:mocks.saveSettings,batch:vi.fn()})}))
vi.mock('@/hooks/useTheme',()=>({useTheme:()=>({resolved:'light'})}))
vi.mock('@/hooks/useTransitionNavigate',()=>({useTransitionNavigate:()=>mocks.navigate}))
vi.mock('@/hooks/usePwa',()=>({usePwa:()=>({canInstall:true,install:mocks.install})}))
vi.mock('@/components/create/CreateCombo',()=>({default:({open,mode})=>open?<div role="dialog">Tạo {mode}</div>:null}))

import AppLayout from '@/components/layout/AppLayout'
import CommandPalette from '@/components/layout/CommandPalette'

const showLayout=()=>render(<MemoryRouter initialEntries={['/']}><Routes><Route element={<AppLayout/>}><Route path="/" element={<div className="page"><h1>Tổng quan</h1></div>}/></Route></Routes></MemoryRouter>)

describe('bố cục và bảng lệnh',()=>{
  beforeEach(()=>{Object.values(mocks).forEach(mock=>mock.mockReset())})

  it('điều hướng, đổi giao diện và cài ứng dụng',async()=>{
    showLayout()
    await userEvent.click(screen.getByRole('button',{name:'Đi tới hôm nay'}))
    await userEvent.click(screen.getByRole('button',{name:'Chuyển sang giao diện tối'}))
    await userEvent.click(screen.getByRole('button',{name:'Cài ứng dụng'}))
    await userEvent.click(screen.getByRole('link',{name:'Công việc'}))
    expect(mocks.navigate.mock.calls.map(call=>call[0])).toEqual(['/lich','/cong-viec'])
    expect(mocks.saveSettings).toHaveBeenCalledWith(expect.objectContaining({theme:'dark',defaultView:'dashboard'}))
    expect(mocks.install).toHaveBeenCalledOnce()
  })

  it('Ctrl+K tìm không dấu, chọn route và trả focus khi Escape',async()=>{
    showLayout()
    const trigger=screen.getByLabelText('Tìm kiếm toàn cục')
    trigger.focus()
    fireEvent.keyDown(window,{key:'k',ctrlKey:true,target:document.body})
    const combobox=screen.getByRole('combobox',{name:'Tìm lệnh hoặc dữ liệu'})
    await userEvent.type(combobox,'cai dat')
    expect(screen.getByRole('option',{name:/Cài đặt/})).toHaveAttribute('aria-selected','true')
    await userEvent.keyboard('{Enter}')
    expect(mocks.navigate).toHaveBeenCalledWith('/cai-dat')
    trigger.focus()
    fireEvent.keyDown(window,{key:'k',metaKey:true,target:document.body})
    await userEvent.keyboard('{Escape}')
    await vi.waitFor(()=>expect(trigger).toHaveFocus())
  })

  it('bảng lệnh hỗ trợ phím mũi tên, click và trạng thái rỗng',async()=>{
    const choose=vi.fn(),close=vi.fn(),{rerender}=render(<CommandPalette open data={data} onClose={close} onChoose={choose}/>)
    const input=screen.getByRole('combobox')
    fireEvent.keyDown(input,{key:'ArrowDown'})
    expect(input).toHaveAttribute('aria-activedescendant','palette-option-nav-tasks')
    fireEvent.keyDown(input,{key:'ArrowUp'})
    await userEvent.click(screen.getByRole('option',{name:/Họp khách hàng/}))
    expect(choose).toHaveBeenCalledWith(expect.objectContaining({id:'task-t1'}))
    await userEvent.clear(input)
    await userEvent.type(input,'không tồn tại')
    expect(screen.getByText('Không tìm thấy kết quả.')).toBeInTheDocument()
    rerender(<CommandPalette open={false} data={data} onClose={close} onChoose={choose}/>)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
