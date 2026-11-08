import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CreateCombo from '@/components/create/CreateCombo'

const batch=vi.fn(),create=vi.fn(),toast=vi.fn()
const data={projects:[{id:'p1',name:'Dự án Một',status:'running'},{id:'p2',name:'Dự án Hai',status:'running'}],tasks:[],contacts:[{id:'self',fullName:'Tôi'}],trips:[]}
vi.mock('@/hooks/useData',()=>({useData:()=>({data,batch,create,toast,mode:'local'})}))

beforeEach(()=>{batch.mockReset().mockResolvedValue(true);create.mockReset();toast.mockReset()})
afterEach(cleanup)

describe('Tạo dự án + nhiệm vụ',()=>{
  it('tạo dự án và 3 nhiệm vụ trong một batch',async()=>{
    render(<CreateCombo open mode="combo" onClose={vi.fn()}/>)
    fireEvent.change(screen.getByLabelText('Tên dự án *'),{target:{value:'Kế hoạch mới'}})
    fireEvent.click(screen.getByRole('button',{name:'Tiếp tục'}))
    fireEvent.change(screen.getByLabelText('Tên nhiệm vụ *'),{target:{value:'Việc 1'}})
    fireEvent.click(screen.getByRole('button',{name:'Thêm nhiệm vụ'}));fireEvent.click(screen.getByRole('button',{name:'Thêm nhiệm vụ'}))
    const titles=screen.getAllByLabelText('Tên nhiệm vụ *')
    fireEvent.change(titles[1],{target:{value:'Việc 2'}});fireEvent.change(titles[2],{target:{value:'Việc 3'}})
    fireEvent.click(screen.getByRole('button',{name:'Tạo'}))
    await waitFor(()=>expect(batch).toHaveBeenCalledOnce())
    const ops=batch.mock.calls[0][0],project=ops[0].data
    expect(ops).toHaveLength(4);expect(ops[0]).toMatchObject({type:'create',collection:'projects'})
    expect(ops.slice(1).every(op=>op.data.projectId===project.id)).toBe(true)
  })
  it('giữ dự án được chọn sẵn',()=>{render(<CreateCombo open mode="task" preselectedProjectId="p2" onClose={vi.fn()}/>);expect(screen.getByLabelText('Dự án cho nhiệm vụ')).toHaveValue('p2')})
  it('chặn tiêu đề nhiệm vụ trống',async()=>{render(<CreateCombo open mode="task" preselectedProjectId="p1" onClose={vi.fn()}/>);await userEvent.click(screen.getByRole('button',{name:'Tạo'}));expect(screen.getByRole('alert')).toHaveTextContent('không được để trống');expect(batch).not.toHaveBeenCalled()})
  it('giới hạn tên dự án 60 và nhiệm vụ 120 ký tự',async()=>{const view=render(<CreateCombo open mode="combo" onClose={vi.fn()}/>);expect(screen.getByLabelText('Tên dự án *')).toHaveAttribute('maxlength','60');view.rerender(<CreateCombo open mode="task" onClose={vi.fn()}/>);expect(screen.getByLabelText('Tên nhiệm vụ *')).toHaveAttribute('maxlength','120')})
})
