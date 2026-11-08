import { useCallback, useId, useMemo, useRef, useState } from 'react'
import TagChip from './TagChip'
import { colorFallback, normalizeTag, tagKey } from '@/tags/tagUtils'
import { normalizeText } from '@/lib/tasks'
import { TAG_MAX, TAGS_PER_ITEM } from '@/lib/limits'

const messageFor=(raw,selected)=>{
  const name=normalizeTag(raw)
  if(!name)return''
  if(Array.from(name).length>TAG_MAX)return`Nhãn không được vượt quá ${TAG_MAX} ký tự.`
  if(selected.some(item=>tagKey(item)===tagKey(name)))return`Nhãn “${name}” đã tồn tại.`
  if(selected.length>=TAGS_PER_ITEM)return`Mỗi nhiệm vụ chỉ được có tối đa ${TAGS_PER_ITEM} nhãn.`
  return''
}

const EMPTY_ARR=[]
const EMPTY_REGISTRY={c:{}}

export default function TagInput({value=EMPTY_ARR,onChange,catalog=EMPTY_ARR,registry=EMPTY_REGISTRY,compact=false}){
  const[input,setInput]=useState(''),[open,setOpen]=useState(false),[active,setActive]=useState(0),[armed,setArmed]=useState(-1),[error,setError]=useState(''),[announcement,setAnnouncement]=useState('')
  const rootRef=useRef(null),inputRef=useRef(null),uid=useId(),listId=`${uid}-list`,errorId=`${uid}-error`
  const selected=Array.isArray(value)?value:[],selectedKeys=useMemo(()=>new Set(selected.map(tagKey)),[selected])
  const matching=useMemo(()=>{
    const query=normalizeText(normalizeTag(input)),items=catalog.filter(item=>!selectedKeys.has(item.key))
    if(!query)return items.slice(0,8)
    return items.filter(item=>normalizeText(item.name).includes(query)).sort((a,b)=>{
      const ap=normalizeText(a.name).startsWith(query),bp=normalizeText(b.name).startsWith(query)
      return Number(bp)-Number(ap)||b.count-a.count||String(b.lastUsed).localeCompare(String(a.lastUsed))
    }).slice(0,8)
  },[catalog,input,selectedKeys])
  const typed=normalizeTag(input),typedKey=tagKey(typed),canCreate=Boolean(typed&&Array.from(typed).length<=TAG_MAX&&!selectedKeys.has(typedKey)&&!catalog.some(item=>item.key===typedKey))
  const options=useMemo(()=>[...matching,...(canCreate?[{name:typed,key:typedKey,color:colorFallback(typedKey),create:true}]:[])],[matching,canCreate,typed,typedKey])
  const colorFor=useCallback(name=>registry?.c?.[tagKey(name)]??catalog.find(item=>item.key===tagKey(name))?.color??colorFallback(tagKey(name)),[catalog,registry])
  const focus=useCallback(()=>inputRef.current?.focus({preventScroll:true}),[])
  const remove=useCallback(name=>{onChange(selected.filter(item=>tagKey(item)!==tagKey(name)));setArmed(-1);setError('');setAnnouncement(`Đã xóa nhãn ${name}`);focus()},[focus,onChange,selected])
  const add=useCallback((raw,keepFocus=true)=>{
    const name=normalizeTag(raw),message=messageFor(raw,selected)
    if(message){setError(message);setAnnouncement('');if(keepFocus)focus();return false}
    if(!name){if(keepFocus)focus();return false}
    onChange([...selected,name]);setInput('');setError('');setArmed(-1);setOpen(false);setAnnouncement(`Đã thêm nhãn ${name}`);if(keepFocus)focus();return true
  },[focus,onChange,selected])
  const addMany=useCallback(raw=>{
    const parts=raw.split(/[,;\n]+/u).filter(part=>part.trim()),next=[...selected],errors=[],added=[],rejected=[]
    for(const part of parts){const message=messageFor(part,next),name=normalizeTag(part);if(message){errors.push(message);rejected.push(name);continue}if(name){next.push(name);added.push(name)}}
    if(added.length)onChange(next)
    setInput(rejected.join(', '));setError(errors[0]||'');setAnnouncement(errors.length?'':(added.length?`Đã thêm nhãn ${added.join(', ')}`:''));setOpen(false);setArmed(-1)
    focus()
  },[focus,onChange,selected])
  const choose=useCallback(index=>{const option=options[index];if(option)add(option.name)},[add,options])
  const keyDown=useCallback(event=>{
    if(event.key==='ArrowDown'&&options.length){event.preventDefault();setOpen(true);setActive(index=>Math.min(index+1,options.length-1));return}
    if(event.key==='ArrowUp'&&options.length){event.preventDefault();setOpen(true);setActive(index=>Math.max(index-1,0));return}
    if(event.key==='Escape'){event.preventDefault();setOpen(false);setArmed(-1);return}
    if(event.key==='Enter'&&(event.isComposing||event.nativeEvent?.isComposing||event.keyCode===229))return
    if((event.key==='Enter'||event.key===',')&&(input||open&&options.length)){event.preventDefault();event.stopPropagation();open&&options[active]?choose(active):add(input);focus();return}
    if(event.key==='Backspace'&&!input&&selected.length){event.preventDefault();const last=selected.length-1;if(armed===last)remove(selected[last]);else setArmed(last);return}
    setArmed(-1)
  },[active,add,armed,choose,focus,input,open,options,remove,selected])
  const paste=useCallback(event=>{event.preventDefault();event.stopPropagation();addMany(event.clipboardData.getData('text'));focus()},[addMany,focus])
  const blur=useCallback(event=>{if(rootRef.current?.contains(event.relatedTarget))return;if(input)add(input,false);setOpen(false)},[add,input])
  const inputFocus=useCallback(()=>{setOpen(true);setActive(0)},[])
  const inputChange=useCallback(event=>{setInput(event.target.value);setOpen(true);setActive(0);setError('');setArmed(-1)},[])
  const popular=catalog.filter(item=>!selectedKeys.has(item.key)).slice(0,6)
  return <div ref={rootRef} className={`tag-input-field ${compact?'is-compact':''}`}>
    <label id={`${uid}-label`} htmlFor={`${uid}-input`}>Nhãn</label>
    <div className="tag-combobox-wrap">
      <div className="tag-combobox" onMouseDown={event=>{if(event.target.closest('button'))event.preventDefault();if(event.target===event.currentTarget)focus()}}>
        {(compact?selected.slice(0,1):selected).map((name,index)=><span className={armed===index?'is-armed':''} key={tagKey(name)}><TagChip name={name} color={colorFor(name)} variant="removable" onRemove={()=>remove(name)}/></span>)}
        {compact&&selected.length>1&&<span className="tag-compact-more">+{selected.length-1}</span>}
        <input ref={inputRef} id={`${uid}-input`} role="combobox" aria-labelledby={`${uid}-label`} aria-autocomplete="list" aria-controls={listId} aria-expanded={open&&options.length>0} aria-activedescendant={open&&options[active]?`${uid}-option-${active}`:undefined} aria-describedby={error?errorId:undefined} value={input} onFocus={inputFocus} onChange={inputChange} onKeyDown={keyDown} onPaste={paste} onBlur={blur} placeholder={selected.length?'Thêm…':'Nhập nhãn…'}/>
      </div>
      {open&&options.length>0&&<div id={listId} className="tag-options" role="listbox">{options.map((option,index)=><button type="button" id={`${uid}-option-${index}`} role="option" aria-selected={active===index} className={active===index?'is-active':''} key={`${option.create?'create':'tag'}-${option.key}`} onMouseDown={event=>event.preventDefault()} onClick={()=>choose(index)}>{option.create?<span>Tạo nhãn “{option.name}”</span>:<><TagChip name={option.name} color={option.color}/><small>{option.count} lần</small></>}</button>)}</div>}
    </div>
    {!compact&&(popular.length?<div className="tag-popular" onMouseDown={event=>event.preventDefault()}><small>Hay dùng</small><div>{popular.map(item=><TagChip key={item.key} name={item.name} color={item.color} variant="toggle" pressed={false} onToggle={()=>add(item.name)}/>)}</div></div>:<small className="field-hint">Gõ để tạo nhãn đầu tiên</small>)}
    {error&&<small id={errorId} className="field-error" aria-live="polite">{error}</small>}
    <span className="sr-only" aria-live="polite">{announcement}</span>
  </div>
}
