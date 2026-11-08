import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import OnboardingTour from '@/components/layout/OnboardingTour'

describe('onboarding lần đầu',()=>{
  it('đi đủ ba bước rồi chọn dữ liệu mẫu',async()=>{
    const finish=vi.fn(),sample=vi.fn().mockResolvedValue(true)
    render(<OnboardingTour onFinish={finish} onSample={sample}/>)
    expect(screen.getByRole('heading',{name:'Tạo việc rõ ràng'})).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button',{name:'Tiếp tục'}))
    expect(screen.getByRole('heading',{name:'Xem lịch tập trung'})).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button',{name:'Tiếp tục'}))
    expect(screen.getByRole('heading',{name:'Ghi chú có liên kết'})).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button',{name:'Dùng dữ liệu mẫu'}))
    expect(sample).toHaveBeenCalledOnce()
    expect(finish).not.toHaveBeenCalled()
  })

  it('cho phép bỏ qua ngay',async()=>{
    const finish=vi.fn().mockResolvedValue(true)
    render(<OnboardingTour onFinish={finish} onSample={vi.fn()}/>)
    await userEvent.click(screen.getByRole('button',{name:'Bỏ qua'}))
    expect(finish).toHaveBeenCalledOnce()
  })
})
