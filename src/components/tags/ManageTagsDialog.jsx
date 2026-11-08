import { useMemo, useState } from 'react'
import { Check, Merge, Palette, Pencil, Trash2 } from 'lucide-react'
import { Button, IconButton, Modal } from '@/components/ui'
import TagChip from './TagChip'
import { useData } from '@/hooks/useData'
import { buildCatalog, normalizeTag, tagKey, TAG_COLOR_NAMES } from '@/tags/tagUtils'
import { buildTagMutation } from '@/tags/tagMutations'
import { normalizeText } from '@/lib/tasks'
import { TAG_MAX } from '@/lib/limits'

const EMPTY_REGISTRY={c:{}}

export default function ManageTagsDialog({onClose,onMutation=()=>{},scope='all'}){
  const{data,tagRegistry=EMPTY_REGISTRY,manageTags,toast}=useData(),[query,setQuery]=useState(''),[renameKey,setRenameKey]=useState(''),[renameValue,setRenameValue]=useState(''),[paletteKey,setPaletteKey]=useState(''),[confirm,setConfirm]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false)
  const sources=useMemo(()=>[...(scope!=='notes'?data.tasks.map(item=>({...item,collection:'tasks'})):[]),...(scope!=='tasks'?data.notes.map(item=>({...item,collection:'notes'})):[])],[data.notes,data.tasks,scope])
  const scopedCatalog=useMemo(()=>buildCatalog(sources,tagRegistry),[sources,tagRegistry])
  const items=useMemo(()=>scopedCatalog.filter(item=>normalizeText(item.name).includes(normalizeText(query))),[scopedCatalog,query])
  const apply=async(mutation,message)=>{const result=buildTagMutation(sources,tagRegistry,mutation);setBusy(true);const saved=await manageTags(result.updates,result.registry);setBusy(false);if(!saved)return false;toast(message(result));onMutation(mutation,result);setRenameKey('');setPaletteKey('');setConfirm(null);setError('');return true}
  const requestRename=item=>{const name=normalizeTag(renameValue);if(!name)return setError('Hãy nhập tên nhãn.');if(Array.from(name).length>TAG_MAX)return setError(`Nhãn không được vượt quá ${TAG_MAX} ký tự.`);const target=scopedCatalog.find(value=>value.key===tagKey(name)&&value.key!==item.key);if(target){setConfirm({type:'merge',item,name,target});return}apply({type:'rename',key:item.key,name},result=>`Đã đổi tên nhãn trên ${result.count} mục.`)}
  const recolor=(item,color)=>apply({type:'recolor',key:item.key,color},()=>`Đã đổi màu nhãn ${item.name}.`)
  const moveColor=(event,item,index)=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;event.preventDefault();const delta=event.key==='ArrowLeft'||event.key==='ArrowUp'?-1:1,next=(index+delta+12)%12;event.currentTarget.parentElement.querySelectorAll('[role="radio"]')[next]?.focus();recolor(item,next)}
  return <><Modal title="Quản lý nhãn" onClose={onClose} busy={busy} actions={<Button variant="secondary" disabled={busy} onClick={onClose}>Đóng</Button>}>
    <div className="manage-tags"><label className="field"><span>Tìm nhãn</span><input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Tìm trong danh sách nhãn…"/></label>{error&&<p className="field-error" role="alert">{error}</p>}
      <div className="manage-tags-list">{items.map(item=><section className="manage-tag-row" key={item.key}><div className="manage-tag-summary"><TagChip name={item.name} color={item.color}/><span>{item.count} nhiệm vụ · {TAG_COLOR_NAMES[item.color]}</span></div>
        {renameKey===item.key?<div className="manage-tag-rename"><input autoFocus value={renameValue} maxLength={TAG_MAX} aria-label={`Tên mới cho ${item.name}`} onChange={event=>{setRenameValue(event.target.value);setError('')}} onKeyDown={event=>{if(event.key==='Enter')requestRename(item);if(event.key==='Escape')setRenameKey('')}}/><IconButton label={`Lưu tên ${item.name}`} disabled={busy} onClick={()=>requestRename(item)}><Check size={16}/></IconButton></div>:<div className="manage-tag-actions"><IconButton label={`Đổi tên ${item.name}`} disabled={busy} onClick={()=>{setRenameKey(item.key);setRenameValue(item.name);setPaletteKey('');setError('')}}><Pencil size={16}/></IconButton><IconButton label={`Đổi màu ${item.name}`} disabled={busy} onClick={()=>{setPaletteKey(value=>value===item.key?'':item.key);setRenameKey('')}}><Palette size={16}/></IconButton><IconButton label={`Xóa nhãn ${item.name}`} disabled={busy} onClick={()=>setConfirm({type:'delete',item})}><Trash2 size={16}/></IconButton></div>}
        {paletteKey===item.key&&<div className="tag-color-grid" role="radiogroup" aria-label={`Màu nhãn ${item.name}`}>{TAG_COLOR_NAMES.map((name,index)=><button type="button" role="radio" aria-checked={item.color===index} className={`tag-color-option tag-${index}`} key={name} disabled={busy} onKeyDown={event=>moveColor(event,item,index)} onClick={()=>recolor(item,index)}><span aria-hidden="true"/>{name}</button>)}</div>}
      </section>)}</div>{!items.length&&<p className="field-hint">Không có nhãn phù hợp.</p>}
    </div>
  </Modal>{confirm&&<Modal title={confirm.type==='merge'?'Gộp nhãn?':'Xóa nhãn?'} onClose={()=>setConfirm(null)} busy={busy} actions={<><Button variant="secondary" disabled={busy} onClick={()=>setConfirm(null)}>Hủy</Button><Button variant="danger" disabled={busy} icon={confirm.type==='merge'?Merge:Trash2} onClick={()=>confirm.type==='merge'?apply({type:'rename',key:confirm.item.key,name:confirm.name},result=>`Đã gộp ${result.count} nhiệm vụ vào nhãn ${confirm.target.name}.`):apply({type:'delete',key:confirm.item.key},result=>`Đã xóa nhãn khỏi ${result.count} nhiệm vụ.`)}>{confirm.type==='merge'?'Gộp nhãn':'Xóa nhãn'}</Button></>}><p>{confirm.type==='merge'?<>Gộp vào nhãn <strong>{confirm.target.name}</strong>? Màu của nhãn đích sẽ được giữ.</>:<>Xóa nhãn <strong>{confirm.item.name}</strong> khỏi {confirm.item.count} nhiệm vụ?</>}</p></Modal>}</>
}
