import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import NotFound from '@/pages/NotFound'

describe('NotFound',()=>{
  it('có đường dẫn về trang chủ',()=>{
    render(<MemoryRouter><NotFound/></MemoryRouter>)
    expect(screen.getByRole('heading',{name:'Không tìm thấy trang'})).toBeInTheDocument()
    expect(screen.getByRole('link',{name:'Về trang chủ'})).toHaveAttribute('href','/')
  })
})
