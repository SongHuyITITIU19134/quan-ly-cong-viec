import { addDays, format, parseISO, startOfWeek } from 'date-fns'
import { vi } from 'date-fns/locale'

export const toISODate = date => format(date, 'yyyy-MM-dd')
export const relativeDate = (days, base = new Date()) => toISODate(addDays(base, days))
export const formatDate = value => value ? format(parseISO(value), 'dd/MM/yyyy', { locale: vi }) : '—'
export const weekStart = value => toISODate(startOfWeek(typeof value === 'string' ? parseISO(value) : value, { weekStartsOn: 1 }))
export const todayISO = () => toISODate(new Date())
export const enumerateDates = (from, to) => { const out=[]; let d=parseISO(from); const end=parseISO(to); while(d<=end){out.push(toISODate(d));d=addDays(d,1)} return out }
