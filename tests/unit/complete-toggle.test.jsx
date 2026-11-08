import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CompleteToggle from '@/components/ui/CompleteToggle'

function ControlledToggle({onChange=()=>{},...props}){
  const [checked,setChecked]=useState(false)
  return <CompleteToggle {...props} checked={checked} onChange={next=>{setChecked(next);onChange(next)}}/>
}

describe('CompleteToggle',()=>{
  it('đổi aria-pressed và trả trạng thái tiếp theo khi bấm',async()=>{
    const onChange=vi.fn(),user=userEvent.setup()
    render(<ControlledToggle label="X" onChange={onChange}/>)
    const button=screen.getByRole('button')
    expect(button).toHaveAttribute('type','button')
    expect(button).toHaveAttribute('aria-pressed','false')
    await user.click(button)
    expect(onChange).toHaveBeenCalledExactlyOnceWith(true)
    expect(button).toHaveAttribute('aria-pressed','true')
  })
  it('đổi tên truy cập và tooltip theo trạng thái',()=>{
    const {rerender}=render(<CompleteToggle label="X" checked={false} onChange={()=>{}}/>)
    expect(screen.getByRole('button',{name:'Đánh dấu hoàn thành: X'})).toHaveAttribute('title','Đánh dấu hoàn thành: X')
    rerender(<CompleteToggle label="X" checked onChange={()=>{}}/>)
    expect(screen.getByRole('button',{name:'Mở lại: X'})).toHaveAttribute('title','Mở lại: X')
  })
  it('đổi chữ trong pill',async()=>{
    const user=userEvent.setup()
    render(<ControlledToggle label="X" showLabel/>)
    expect(screen.getByText('Hoàn thành')).toBeInTheDocument()
    await user.click(screen.getByRole('button'))
    expect(screen.getByText('Đã hoàn thành')).toBeInTheDocument()
  })
  it('Space và Enter dùng hành vi nút gốc',async()=>{
    const user=userEvent.setup(),onChange=vi.fn()
    render(<ControlledToggle label="X" onChange={onChange}/>)
    await user.tab()
    await user.keyboard(' ')
    expect(onChange).toHaveBeenLastCalledWith(true)
    await user.keyboard('{Enter}')
    expect(onChange).toHaveBeenLastCalledWith(false)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed','false')
  })
  it('disabled không đổi trạng thái',async()=>{
    const user=userEvent.setup(),onChange=vi.fn()
    render(<ControlledToggle label="X" onChange={onChange} disabled/>)
    await user.click(screen.getByRole('button'))
    await user.tab()
    await user.keyboard(' {Enter}')
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByRole('button')).toBeDisabled()
  })
  it('không truyền click, pointer hoặc drag lên thẻ cha',async()=>{
    const user=userEvent.setup(),onClick=vi.fn(),onPointerDown=vi.fn(),onDragStart=vi.fn()
    render(<div onClick={onClick} onPointerDown={onPointerDown} onDragStart={onDragStart}><ControlledToggle label="X"/></div>)
    const button=screen.getByRole('button')
    await user.click(button)
    fireEvent.dragStart(button)
    expect(onClick).not.toHaveBeenCalled()
    expect(onPointerDown).not.toHaveBeenCalled()
    expect(onDragStart).not.toHaveBeenCalled()
    expect(button).toHaveAttribute('draggable','false')
  })
})
