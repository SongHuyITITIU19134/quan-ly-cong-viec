import { useEffect, useState } from 'react'
import { Clock3 } from 'lucide-react'
import { PROJECT_COLORS, PROJECT_EFFECTIVE_STATUSES, PROJECT_STATUS_LABELS, validateProject } from '@/lib/projects'
import { getProjectEffectiveStatus, isProjectFullyDone } from '@/lib/projectStatus'
import { vi } from '@/i18n/vi'
import { PROJECT_NAME_MAX } from '@/lib/limits'

const empty={name:'',description:'',colorIndex:1,status:'running',ownerId:'',startDate:'',dueDate:'',archived:false}

export default function ProjectForm({project,projects,contacts,tasks,loading=false,onSave,formId='project-form'}){
 const[form,setForm]=useState({...empty,...project}),[error,setError]=useState('')
 useEffect(()=>setForm({...empty,...project}),[project])
 const set=(key,value)=>setForm(current=>({...current,[key]:value}))
 const status=getProjectEffectiveStatus(form,tasks,{loading}),fullyDone=isProjectFullyDone(form,tasks,{loading}),autoDerived=status==='waiting'&&form.status!=='waiting'
 const options=PROJECT_EFFECTIVE_STATUSES.filter(value=>fullyDone?!['running','paused'].includes(value):value!=='waiting'||value===status)
 const canDeriveWaiting=getProjectEffectiveStatus({...empty,...project},tasks,{loading})==='waiting'
 const submit=async event=>{
  event.preventDefault()
  const message=validateProject(form,projects)
  if(message)return setError(message)
  setError('')
  const value={...form,name:form.name.trim().replace(/\s+/g,' '),colorIndex:Number(form.colorIndex),archived:form.status==='archived'}
  // A metadata save must not store waiting or write a hidden background status.
  if(autoDerived){delete value.status;delete value.archived}
  await onSave(value)
 }
 return <form id={formId} className="form-grid project-form" onSubmit={submit}>
  {error&&<p className="form-error span-2" role="alert">{error}</p>}
  <div className="field span-2"><label htmlFor={`${formId}-name`}>{vi.generated.ProjectForm_29_0}</label><input id={`${formId}-name`} data-autofocus maxLength={PROJECT_NAME_MAX} value={form.name} onChange={event=>set('name',event.target.value)} required/><small className={form.name.length>=PROJECT_NAME_MAX-10?'text-danger':''}>{form.name.length}/{PROJECT_NAME_MAX}</small></div>
  <div className="field span-2"><label htmlFor={`${formId}-description`}>{vi.generated.ProjectForm_30_1}</label><textarea id={`${formId}-description`} rows="3" value={form.description} onChange={event=>set('description',event.target.value)}/></div>
  <fieldset className="field span-2 project-colors"><legend>{vi.generated.ProjectForm_31_2}</legend><div>{PROJECT_COLORS.map(color=><label key={color} className={`label-theme-${color}`}><input type="radio" name="project-color" value={color} checked={Number(form.colorIndex)===color} onChange={()=>set('colorIndex',color)}/><span aria-hidden="true"/><span className="sr-only">{vi.generated.ProjectForm_31_3}{color}</span></label>)}</div></fieldset>
  <div className="field"><label htmlFor={`${formId}-status`}>{vi.generated.ProjectForm_32_4}</label><select id={`${formId}-status`} value={status} aria-describedby={autoDerived?`${formId}-auto-status`:undefined} style={status==='waiting'?{color:'var(--waiting)',background:'var(--waiting-bg)'}:undefined} onChange={event=>set('status',event.target.value==='waiting'?project.status:event.target.value)}>{options.map(value=><option key={value} value={value} disabled={value==='waiting'&&!canDeriveWaiting}>{PROJECT_STATUS_LABELS[value]}</option>)}</select></div>
  {autoDerived&&<p className="span-2" id={`${formId}-auto-status`} role="note"><Clock3 size={16} aria-hidden="true"/> {vi.projects.autoWaiting}<br/>{vi.projects.derivedSaveHint}</p>}
  <div className="field"><label htmlFor={`${formId}-owner`}>{vi.generated.ProjectForm_34_5}</label><select id={`${formId}-owner`} value={form.ownerId} onChange={event=>set('ownerId',event.target.value)}><option value="">{vi.generated.ProjectForm_34_6}</option>{contacts.map(contact=><option key={contact.id} value={contact.id}>{contact.fullName}</option>)}</select></div>
  <div className="field"><label htmlFor={`${formId}-start`}>{vi.generated.ProjectForm_35_7}</label><input id={`${formId}-start`} type="date" value={form.startDate} onChange={event=>set('startDate',event.target.value)}/></div>
  <div className="field"><label htmlFor={`${formId}-due`}>{vi.generated.ProjectForm_36_8}</label><input id={`${formId}-due`} type="date" value={form.dueDate} onChange={event=>set('dueDate',event.target.value)}/></div>
 </form>
}
