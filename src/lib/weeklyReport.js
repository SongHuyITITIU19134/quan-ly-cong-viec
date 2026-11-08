import { addCalendarDays } from './recurrence'

export function weeklyReport({tasks=[],trips=[]},today){
 const start=addCalendarDays(today,-6),next=addCalendarDays(today,7)
 const done=tasks.filter(task=>task.status==='done'&&String(task.completedAt||task.updatedAt||'').slice(0,10)>=start&&String(task.completedAt||task.updatedAt||'').slice(0,10)<=today)
 const overdue=tasks.filter(task=>task.status!=='done'&&task.dueDate&&task.dueDate<today)
 const upcoming=tasks.filter(task=>task.status!=='done'&&task.dueDate>=today&&task.dueDate<=next)
 const tripList=trips.filter(trip=>!trip.completed&&trip.endDate>=today&&trip.startDate<=next)
 const lines=(title,items,label)=>[title,...(items.length?items.map(item=>`- ${label(item)}`):['- Không có'])]
 return[
  `BÁO CÁO TUẦN · ${today}`,
  ...lines('Đã xong',done,item=>item.title),
  ...lines('Quá hạn',overdue,item=>`${item.title} (${item.dueDate})`),
  ...lines('Sắp tới',upcoming,item=>`${item.title} (${item.dueDate})`),
  ...lines('Công tác',tripList,item=>`${item.name} · ${item.startDate}–${item.endDate}`),
 ].join('\n')
}
