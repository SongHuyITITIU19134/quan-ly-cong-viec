import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { briefingClock, DAILY_BRIEFING_STORAGE_KEY } from '@/lib/dailyBriefing'

const mocks=vi.hoisted(()=>({navigate:vi.fn(),saveSettings:vi.fn(),install:vi.fn(),toast:vi.fn(),resendEmail:vi.fn(),confirmEmail:vi.fn()}))
const layoutState=vi.hoisted(()=>({mode:'local',user:null,readOnly:false,emailNeedsVerification:false}))
const data={tasks:[{id:'t1',title:'Họp khách hàng',status:'todo',dueDate:'2020-01-01'}],projects:[{id:'p1',name:'Dự án Mới'}],trips:[],notes:[]}

vi.mock('@/hooks/useData',()=>({useData:()=>({data,loading:false,error:null,setError:vi.fn(),...layoutState,logout:vi.fn(),resendEmail:mocks.resendEmail,confirmEmail:mocks.confirmEmail,importOffer:false,importBusy:false,importLocal:vi.fn(),skipImport:vi.fn(),toast:mocks.toast,settings:{theme:'system',defaultView:'dashboard',onboardingSeen:true},saveSettings:mocks.saveSettings,batch:vi.fn()})}))
vi.mock('@/hooks/useTheme',()=>({useTheme:()=>({resolved:'light'})}))
vi.mock('@/hooks/useTransitionNavigate',()=>({useTransitionNavigate:()=>mocks.navigate}))
vi.mock('@/hooks/usePwa',()=>({usePwa:()=>({canInstall:true,install:mocks.install})}))
vi.mock('@/components/create/CreateCombo',()=>({default:({open,mode})=>open?<div role="dialog">Tạo {mode}</div>:null}))

import AppLayout from '@/components/layout/AppLayout'
import CommandPalette from '@/components/layout/CommandPalette'

const showLayout=()=>render(<MemoryRouter initialEntries={['/']}><Routes><Route element={<AppLayout/>}><Route path="/" element={<div className="page"><h1>Tổng quan</h1></div>}/></Route></Routes></MemoryRouter>)

describe('bố cục và bảng lệnh',()=>{
  beforeEach(()=>{Object.assign(layoutState,{mode:'local',user:null,readOnly:false,emailNeedsVerification:false});Object.values(mocks).forEach(mock=>mock.mockReset());localStorage.setItem(DAILY_BRIEFING_STORAGE_KEY,briefingClock().date)})
  afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals()})

  it('điều hướng, đổi giao diện và cài ứng dụng',async()=>{
    showLayout()
    const topbar=within(document.querySelector('.shell-topbar'))
    await userEvent.click(topbar.getByRole('button',{name:'Đi tới hôm nay'}))
    await userEvent.click(topbar.getByRole('button',{name:'Chuyển sang giao diện tối'}))
    await userEvent.click(topbar.getByRole('button',{name:'Cài ứng dụng'}))
    await userEvent.click(within(document.querySelector('.shell-sidebar')).getByRole('link',{name:'Công việc'}))
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
    await vi.waitFor(()=>expect(screen.queryByRole('dialog',{name:'Bảng lệnh'})).not.toBeInTheDocument())
    trigger.focus()
    fireEvent.keyDown(window,{key:'k',metaKey:true,target:document.body})
    fireEvent.keyDown(screen.getByRole('combobox',{name:'Tìm lệnh hoặc dữ liệu'}),{key:'Escape'})
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

  it('hiện báo cáo một lần từ 06:00 và gửi notification khi đã được phép',()=>{
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-08T00:00:00Z'))
    localStorage.removeItem(DAILY_BRIEFING_STORAGE_KEY)
    const NotificationMock=vi.fn()
    NotificationMock.permission='granted'
    vi.stubGlobal('Notification',NotificationMock)
    showLayout()
    expect(screen.getByRole('dialog',{name:/Báo cáo công việc/})).toBeInTheDocument()
    expect(screen.getAllByText('Họp khách hàng')).toHaveLength(2)
    expect(screen.getByRole('heading',{name:'Tổng quan',level:3})).toBeInTheDocument()
    expect(localStorage.getItem(DAILY_BRIEFING_STORAGE_KEY)).toBe('2026-11-08')
    expect(NotificationMock).toHaveBeenCalledOnce()
  })

  it('giữ banner xác minh và giải thích khi người dùng chỉ đọc bấm tạo',async()=>{
    Object.assign(layoutState,{mode:'firebase',user:{email:'chua-xac-minh@example.com',emailVerified:false},readOnly:true,emailNeedsVerification:true})
    showLayout()
    const banner=screen.getByRole('region',{name:'Xác minh email'})
    expect(within(banner).getByRole('button',{name:'Gửi lại email'})).toBeInTheDocument()
    expect(within(banner).getByRole('button',{name:'Tôi đã xác minh'})).toBeInTheDocument()
    const create=within(document.querySelector('.shell-sidebar')).getByRole('button',{name:'Tạo nhiệm vụ'})
    expect(create).toHaveAttribute('aria-disabled','true')
    expect(create).toHaveAttribute('title','Xác minh email để chỉnh sửa')
    await userEvent.click(create)
    expect(mocks.toast).toHaveBeenCalledWith('Xác minh email để chỉnh sửa')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
