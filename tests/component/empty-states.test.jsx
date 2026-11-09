import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const state=vi.hoisted(()=>({data:{projects:[],tasks:[],contacts:[],trips:[]}}))
const noop=vi.fn()
vi.mock('@/hooks/useData',()=>({
  useData:()=>({data:state.data,loading:false,create:noop,update:noop,remove:noop,batch:noop,toast:noop}),
  useDataState:()=>({data:state.data,loading:false}),
  useActions:()=>({create:noop,update:noop,remove:noop,batch:noop}),
  useToast:()=>noop,
}))
vi.mock('@/app/App',()=>({Page:({children})=><main>{children}</main>,Header:({title,description,action})=><header><h1>{title}</h1><p>{description}</p>{action}</header>}))
vi.mock('@/hooks/useTransitionNavigate',()=>({useTransitionNavigate:()=>noop}))
vi.mock('@/hooks/useCountUp',()=>({useCountUp:()=>({current:null})}))
import Dashboard from '@/pages/Dashboard'
import Tasks from '@/pages/Tasks'
import Calendar from '@/pages/Calendar'
import Trips from '@/pages/Trips'
import Contacts from '@/pages/Contacts'
import MindMap from '@/pages/MindMap'

const empty={projects:[],tasks:[],contacts:[],trips:[]}
const show=(Component,url='/')=>render(<MemoryRouter initialEntries={[url]}><Component/></MemoryRouter>)

describe('trạng thái dữ liệu trống',()=>{
  beforeEach(()=>{state.data=empty})
  it.each([
    [Dashboard,'/','Bắt đầu một nhịp làm việc mới','Tạo dự án đầu tiên'],
    [Tasks,'/cong-viec','Chưa có nhiệm vụ','Tạo nhiệm vụ'],
    [Tasks,'/cong-viec?view=list','Chưa có nhiệm vụ','Tạo nhiệm vụ'],
    [Tasks,'/cong-viec?view=projects','Chưa có dự án','Tạo dự án'],
    [Calendar,'/lich','Chưa có lịch công việc','Tạo nhiệm vụ'],
    [Trips,'/cong-tac','Chưa có chuyến công tác','Tạo chuyến công tác'],
    [Contacts,'/danh-ba','Chưa có liên hệ','Thêm liên hệ đầu tiên'],
    [MindMap,'/so-do','Chưa có dự án','Tạo dự án'],
  ])('%s hiển thị hành động chính', (Component,url,title,action)=>{show(Component,url);expect(screen.getByRole('heading',{name:title})).toBeInTheDocument();expect(screen.getByRole('button',{name:action})).toBeInTheDocument()})
  it('phân biệt không khớp bộ lọc với chưa có dữ liệu',()=>{
    state.data={...empty,tasks:[{id:'t1',title:'Việc khác',status:'todo',priority:'medium',dueDate:'2026-12-01',order:1,progress:0}]}
    show(Tasks,'/cong-viec?q=khong-khop')
    expect(screen.getByRole('heading',{name:'Không có nhiệm vụ khớp bộ lọc'})).toBeInTheDocument()
    expect(screen.getByRole('button',{name:'Đặt lại'})).toBeInTheDocument()
  })
})
