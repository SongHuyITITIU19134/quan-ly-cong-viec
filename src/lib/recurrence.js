const parts=value=>String(value||'').split('-').map(Number)
const pad=value=>String(value).padStart(2,'0')
const leap=year=>year%4===0&&(year%100!==0||year%400===0)
const daysInMonth=(year,month)=>[31,leap(year)?29:28,31,30,31,30,31,31,30,31,30,31][month-1]
const format=(year,month,day)=>`${year}-${pad(month)}-${pad(day)}`
export const inferSeriesId=task=>task?.seriesId||String(task?.id||'').replace(/-r\d{4}-\d{2}-\d{2}$/u,'')

export function addCalendarDays(value,amount){
 let[year,month,day]=parts(value)
 if(!year||!month||!day)return''
 const direction=amount<0?-1:1
 for(let index=0;index<Math.abs(amount);index++){day+=direction;if(day>daysInMonth(year,month)){day=1;month+=1;if(month>12){month=1;year+=1}}if(day<1){month-=1;if(month<1){month=12;year-=1}day=daysInMonth(year,month)}}
 return format(year,month,day)
}

export function nextOccurrence(task,anchorDate=task?.dueDate){
 const repeat=task?.repeat,due=task?.dueDate
 if(!repeat||!['daily','weekly','monthly'].includes(repeat.freq)||!due)return''
 const interval=Math.max(1,Math.min(30,Number(repeat.interval)||1))
 let next=''
 if(repeat.freq==='daily')next=addCalendarDays(due,interval)
 if(repeat.freq==='weekly')next=addCalendarDays(due,interval*7)
 if(repeat.freq==='monthly'){
  const[year,month]=parts(due),anchorDay=parts(anchorDate)[2],index=year*12+month-1+interval,nextYear=Math.floor(index/12),nextMonth=index%12+1
  next=format(nextYear,nextMonth,Math.min(anchorDay,daysInMonth(nextYear,nextMonth)))
 }
 return repeat.until&&next>repeat.until?'':next
}

export function recurringTask(task,tasks=[]){
 const seriesId=inferSeriesId(task),root=tasks.find(item=>item.id===seriesId),dueDate=nextOccurrence(task,root?.dueDate||task.dueDate),id=dueDate?`${seriesId}-r${dueDate}`:''
 if(!id||tasks.some(item=>item.id===id))return null
 const source=Object.fromEntries(Object.entries(task).filter(([key])=>!['createdAt','updatedAt','completedAt'].includes(key)))
 return{...source,id,seriesId,dueDate,status:'todo',progress:0,checklist:(task.checklist||[]).map(item=>({...item,done:false}))}
}

export function recurrenceCreateOp(task,tasks=[]){const data=recurringTask(task,tasks);return data?{type:'create',collection:'tasks',id:data.id,data}:null}
export const recurrenceUndoOp=op=>op?.type==='create'?{type:'remove',collection:op.collection,id:op.id}:null
