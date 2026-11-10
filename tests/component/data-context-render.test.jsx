import { Profiler, useState } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { DataProvider, useData, useToast } from '@/hooks/useData'
import { repository } from '@/data/repository'
import ToastHost from '@/components/ui/ToastHost'
import Dashboard from '@/pages/Dashboard'

const countDashboardRender=vi.hoisted(()=>vi.fn(value=>value))
vi.mock('@/hooks/useCountUp',()=>({useCountUp:countDashboardRender}))

function Page(){const{loading,toast}=useData();return <><span data-testid="state">{loading?'loading':'ready'}</span><button onClick={()=>toast('Thông báo thử')}>Toast</button></>}
function FailureHarness(){const{loading,error,batch}=useData();return <>{error&&<div role="alert">{error}</div>}<button disabled={loading} onClick={()=>batch([{type:'create',collection:'tasks',id:'failed-task',data:{id:'failed-task',title:'Không lưu được'}}])}>Tạo lỗi</button></>}
function DashboardHarness(){const[open,setOpen]=useState(false),toast=useToast();return <><button onClick={()=>toast('Toast dashboard')}>Toast Dashboard</button><button onClick={()=>setOpen(value=>!value)}>Drawer</button><Dashboard/>{open&&<div role="dialog">Drawer thử</div>}<ToastHost/></>}

describe('context render isolation',()=>{
  beforeEach(()=>{
    localStorage.clear()
    window.matchMedia=vi.fn().mockReturnValue({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()})
  })
  it('đổi toast không làm page dùng facade render lại',async()=>{const onRender=vi.fn();render(<DataProvider><Profiler id="page" onRender={onRender}><Page/></Profiler><ToastHost/></DataProvider>);await waitFor(()=>expect(screen.getByTestId('state')).toHaveTextContent('ready'));const before=onRender.mock.calls.length;await userEvent.click(screen.getByRole('button',{name:'Toast'}));expect(screen.getByText('Thông báo thử')).toBeInTheDocument();expect(onRender).toHaveBeenCalledTimes(before)})
  it('toast và drawer không render lại Dashboard',async()=>{localStorage.setItem('nhip-viec-initialized','true');countDashboardRender.mockClear();render(<MemoryRouter><DataProvider><DashboardHarness/></DataProvider></MemoryRouter>);await screen.findByRole('heading',{name:/Chào buổi sáng/});const before=countDashboardRender.mock.calls.length;await userEvent.click(screen.getByRole('button',{name:'Toast Dashboard'}));await userEvent.click(screen.getByRole('button',{name:'Drawer'}));expect(screen.getByRole('dialog')).toBeInTheDocument();await userEvent.click(screen.getByRole('button',{name:'Drawer'}));expect(screen.queryByRole('dialog')).not.toBeInTheDocument();expect(countDashboardRender).toHaveBeenCalledTimes(before)})
  it('hiện toast cụ thể khi mutation tạo thất bại',async()=>{const error=Object.assign(new Error('Vượt hạn mức'),{code:'resource-exhausted'}),spy=vi.spyOn(repository,'batch').mockRejectedValueOnce(error);render(<DataProvider><FailureHarness/><ToastHost/></DataProvider>);const button=screen.getByRole('button',{name:'Tạo lỗi'});await waitFor(()=>expect(button).toBeEnabled());await userEvent.click(button);expect(await screen.findByText('Không thể lưu (resource-exhausted): Vượt hạn mức')).toBeVisible();expect(screen.getByRole('alert')).toHaveTextContent('Không thể lưu thay đổi. Dữ liệu cũ vẫn được giữ.');spy.mockRestore()})
})
