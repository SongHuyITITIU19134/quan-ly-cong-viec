import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Bell, CalendarCheck, CalendarDays, ChevronDown, ContactRound, Download, GitBranch, LayoutDashboard, ListTodo, LogOut, Moon, NotebookTabs, Plane, Plus, Search, Settings, Sparkles, Sun } from 'lucide-react'
import { vi } from '@/i18n/vi'
import { Popover } from '@/components/ui'
import CreateCombo from '@/components/create/CreateCombo'
import { useTheme } from '@/hooks/useTheme'
import { useData } from '@/hooks/useData'
import { getDueState } from '@/lib/tasks'
import { todayISO } from '@/lib/dates'
import { useTransitionNavigate } from '@/hooks/useTransitionNavigate'
import { pendingReminders, pruneReminderIds, rememberReminder, reminderId } from '@/lib/reminders'
import CommandPalette from '@/components/layout/CommandPalette'
import { shouldOpenPalette } from '@/lib/palette'
import { usePwa } from '@/hooks/usePwa'

const links = [
  ['/', vi.nav.dashboard, LayoutDashboard],
  ['/cong-viec', vi.nav.tasks, ListTodo],
  ['/so-do', vi.nav.mindMap, GitBranch],
  ['/lich', vi.nav.calendar, CalendarDays],
  ['/cong-tac', vi.nav.trips, Plane],
  ['/danh-ba', vi.nav.contacts, ContactRound],
  ['/so-tay', vi.nav.notebooks, NotebookTabs],
  ['/cai-dat', vi.generated.AppLayout_25_0, Settings],
]

function Navigation({onNavigate}) {
  return <nav className="dock-nav" aria-label={vi.generated.AppLayout_29_1}>
    {links.map(([to,label,Icon])=><NavLink key={to} to={to} end={to==='/' } className="dock-link" onClick={event=>{if(!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey){event.preventDefault();onNavigate(to)}}}><Icon size={19} aria-hidden="true"/><span>{label}</span></NavLink>)}
  </nav>
}

