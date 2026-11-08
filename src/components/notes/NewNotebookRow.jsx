import { Plus } from 'lucide-react'
import { NOTEBOOK_TEMPLATES } from '@/lib/notes'
import { vi } from '@/i18n/vi'

export default function NewNotebookRow({onChoose}){
  return <div className="new-notebook-row" aria-label={vi.notebooks.startNew}>{NOTEBOOK_TEMPLATES.map((template,index)=><button type="button" className={`new-notebook-card label-theme-${template.color+1} ${index===0?'is-blank':''}`} key={template.id} onClick={()=>onChoose(template)}>{index===0?<Plus size={24}/>:<span>{vi.notebooks.template}</span>}<strong>{template.name}</strong></button>)}</div>
}
