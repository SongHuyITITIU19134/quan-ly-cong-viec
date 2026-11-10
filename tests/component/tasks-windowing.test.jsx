import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import KanbanView from '@/pages/tasks/KanbanView'
import ListView from '@/pages/tasks/ListView'
import { STATUS_KEYS } from '@/i18n/vi'

vi.mock('@/components/task/TaskCard',()=>({default:({task})=><article>{task.title}</article>}))

const tasks=Array.from({length:101},(_,index)=>({
  id:`task-${index+1}`,title:`Việc ${index+1}`,status:'todo',priority:'medium',progress:0,
  dueDate:'2026-11-30',assigneeId:'self',tags:[],order:index+1
}))
const groupedFor=items=>Object.fromEntries(STATUS_KEYS.map(key=>[key,items.filter(task=>task.status===key)]))

describe('cửa sổ render Tasks',()=>{
  it('Kanban giữ bộ đếm toàn bộ và mở thêm từng 40 thẻ',()=>{
    render(<KanbanView data={{tasks}} filtered={tasks} grouped={groupedFor(tasks)} hasFilters={false} setParams={vi.fn()} taskProps={task=>({task})} dropTask={vi.fn()} setDragging={vi.fn()} setEditing={vi.fn()}/>)
    expect(screen.getByText('101')).toBeInTheDocument()
    expect(screen.getAllByText(/^Việc \d+$/u)).toHaveLength(40)
    expect(screen.queryByRole('combobox',{name:/Chuyển sang/u})).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button',{name:'Xem thêm (còn 61)'}))
    expect(screen.getAllByText(/^Việc \d+$/u)).toHaveLength(80)
  })

  it('Kanban vẫn hiện kết quả lọc nằm ngoài 40 thẻ đầu',()=>{
    const match=[tasks[100]]
    render(<KanbanView data={{tasks}} filtered={match} grouped={groupedFor(match)} hasFilters setParams={vi.fn()} taskProps={task=>({task})} dropTask={vi.fn()} setDragging={vi.fn()} setEditing={vi.fn()}/>)
    expect(screen.getByText('Việc 101')).toBeInTheDocument()
    expect(screen.queryByRole('button',{name:/Xem thêm/u})).not.toBeInTheDocument()
  })

  it('ListView phân trang đúng 100 dòng',()=>{
    render(<ListView data={{tasks,contacts:[{id:'self',fullName:'Tôi'}]}} filtered={tasks} tagRegistry={{c:{}}} tagFilters={[]} toggleTag={vi.fn()} changeStatus={vi.fn()} setEditing={vi.fn()} setConfirm={vi.fn()} setParams={vi.fn()}/>)
    expect(screen.getAllByRole('row')).toHaveLength(101)
    expect(screen.queryByText('Việc 101')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button',{name:'Trang sau'}))
    expect(screen.getByText('Việc 101')).toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(2)
  })
})