export default function AppLayout(){
  const navigate=useTransitionNavigate()
  const location=useLocation()
  const{resolved}=useTheme()
  const{data,error,setError,mode,user,logout,emailNeedsVerification,resendEmail,confirmEmail,importOffer,importBusy,importLocal,skipImport,toast,settings,saveSettings}=useData()
  const{canInstall,install}=usePwa(toast)
  const[query,setQuery]=useState('')
  const[paletteOpen,setPaletteOpen]=useState(false)
  const[paletteInitial,setPaletteInitial]=useState('')
  const[createMode,setCreateMode]=useState(null)
  const searchRef=useRef(null)
  const paletteReturnFocus=useRef(null)
  const previousPath=useRef(location.pathname)
  const notified=useRef(new Set())
  const[reminderCount,setReminderCount]=useState(0)
  const overdueCount=useMemo(()=>data.tasks.filter(task=>getDueState(task,todayISO())==='overdue').length,[data.tasks])

  useEffect(()=>{pruneReminderIds(localStorage,todayISO())},[])

  useEffect(()=>{
    if(paletteOpen||!paletteReturnFocus.current)return undefined
    const frame=requestAnimationFrame(()=>paletteReturnFocus.current?.focus?.())
    return()=>cancelAnimationFrame(frame)
  },[paletteOpen])

  useEffect(()=>{const routes={tasks:'/cong-viec',calendar:'/lich',trips:'/cong-tac',contacts:'/danh-ba',notebooks:'/so-tay'};if(location.pathname==='/'&&routes[settings.defaultView])navigate(routes[settings.defaultView],{replace:true})},[location.pathname,navigate,settings.defaultView])

  useEffect(()=>{
    const onShortcut=event=>{
      if(shouldOpenPalette(event)){event.preventDefault();paletteReturnFocus.current=document.activeElement;setPaletteInitial('');setPaletteOpen(true);return}
      if(event.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)){
        event.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown',onShortcut)
    return()=>window.removeEventListener('keydown',onShortcut)
  },[])

  useEffect(()=>{const check=()=>{const reminders=pendingReminders(data.tasks,new Date(),localStorage);setReminderCount(reminders.length);for(const task of reminders){const key=reminderId(task);if(notified.current.has(key))continue;notified.current.add(key);rememberReminder(localStorage,task);const message=vi.generated.AppLayout_67_2(task.title);toast(message);if(typeof Notification!=='undefined'&&Notification.permission==='granted')new Notification(vi.generated.AppLayout_67_3,{body:message})}};check();const timer=window.setInterval(check,30000);return()=>window.clearInterval(timer)},[data.tasks,toast])

  useEffect(()=>{
    if(previousPath.current===location.pathname)return
    previousPath.current=location.pathname
    requestAnimationFrame(()=>{const heading=document.querySelector('.page h1');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true})}})
  },[location.pathname])

  useEffect(()=>{
    const params=new URLSearchParams(location.search)
    if(params.get('new')!=='1')return
    setCreateMode('combo')
    params.delete('new')
    navigate(`${location.pathname}${params.size?`?${params}`:''}`,{replace:true})
  },[location.pathname,location.search,navigate])

  const submitSearch=event=>{
    event.preventDefault()
    paletteReturnFocus.current=searchRef.current
    setPaletteInitial(query.trim())
    setPaletteOpen(true)
  }
  const closePalette=()=>setPaletteOpen(false)
  const changeTheme=()=>saveSettings({...settings,theme:resolved==='dark'?'light':'dark'})
  const choosePalette=item=>{setPaletteOpen(false);if(item.action==='task')setCreateMode('task');else if(item.action==='theme')changeTheme();else if(item.to)navigate(item.to)}
  const chooseCreate=mode=>{
    if(mode==='trip')navigate('/cong-tac?new=trip')
    else setCreateMode(mode)
  }
  const menuKeys=event=>{
    if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return
    event.preventDefault()
    const items=[...event.currentTarget.parentElement.querySelectorAll('[role="menuitem"]')],index=items.indexOf(event.currentTarget)
    items[event.key==='Home'?0:event.key==='End'?items.length-1:(index+(event.key==='ArrowDown'?1:-1)+items.length)%items.length]?.focus()
  }

  return <div className="app-shell">
      <header className="shell-topbar" aria-label={vi.generated.AppLayout_104_4}>
        <form className="global-search hard-shadow" role="search" onSubmit={submitSearch}>
          <Search size={17} aria-hidden="true"/>
          <input ref={searchRef} value={query} onChange={event=>setQuery(event.target.value)} onFocus={()=>setQuery('')} aria-label={vi.generated.AppLayout_107_5} placeholder={vi.generated.AppLayout_107_6}/>
          <kbd aria-hidden="true">⌘K</kbd>
        </form>
        <button className="topbar-button" type="button" aria-label={vi.generated.AppLayout_110_7} title={vi.generated.AppLayout_110_8} onClick={()=>navigate('/lich')}><CalendarCheck size={19}/></button>
        <button className={`topbar-button notification-button ${overdueCount||reminderCount?'has-alert':''}`} type="button" aria-label={vi.generated.AppLayout_111_9(reminderCount,overdueCount)} title={vi.generated.AppLayout_111_10} onClick={()=>navigate('/cong-viec?due=overdue')}><Bell size={19}/>{overdueCount+reminderCount>0&&<span className="notification-count">{overdueCount+reminderCount}</span>}</button>
        <button className="topbar-button" type="button" onClick={changeTheme} aria-label={resolved==='dark'?vi.generated.AppLayout_112_11:vi.generated.AppLayout_112_12} title={resolved==='dark'?vi.generated.AppLayout_112_13:vi.generated.AppLayout_112_14}>{resolved==='dark'?<Sun size={19}/>:<Moon size={19}/>}</button>
        {canInstall&&<button className="topbar-button" type="button" onClick={install} aria-label={vi.generated.AppLayout_113_15} title={vi.generated.AppLayout_113_16}><Download size={19}/></button>}
        {mode==='firebase'?<Popover className="profile-menu" panelClassName="profile-menu-panel" align="end" accessibleLabel={vi.generated.AppLayout_114_17} label={<>{user?.photoURL?<img src={user.photoURL} alt="" referrerPolicy="no-referrer"/>:<span aria-hidden="true">{(user?.displayName||user?.email||'T').slice(0,1).toUpperCase()}</span>}<strong>{user?.displayName||vi.generated.AppLayout_114_18}</strong></>}><div className="profile-menu-identity"><strong>{user?.displayName||vi.generated.AppLayout_114_19}</strong><span>{user?.email}</span></div><button type="button" role="menuitem" onClick={logout}><LogOut size={17}/>{vi.auth.signOut}</button></Popover>:<button className="profile-button" type="button" title={vi.generated.AppLayout_114_20}><span aria-hidden="true">T</span><strong>{vi.generated.AppLayout_114_21}</strong></button>}
      </header>
    <main className="main surface-sheet" id="main-content">
      {error&&<div className="global-error" role="alert"><span>{error}</span><button onClick={()=>setError(null)}>{vi.generated.AppLayout_117_22}</button></div>}
      {emailNeedsVerification&&<section className="verification-banner" aria-label={vi.auth.verifyTitle}><div><strong>{vi.auth.verifyTitle}</strong><p>{vi.auth.verifyDescription}</p></div><div><button type="button" onClick={resendEmail}>{vi.auth.resend}</button><button type="button" onClick={confirmEmail}>{vi.auth.verified}</button></div></section>}
      {importOffer&&<section className="cloud-import-banner" aria-label={vi.generated.AppLayout_119_23}><div><strong>{vi.auth.importTitle}</strong><p>{vi.auth.importDescription}</p></div><div><button type="button" disabled={importBusy} onClick={skipImport}>{vi.auth.skip}</button><button type="button" disabled={importBusy} onClick={importLocal}>{importBusy?vi.auth.importing:vi.auth.import}</button></div></section>}
      <Outlet/>
    </main>
    <footer className="floating-dock">
      <NavLink className="dock-brand" to="/" aria-label={vi.generated.AppLayout_123_24} onClick={event=>{event.preventDefault();navigate('/')}}><span className="dock-brand-mark"><Sparkles size={19}/></span><strong>{vi.appName}</strong></NavLink>
      <Navigation onNavigate={navigate}/>
      <div className="dock-create-group"><button className="dock-create" type="button" aria-label={vi.generated.AppLayout_125_25} onClick={()=>setCreateMode('combo')}><Plus size={20}/><span>{vi.generated.AppLayout_125_26}</span></button><Popover className="dock-create-more" panelClassName="create-menu" align="end" accessibleLabel={vi.generated.AppLayout_125_27} label={<ChevronDown size={17}/>}>{[['combo',vi.generated.AppLayout_125_28],['task',vi.generated.AppLayout_125_29],['project',vi.generated.AppLayout_125_30],['trip',vi.generated.AppLayout_125_31]].map(([mode,label])=><button type="button" role="menuitem" key={mode} onKeyDown={menuKeys} onClick={()=>chooseCreate(mode)}>{label}</button>)}</Popover></div>
    </footer>
    <CreateCombo open={Boolean(createMode)} mode={createMode||'combo'} preselectedProjectId={new URLSearchParams(location.search).get('project')||new URLSearchParams(location.search).get('projectId')||''} onClose={()=>setCreateMode(null)}/>
    <CommandPalette open={paletteOpen} data={data} initialQuery={paletteInitial} onClose={closePalette} onChoose={choosePalette}/>
  </div>
}
