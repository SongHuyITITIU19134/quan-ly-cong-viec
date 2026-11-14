import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Bell, CalendarCheck, CalendarDays, ContactRound, Download, GitBranch, LayoutDashboard, ListTodo, LogOut, Moon, MoreHorizontal, NotebookTabs,
  Plane, Plus, Search, Settings, Sparkles, Sun,
} from 'lucide-react'
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
import OnboardingTour from '@/components/layout/OnboardingTour'
import DailyBriefingDialog from '@/components/layout/DailyBriefingDialog'
import { briefingClock, buildDailyBriefing, DAILY_BRIEFING_STORAGE_KEY, shouldShowDailyBriefing } from '@/lib/dailyBriefing'

const links = [
  ['/', vi.nav.dashboard, LayoutDashboard],
  ['/cong-viec', vi.nav.tasks, ListTodo],
  ['/lich', vi.nav.calendar, CalendarDays],
  ['/cong-tac', vi.nav.trips, Plane],
  ['/danh-ba', vi.nav.contacts, ContactRound],
  ['/so-do', vi.nav.mindMap, GitBranch],
  ['/so-tay', vi.nav.notebooks, NotebookTabs],
]
const mobileLinks = [links[0],links[1],links[2],links[6]]
const moreLinks = [links[3],links[4],links[5]]

function AppLink({item,onNavigate,className='shell-nav-link',role}) {
  const[to,label,Icon]=item
  return <NavLink to={to} end={to==='/' } className={className} aria-label={label} title={label} role={role} onClick={event=>{
    if(!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey){event.preventDefault();onNavigate(to)}
  }}><Icon size={20} aria-hidden="true"/><span>{label}</span></NavLink>
}

function Navigation({onNavigate}) {
  return <nav className="shell-nav" aria-label={vi.shell.navigation}>
    {links.map(item=><AppLink key={item[0]} item={item} onNavigate={onNavigate}/>)}
  </nav>
}

