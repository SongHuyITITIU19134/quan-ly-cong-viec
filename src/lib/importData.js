import { normalizeTrip } from '@/lib/trips'
import { normalizeTags } from '@/tags/tagUtils'
import { CONTACT_NAME_MAX, CONTACT_NOTES_MAX, CONTACT_ORGANIZATION_MAX, CONTACT_TITLE_MAX, NOTE_BODY_MAX, NOTE_TITLE_MAX, NOTEBOOK_NAME_MAX, PROJECT_NAME_MAX, REMIND_BEFORE_VALUES, REPEAT_INTERVAL_MAX, TASK_DESCRIPTION_MAX, TASK_NOTES_MAX, TASK_SERIES_ID_MAX, TASK_TITLE_MAX, TRIP_LOCATION_MAX, TRIP_NAME_MAX, TRIP_NOTES_MAX, TRIP_PURPOSE_MAX } from '@/lib/limits'

const taskStatuses=['todo','doing','waiting','done','paused'],priorities=['low','medium','high','urgent'],projectStatuses=['running','paused','done','archived']
const compact=value=>Array.isArray(value)?value.map(compact):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).filter(([,item])=>item!==undefined).map(([key,item])=>[key,compact(item)])):value
export const IMPORT_FIELDS={
  tasks:['id','createdAt','updatedAt','completedAt','title','description','projectId','projectName','status','priority','startDate','dueDate','assignerId','assigneeId','collaboratorIds','notes','checklist','progress','progressMode','tripId','tripPhase','order','tags','repeat','remindBefore','seriesId'],
  projects:['id','createdAt','updatedAt','completedAt','name','description','colorIndex','color','status','ownerId','startDate','dueDate','archived'],
  notebooks:['id','createdAt','updatedAt','completedAt','name','color','pinned','archived'],
  notes:['id','createdAt','updatedAt','completedAt','notebookId','title','body','tags','pinned','links'],
  contacts:['id','createdAt','updatedAt','completedAt','fullName','organization','title','phone','email','notes','isSelf'],
  trips:['id','createdAt','updatedAt','completedAt','name','location','startDate','endDate','startSession','endSession','purpose','contactIds','projectId','notes','color','completed'],
}
const schemaItem=(name,item)=>Object.fromEntries(IMPORT_FIELDS[name].filter(key=>Object.hasOwn(item,key)).map(key=>[key,item[key]]))
const textWithin=(value,max,{required=false}={})=>typeof value==='string'&&(!required||value.trim().length>0)&&Array.from(value).length<=max
const validRepeat=value=>value==null||(value&&typeof value==='object'&&!Array.isArray(value)&&['daily','weekly','monthly'].includes(value.freq)&&Number.isInteger(value.interval)&&value.interval>=1&&value.interval<=REPEAT_INTERVAL_MAX&&(!Object.hasOwn(value,'until')||typeof value.until==='string'))

export function normalizeImportDoc(name,item){
  if(!item||typeof item!=='object'||typeof item.id!=='string'||!item.id.trim())return null
  item=schemaItem(name,item)
  if(name==='trips'){if(!textWithin(item.name,TRIP_NAME_MAX,{required:true})||!textWithin(item.location,TRIP_LOCATION_MAX,{required:true})||(item.purpose!==undefined&&!textWithin(item.purpose,TRIP_PURPOSE_MAX))||(item.notes!==undefined&&!textWithin(item.notes,TRIP_NOTES_MAX)))return null;return compact(normalizeTrip(item))}
  if(name==='tasks'){if(!textWithin(item.title,TASK_TITLE_MAX,{required:true})||(item.description!==undefined&&!textWithin(item.description,TASK_DESCRIPTION_MAX))||(item.notes!==undefined&&!textWithin(item.notes,TASK_NOTES_MAX))||(item.seriesId!==undefined&&!textWithin(item.seriesId,TASK_SERIES_ID_MAX))||!validRepeat(item.repeat)||(item.remindBefore!=null&&!REMIND_BEFORE_VALUES.includes(item.remindBefore)))return null;const progress=Number(item.progress),repeat=item.repeat?{freq:item.repeat.freq,interval:item.repeat.interval,...(item.repeat.until?{until:item.repeat.until}:{})}:item.repeat;return compact({...item,title:item.title.trim(),repeat,status:taskStatuses.includes(item.status)?item.status:'todo',priority:priorities.includes(item.priority)?item.priority:'medium',progress:Number.isFinite(progress)?Math.min(100,Math.max(0,progress)):0,tags:normalizeTags(item.tags)})}
  if(name==='projects'){const projectName=typeof item.name==='string'?item.name.trim():'';if(!projectName)return null;const color=Number(item.colorIndex);return compact({...item,name:Array.from(projectName).slice(0,PROJECT_NAME_MAX).join(''),status:projectStatuses.includes(item.status)?item.status:'running',colorIndex:Number.isInteger(color)&&color>=1&&color<=8?color:1})}
  if(name==='notebooks'){const notebookName=typeof item.name==='string'?item.name.trim():'';if(!notebookName)return null;const color=Number(item.color);return compact({...item,name:Array.from(notebookName).slice(0,NOTEBOOK_NAME_MAX).join(''),color:Number.isInteger(color)&&color>=0&&color<=7?color:0,pinned:Boolean(item.pinned),archived:Boolean(item.archived)})}
  if(name==='notes'){const title=typeof item.title==='string'?item.title.trim():'';if(!title||typeof item.notebookId!=='string'||!item.notebookId)return null;return compact({...item,title:Array.from(title).slice(0,NOTE_TITLE_MAX).join(''),body:Array.from(String(item.body||'')).slice(0,NOTE_BODY_MAX).join(''),tags:normalizeTags(item.tags),pinned:Boolean(item.pinned),links:item.links&&typeof item.links==='object'?item.links:{}})}
  if(name==='contacts'){if(!textWithin(item.fullName,CONTACT_NAME_MAX,{required:true})||(item.organization!==undefined&&!textWithin(item.organization,CONTACT_ORGANIZATION_MAX))||(item.title!==undefined&&!textWithin(item.title,CONTACT_TITLE_MAX))||(item.notes!==undefined&&!textWithin(item.notes,CONTACT_NOTES_MAX)))return null;return compact(item)}
  return compact(item)
}
