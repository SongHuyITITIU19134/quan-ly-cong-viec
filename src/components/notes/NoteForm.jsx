import { useEffect, useState } from 'react'
import { Button } from '@/components/ui'
import TagInput from '@/components/tags/TagInput'
import { vi } from '@/i18n/vi'
import { NOTE_BODY_MAX, NOTE_TITLE_MAX } from '@/lib/limits'

export default function NoteForm({note={},notebooks,projects,trips,contacts,tagCatalog,tagRegistry,onSave,onCancel,formId='note-form'}){
  const[form,setForm]=useState({title:'',body:'',tags:[],notebookId:notebooks[0]?.id||'',pinned:false,links:{},...note}),[error,setError]=useState(''),[saving,setSaving]=useState(false)
  useEffect(()=>setForm({title:'',body:'',tags:[],notebookId:notebooks[0]?.id||'',pinned:false,links:{},...note}),[note,notebooks])
  const set=(key,value)=>{setForm(current=>({...current,[key]:value}));setError('')}
  const link=(key,value)=>set('links',{...(form.links||{}),[key]:value||undefined})
  const submit=async event=>{event.preventDefault();const title=form.title.trim();if(!title)return setError(vi.notebooks.titleRequired);if(Array.from(title).length>NOTE_TITLE_MAX)return setError(vi.notebooks.titleTooLong);if(Array.from(form.body||'').length>NOTE_BODY_MAX)return setError(vi.notebooks.bodyTooLong);setSaving(true);const links=Object.fromEntries(Object.entries(form.links||{}).filter(([,value])=>Boolean(value))),saved=await onSave({...form,title,body:form.body||'',links});if(!saved){setError(vi.notebooks.saveNoteFailed);setSaving(false)}}
  return <form id={formId} className="form-grid note-form" onSubmit={submit} noValidate>
    {error&&<p className="form-error span-2" id={`${formId}-error`} role="alert">{error}</p>}
    <div className="field span-2"><label htmlFor={`${formId}-title`}>{vi.notebooks.noteTitle} *</label><input id={`${formId}-title`} data-autofocus required maxLength={NOTE_TITLE_MAX} aria-describedby={error?`${formId}-error`:undefined} aria-invalid={Boolean(error)} value={form.title} onChange={event=>set('title',event.target.value)}/><small className="field-hint">{form.title.length}/{NOTE_TITLE_MAX}</small></div>
    <div className="field span-2"><label htmlFor={`${formId}-body`}>{vi.notebooks.noteBody}</label><textarea id={`${formId}-body`} rows="10" maxLength={NOTE_BODY_MAX} value={form.body} onChange={event=>set('body',event.target.value)}/><small className="field-hint">{form.body.length}/{NOTE_BODY_MAX}</small></div>
    <div className="span-2"><TagInput value={form.tags} onChange={value=>set('tags',value)} catalog={tagCatalog} registry={tagRegistry}/></div>
    <div className="field span-2"><label htmlFor={`${formId}-notebook`}>{vi.notebooks.noteNotebook}</label><select id={`${formId}-notebook`} value={form.notebookId} onChange={event=>set('notebookId',event.target.value)}>{notebooks.filter(item=>!item.archived||item.id===form.notebookId).map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
    <fieldset className="form-section span-2"><legend className="sr-only">{vi.notebooks.noteLinks}</legend><div className="form-grid note-link-fields"><div className="field"><label htmlFor={`${formId}-project`}>{vi.notebooks.linkProject}</label><select id={`${formId}-project`} value={form.links?.projectId||''} onChange={event=>link('projectId',event.target.value)}><option value="">{vi.notebooks.none}</option>{projects.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></div><div className="field"><label htmlFor={`${formId}-trip`}>{vi.notebooks.linkTrip}</label><select id={`${formId}-trip`} value={form.links?.tripId||''} onChange={event=>link('tripId',event.target.value)}><option value="">{vi.notebooks.none}</option>{trips.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></div><div className="field span-2"><label htmlFor={`${formId}-contact`}>{vi.notebooks.linkContact}</label><select id={`${formId}-contact`} value={form.links?.contactId||''} onChange={event=>link('contactId',event.target.value)}><option value="">{vi.notebooks.none}</option>{contacts.map(item=><option key={item.id} value={item.id}>{item.fullName}</option>)}</select></div></div></fieldset>
    <label className="check-field span-2"><input type="checkbox" checked={form.pinned} onChange={event=>set('pinned',event.target.checked)}/>{vi.notebooks.notePinned}</label>
    <div className="inline-actions span-2"><Button variant="secondary" onClick={onCancel} disabled={saving}>{vi.action.cancel}</Button><Button type="submit" disabled={saving}>{saving?vi.notebooks.saving:vi.notebooks.saveNote}</Button></div>
  </form>
}
