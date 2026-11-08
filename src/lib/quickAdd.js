import { addCalendarDays } from './recurrence'

const priorities={thấp:'low',thap:'low',vừa:'medium',vua:'medium',cao:'high',gấp:'urgent',gap:'urgent'}
const normalize=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
const validDate=(year,month,day)=>{const value=new Date(year,month-1,day);return value.getFullYear()===year&&value.getMonth()===month-1&&value.getDate()===day}
const format=(year,month,day)=>`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`

export function parseQuickAdd(text,today){
 const raw=String(text),base=today||format(new Date().getFullYear(),new Date().getMonth()+1,new Date().getDate()),tags=[...raw.matchAll(/#([^\s#!]+)/gu)].map(match=>match[1]),priorityMatch=raw.match(/!(thấp|thap|vừa|vua|cao|gấp|gap)\b/iu),priority=priorityMatch?priorities[normalize(priorityMatch[1])]:'medium',content=raw.replace(/#([^\s#!]+)/gu,'').replace(/!(thấp|thap|vừa|vua|cao|gấp|gap)\b/giu,'').trim()
 let dueDate=''
 let dateMatch=null
 const numeric=content.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?\b/u)
 if(numeric){let year=Number(numeric[3]||base.slice(0,4)),month=Number(numeric[2]),day=Number(numeric[1]);if(!numeric[3]&&validDate(year,month,day)&&format(year,month,day)<base)year+=1;if(validDate(year,month,day))dueDate=format(year,month,day)}
 if(dueDate)dateMatch=numeric[0]
 if(!dueDate){const relative=content.match(/^\s*(hôm nay|hom nay|mai|mốt|mot)\b|\b(hôm nay|hom nay|mai|mốt|mot)\s*$/u),token=relative?.[1]||relative?.[2],amount={"hôm nay":0,'hom nay':0,mai:1,'mốt':2,mot:2}[token];if(relative){dueDate=addCalendarDays(base,amount);dateMatch=relative[0]}}
 if(!dueDate){const weekday=content.match(/^\s*((?:thứ|thu)\s*([2-7])|cn)\b|\b((?:thứ|thu)\s*([2-7])|cn)\s*$/iu);if(weekday){const token=normalize(weekday[1]||weekday[3]),wanted=token==='cn'?0:Number(weekday[2]||weekday[4])-1,[year,month,day]=base.split('-').map(Number),current=new Date(year,month-1,day).getDay(),delta=(wanted-current+7)%7||7;dueDate=addCalendarDays(base,delta);dateMatch=weekday[0]}}
 const title=(dateMatch?content.replace(dateMatch,''):content)
 return{title:title.trim().replace(/\s+/gu,' '),dueDate,tags,priority}
}
