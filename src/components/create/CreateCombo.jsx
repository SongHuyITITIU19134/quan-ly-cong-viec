import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button, IconButton, Modal } from '@/components/ui'
import { useData } from '@/hooks/useData'
import { todayISO } from '@/lib/dates'
import { STATUS_KEYS, vi } from '@/i18n/vi'
import TagInput from '@/components/tags/TagInput'
import { PROJECT_NAME_MAX, TASK_TITLE_MAX } from '@/lib/limits'

const newTask=()=>({id:crypto.randomUUID(),title:'',status:'todo',dueDate:todayISO(),assigneeId:'self',tags:[]})
const projectValue=(name,index,id)=>({id,name:name.trim().replace(/\s+/g,' '),description:'',colorIndex:index%8+1,status:'running',ownerId:'',startDate:'',dueDate:'',archived:false})
const taskValue=(row,projectId,order)=>({id:row.id,title:row.title.trim(),description:'',projectId:projectId||null,status:row.status,priority:'medium',startDate:todayISO(),dueDate:row.dueDate,assignerId:'',assigneeId:row.assigneeId||'self',collaboratorIds:[],notes:'',checklist:[],progress:0,progressMode:'auto',tripId:null,tripPhase:null,order,tags:row.tags})

export default function CreateCombo({open,mode='combo',preselectedProjectId='',onClose}){
  const{data,batch,tagCatalog=[],tagRegistry={c:{}},toast}=useData()
  const[step,setStep]=useState(mode==='combo'?1:2)
  const[projectMode,setProjectMode]=useState(mode==='task'||preselectedProjectId?'existing':'new')
  const[selectedProjectId,setSelectedProjectId]=useState(preselectedProjectId)
  const[projectName,setProjectName]=useState('')
  const[search,setSearch]=useState('')
  const[tasks,setTasks]=useState(mode==='project'?[]:[newTask()])
  const[error,setError]=useState('')
  const[saving,setSaving]=useState(false)
  const projects=useMemo(()=>data.projects.filter(project=>project.status!=='archived'&&project.name.toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi'))),[data.projects,search])

  useEffect(()=>{
    if(!open)return
    setStep(mode==='combo'?1:2);setProjectMode(mode==='task'||preselectedProjectId?'existing':'new');setSelectedProjectId(preselectedProjectId);setProjectName('');setSearch('');setTasks(mode==='project'?[]:[newTask()]);setError('');setSaving(false)
  },[open,mode,preselectedProjectId])
  if(!open)return null

  const updateTask=(id,key,value)=>{setTasks(rows=>rows.map(row=>row.id===id?{...row,[key]:value}:row));setError('')}
  const validateProject=()=>{
    if(projectMode==='existing'&&!selectedProjectId)return 'Hãy chọn một dự án.'
    if(projectMode==='new'&&!projectName.trim())return 'Hãy nhập tên dự án.'
    if(Array.from(projectName.trim()).length>PROJECT_NAME_MAX)return `Tên dự án không được vượt quá ${PROJECT_NAME_MAX} ký tự.`
    return ''
  }
  const next=()=>{const message=validateProject();if(message)return setError(message);setError('');setStep(2)}
  const submit=async event=>{
    event.preventDefault()
    const projectError=mode==='task'&&!selectedProjectId?'':validateProject()
    if(projectError)return setError(projectError)
    if(tasks.some(row=>!row.title.trim()))return setError('Tên nhiệm vụ không được để trống.')
    if(tasks.some(row=>Array.from(row.title.trim()).length>TASK_TITLE_MAX))return setError(`Tên nhiệm vụ không được vượt quá ${TASK_TITLE_MAX} ký tự.`)
    if(!tasks.length&&projectMode==='existing')return setError('Hãy thêm ít nhất một nhiệm vụ.')
    setSaving(true)
    const creatingProject=projectMode==='new'&&mode!=='task'
    const projectId=creatingProject?crypto.randomUUID():selectedProjectId||null
    const project=creatingProject?projectValue(projectName,data.projects.length,projectId):null
    const taskItems=tasks.map((row,index)=>taskValue(row,projectId,data.tasks.length+index+1))
    const ops=[...(project?[{type:'create',collection:'projects',id:project.id,data:project}]:[]),...taskItems.map(item=>({type:'create',collection:'tasks',id:item.id,data:item}))]
    const ok=Boolean(await batch(ops))
    setSaving(false)
    if(!ok)return
    toast(project&&taskItems.length?`Đã tạo dự án và ${taskItems.length} nhiệm vụ.`:project?'Đã tạo dự án.':`Đã tạo ${taskItems.length} nhiệm vụ.`)
    onClose()
  }

  const projectStep=<div className="create-project-step">
    <div className="segmented" role="group" aria-label="Nguồn dự án"><button type="button" className={projectMode==='new'?'active':''} onClick={()=>setProjectMode('new')}>Dự án mới</button><button type="button" className={projectMode==='existing'?'active':''} onClick={()=>setProjectMode('existing')}>Dự án có sẵn</button></div>
    {projectMode==='new'?<div className="field"><label htmlFor="combo-project-name">Tên dự án *</label><input id="combo-project-name" data-autofocus maxLength={PROJECT_NAME_MAX} value={projectName} onChange={event=>{setProjectName(event.target.value);setError('')}}/><small className="field-hint">{projectName.length}/{PROJECT_NAME_MAX}</small></div>:<><div className="field"><label htmlFor="combo-project-search">Tìm dự án</label><input id="combo-project-search" data-autofocus type="search" value={search} onChange={event=>setSearch(event.target.value)} placeholder="Nhập tên dự án…"/></div><div className="create-project-list" role="radiogroup" aria-label="Chọn dự án">{projects.map(project=><label key={project.id}><input type="radio" name="combo-project" checked={selectedProjectId===project.id} onChange={()=>{setSelectedProjectId(project.id);setError('')}}/><span title={project.name}>{project.name}</span></label>)}</div></>}
  </div>
  return <Modal title={mode==='project'?'Tạo dự án':mode==='task'?'Tạo nhiệm vụ':'Tạo dự án + nhiệm vụ'} onClose={onClose} busy={saving} actions={<><Button variant="secondary" onClick={onClose} disabled={saving}>Hủy</Button>{step===1?<Button onClick={next}>Tiếp tục</Button>:<Button type="submit" form="create-combo-form" disabled={saving}>{saving?'Đang lưu…':'Tạo'}</Button>}</>}>
    <form id="create-combo-form" className="create-combo" onSubmit={submit} noValidate>
      {mode==='combo'&&<ol className="create-steps" aria-label="Các bước"><li className={step===1?'active':''}>1. Dự án</li><li className={step===2?'active':''}>2. Nhiệm vụ</li></ol>}
      {(step===1||mode==='project')&&projectStep}
      {step===2&&mode!=='project'&&<>
        {mode==='task'&&<div className="field"><label htmlFor="combo-task-project">Dự án cho nhiệm vụ</label><select id="combo-task-project" aria-label="Dự án cho nhiệm vụ" value={selectedProjectId} onChange={event=>setSelectedProjectId(event.target.value)}><option value="">Không thuộc dự án</option>{data.projects.filter(project=>project.status!=='archived').map(project=><option key={project.id} value={project.id}>{project.name}</option>)}</select></div>}
        <div className="create-task-list">{tasks.map((row,index)=><fieldset className="create-task-row" key={row.id}><legend>Nhiệm vụ {index+1}</legend><div className="field create-task-title"><label htmlFor={`combo-title-${row.id}`}>Tên nhiệm vụ *</label><input id={`combo-title-${row.id}`} maxLength={TASK_TITLE_MAX} value={row.title} onChange={event=>updateTask(row.id,'title',event.target.value)}/><small>{row.title.length}/{TASK_TITLE_MAX}</small></div><div className="field"><label htmlFor={`combo-status-${row.id}`}>Trạng thái</label><select id={`combo-status-${row.id}`} value={row.status} onChange={event=>updateTask(row.id,'status',event.target.value)}>{STATUS_KEYS.map(key=><option value={key} key={key}>{vi.status[key]}</option>)}</select></div><div className="field"><label htmlFor={`combo-due-${row.id}`}>Hạn</label><input id={`combo-due-${row.id}`} type="date" value={row.dueDate} onChange={event=>updateTask(row.id,'dueDate',event.target.value)}/></div>{data.contacts.length>0&&<div className="field"><label htmlFor={`combo-assignee-${row.id}`}>Phụ trách</label><select id={`combo-assignee-${row.id}`} value={row.assigneeId} onChange={event=>updateTask(row.id,'assigneeId',event.target.value)}>{data.contacts.map(contact=><option value={contact.id} key={contact.id}>{contact.fullName}</option>)}</select></div>}<div className="create-task-tags"><TagInput compact value={row.tags} onChange={value=>updateTask(row.id,'tags',value)} catalog={tagCatalog} registry={tagRegistry}/></div><IconButton label={`Xóa nhiệm vụ ${index+1}`} onClick={()=>setTasks(rows=>rows.filter(item=>item.id!==row.id))}><Trash2 size={17}/></IconButton></fieldset>)}</div>
        <Button variant="secondary" icon={Plus} onClick={()=>setTasks(rows=>[...rows,newTask()])}>Thêm nhiệm vụ</Button>
        {mode==='combo'&&<button type="button" className="create-back" onClick={()=>setStep(1)}>← Quay lại dự án</button>}
      </>}
      {error&&<p className="field-error" role="alert">{error}</p>}
    </form>
  </Modal>
}
