import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Button, Modal } from '@/components/ui'

afterEach(cleanup)

describe('Modal dùng chung',()=>{
  it('render dưới document.body và đóng bằng Escape',()=>{
    const onClose=vi.fn(),host=document.createElement('div')
    document.body.appendChild(host)
    render(<Modal title="Xác nhận" onClose={onClose} actions={<Button onClick={onClose}>Hủy</Button>}><p>Nội dung</p></Modal>,{container:host})
    const dialog=screen.getByRole('dialog')
    expect(dialog.parentElement.parentElement).toBe(document.body)
    expect(dialog).toHaveAttribute('aria-modal','true')
    expect(screen.getByRole('button',{name:'Hủy'})).toHaveFocus()
    fireEvent.keyDown(document,{key:'Escape'})
    expect(onClose).toHaveBeenCalledOnce()
    host.remove()
  })
})
