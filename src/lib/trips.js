import { differenceInCalendarDays, format, parseISO } from 'date-fns'
import { vi } from '@/i18n/vi'

export function normalizeTrip(trip){
 return {...trip,completed:trip.completed===true,completedAt:trip.completedAt??null,startSession:trip.startSession==='chieu'?'chieu':'sang',endSession:trip.endSession==='sang'?'sang':'chieu'}
}
const epoch=parseISO('1970-01-01')
export const tripSlot=(date,session)=>differenceInCalendarDays(parseISO(date),epoch)*2+(session==='chieu'?1:0)
export function tripSlots(trip){const value=normalizeTrip(trip);return [tripSlot(value.startDate,value.startSession),tripSlot(value.endDate,value.endSession)]}
export const compareTrips=(a,b)=>a.startDate.localeCompare(b.startDate)||(normalizeTrip(a).startSession==='chieu'?1:0)-(normalizeTrip(b).startSession==='chieu'?1:0)
export function formatTripRange(trip,{short=false}={}){
 const value=normalizeTrip(trip),date=day=>format(parseISO(day),short?'dd/MM':'dd/MM/yyyy')
 if(value.startDate===value.endDate)return `${date(value.startDate)} · ${value.startSession!==value.endSession?vi.trips.allDay:vi.trips.sessions[value.startSession]}`
 return `${date(value.startDate)} (${vi.trips.sessions[value.startSession]}) → ${date(value.endDate)} (${vi.trips.sessions[value.endSession]})`
}
export function tripDaySession(trip,date){
 const value=normalizeTrip(trip)
 if(date<value.startDate||date>value.endDate)return ''
 const start=date===value.startDate?value.startSession:'sang',end=date===value.endDate?value.endSession:'chieu'
 return start===end?vi.trips.sessions[start]:''
}
export function tripsOverlap(a,b,date){
 if(a.completed||b.completed)return false
 const [aStart,aEnd]=tripSlots(a),[bStart,bEnd]=tripSlots(b)
 const start=Math.max(aStart,bStart),end=Math.min(aEnd,bEnd)
 return date?Math.max(start,tripSlot(date,'sang'))<=Math.min(end,tripSlot(date,'chieu')):start<=end
}
export function getTripPhase(task,trip){if(task.tripPhase) return task.tripPhase;if(!task.dueDate||!trip) return null;if(task.dueDate<trip.startDate)return'before';if(task.dueDate>trip.endDate)return'after';return'during'}
export function findTripOverlaps(trips,date){const pairs=[];for(let i=0;i<trips.length;i++)for(let j=i+1;j<trips.length;j++)if(tripsOverlap(trips[i],trips[j],date))pairs.push([trips[i],trips[j]]);return pairs}
export function tasksDueDuringTrip(tasks,trip){return tasks.filter(t=>t.status!=='done'&&t.dueDate>=trip.startDate&&t.dueDate<=trip.endDate)}
