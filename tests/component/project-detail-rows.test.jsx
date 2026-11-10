import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ProjectsView from '@/pages/tasks/ProjectsView'

const project={id:'p1',name:'Dự án Một',description:'',colorIndex:2,status:'running'}
const task={id:'t1',projectId:'p1',title:'Chuẩn bị báo cáo',status:'todo',priority:'high',tags:['Một','Hai','Ba']}

describe('hàng nhiệm vụ trong chi tiết dự án',()=>{
  beforeEach(()=>{
    window.matchMedia=vi.fn().mockReturnValue({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()})
  })

  it('đặt title, tối đa hai tag, +N và status trên cùng dòng; toggle chưa xong rỗng',()=>{
    const changeStatus=vi.fn()
    render(<MemoryRouter><ProjectsView
      active={false} editing={null} data={{projects:[project],tasks:[task],contacts:[],trips:[],notes:[]}} loading={false}
      projectStatus={()=>project.status} changeParam={vi.fn()} setView={vi.fn()} projectEditing={null} setProjectEditing={vi.fn()}
      projectConfirm={null} setProjectConfirm={vi.fn()} deleteTarget="" setDeleteTarget={vi.fn()} moveTarget="" setMoveTarget={vi.fn()}
      selectedProject={project} setEditing={vi.fn()} saveProject={vi.fn()} archiveProject={vi.fn()} deleteProject={vi.fn()}
      moveProjectTasks={vi.fn()} changeStatus={changeStatus} tagRegistry={{c:{}}} readOnly={false} onReadOnly={vi.fn()} blockedCreateProps={{}}
    /></MemoryRouter>)
    const row=screen.getByTestId('project-task-row-t1'),line=within(row).getByTestId('project-task-title-line')
    expect(within(line).getByText(task.title)).toBeInTheDocument()
    expect(within(line).getByText('Một')).toBeInTheDocument()
    expect(within(line).getByText('Hai')).toBeInTheDocument()
    expect(within(line).getByRole('button',{name:'Xem thêm 1 nhãn'})).toHaveTextContent('+1')
    expect(within(line).getByText('Chưa bắt đầu')).toBeInTheDocument()
    const toggle=within(row).getByRole('button',{name:`Đánh dấu hoàn thành: ${task.title}`})
    expect(toggle.querySelector('svg')).not.toBeInTheDocument()
    fireEvent.click(toggle)
    expect(changeStatus).toHaveBeenCalledWith(task,'done')
  })
})
