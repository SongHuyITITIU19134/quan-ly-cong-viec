import { useEffect, useMemo, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { filterPalette, paletteItems } from '@/lib/palette'

export default function CommandPalette({open,data,initialQuery='',onClose,onChoose}){
  const[query,setQuery]=useState(''),[active,setActive]=useState(0),inputRef=useRef(null),items=useMemo(()=>filterPalette(paletteItems(data),query),[data,query])
  useEffect(()=>{if(open){setQuery(initialQuery);setActive(0);requestAnimationFrame(()=>inputRef.current?.focus())}},[initialQuery,open])
  useEffect(()=>{if(active>=items.length)setActive(Math.max(0,items.length-1))},[active,items.length])
  if(!open)return null
  const close=()=>onClose()
  const keys=event=>{if(event.key==='Escape'){event.preventDefault();close()}if(event.key==='ArrowDown'){event.preventDefault();setActive(value=>(value+1)%Math.max(1,items.length))}if(event.key==='ArrowUp'){event.preventDefault();setActive(value=>(value-1+Math.max(1,items.length))%Math.max(1,items.length))}if(event.key==='Enter'&&items[active]){event.preventDefault();onChoose(items[active])}}
  return <div className="palette-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)close()}}><section className="command-palette" role="dialog" aria-modal="true" aria-label="Bảng lệnh"><div className="palette-search"><Search size={18}/><input ref={inputRef} role="combobox" aria-label="Tìm lệnh hoặc dữ liệu" aria-expanded="true" aria-controls="palette-results" aria-autocomplete="list" aria-activedescendant={items[active]?`palette-option-${items[active].id}`:undefined} value={query} onChange={event=>{setQuery(event.target.value);setActive(0)}} onKeyDown={keys} placeholder="Nhập lệnh, nhiệm vụ, dự án…"/></div><div id="palette-results" role="listbox">{items.map((item,index)=><button id={`palette-option-${item.id}`} type="button" role="option" aria-selected={index===active} className={index===active?'is-active':''} key={item.id} onMouseEnter={()=>setActive(index)} onClick={()=>onChoose(item)}><span>{item.label}</span><small>{item.group}</small></button>)}{!items.length&&<p className="muted">Không tìm thấy kết quả.</p>}</div><p className="palette-help">↑↓ chọn · Enter mở · Esc đóng</p></section></div>
}