export default function AppLayout(){
  const navigate=useTransitionNavigate()
  const location=useLocation()
  const{resolved}=useTheme()
  const{
    data,loading,error,setError,mode,user,logout,readOnly,emailNeedsVerification,resendEmail,confirmEmail,
    importOffer,importBusy,importLocal,skipImport,toast,settings,saveSettings,batch
  }=useData()
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
  const[dailyBriefingState,setDailyBriefingState]=useState(null)
  const overdueCount=useMemo(()=>data.tasks.filter(task=>getDueState(task,todayISO())==='overdue').length,[data.tasks])
  const dailyBriefing=useMemo(()=>buildDailyBriefing(data,dailyBriefingState?.date||todayISO()),[data,dailyBriefingState?.date])
  const personName=user?.displayName||vi.common.assignee
  const personInitial=(user?.displayName||user?.email||'T').slice(0,1).toUpperCase()
  const requestCreate=useCallback(mode=>{if(readOnly)return toast(vi.auth.verifyToEdit);setCreateMode(mode)},[readOnly,toast])

  useEffect(()=>{pruneReminderIds(localStorage,todayISO())},[])

  useEffect(()=>{const open=event=>{if(['project','task','combo'].includes(event.detail))requestCreate(event.detail)};window.addEventListener('nhip-viec-create',open);return()=>window.removeEventListener('nhip-viec-create',open)},[requestCreate])

  useEffect(()=>{
    if(paletteOpen||!paletteReturnFocus.current)return undefined
    const frame=requestAnimationFrame(()=>paletteReturnFocus.current?.focus?.())
    return()=>cancelAnimationFrame(frame)
  },[paletteOpen])

  useEffect(()=>{const routes={tasks:'/cong-viec',calendar:'/lich',trips:'/cong-tac',contacts:'/danh-ba',notebooks:'/so-tay'};if(location.pathname==='/'&&routes[settings.defaultView])navigate(routes[settings.defaultView],{replace:true})},[location.pathname,navigate,settings.defaultView])

  useEffect(()=>{
    const onShortcut=event=>{
      if(shouldOpenPalette(event)){event.preventDefault();paletteReturnFocus.current=document.activeElement;setPaletteInitial('');setPaletteOpen(true);return}
      if(event.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)){event.preventDefault();searchRef.current?.focus()}
    }
    window.addEventListener('keydown',onShortcut)
    return()=>window.removeEventListener('keydown',onShortcut)
  },[])

  useEffect(()=>{const check=()=>{const reminders=pendingReminders(data.tasks,new Date(),localStorage);setReminderCount(reminders.length);for(const task of reminders){const key=reminderId(task);if(notified.current.has(key))continue;notified.current.add(key);rememberReminder(localStorage,task);const message=vi.generated.AppLayout_67_2(task.title);toast(message);if(typeof Notification!=='undefined'&&Notification.permission==='granted')new Notification(vi.generated.AppLayout_67_3,{body:message})}};check();const timer=window.setInterval(check,30000);return()=>window.clearInterval(timer)},[data.tasks,toast])

  useEffect(()=>{
    if(import.meta.env.VITE_E2E==='true')return undefined
    if(loading)return undefined
    const check=()=>{
      let shown=''
      try{shown=localStorage.getItem(DAILY_BRIEFING_STORAGE_KEY)||''}catch{/* The report still opens when storage is blocked. */}
      const now=new Date()
      if(!shouldShowDailyBriefing(now,shown))return
      const{date}=briefingClock(now),unavailable=Boolean(error)
      try{localStorage.setItem(DAILY_BRIEFING_STORAGE_KEY,date)}catch{/* Daily deduplication is best effort. */}
      setDailyBriefingState({date,unavailable})
      toast(unavailable?vi.dailyBriefing.unavailable:vi.dailyBriefing.ready)
      if(typeof Notification!=='undefined'&&Notification.permission==='granted'){
        const report=buildDailyBriefing(data,date)
        new Notification(vi.dailyBriefing.ready,{body:unavailable?vi.dailyBriefing.unavailable:vi.dailyBriefing.notificationBody(report.summary.today,report.summary.overdue)})
      }
    }
    check()
    const timer=window.setInterval(check,30000)
    return()=>window.clearInterval(timer)
  },[data,error,loading,toast])

  useEffect(()=>{
    if(previousPath.current===location.pathname)return
    previousPath.current=location.pathname
    requestAnimationFrame(()=>{const heading=document.querySelector('.page h1');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true})}})
  },[location.pathname])

  useEffect(()=>{
    const params=new URLSearchParams(location.search)
    if(params.get('new')!=='1')return
    if(readOnly)toast(vi.auth.verifyToEdit)
    else setCreateMode('combo')
    params.delete('new')
    navigate(`${location.pathname}${params.size?`?${params}`:''}`,{replace:true})
  },[location.pathname,location.search,navigate,readOnly,toast])

  const openPalette=(initial='',returnFocus=document.activeElement)=>{paletteReturnFocus.current=returnFocus;setPaletteInitial(initial);setPaletteOpen(true)}
  const submitSearch=event=>{event.preventDefault();openPalette(query.trim(),searchRef.current)}
  const closePalette=()=>{setPaletteOpen(false);paletteReturnFocus.current?.focus?.()}
  const changeTheme=()=>saveSettings({...settings,theme:resolved==='dark'?'light':'dark'})
  const blockedCreateProps=readOnly?{'aria-disabled':true,title:vi.auth.verifyToEdit}:{}
  const choosePalette=item=>{setPaletteOpen(false);if(item.action==='task')requestCreate('task');else if(item.action==='theme')changeTheme();else if(item.to)navigate(item.to)}
  const finishOnboarding=()=>saveSettings({...settings,onboardingSeen:true})
  const enableDailyNotifications=async()=>{
    if(typeof Notification==='undefined'){toast(vi.dailyBriefing.notificationsUnsupported);return}
    const permission=await Notification.requestPermission()
    if(permission!=='granted'){toast(vi.dailyBriefing.notificationsDenied);return}
    toast(vi.dailyBriefing.notificationsEnabled)
    new Notification(vi.dailyBriefing.ready,{body:vi.dailyBriefing.notificationBody(dailyBriefing.summary.today,dailyBriefing.summary.overdue)})
  }
  const useSample=async()=>{
    const[{onboardingSample},{stringifyJsonExport,parseJsonImport,buildImportOps}]=await Promise.all([
      import('@/data/onboardingSample'),import('@/lib/dataTransfer')
    ])
    const imported=parseJsonImport(stringifyJsonExport(onboardingSample())).data
    const ops=buildImportOps(imported,data,'skip')
    if(ops.length&&!await batch(ops))return
    if(await finishOnboarding())toast(vi.onboarding.sampleAdded)
  }
  const alertLabel=vi.shell.reminders(reminderCount,overdueCount)
  const profile=<>{user?.photoURL?<img src={user.photoURL} alt="" referrerPolicy="no-referrer"/>:<span aria-hidden="true">{personInitial}</span>}<strong>{personName}</strong></>
  const accountMenu=<>
    {mode==='firebase'&&<div className="profile-menu-identity"><strong>{personName}</strong><span>{user?.email}</span></div>}
    <button type="button" role="menuitem" onClick={changeTheme}>{resolved==='dark'?<Sun size={17}/>:<Moon size={17}/>}<span>{resolved==='dark'?vi.shell.light:vi.shell.dark}</span></button>
    {mode==='firebase'&&<button type="button" role="menuitem" onClick={logout}><LogOut size={17}/><span>{vi.auth.signOut}</span></button>}
  </>

  return <div className="app-shell">
    <aside className="shell-sidebar">
      <NavLink className="shell-brand" to="/" aria-label={`${vi.appName} — ${vi.nav.dashboard}`} onClick={event=>{event.preventDefault();navigate('/')}}>
        <span className="shell-brand-mark"><Sparkles size={20}/></span><strong>{vi.appName}</strong>
      </NavLink>
      {location.pathname!=='/cong-viec'&&<Popover className="shell-create-menu" panelClassName="create-menu-panel" align="end" accessibleLabel={vi.action.createNew} label={<><Plus size={19} aria-hidden="true"/><span>{vi.action.createNew}</span></>}>
        {[['project',vi.shell.projectChoice],['task',vi.shell.taskChoice],['combo',vi.shell.createCombo]].map(([value,label])=><button type="button" role="menuitem" {...blockedCreateProps} key={value} onClick={()=>window.setTimeout(()=>requestCreate(value),0)}>{label}</button>)}
      </Popover>}
      <Navigation onNavigate={navigate}/>
      <div className="shell-sidebar-bottom">
        <AppLink item={['/cai-dat',vi.nav.settings,Settings]} onNavigate={navigate}/>
        <Popover className="workspace-menu" panelClassName="profile-menu-panel" label={<><span className="workspace-avatar" aria-hidden="true">{personInitial}</span><span className="workspace-copy"><small>{vi.shell.workspace}</small><strong>{mode==='firebase'?personName:vi.shell.local}</strong></span><MoreHorizontal size={18}/></>}>
          {accountMenu}
        </Popover>
      </div>
    </aside>

    <header className="mobile-header" aria-label={vi.shell.quickTools}>
      <div><small>{vi.shell.greeting(personName)}</small><strong>{vi.appName}</strong></div>
      <button className="topbar-button" type="button" aria-label={vi.shell.today} title={vi.shell.today} onClick={()=>navigate('/lich')}><CalendarCheck size={20}/></button>
      <button className="topbar-button notification-button" type="button" aria-label={alertLabel} title={vi.shell.reminderTitle} onClick={()=>navigate('/cong-viec?due=overdue')}>
        <Bell size={20}/>{overdueCount+reminderCount>0&&<span className="notification-count">{overdueCount+reminderCount}</span>}
      </button>
      <button className="topbar-button" type="button" onClick={changeTheme} aria-label={resolved==='dark'?vi.shell.lightTheme:vi.shell.darkTheme} title={resolved==='dark'?vi.shell.light:vi.shell.dark}>{resolved==='dark'?<Sun size={20}/>:<Moon size={20}/>}</button>
      <Popover className="mobile-profile profile-menu" panelClassName="mobile-more-panel" align="end" label={profile}>
        <button type="button" role="menuitem" onClick={event=>openPalette('',event.currentTarget)}><Search size={18}/><span>{vi.action.search}</span></button>
        {moreLinks.map(item=><AppLink key={item[0]} item={item} onNavigate={navigate} className="mobile-menu-link" role="menuitem"/>)}
        <AppLink item={['/cai-dat',vi.nav.settings,Settings]} onNavigate={navigate} className="mobile-menu-link" role="menuitem"/>
        {accountMenu}
      </Popover>
    </header>

    <div className="shell-workspace">
      <header className="shell-topbar" aria-label={vi.shell.quickTools}>
        <form className="global-search" role="search" onSubmit={submitSearch}>
          <Search size={18} aria-hidden="true"/>
          <input ref={searchRef} value={query} onChange={event=>setQuery(event.target.value)} onFocus={()=>setQuery('')} aria-label={vi.shell.search} placeholder={vi.shell.searchPlaceholder}/>
          <kbd aria-hidden="true">⌘K</kbd>
        </form>
        <button className="topbar-button" type="button" aria-label={vi.shell.today} title={vi.shell.today} onClick={()=>navigate('/lich')}><CalendarCheck size={19}/></button>
        <button className="topbar-button notification-button" type="button" aria-label={alertLabel} title={vi.shell.reminderTitle} onClick={()=>navigate('/cong-viec?due=overdue')}><Bell size={19}/>{overdueCount+reminderCount>0&&<span className="notification-count">{overdueCount+reminderCount}</span>}</button>
        <button className="topbar-button" type="button" onClick={changeTheme} aria-label={resolved==='dark'?vi.shell.lightTheme:vi.shell.darkTheme} title={resolved==='dark'?vi.shell.light:vi.shell.dark}>{resolved==='dark'?<Sun size={19}/>:<Moon size={19}/>}</button>
        {canInstall&&<button className="topbar-button" type="button" onClick={install} aria-label={vi.shell.install} title={vi.shell.install}><Download size={19}/></button>}
      </header>
      <main className="main" id="main-content">
        {error&&<div className="global-error" role="alert"><span>{error}</span><button onClick={()=>setError(null)}>{vi.action.close}</button></div>}
        {emailNeedsVerification&&<section className="verification-banner" aria-label={vi.auth.verifyTitle}><div><strong>{vi.auth.verifyTitle}</strong><p>{vi.auth.verifyDescription}</p></div><div><button type="button" onClick={resendEmail}>{vi.auth.resend}</button><button type="button" onClick={confirmEmail}>{vi.auth.verified}</button></div></section>}
        {importOffer&&<section className="cloud-import-banner" aria-label={vi.shell.localImport}><div><strong>{vi.auth.importTitle}</strong><p>{vi.auth.importDescription}</p></div><div><button type="button" disabled={importBusy} onClick={skipImport}>{vi.auth.skip}</button><button type="button" disabled={importBusy} onClick={importLocal}>{importBusy?vi.auth.importing:vi.auth.import}</button></div></section>}
        <div className="route-content" key={location.pathname}><Outlet/></div>
      </main>
    </div>

    <nav className="mobile-tabs" aria-label={vi.shell.navigation}>
      <AppLink item={mobileLinks[0]} onNavigate={navigate} className="mobile-tab"/>
      <AppLink item={mobileLinks[1]} onNavigate={navigate} className="mobile-tab"/>
      <button className="mobile-create" type="button" aria-label={vi.action.create} {...blockedCreateProps} onClick={()=>requestCreate('combo')}><Plus size={24}/><span>{vi.action.create}</span></button>
      <AppLink item={mobileLinks[2]} onNavigate={navigate} className="mobile-tab"/>
      <AppLink item={mobileLinks[3]} onNavigate={navigate} className="mobile-tab"/>
    </nav>
    <CreateCombo open={Boolean(createMode)} mode={createMode||'combo'} preselectedProjectId={new URLSearchParams(location.search).get('project')||new URLSearchParams(location.search).get('projectId')||''} onClose={()=>setCreateMode(null)}/>
    {!loading&&!readOnly&&settings.onboardingSeen!==true&&<OnboardingTour onFinish={finishOnboarding} onSample={useSample}/>} 
    <CommandPalette open={paletteOpen} data={data} initialQuery={paletteInitial} onClose={closePalette} onChoose={choosePalette}/>
    {dailyBriefingState&&<DailyBriefingDialog briefing={dailyBriefing} data={data} date={dailyBriefingState.date} unavailable={dailyBriefingState.unavailable} onClose={()=>setDailyBriefingState(null)} onEnableNotifications={enableDailyNotifications} canEnableNotifications={typeof Notification!=='undefined'&&Notification.permission==='default'}/>}
  </div>
}
