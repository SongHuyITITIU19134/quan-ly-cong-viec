import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Grid2X2, List, Plus, Search } from 'lucide-react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Header, Page } from '@/app/App'
import { Button, Drawer, EmptyState, LoadingState, Modal } from '@/components/ui'
import NotebookCard from '@/components/notes/NotebookCard'
import NewNotebookRow from '@/components/notes/NewNotebookRow'
import NotebookForm from '@/components/notes/NotebookForm'
import NoteForm from '@/components/notes/NoteForm'
import NoteRow from '@/components/notes/NoteRow'
import TagFilter from '@/components/tags/TagFilter'
import { useData } from '@/hooks/useData'
import { useTransitionNavigate } from '@/hooks/useTransitionNavigate'
import { filterNotes, linkedNoteDraft, normalizeNotebookName, noteCounts, sortNotes } from '@/lib/notes'
import { buildCatalog } from '@/tags/tagUtils'
import { vi } from '@/i18n/vi'
import { NOTE_TITLE_MAX } from '@/lib/limits'
import { buildDeleteOps, buildRestoreOps } from '@/lib/relations'

const viewKey='nhip-viec-notebooks-view'
const sortNotebooks=(items,sort,updates)=>items.map((item,index)=>({item,index})).sort((a,b)=>{if(sort==='pinned'){const pinned=Number(Boolean(b.item.pinned))-Number(Boolean(a.item.pinned));if(pinned)return pinned}if(sort==='title'){const title=a.item.name.localeCompare(b.item.name,'vi',{sensitivity:'base'});if(title)return title}const updated=String(updates[b.item.id]||b.item.updatedAt||b.item.createdAt||'').localeCompare(String(updates[a.item.id]||a.item.updatedAt||a.item.createdAt||''));return updated||a.index-b.index}).map(value=>value.item)
const pinnedFirst=(items,sort)=>{const sorted=sortNotes(items,sort);return[...sorted.filter(item=>item.pinned),...sorted.filter(item=>!item.pinned)]}

