import { FolderInput, MoreHorizontal, Pencil, Pin, PinOff, Trash2 } from 'lucide-react'
import { Popover } from '@/components/ui'
import TaskTags from '@/components/tags/TaskTags'
import { formatDate } from '@/lib/dates'
import { snippet } from '@/lib/notes'
import { vi } from '@/i18n/vi'

export default function NoteRow({note,tagRegistry,projects,trips,contacts,onOpen,onPin,onMove,onDelete}){
  const linked=[['projectId',vi.notebooks.relatedProject,projects,'name'],['tripId',vi.notebooks.relatedTrip,trips,'name'],['contactId',vi.notebooks.relatedContact,contacts,'fullName']].flatMap(([key,label,items,field])=>note.links?.[key]?[{key,label,value:items.find(item=>item.id===note.links[key])?.[field]||vi.notebooks.unknownLink}]:[])
  return <article className="note-row" role="listitem" onClick={event=>{if(!event.target.closest('button'))onOpen()}}>
    <div className="note-row-content"><button type="button" className="note-pin" aria-pressed={Boolean(note.pinned)} aria-label={(note.pinned?vi.notebooks.unpinLabel:vi.notebooks.pinLabel)(note.title)} onClick={onPin}>{note.pinned?<Pin size={18}/>:<PinOff size={18}/>}</button>
      <button type="button" className="note-row-main" onClick={onOpen}><strong>{note.title}</strong><p>{snippet(note.body)||vi.notebooks.noBody}</p><TaskTags tags={note.tags} registry={tagRegistry} max={3}/>{linked.length>0&&<span className="note-links">{linked.map(item=><small className="chip" key={item.key}>{item.label}: {item.value}</small>)}</span>}</button>
      <span className="note-updated">{formatDate(note.updatedAt||note.createdAt)}</span></div>
    <div className="note-row-actions"><button type="button" className="note-edit" aria-label={`${vi.notebooks.edit}: ${note.title}`} onClick={onOpen}><Pencil size={16}/><span>{vi.notebooks.edit}</span></button>
      <Popover align="end" className="note-menu" accessibleLabel={vi.notebooks.menuLabel(note.title)} label={<MoreHorizontal size={20}/>}><button role="menuitem" onClick={onOpen}><Pencil size={16}/>{vi.notebooks.edit}</button><button role="menuitem" onClick={onPin}>{note.pinned?<PinOff size={16}/>:<Pin size={16}/>} {note.pinned?vi.notebooks.unpin:vi.notebooks.pin}</button><button role="menuitem" onClick={onMove}><FolderInput size={16}/>{vi.notebooks.move}</button><button role="menuitem" className="text-danger" onClick={onDelete}><Trash2 size={16}/>{vi.notebooks.remove}</button></Popover></div>
  </article>
}
