import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import CompletionGauge from '@/pages/dashboard/CompletionGaugeCard'

const cases=[
  [0,0,'Chưa có việc trong khoảng này'],
  [1,10,'Cần tăng tốc'],
  [2,10,'Cần cố gắng'],
  [6,10,'Đang ổn'],
  [8,10,'Tốt'],
  [10,10,'Đạt mục tiêu']
]

describe('CompletionGauge',()=>{
  afterEach(()=>{cleanup();vi.unstubAllGlobals()})

  it.each(cases)('hiện aria-label và chip cho %i/%i', (done,total,label)=>{
    render(<CompletionGauge done={done} total={total}/>)
    expect(screen.getByRole('img')).toHaveAttribute('aria-label',expect.stringContaining(label))
    expect(screen.getByText(label)).toBeInTheDocument()
  })

  it('chỉ hiện flame khi đạt mục tiêu',()=>{
    const{container,rerender}=render(<CompletionGauge done={8} total={10}/>)
    expect(container.querySelector('.gauge-flame')).not.toBeInTheDocument()
    rerender(<CompletionGauge done={10} total={10}/>)
    expect(container.querySelectorAll('.gauge-flame-layer')).toHaveLength(3)
  })

  it('tắt animation bằng matchMedia reduced motion',()=>{
    vi.stubGlobal('matchMedia',vi.fn(()=>({matches:true,addEventListener:vi.fn(),removeEventListener:vi.fn()})))
    const{container}=render(<CompletionGauge done={10} total={10}/>)
    expect(container.querySelector('.completion-gauge')).toHaveClass('is-reduced-motion')
    expect(container.querySelector('.gauge-flame')).toBeInTheDocument()
  })

  it('danger hiện dòng cảnh báo với số việc còn lại và quá hạn',()=>{
    render(<CompletionGauge done={1} total={10} overdue={3}/>)
    expect(screen.getByText('Còn 9 việc chưa xong, 3 quá hạn')).toBeInTheDocument()
  })
})
