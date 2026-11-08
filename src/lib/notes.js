import { normalizeTags, tagKey } from '@/tags/tagUtils'
import { NOTEBOOK_NAME_MAX, NOTE_SNIPPET_MAX } from '@/lib/limits'

const searchable=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('vi').trim().replace(/\s+/gu,' ')

export const normalizeNotebookName=value=>searchable(value)

export function isNotebookNameUnique(name,notebooks=[],ignoreId=''){
  const key=normalizeNotebookName(name)
  return Boolean(key)&&!notebooks.some(notebook=>notebook.id!==ignoreId&&normalizeNotebookName(notebook.name)===key)
}

export function validateNotebook(notebook,notebooks=[]){
  const name=String(notebook?.name??'').trim().replace(/\s+/gu,' ')
  if(!name)return'Vui lòng nhập tên sổ.'
  if(Array.from(name).length>NOTEBOOK_NAME_MAX)return`Tên sổ không được vượt quá ${NOTEBOOK_NAME_MAX} ký tự.`
  if(!isNotebookNameUnique(name,notebooks,notebook?.id))return'Tên sổ đã tồn tại.'
  return''
}

export function filterNotes(notes=[],{q='',tags=[]}={}){
  const query=searchable(q),wanted=(tags||[]).map(tagKey)
  return notes.filter(note=>{
    const matchesQuery=!query||[note.title,note.body,...normalizeTags(note.tags)].some(value=>searchable(value).includes(query))
    const matchesTags=!wanted.length||normalizeTags(note.tags).some(tag=>wanted.includes(tagKey(tag)))
    return matchesQuery&&matchesTags
  })
}

export function sortNotes(notes=[],sort='updated'){
  const indexed=notes.map((note,index)=>({note,index}))
  indexed.sort((a,b)=>{
    if(sort==='pinned'){const pin=Number(Boolean(b.note.pinned))-Number(Boolean(a.note.pinned));if(pin)return pin}
    if(sort==='title'){const title=String(a.note.title).localeCompare(String(b.note.title),'vi',{sensitivity:'base'});if(title)return title}
    if(sort==='created'){const created=String(b.note.createdAt||'').localeCompare(String(a.note.createdAt||''));if(created)return created}
    if(sort==='updated'||sort==='pinned'){const updated=String(b.note.updatedAt||'').localeCompare(String(a.note.updatedAt||''));if(updated)return updated}
    return a.index-b.index
  })
  return indexed.map(item=>item.note)
}

export function noteCounts(notes=[]){
  return notes.reduce((counts,note)=>({...counts,[note.notebookId]:(counts[note.notebookId]||0)+1}),{})
}

export function linkedNoteDraft(params,notebooks=[]){
  if(params.get('new')!=='note')return null
  const notebook=notebooks.find(item=>!item.archived)||notebooks[0]
  if(!notebook)return null
  const links={}
  for(const key of ['projectId','tripId','contactId'])if(params.get(key))links[key]=params.get(key)
  return{notebookId:notebook.id,links}
}

export function snippet(body,max=NOTE_SNIPPET_MAX){
  const value=String(body??'').trim().replace(/\s+/gu,' ')
  if(Array.from(value).length<=max)return value
  return `${Array.from(value).slice(0,Math.max(0,max-1)).join('').trimEnd()}…`
}

export const NOTEBOOK_TEMPLATES=[
  {id:'blank',name:'Trống',notebookName:'Sổ mới',color:0,notes:[]},
  {id:'meeting',name:'Họp',notebookName:'Ghi chép cuộc họp',color:1,notes:[{title:'Nội dung cuộc họp',body:'Thời gian:\nThành phần:\nNội dung:',tags:['Họp']},{title:'Việc cần làm',body:'',tags:['Cần làm']}]},
  {id:'idea',name:'Ý tưởng',notebookName:'Ý tưởng mới',color:2,notes:[{title:'Ý tưởng đầu tiên',body:'Vấn đề:\nGiải pháp:\nBước tiếp theo:',tags:['Ý tưởng']}]},
  {id:'trip',name:'Công tác',notebookName:'Sổ công tác',color:3,notes:[{title:'Lịch trình',body:'Điểm đến:\nThời gian:\nNội dung:',tags:['Công tác']},{title:'Chuẩn bị',body:'',tags:['Cần làm']}]},
  {id:'remember',name:'Cần nhớ',notebookName:'Những điều cần nhớ',color:4,notes:[{title:'Ghi nhớ',body:'',tags:['Cần nhớ']}]},
]
