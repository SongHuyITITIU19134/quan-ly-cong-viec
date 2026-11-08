import { useEffect, useState } from 'react'
import { Button } from '@/components/ui'
import { PROJECT_COLORS } from '@/lib/projects'
import { validateNotebook } from '@/lib/notes'
import { vi } from '@/i18n/vi'
import { NOTEBOOK_NAME_MAX } from '@/lib/limits'

export default function NotebookForm({notebook={},notebooks,onSave,onCancel,formId='notebook-form'}){
  const[form,setForm]=useState({name:'',color:0,pinned:false,archived:false,...notebook}),[error,setError]=useState(''),[saving,setSaving]=useState(false)
  useEffect(()=>setForm({name:'',color:0,pinned:false,archived:false,...notebook}),[notebook])
  const set=(key,value)=>{setForm(current=>({...current,[key]:value}));setError('')}
  const submit=async event=>{event.preventDefault();const message=validateNotebook(form,notebooks);if(message)return setError(message);setSaving(true);const saved=await onSave({...form,name:form.name.trim().replace(/\s+/gu,' '),color:Number(form.color)});if(!saved){setError(vi.notebooks.saveFailed);setSaving(false)}}
  return <form id={formId} className="form-grid notebook-form" onSubmit={submit} noValidate>
    {error&&<p className="form-error span-2" id={`${formId}-error`} role="alert">{error}</p>}
    <div className="field span-2"><label htmlFor={`${formId}-name`}>{vi.notebooks.formName} *</label><input id={`${formId}-name`} data-autofocus required maxLength={NOTEBOOK_NAME_MAX} aria-describedby={error?`${formId}-error`:undefined} aria-invalid={Boolean(error)} value={form.name} onChange={event=>set('name',event.target.value)}/><small className="field-hint">{form.name.length}/{NOTEBOOK_NAME_MAX}</small></div>
    <fieldset className="field span-2 project-colors"><legend>{vi.notebooks.formColor}</legend><div>{PROJECT_COLORS.map(value=><label key={value} className={`label-theme-${value}`}><input type="radio" name="notebook-color" value={value-1} checked={Number(form.color)===value-1} onChange={()=>set('color',value-1)}/><span aria-hidden="true"/><span className="sr-only">{vi.notebooks.formColor} {value}</span></label>)}</div></fieldset>
    <label className="check-field span-2"><input type="checkbox" checked={form.pinned} onChange={event=>set('pinned',event.target.checked)}/>{vi.notebooks.formPinned}</label>
    <div className="inline-actions span-2"><Button variant="secondary" onClick={onCancel} disabled={saving}>{vi.action.cancel}</Button><Button type="submit" disabled={saving}>{saving?vi.notebooks.saving:vi.notebooks.saveNotebook}</Button></div>
  </form>
}
