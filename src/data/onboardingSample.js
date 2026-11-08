import { todayISO } from '@/lib/dates'

const shiftDate=days=>{
  const[year,month,day]=todayISO().split('-').map(Number),date=new Date(year,month-1,day+days)
  return`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
}

export const SAMPLE_ID_PREFIX='sample-'

export function onboardingSample(){
  const today=todayISO()
  return{
    projects:[{id:'sample-project',name:'Khởi động Nhịp việc',description:'Dự án mẫu để khám phá ứng dụng',colorIndex:1,status:'running',ownerId:'self',startDate:today,dueDate:shiftDate(14),archived:false}],
    tasks:[
      {id:'sample-task-calendar',title:'Xem công việc trên lịch',description:'',projectId:'sample-project',status:'todo',priority:'medium',startDate:today,dueDate:shiftDate(1),assignerId:'self',assigneeId:'self',collaboratorIds:[],notes:'',checklist:[],progress:0,progressMode:'auto',tripId:null,tripPhase:null,order:100,tags:['Bắt đầu']},
      {id:'sample-task-repeat',title:'Lập kế hoạch mỗi tuần',description:'',projectId:'sample-project',status:'todo',priority:'high',startDate:today,dueDate:shiftDate(3),assignerId:'self',assigneeId:'self',collaboratorIds:[],notes:'',checklist:[],progress:0,progressMode:'auto',tripId:null,tripPhase:null,order:200,tags:['Bắt đầu'],seriesId:'sample-task-repeat',repeat:{freq:'weekly',interval:1}}
    ],
    contacts:[],trips:[],
    notebooks:[{id:'sample-notebook',name:'Ghi chú khởi động',color:0,pinned:true,archived:false}],
    notes:[{id:'sample-note',notebookId:'sample-notebook',title:'Ba bước làm quen',body:'Tạo việc, xem lịch và ghi lại điều quan trọng.',tags:['Bắt đầu'],pinned:true,links:{projectId:'sample-project'}}]
  }
}

export const isSampleItem=item=>String(item?.id||'').startsWith(SAMPLE_ID_PREFIX)
