import { addDays, isAfter, isBefore, parseISO } from 'date-fns'
import { todayISO, toISODate } from './dates'
import { tagKey } from '@/tags/tagUtils'
export const DUE_SOON_DAYS = 3
export function getDueState(task, today=todayISO()) { if(task.status==='done') return 'ok'; if(!task.dueDate) return 'none'; if(task.dueDate<today) return 'overdue'; if(task.dueDate===today) return 'today'; if(task.dueDate<=toISODate(addDays(parseISO(today),DUE_SOON_DAYS))) return 'soon'; return 'ok' }
export function normalizeText(value=''){return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase()}
export function applyFilters(tasks, f={}) { return tasks.filter(t=>{
  if(f.q && !normalizeText([t.title,t.description,t.notes,...(t.tags||[])].join(' ')).includes(normalizeText(f.q))) return false
  if(f.status?.length && !f.status.includes(t.status)) return false
  if(f.priority?.length && !f.priority.includes(t.priority)) return false
  if(f.tags?.length && !normalizeTagsForFilter(t.tags).some(key=>f.tags.includes(key))) return false
  if(f.contactId && ![t.assignerId,t.assigneeId,...(t.collaboratorIds||[])].includes(f.contactId)) return false
  if(f.projectId && t.projectId!==f.projectId) return false
  if(f.tripId && t.tripId!==f.tripId) return false
  if(f.from && (!t.dueDate || isBefore(parseISO(t.dueDate),parseISO(f.from)))) return false
  if(f.to && (!t.dueDate || isAfter(parseISO(t.dueDate),parseISO(f.to)))) return false
  if(f.due && getDueState(t,f.today)!==f.due) return false
  return true
}) }
const normalizeTagsForFilter=tags=>(tags||[]).map(tagKey)
export function sortTasks(tasks, sort='order') { return [...tasks].sort((a,b)=> sort==='dueDate' ? (a.dueDate||'9999').localeCompare(b.dueDate||'9999') : sort==='priority' ? ({urgent:0,high:1,medium:2,low:3}[a.priority]-{urgent:0,high:1,medium:2,low:3}[b.priority]) : (a.order??0)-(b.order??0)) }
