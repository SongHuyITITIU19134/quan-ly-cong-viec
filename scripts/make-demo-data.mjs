import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const pad=value=>String(value).padStart(2,'0')
const shiftDate=(base,days)=>{
  const date=new Date(base.getFullYear(),base.getMonth(),base.getDate()+days)
  return`${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`
}

export function makeDemoData(now=new Date()){
  const today=shiftDate(now,0),createdAt=new Date(now).toISOString()
  const projects=[
    {id:'demo-project-launch',name:'Ra mắt sản phẩm Q4',description:'Chuẩn bị nội dung, vận hành và kế hoạch phát hành.',colorIndex:6,status:'running',ownerId:'demo-self',startDate:shiftDate(now,-20),dueDate:shiftDate(now,8),archived:false},
    {id:'demo-project-experience',name:'Nâng cấp trải nghiệm',description:'Tinh chỉnh hành trình và phản hồi của khách hàng.',colorIndex:4,status:'running',ownerId:'demo-lan',startDate:shiftDate(now,-12),dueDate:shiftDate(now,18),archived:false},
    {id:'demo-project-operations',name:'Báo cáo vận hành',description:'Tổng hợp số liệu, rủi ro và kế hoạch tuần tới.',colorIndex:2,status:'running',ownerId:'demo-minh',startDate:shiftDate(now,-7),dueDate:shiftDate(now,4),archived:false},
  ]
  const contacts=[
    {id:'demo-self',fullName:'Huy Nguyễn',organization:'Nhịp việc',title:'Phụ trách',phone:'0900000001',email:'huy@example.com',notes:'',isSelf:true},
    {id:'demo-lan',fullName:'Lan Anh',organization:'Sản phẩm',title:'Thiết kế sản phẩm',phone:'0900000002',email:'lan@example.com',notes:''},
    {id:'demo-minh',fullName:'Minh Trần',organization:'Vận hành',title:'Điều phối',phone:'0900000003',email:'minh@example.com',notes:''},
  ]
  const definitions=[
    ['Chốt kế hoạch ra mắt','Rà lại mốc bàn giao với các nhóm.','demo-project-launch','doing','urgent',0,'demo-self',['Ra mắt','Ưu tiên'],55,3],
    ['Duyệt nội dung chiến dịch','Hoàn thiện thông điệp cho tuần đầu.','demo-project-launch','waiting','high',0,'demo-lan',['Nội dung'],75,2],
    ['Kiểm tra số liệu vận hành','Đối chiếu dữ liệu trước khi gửi báo cáo.','demo-project-operations','todo','high',0,'demo-minh',['Báo cáo'],25,1],
    ['Phản hồi nhóm kinh doanh','Tổng hợp các câu hỏi còn mở.','demo-project-launch','todo','medium',-1,'demo-self',['Khách hàng'],0,1],
    ['Sửa luồng đăng ký','Giảm số bước và làm rõ trạng thái.','demo-project-experience','doing','high',-2,'demo-lan',['UX'],50,2],
    ['Chốt bảng chỉ số tuần','Gửi bản cuối cho nhóm vận hành.','demo-project-operations','waiting','urgent',-3,'demo-minh',['Báo cáo','Ưu tiên'],80,3],
    ['Phỏng vấn khách hàng','Ghi nhận ba vấn đề chính.','demo-project-experience','todo','medium',2,'demo-lan',['Nghiên cứu'],0,0],
    ['Chuẩn bị tài liệu hướng dẫn','Viết bản ngắn cho người dùng mới.','demo-project-launch','todo','low',3,'demo-self',['Nội dung'],20,1],
    ['Tổng hợp rủi ro','Xếp hạng theo mức độ ảnh hưởng.','demo-project-operations','paused','medium',4,'demo-minh',['Vận hành'],35,1],
    ['Kiểm thử bản phát hành','Chạy lại các luồng quan trọng.','demo-project-launch','todo','high',5,'demo-self',['Kiểm thử'],10,2],
    ['Cập nhật thư viện giao diện','Chuẩn hóa khoảng cách và trạng thái.','demo-project-experience','done','medium',-1,'demo-lan',['UI'],100,2],
    ['Gửi báo cáo ngày','Bản tóm tắt đã được xác nhận.','demo-project-operations','done','low',0,'demo-minh',['Báo cáo'],100,1],
    ['Lập kế hoạch sprint tiếp theo','Ưu tiên các cải tiến có tác động cao.','demo-project-experience','todo','medium',6,'demo-lan',['Kế hoạch'],0,0],
    ['Rà soát checklist phát hành','Xác nhận người phụ trách từng hạng mục.','demo-project-launch','doing','high',1,'demo-self',['Ra mắt'],60,3],
  ]
  const tasks=definitions.map(([title,description,projectId,status,priority,dueOffset,assigneeId,tags,progress,doneItems],index)=>({
    id:`demo-task-${index+1}`,createdAt,updatedAt:createdAt,...(status==='done'?{completedAt:createdAt}:{}),title,description,projectId,status,priority,
    startDate:shiftDate(now,Math.min(-5,dueOffset)),dueDate:shiftDate(now,dueOffset),assignerId:'demo-self',assigneeId,
    collaboratorIds:index%3===0?['demo-lan','demo-minh'].filter(id=>id!==assigneeId):[],notes:'',
    checklist:['Chuẩn bị','Thực hiện','Xác nhận'].map((text,itemIndex)=>({id:`demo-check-${index+1}-${itemIndex+1}`,text,done:itemIndex<doneItems})),
    progress,progressMode:'manual',tripId:null,tripPhase:null,order:(index+1)*100,tags,
  }))
  const trips=[
    {id:'demo-trip-ongoing',name:'Làm việc cùng đội vận hành',location:'Đà Nẵng',startDate:shiftDate(now,-1),endDate:shiftDate(now,1),startSession:'sang',endSession:'chieu',purpose:'Chốt quy trình và số liệu báo cáo.',contactIds:['demo-minh'],projectId:'demo-project-operations',notes:'',color:'#fbbf1b',completed:false},
    {id:'demo-trip-upcoming',name:'Khảo sát người dùng',location:'Hà Nội',startDate:shiftDate(now,7),endDate:shiftDate(now,8),startSession:'chieu',endSession:'chieu',purpose:'Phỏng vấn và kiểm thử trải nghiệm mới.',contactIds:['demo-lan'],projectId:'demo-project-experience',notes:'',color:'#a9d9f7',completed:false},
  ]
  return{schemaVersion:2,createdAt,data:{projects,tasks,contacts,trips,notebooks:[],notes:[]}}
}

const isMain=process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]
if(isMain){
  const output=new URL('../docs/design/demo-data.json',import.meta.url)
  await mkdir(new URL('../docs/design/',import.meta.url),{recursive:true})
  await writeFile(output,`${JSON.stringify(makeDemoData(),null,2)}\n`)
  console.log(fileURLToPath(output))
}