export default function Notebooks(){
  const{notebookId}=useParams(),navigate=useTransitionNavigate()
  const{data,loading,batch,update,toast,tagCatalog,tagRegistry}=useData()
  const[params,setParams]=useSearchParams()
  const[view,setView]=useState(()=>{try{return localStorage.getItem(viewKey)==='list'?'list':'grid'}catch{return'grid'}})
  const[overviewQuery,setOverviewQuery]=useState(''),[overviewSort,setOverviewSort]=useState('updated'),[showArchived,setShowArchived]=useState(false)
  const[editingNotebook,setEditingNotebook]=useState(null),[editingNote,setEditingNote]=useState(null),[confirmNotebook,setConfirmNotebook]=useState(null),[confirmNote,setConfirmNote]=useState(null),[moving,setMoving]=useState(null),[moveTarget,setMoveTarget]=useState('')
  const notebook=data.notebooks.find(item=>item.id===notebookId),counts=useMemo(()=>noteCounts(data.notes),[data.notes])
  const notebookUpdates=useMemo(()=>{const result={};for(const item of data.notebooks)result[item.id]=item.updatedAt||item.createdAt||'';for(const note of data.notes)if(note.notebookId&&String(note.updatedAt||note.createdAt||'')>String(result[note.notebookId]||''))result[note.notebookId]=note.updatedAt||note.createdAt;return result},[data.notebooks,data.notes])
  const q=params.get('q')||'',tagValue=params.get('tags')||'',sort=params.get('sort')||'updated',tagFilters=useMemo(()=>tagValue.split(',').filter(Boolean),[tagValue])
  const notebookNotes=useMemo(()=>data.notes.filter(note=>note.notebookId===notebookId),[data.notes,notebookId])
  const noteCatalog=useMemo(()=>buildCatalog(notebookNotes,tagRegistry),[notebookNotes,tagRegistry])
  const editorTagCatalog=useMemo(()=>buildCatalog([...data.tasks,...data.notes],tagRegistry),[data.tasks,data.notes,tagRegistry])
  const visibleNotes=useMemo(()=>pinnedFirst(filterNotes(notebookNotes,{q,tags:tagFilters}),sort),[notebookNotes,q,tagFilters,sort])
  const overviewMatches=useMemo(()=>{const allowed=new Set(data.notebooks.filter(item=>showArchived||!item.archived).map(item=>item.id));return filterNotes(data.notes,{q:overviewQuery}).filter(note=>allowed.has(note.notebookId))},[data.notebooks,data.notes,overviewQuery,showArchived])
  const visibleNotebooks=useMemo(()=>{const query=normalizeNotebookName(overviewQuery),matchingIds=new Set(overviewMatches.map(note=>note.notebookId));return sortNotebooks(data.notebooks.filter(item=>(showArchived||!item.archived)&&(!query||normalizeNotebookName(item.name).includes(query)||matchingIds.has(item.id))),overviewSort,notebookUpdates)},[data.notebooks,notebookUpdates,overviewMatches,overviewQuery,overviewSort,showArchived])
  const archivedCount=data.notebooks.filter(item=>item.archived).length

  useEffect(()=>{try{localStorage.setItem(viewKey,view)}catch{/* Preference is optional. */}},[view])
  useEffect(()=>{const note=data.notes.find(item=>item.id===params.get('note'));if(note&&note.notebookId===notebookId)setEditingNote(note)},[data.notes,notebookId,params])
  useEffect(()=>{const draft=linkedNoteDraft(params,data.notebooks);if(!draft)return;setEditingNote(draft);const next=new URLSearchParams(params);for(const key of ['new','projectId','tripId','contactId'])next.delete(key);setParams(next,{replace:true})},[data.notebooks,params,setParams])
  const changeParam=(key,value)=>{const next=new URLSearchParams(params);value?next.set(key,value):next.delete(key);setParams(next,{replace:true})}
  const closeNote=()=>{setEditingNote(null);const next=new URLSearchParams(params);next.delete('note');setParams(next,{replace:true})}
  const chooseTemplate=template=>setEditingNotebook({name:template.notebookName,color:template.color,pinned:false,archived:false,templateNotes:template.notes})
  const saveNotebook=async form=>{const existing=Boolean(editingNotebook?.id),id=editingNotebook?.id||crypto.randomUUID(),templateNotes=editingNotebook?.templateNotes||[],notebookValue={...form,id};delete notebookValue.templateNotes;const ops=[{type:existing?'update':'create',collection:'notebooks',id,data:notebookValue},...(!existing?templateNotes.map(note=>({type:'create',collection:'notes',id:crypto.randomUUID(),data:{...note,notebookId:id,body:note.body||'',tags:note.tags||[],pinned:false,links:{}}})):[])],saved=await batch(ops);if(!saved)return false;setEditingNotebook(null);toast(existing?vi.notebooks.saved:vi.notebooks.created);return true}
  const saveNote=async form=>{const existing=Boolean(editingNote?.id),id=editingNote?.id||crypto.randomUUID(),saved=await batch([{type:existing?'update':'create',collection:'notes',id,data:{...form,id}}]);if(!saved)return false;closeNote();toast(vi.notebooks.noteSaved);return true}
  const quickAdd=async event=>{if(event.key!=='Enter'||event.nativeEvent.isComposing)return;event.preventDefault();const title=event.currentTarget.value.trim();if(!title)return;const id=crypto.randomUUID(),saved=await batch([{type:'create',collection:'notes',id,data:{id,notebookId,title:Array.from(title).slice(0,NOTE_TITLE_MAX).join(''),body:'',tags:[],pinned:false,links:{}}}]);if(saved){event.currentTarget.value='';toast(vi.notebooks.noteSaved)}}
  const deleteNote=async()=>{const ops=buildDeleteOps('note',confirmNote.id,data),undo=buildRestoreOps(ops,data);if(!await batch(ops))return;setConfirmNote(null);closeNote();toast(vi.notebooks.noteDeleted,{label:vi.action.undo,onClick:()=>batch(undo)})}
  const deleteNotebook=async()=>{const ops=buildDeleteOps('notebook',confirmNotebook.id,data),undo=buildRestoreOps(ops,data);if(!await batch(ops))return;setConfirmNotebook(null);if(notebookId===confirmNotebook.id)navigate('/so-tay');toast(vi.notebooks.deleted,{label:vi.action.undo,onClick:()=>batch(undo)})}
  const moveNote=async()=>{if(!moving||!moveTarget)return;if(await update('notes',moving.id,{notebookId:moveTarget})){setMoving(null);setMoveTarget('');toast(vi.notebooks.noteSaved)}}
  const openNote=note=>{setEditingNote(note);if(notebookId){const next=new URLSearchParams(params);next.set('note',note.id);setParams(next,{replace:true})}}
  const noteRow=note=><NoteRow key={note.id} note={note} tagRegistry={tagRegistry} projects={data.projects} trips={data.trips} contacts={data.contacts} onOpen={()=>openNote(note)} onPin={()=>update('notes',note.id,{pinned:!note.pinned})} onMove={()=>{setMoving(note);setMoveTarget(note.notebookId)}} onDelete={()=>setConfirmNote(note)}/>

  if(loading)return <Page><LoadingState/></Page>
  if(notebookId&&!notebook)return <Page><Header title={vi.notebooks.notFoundTitle} description={vi.notebooks.notFoundDescription}/><EmptyState title={vi.notebooks.notFoundTitle} description={vi.notebooks.notFoundDescription} action={<Button icon={ArrowLeft} onClick={()=>navigate('/so-tay')}>{vi.notebooks.back}</Button>}/></Page>

  return <Page>
    {notebook?<>
      <button type="button" className="notebook-back" onClick={()=>navigate('/so-tay')}><ArrowLeft size={17}/>{vi.notebooks.back}</button>
      <Header title={notebook.name} description={`${vi.notebooks.countLabel(notebookNotes.length)}${notebook.archived?` · ${vi.notebooks.archived}`:''}`} action={<Button icon={Plus} onClick={()=>setEditingNote({notebookId:notebook.id})}>{vi.notebooks.newNote}</Button>}/>
      <div className={`notebook-detail-head label-theme-${Number(notebook.color||0)+1}`}><span className="notebook-color-chip"/>{notebook.pinned&&<span>{vi.notebooks.pinned}</span>}<input aria-label={vi.notebooks.quickAdd} maxLength={NOTE_TITLE_MAX} placeholder={vi.notebooks.quickAddPlaceholder} onKeyDown={quickAdd}/></div>
      <div className="notebook-toolbar"><div className="search"><Search size={18}/><input value={q} onChange={event=>changeParam('q',event.target.value)} aria-label={vi.notebooks.withinSearch} placeholder={vi.notebooks.withinSearchPlaceholder}/></div><TagFilter scope="notes" catalog={noteCatalog} selected={tagFilters} onToggle={key=>changeParam('tags',tagFilters.includes(key)?tagFilters.filter(item=>item!==key).join(','):[...tagFilters,key].join(','))} onClear={()=>changeParam('tags','')} onReplace={keys=>changeParam('tags',keys.join(','))}/><select aria-label={vi.notebooks.sort} value={sort} onChange={event=>changeParam('sort',event.target.value)}><option value="updated">{vi.notebooks.sortUpdated}</option><option value="created">{vi.notebooks.sortCreated}</option><option value="title">{vi.notebooks.sortTitle}</option><option value="pinned">{vi.notebooks.sortPinned}</option></select></div>
      {visibleNotes.length?<div className="notes-list" role="list">{visibleNotes.map(noteRow)}</div>:<EmptyState title={vi.notebooks.emptyNotesTitle} description={vi.notebooks.emptyNotesDescription} action={<Button icon={Plus} onClick={()=>setEditingNote({notebookId:notebook.id})}>{vi.notebooks.newNote}</Button>}/>}</>
    :<>
      <Header title={vi.notebooks.title} description={vi.notebooks.description} action={<Button icon={Plus} onClick={()=>chooseTemplate({notebookName:'',color:0,notes:[]})}>{vi.notebooks.create}</Button>}/>
      <div className="notebooks-search search"><Search size={18}/><input value={overviewQuery} onChange={event=>setOverviewQuery(event.target.value)} aria-label={vi.notebooks.search} placeholder={vi.notebooks.searchPlaceholder}/></div>
      <section className="notebook-section"><h2>{vi.notebooks.startNew}</h2><NewNotebookRow onChoose={chooseTemplate}/></section>
      <section className="notebook-section"><div className="section-row notebook-section-head"><h2>{vi.notebooks.recent}</h2><div className="notebook-controls"><select aria-label={vi.notebooks.sort} value={overviewSort} onChange={event=>setOverviewSort(event.target.value)}><option value="updated">{vi.notebooks.sortUpdated}</option><option value="title">{vi.notebooks.sortTitle}</option><option value="pinned">{vi.notebooks.sortPinned}</option></select><button type="button" aria-label={vi.notebooks.grid} aria-pressed={view==='grid'} onClick={()=>setView('grid')}><Grid2X2 size={18}/></button><button type="button" aria-label={vi.notebooks.list} aria-pressed={view==='list'} onClick={()=>setView('list')}><List size={18}/></button>{archivedCount>0&&<button type="button" className="archive-toggle" aria-pressed={showArchived} onClick={()=>setShowArchived(value=>!value)}>{showArchived?vi.notebooks.hideArchived:`${vi.notebooks.showArchived} (${archivedCount})`}</button>}</div></div>
        {visibleNotebooks.length?<div className={`notebook-grid is-${view}`}>{visibleNotebooks.map(item=><NotebookCard key={item.id} notebook={item} count={counts[item.id]||0} updatedAt={notebookUpdates[item.id]} view={view} onOpen={()=>navigate(`/so-tay/${item.id}`)} onEdit={()=>setEditingNotebook(item)} onPin={()=>update('notebooks',item.id,{pinned:!item.pinned})} onArchive={()=>update('notebooks',item.id,{archived:!item.archived})} onDelete={()=>setConfirmNotebook(item)}/>)}</div>:<EmptyState title={overviewQuery?vi.notebooks.noSearchResults:vi.notebooks.emptyTitle} description={overviewQuery?vi.notebooks.searchPlaceholder:vi.notebooks.emptyDescription} action={!overviewQuery?<Button icon={Plus} onClick={()=>chooseTemplate({notebookName:'',color:0,notes:[]})}>{vi.notebooks.create}</Button>:undefined}/>}</section>
      {overviewQuery&&overviewMatches.length>0&&<section className="notebook-section"><h2>{vi.notebooks.searchResults}</h2><div className="notes-list" role="list">{overviewMatches.map(noteRow)}</div></section>}
    </>}

    {editingNotebook&&<Drawer title={editingNotebook.id?vi.notebooks.edit:vi.notebooks.create} onClose={()=>setEditingNotebook(null)}><NotebookForm notebook={editingNotebook} notebooks={data.notebooks} onSave={saveNotebook} onCancel={()=>setEditingNotebook(null)}/></Drawer>}
    {editingNote&&<Drawer title={editingNote.id?vi.notebooks.edit:vi.notebooks.newNote} onClose={closeNote}><NoteForm note={editingNote} notebooks={data.notebooks} projects={data.projects} trips={data.trips} contacts={data.contacts} tagCatalog={editorTagCatalog.length?editorTagCatalog:tagCatalog} tagRegistry={tagRegistry} onSave={saveNote} onCancel={closeNote}/></Drawer>}
    {confirmNote&&<Modal title={vi.notebooks.deleteNoteTitle} onClose={()=>setConfirmNote(null)} actions={<><Button variant="secondary" onClick={()=>setConfirmNote(null)}>{vi.action.cancel}</Button><Button variant="danger" onClick={deleteNote}>{vi.notebooks.remove}</Button></>}><p>{vi.notebooks.deleteNoteDescription}</p></Modal>}
    {confirmNotebook&&<Modal title={vi.notebooks.deleteTitle} onClose={()=>setConfirmNotebook(null)} actions={<><Button variant="secondary" onClick={()=>setConfirmNotebook(null)}>{vi.action.cancel}</Button><Button variant="danger" onClick={deleteNotebook}>{vi.notebooks.remove}</Button></>}><p>{vi.notebooks.countLabel(counts[confirmNotebook.id]||0)}. {vi.notebooks.deleteDescription}</p></Modal>}
    {moving&&<Modal title={vi.notebooks.move} onClose={()=>setMoving(null)} actions={<><Button variant="secondary" onClick={()=>setMoving(null)}>{vi.action.cancel}</Button><Button onClick={moveNote} disabled={!moveTarget||moveTarget===moving.notebookId}>{vi.notebooks.move}</Button></>}><div className="field"><label htmlFor="move-note-target">{vi.notebooks.movePrompt}</label><select id="move-note-target" value={moveTarget} onChange={event=>setMoveTarget(event.target.value)}>{data.notebooks.filter(item=>!item.archived).map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></div></Modal>}
  </Page>
}
