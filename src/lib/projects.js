import { vi } from '@/i18n/vi'
import { PROJECT_NAME_MAX } from '@/lib/limits'

export const PROJECT_STATUSES=['running','paused','done','archived']
// UI options include the derived value; persisted statuses/migration stay unchanged.
export const PROJECT_EFFECTIVE_STATUSES=['running','paused','waiting','done','archived']
export const PROJECT_COLORS=Array.from({length:8},(_,index)=>index+1)
export const PROJECT_STATUS_LABELS={running:vi.projects.running,paused:vi.status.paused,waiting:vi.status.waiting,done:vi.status.done,archived:vi.projects.archived}

export const normalizeProjectName=value=>(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ').toLocaleLowerCase('vi')
const stableId=value=>`project-${encodeURIComponent(value.trim())}`

export function validateProject(project,projects=[]){
 const name=(project.name||'').trim().replace(/\s+/g,' ')
 if(!name)return 'Vui lòng nhập tên dự án.'
 if(Array.from(name).length>PROJECT_NAME_MAX)return `Tên dự án không được vượt quá ${PROJECT_NAME_MAX} ký tự.`
 if(project.startDate&&project.dueDate&&project.dueDate<project.startDate)return 'Hạn dự án không được trước ngày bắt đầu.'
 if(projects.some(item=>item.id!==project.id&&normalizeProjectName(item.name)===normalizeProjectName(name)))return 'Tên dự án đã tồn tại.'
 return ''
}

export function migrateData(input,now=new Date().toISOString()){
 const source=input&&typeof input==='object'?input:{},tasks=Array.isArray(source.tasks)?source.tasks:[],originals=Array.isArray(source.projects)?source.projects:[]
 const unique=new Map()
 for(const item of originals){const project=typeof item==='string'?{id:stableId(item),name:item.trim()}:item;if(!unique.has(project.id))unique.set(project.id,project)}
 const knownNames=new Map([...unique.values()].map(item=>[normalizeProjectName(item.name),item.id]))
 for(const task of tasks)if(task.projectName&&!knownNames.has(normalizeProjectName(task.projectName)))knownNames.set(normalizeProjectName(task.projectName),null)
 const extra=[...knownNames].filter(([name,id])=>name&&!id).map(([name],index)=>({id:stableId(name),name:tasks.find(task=>normalizeProjectName(task.projectName)===name)?.projectName||name,colorIndex:index%8+1}))
 const projects=[...unique.values(),...extra].filter((item,index,items)=>items.findIndex(project=>project.id===item.id)===index).map((item,index)=>{
  const status=PROJECT_STATUSES.includes(item.status)?item.status:item.archived?'archived':'running',legacyColor=typeof item.color==='number'?item.color:null,colorIndex=PROJECT_COLORS.includes(item.colorIndex)?item.colorIndex:PROJECT_COLORS.includes(legacyColor)?legacyColor:index%8+1
  return {...item,name:item.name??'Dự án chưa đặt tên',description:item.description||'',colorIndex,status,ownerId:item.ownerId||'',startDate:item.startDate||'',dueDate:item.dueDate||'',archived:status==='archived',createdAt:item.createdAt||now,updatedAt:item.updatedAt||item.createdAt||now}
 })
 const byName=new Map(projects.map(project=>[normalizeProjectName(project.name),project.id]))
 return {...source,projects,tasks:tasks.map(task=>task.projectId||!task.projectName?task:{...task,projectId:byName.get(normalizeProjectName(task.projectName))||null})}
}

export function projectDeleteOps(projectId,tasks,targetProjectId=null){return tasks.filter(task=>task.projectId===projectId).map(task=>({type:'update',collection:'tasks',id:task.id,data:{projectId:targetProjectId||null}}))}
