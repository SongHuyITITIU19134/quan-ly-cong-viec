import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertCircle, ArrowDown, CheckCircle2, Circle, CircleDotDashed, Inbox, PauseCircle, Timer, TriangleAlert, X } from 'lucide-react'
import { vi } from '@/i18n/vi'

const statusIcons={todo:Circle,doing:CircleDotDashed,waiting:Timer,done:CheckCircle2,paused:PauseCircle}
const priorityIcons={urgent:TriangleAlert,high:TriangleAlert,medium:Timer,low:ArrowDown}

export function Button({ children, variant = '', icon: Icon, type = 'button', ...props }) { return <button type={type} className={`button ${variant}`.trim()} {...props}>{Icon && <Icon size={17} aria-hidden="true"/>}<span>{children}</span></button> }
export function IconButton({ label, children, ...props }) { return <button type="button" className="icon-button" aria-label={label} title={label} {...props}>{children}</button> }
export function Card({ children, className = '', ...props }) { return <section className={`card ${className}`} {...props}>{children}</section> }
export function Badge({ children, kind = '', icon: Icon }) { return <span className={`badge ${kind}`.trim()}>{Icon&&<span className="badge-marker" aria-hidden="true"><Icon size={15}/></span>}{children}</span> }
export function StatusBadge({ value }) { const Icon=statusIcons[value]||Circle;return <Badge kind={`status-${value}`} icon={Icon}>{vi.status[value]}</Badge> }
export function PriorityBadge({ value }) { const Icon=priorityIcons[value]||Circle;return <Badge kind={`priority-${value}`} icon={Icon}>{vi.priority[value]}</Badge> }
export function ProgressBar({ value = 0, label = true }) { const safe=Math.min(100,Math.max(0,value));return <div className="progress-wrap" role="progressbar" aria-label={`${vi.common.progress}: ${safe}%`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={safe}>{label&&<div className="progress-label"><span>{vi.common.progress}</span><strong>{safe}%</strong></div>}<div className="progress"><span style={{'--progress-scale':safe/100}} /></div></div> }
export function EmptyState({ title = vi.common.empty, description = vi.generated.index_16_0, action }) { return <div className="empty"><div><span className="empty-icon"><Inbox size={30}/></span><h3>{title}</h3><p>{description}</p>{action}</div></div> }
export function LoadingState() { return <div className="empty" role="status" aria-busy="true"><div className="loading-stack"><span className="sr-only">{vi.common.loading}</span><span className="skeleton"/><span className="skeleton"/><span className="skeleton"/></div></div> }
export function ErrorState({ retry }) { return <div className="empty" role="alert"><div><span className="empty-icon"><AlertCircle size={30}/></span><h3>{vi.common.error}</h3><Button onClick={retry}>{vi.action.retry}</Button></div></div> }

export function Popover({label,accessibleLabel,children,className='',panelClassName='',align='start',role='menu'}) {
  const[open,setOpen]=useState(false)
  const[position,setPosition]=useState({top:0,left:0,maxHeight:320})
  const anchorRef=useRef(null),panelRef=useRef(null),id=useId()
  const close=useCallback((restore=true)=>{setOpen(false);if(restore)requestAnimationFrame(()=>anchorRef.current?.focus())},[])
  const place=useCallback(()=>{
    const anchor=anchorRef.current?.getBoundingClientRect(),panel=panelRef.current?.getBoundingClientRect()
    if(!anchor||!panel)return
    const gap=8,pad=10,spaceBelow=innerHeight-anchor.bottom-gap,spaceAbove=anchor.top-gap
    const useAbove=spaceBelow<Math.min(panel.height,240)&&spaceAbove>spaceBelow
    const top=useAbove?Math.max(pad,anchor.top-panel.height-gap):Math.min(innerHeight-panel.height-pad,anchor.bottom+gap)
    const preferred=align==='end'?anchor.right-panel.width:anchor.left
    setPosition({top:Math.max(pad,top),left:Math.min(innerWidth-panel.width-pad,Math.max(pad,preferred)),maxHeight:Math.max(120,(useAbove?spaceAbove:spaceBelow)-pad)})
  },[align])
  useLayoutEffect(()=>{if(open){place();requestAnimationFrame(()=>panelRef.current?.querySelector('button,input,[href],[tabindex]:not([tabindex="-1"])')?.focus())}},[open,place])
  useEffect(()=>{
    if(!open)return undefined
    const onPointer=event=>{if(!panelRef.current?.contains(event.target)&&!anchorRef.current?.contains(event.target))close(false)}
    const onKey=event=>{if(event.key==='Escape'){event.preventDefault();close()} }
    const onMove=()=>place()
    document.addEventListener('pointerdown',onPointer,true);document.addEventListener('keydown',onKey)
    window.addEventListener('resize',onMove);document.addEventListener('scroll',onMove,true)
    return()=>{document.removeEventListener('pointerdown',onPointer,true);document.removeEventListener('keydown',onKey);window.removeEventListener('resize',onMove);document.removeEventListener('scroll',onMove,true)}
  },[open,close,place])
  return <span className={`popover-anchor ${className}`.trim()}>
    <button ref={anchorRef} type="button" className="popover-trigger" aria-label={accessibleLabel} aria-expanded={open} aria-controls={open?id:undefined} aria-haspopup={role==='menu'?'menu':'dialog'} onClick={()=>setOpen(value=>!value)}>{label}</button>
    {open&&createPortal(<div ref={panelRef} id={id} className={`popover-panel ${panelClassName}`.trim()} style={position} role={role} onClick={event=>{if(event.target.closest('[role="menuitem"]'))close()}}>{children}</div>,document.body)}
  </span>
}

export function Modal({ title, children, onClose, actions, busy=false }) {
  const dialogRef=useRef(null),titleId=useId(),previousFocus=useRef(null),closeRef=useRef(onClose),busyRef=useRef(busy)
  closeRef.current=onClose;busyRef.current=busy
  useEffect(()=>{
    previousFocus.current=document.activeElement
    const dialog=dialogRef.current
    const previousOverflow=document.body.style.overflow
    const focusables=()=>[...dialog.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[href],[tabindex]:not([tabindex="-1"])')]
    document.body.style.overflow='hidden'
    ;(dialog.querySelector('.modal-actions button:not([disabled])')||focusables()[0]||dialog).focus()
    const onKey=e=>{if(e.key==='Escape'&&!busyRef.current){e.preventDefault();closeRef.current();return}if(e.key==='Tab'){const items=focusables();if(!items.length){e.preventDefault();return}const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}}
    document.addEventListener('keydown',onKey)
    return()=>{document.body.style.overflow=previousOverflow;document.removeEventListener('keydown',onKey);previousFocus.current?.focus?.()}
  },[])
  return createPortal(<div className="modal-backdrop" role="presentation" onMouseDown={e=>e.target===e.currentTarget&&!busy&&onClose()}><div ref={dialogRef} tabIndex="-1" className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-busy={busy||undefined}><div className="modal-head"><h2 id={titleId}>{title}</h2><IconButton label={vi.action.close} onClick={onClose} disabled={busy}><X size={20}/></IconButton></div><div className="modal-body">{children}</div>{actions&&<div className="modal-actions">{actions}</div>}</div></div>,document.body)
}

export function Drawer({title,children,onClose,actions}){
  const dialogRef=useRef(null),titleId=useId(),previousFocus=useRef(null),closeRef=useRef(onClose),dirtyRef=useRef(false)
  const[dirty,setDirty]=useState(false),[guard,setGuard]=useState(false),[closing,setClosing]=useState(false)
  closeRef.current=onClose;dirtyRef.current=dirty
  const finishClose=useCallback(()=>{setClosing(true);window.setTimeout(()=>closeRef.current(),160)},[])
  const requestClose=useCallback(()=>{if(dirtyRef.current){setGuard(true);return}finishClose()},[finishClose])
  useEffect(()=>{
    previousFocus.current=document.activeElement
    const dialog=dialogRef.current
    const focusables=()=>[...dialog.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[href],[tabindex]:not([tabindex="-1"])')]
    ;(dialog.querySelector('[data-autofocus]')||focusables()[0]||dialog).focus()
    const onKey=event=>{if(event.key==='Escape'){event.preventDefault();requestClose();return}if(event.key==='Tab'){const items=focusables();if(!items.length){event.preventDefault();return}const first=items[0],last=items.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}}}
    const viewport=window.visualViewport
    const syncViewport=()=>document.documentElement.style.setProperty('--visual-viewport-height',`${viewport?.height||innerHeight}px`)
    document.documentElement.dataset.drawerOpen='true';syncViewport();document.addEventListener('keydown',onKey);viewport?.addEventListener('resize',syncViewport)
    return()=>{delete document.documentElement.dataset.drawerOpen;document.documentElement.style.removeProperty('--visual-viewport-height');document.removeEventListener('keydown',onKey);viewport?.removeEventListener('resize',syncViewport);previousFocus.current?.focus?.()}
  },[requestClose])
  return createPortal(<div className={`drawer-layer ${closing?'is-closing':''}`} role="presentation" onMouseDown={event=>event.target===event.currentTarget&&requestClose()}>
    <div ref={dialogRef} tabIndex="-1" className="drawer" role="dialog" aria-modal="true" aria-labelledby={titleId} onInput={()=>setDirty(true)} onChange={()=>setDirty(true)}>
      <div className="drawer-handle" aria-hidden="true"/><header className="drawer-head"><h2 id={titleId}>{title}</h2><IconButton label={vi.action.close} onClick={requestClose}><X size={20}/></IconButton></header>
      {guard&&<div className="drawer-guard" role="alert"><span>{vi.generated.index_87_1}</span><button type="button" onClick={()=>setGuard(false)}>{vi.generated.index_87_2}</button><button type="button" onClick={finishClose}>{vi.generated.index_87_3}</button></div>}
      <div className="drawer-body">{children}</div>{actions&&<footer className="drawer-actions">{actions}</footer>}
    </div>
  </div>,document.body)
}
