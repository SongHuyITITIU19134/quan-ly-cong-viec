import { addCalendarDays } from './recurrence'

const dueTime=value=>{const[year,month,day]=String(value||'').split('-').map(Number);return year&&month&&day?new Date(year,month-1,day,9).getTime():NaN}
export const reminderId=task=>`${task.id}:${task.dueDate}:${task.remindBefore}`
export function dueReminders(tasks=[],now=new Date()){
 const current=now.getTime(),windowMs=5*60*1000
 return tasks.filter(task=>task.status!=='done'&&[0,15,60,1440].includes(task.remindBefore)&&Number.isFinite(dueTime(task.dueDate))).filter(task=>{const at=dueTime(task.dueDate)-task.remindBefore*60*1000;return at<=current&&current-at<=windowMs})
}

const STORAGE_KEY='nhip-viec-reminders-shown'
export function loadReminderIds(storage){try{const values=JSON.parse(storage.getItem(STORAGE_KEY)||'[]');return new Set(Array.isArray(values)?values:[])}catch{return new Set()}}
export function rememberReminder(storage,task){const values=loadReminderIds(storage);values.add(reminderId(task));try{storage.setItem(STORAGE_KEY,JSON.stringify([...values].slice(-500)))}catch{/* Nhắc trong phiên vẫn hoạt động khi storage bị chặn. */}return values}
export function pendingReminders(tasks=[],now=new Date(),storage){const shown=loadReminderIds(storage);return dueReminders(tasks,now).filter(task=>!shown.has(reminderId(task)))}
export function pruneReminderIds(storage,today){const threshold=addCalendarDays(today,-30),values=loadReminderIds(storage),kept=[...values].filter(key=>{const due=key.match(/:(\d{4}-\d{2}-\d{2}):\d+$/u)?.[1];return!due||due>=threshold});if(kept.length!==values.size)try{storage.setItem(STORAGE_KEY,JSON.stringify(kept))}catch{/* Dọn dẹp là best effort. */}return new Set(kept)}
