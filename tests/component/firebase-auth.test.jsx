import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

let dataState
vi.mock('@/hooks/useData',()=>({useData:()=>dataState}))
vi.mock('@/components/layout/AppLayout',()=>({default:()=> <div>Ứng dụng</div>}))
import { RouteGuard } from '@/app/App'

describe('cổng đăng nhập Firebase',()=>{
  beforeEach(()=>{dataState={mode:'firebase',user:null,authPending:false,login:vi.fn(),loginEmail:vi.fn(),registerEmail:vi.fn(),resetPassword:vi.fn(),authBusy:false,authError:null,authNotice:null}})
  it('hiện loader trong khi auth đang chờ',()=>{dataState.authPending=true;render(<MemoryRouter><RouteGuard/></MemoryRouter>);expect(screen.getByRole('status')).toHaveAttribute('aria-busy','true')})
  it('hiện Login khi auth không có người dùng',()=>{render(<MemoryRouter><RouteGuard/></MemoryRouter>);expect(screen.getByRole('button',{name:'Đăng nhập Google'})).toBeInTheDocument()})
  it('kiểm tra form đăng ký trước khi gửi',async()=>{render(<MemoryRouter><RouteGuard/></MemoryRouter>);await userEvent.click(screen.getByRole('tab',{name:'Đăng ký'}));await userEvent.click(screen.getByRole('button',{name:'Đăng ký'}));expect(screen.getByText('Vui lòng nhập họ tên.')).toBeInTheDocument();expect(screen.getByText('Mật khẩu phải có ít nhất 8 ký tự.')).toBeInTheDocument();expect(dataState.registerEmail).not.toHaveBeenCalled()})
  it('chế độ local không hiện Login',()=>{dataState.mode='local';render(<MemoryRouter><RouteGuard/></MemoryRouter>);expect(screen.getByText('Ứng dụng')).toBeInTheDocument();expect(screen.queryByRole('button',{name:'Đăng nhập Google'})).not.toBeInTheDocument()})
})
