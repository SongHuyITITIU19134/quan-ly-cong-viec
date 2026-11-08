import { Archive, MoreHorizontal, Pencil, Pin, PinOff, RotateCcw, Trash2 } from 'lucide-react'
import { Popover } from '@/components/ui'
import { formatDate } from '@/lib/dates'
import { vi } from '@/i18n/vi'

export default function NotebookCard({notebook,count=0,updatedAt,onOpen,onEdit,onPin,onArchive,onDelete,view='grid'}){
  const updated=updatedAt||notebook.updatedAt||notebook.createdAt
  return <article className={`notebook-card label-theme-${Number(notebook.color||0)+1} is-${view} ${notebook.archived?'is-archived':''}`} onClick={event=>{if(!event.target.closest('button'))onOpen()}}>
    <div className="notebook-card-actions">{notebook.pinned&&<span className="notebook-state"><Pin size={15}/>{vi.notebooks.pinned}</span>}{notebook.archived&&<span className="notebook-state"><Archive size={15}/>{vi.notebooks.archived}</span>}<Popover align="end" className="notebook-menu" accessibleLabel={vi.notebooks.menuLabel(notebook.name)} label={<MoreHorizontal size={20}/>}><button role="menuitem" onClick={onOpen}>{vi.notebooks.open}</button><button role="menuitem" onClick={onEdit}><Pencil size={16}/>{vi.notebooks.edit}</button><button role="menuitem" onClick={onPin}>{notebook.pinned?<PinOff size={16}/>:<Pin size={16}/>} {notebook.pinned?vi.notebooks.unpin:vi.notebooks.pin}</button><button role="menuitem" onClick={onArchive}>{notebook.archived?<RotateCcw size={16}/>:<Archive size={16}/>} {notebook.archived?vi.notebooks.restore:vi.notebooks.archive}</button><button role="menuitem" className="text-danger" onClick={onDelete}><Trash2 size={16}/>{vi.notebooks.remove}</button></Popover></div>
    <button type="button" className="notebook-card-open" onClick={onOpen}><strong>{notebook.name}</strong><span><small>{vi.notebooks.countLabel(count)}</small><small>{vi.notebooks.updated} {formatDate(updated)}</small></span></button>
  </article>
}
