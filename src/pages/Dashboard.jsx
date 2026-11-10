import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { Bell, CalendarDays, Check, ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react'
import { addDays, endOfMonth, endOfWeek, startOfMonth, startOfWeek } from 'date-fns'
import { Page } from '@/app/App'
import { Avatar, AvatarStack, Button, Card, EmptyState, ProgressBar } from '@/components/ui'
import { useActions, useAuth, useDataState, useToast } from '@/hooks/useData'
import { getProjectEffectiveStatus } from '@/lib/projectStatus'
import { getDueState } from '@/lib/tasks'
import { projectProgress, taskProgress, withStatus } from '@/lib/progress'
import { formatDate, todayISO, toISODate } from '@/lib/dates'
import { vi } from '@/i18n/vi'
import { useTransitionNavigate } from '@/hooks/useTransitionNavigate'
import { recurrenceCreateOp, recurrenceUndoOp } from '@/lib/recurrence'
import { weeklyReport } from '@/lib/weeklyReport'
import { buildIndexes } from '@/lib/indexes'

const priorityRank={urgent:0,high:1,medium:2,low:3}
const taskOrder=(left,right)=>(priorityRank[left.priority]??4)-(priorityRank[right.priority]??4)||(left.order??0)-(right.order??0)

function DashboardTask({task,indexes,onToggle,onOpen,emphasis=false}){
  const project=indexes.byId.projects.get(task.projectId),contact=indexes.byId.contacts.get(task.assigneeId)
  const collaborators=(task.collaboratorIds||[]).map(id=>indexes.byId.contacts.get(id)).filter(Boolean)
  const people=[contact,...collaborators].filter(Boolean).map(person=>({id:person.id,name:person.fullName,src:person.photoURL}))
  return <article className={`dashboard-task-card ${emphasis?'is-emphasis':''} ${task.status==='done'?'is-done':''}`}>
    <div className="dashboard-task-main"><button className="dashboard-task-title" type="button" onClick={onOpen}>{task.title}</button>
      <p>{task.description||vi.dashboard.noDescription}</p></div>
    <div className="dashboard-task-meta">{project&&<span className="project-chip">{project.name}</span>}<AvatarStack people={people} max={4}/>
      <span>{task.dueDate?formatDate(task.dueDate):vi.dashboard.noDue}</span></div>
    <ProgressBar value={taskProgress(task)}/>
    <button type="button" className="dashboard-task-check" aria-label={task.status==='done'?vi.completeToggle.reopen(task.title):vi.completeToggle.complete(task.title)}
      aria-pressed={task.status==='done'} onClick={onToggle}>{task.status==='done'&&<Check size={17}/>}</button>
  </article>
}

function Dashboard(){
  const{data,loading}=useDataState(),{batch}=useActions(),{readOnly}=useAuth(),toast=useToast(),navigate=useTransitionNavigate()
  const[period,setPeriod]=useState(()=>{try{const value=localStorage.getItem('nhip-viec-period');return['today','week','month'].includes(value)?value:'week'}catch{return'week'}})
  const[taskTab,setTaskTab]=useState('recent'),[panelView,setPanelView]=useState('tasks'),[weekOffset,setWeekOffset]=useState(0),[showReport,setShowReport]=useState(false)
  const recoveryShown=useRef(false),today=todayISO()
  useEffect(()=>{try{localStorage.setItem('nhip-viec-period',period)}catch{/* Storage can be unavailable. */}},[period])
  useEffect(()=>{if(data.recoveryError&&!recoveryShown.current){recoveryShown.current=true;toast(vi.dashboard.recovery)}if(!data.recoveryError)recoveryShown.current=false},[data.recoveryError,toast])
  const indexes=useMemo(()=>buildIndexes(data),[data.projects,data.tasks,data.contacts,data.trips,data.notes])
  const range=useMemo(()=>period==='today'?[today,today]:period==='month'
    ?[toISODate(startOfMonth(new Date())),toISODate(endOfMonth(new Date()))]
    :[toISODate(startOfWeek(new Date(),{weekStartsOn:1})),toISODate(endOfWeek(new Date(),{weekStartsOn:1}))],[period,today])
  const weekRange=useMemo(()=>[toISODate(startOfWeek(new Date(),{weekStartsOn:1})),toISODate(endOfWeek(new Date(),{weekStartsOn:1}))],[])
  const summary=useMemo(()=>{
    const result={scoped:0,today:[],overdue:[],soon:[],doneWeek:[],upcoming:[],recent:[]}
    for(const task of data.tasks){
      if(task.dueDate>=range[0]&&task.dueDate<=range[1])result.scoped+=1
      if(task.dueDate===today)result.today.push(task)
      const due=getDueState(task)
      if(due==='overdue')result.overdue.push(task)
      if(due==='soon')result.soon.push(task)
      if(task.status==='done'&&task.dueDate>=weekRange[0]&&task.dueDate<=weekRange[1])result.doneWeek.push(task)
      if(task.dueDate>today&&task.status!=='done')result.upcoming.push(task)
      if(task.status!=='done')result.recent.push(task)
    }
    for(const list of [result.today,result.overdue,result.soon,result.upcoming,result.recent])list.sort(taskOrder)
    return result
  },[data.tasks,range,today,weekRange])
  const projectRows=useMemo(()=>data.projects.map((project,index)=>{
    const tasks=indexes.tasksByProject.get(project.id)||[]
    return{project,index,tasks,status:getProjectEffectiveStatus(project,tasks,{loading}),progress:projectProgress(tasks,project.id)}
  }).filter(item=>item.status!=='archived'),[data.projects,indexes,loading])
  const nearestProject=useMemo(()=>projectRows.filter(item=>item.status!=='done'&&item.project.dueDate>=today)
    .sort((left,right)=>left.project.dueDate.localeCompare(right.project.dueDate))[0]?.project.id,[projectRows,today])
  const taskLists={recent:summary.recent,today:summary.today,upcoming:summary.upcoming,overdue:summary.overdue}
  const activeTasks=taskLists[taskTab].slice(0,5),urgentId=activeTasks.find(task=>task.priority==='urgent'||getDueState(task)==='overdue')?.id
  const nextTimelineId=summary.today.find(task=>task.status!=='done')?.id
  const weekDays=useMemo(()=>Array.from({length:7},(_,index)=>{
    const start=startOfWeek(addDays(new Date(),weekOffset*7),{weekStartsOn:1}),date=toISODate(addDays(start,index))
    return{date,label:['CN','T2','T3','T4','T5','T6','T7'][addDays(start,index).getDay()]}
  }),[weekOffset])
  const todayTrips=useMemo(()=>data.trips.filter(trip=>trip.startDate<=today&&trip.endDate>=today),[data.trips,today])
  const self=data.contacts.find(contact=>contact.isSelf)||data.contacts.find(contact=>contact.id==='self')
  const name=self?.fullName||vi.common.assignee,report=useMemo(()=>weeklyReport(data,today),[data,today])
  const noData=!data.projects.length&&!data.tasks.length&&!data.trips.length
  const goToScope=query=>navigate(`/cong-viec${query?`?${query}`:''}`)
  const toggleTask=async task=>{
    const status=task.status==='done'?'todo':'done',created=status==='done'?recurrenceCreateOp(task,data.tasks):null
    const ops=[{type:'update',collection:'tasks',id:task.id,data:withStatus(task,status)},...(created?[created]:[])]
    if(!await batch(ops))return
    const undo=[{type:'update',collection:'tasks',id:task.id,data:task},...(created?[recurrenceUndoOp(created)]:[])]
    toast(status==='done'?vi.dashboard.completed:vi.dashboard.reopened,{label:vi.action.undo,onClick:()=>batch(undo)})
  }
  const requestCreate=to=>{if(readOnly)return toast(vi.auth.verifyToEdit);navigate(to)}
  const openCreate=mode=>window.setTimeout(()=>window.dispatchEvent(new CustomEvent('nhip-viec-create',{detail:mode})),0)
  const blockedCreateProps=readOnly?{'aria-disabled':true,title:vi.auth.verifyToEdit}:{}
  const useSample=async()=>{
    const[{onboardingSample},{stringifyJsonExport,parseJsonImport,buildImportOps}]=await Promise.all([
      import('@/data/onboardingSample'),import('@/lib/dataTransfer')
    ])
    const ops=buildImportOps(parseJsonImport(stringifyJsonExport(onboardingSample())).data,data,'skip')
    if(ops.length&&await batch(ops))toast(vi.dashboard.sampleAdded)
  }
  const openPalette=()=>window.dispatchEvent(new KeyboardEvent('keydown',{key:'k',metaKey:true,bubbles:true}))
  const copyReport=async()=>{await navigator.clipboard.writeText(report);toast(vi.dashboard.reportCopied)}
  const longDate=new Intl.DateTimeFormat('vi-VN',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date())
  return <Page><div className="dashboard-layout">
    <section className="dashboard-center">
      <header className="dashboard-welcome"><p>{vi.dashboard.greeting(name)}</p>
        <h1>{vi.dashboard.todayCount(summary.today.filter(task=>task.status!=='done').length)}<span className="sr-only"> — {vi.dashboard.morning}</span></h1>
        <div className="dashboard-welcome-actions"><button className="dashboard-search" type="button" onClick={openPalette}>
          <Search size={18}/><span>{vi.dashboard.search}</span><kbd>⌘K</kbd></button>
          <label className="sr-only" htmlFor="dashboard-period">{vi.dashboard.period}</label>
          <select id="dashboard-period" value={period} onChange={event=>setPeriod(event.target.value)}><option value="today">{vi.dashboard.todayPeriod}</option>
            <option value="week">{vi.dashboard.weekPeriod}</option><option value="month">{vi.dashboard.monthPeriod}</option></select>
          <Button variant="ghost" onClick={()=>setShowReport(value=>!value)}>{vi.dashboard.weeklyReport}</Button></div></header>
      {noData?<Card className="dashboard-empty-card"><EmptyState title={vi.dashboard.emptyTitle} description={vi.dashboard.emptyDescription}
        action={<div className="dashboard-empty-actions"><Button icon={Plus} {...blockedCreateProps} onClick={()=>requestCreate('/cong-viec?view=projects&new=project')}>{vi.dashboard.createFirstProject}</Button>
          <Button variant="secondary" onClick={useSample}>{vi.dashboard.useSample}</Button></div>}/></Card>:<>
      {showReport&&<Card className="dashboard-report"><div className="section-row"><h2>{vi.dashboard.weeklyReport}</h2>
        <Button onClick={copyReport}>{vi.dashboard.copy}</Button></div><pre>{report}</pre></Card>}
      <div className="dashboard-kpis"><button onClick={()=>goToScope(`from=${today}&to=${today}`)}><span>{vi.dashboard.kpiToday}</span><strong>{summary.today.length}</strong></button>
        <button className="is-emphasis" onClick={()=>goToScope('due=overdue')}><span>{vi.dashboard.kpiOverdue}</span><strong>{summary.overdue.length}</strong></button>
        <button onClick={()=>goToScope('due=soon')}><span>{vi.dashboard.kpiSoon}</span><strong>{summary.soon.length}</strong></button>
        <button onClick={()=>goToScope(`status=done&from=${weekRange[0]}&to=${weekRange[1]}`)}><span>{vi.dashboard.kpiDone}</span><strong>{summary.doneWeek.length}</strong></button></div>
      <Card className={`dashboard-center-panel ${panelView==='tasks'?'is-tasks':'is-projects'}`}><div className="dashboard-panel-head"><div><h2>{panelView==='tasks'?vi.dashboard.myTasks:vi.dashboard.projects}</h2>
        <span className="dashboard-panel-dots" aria-label={vi.dashboard.panelPosition(panelView==='tasks'?1:2)}><i className={panelView==='tasks'?'is-active':''}/><i className={panelView==='projects'?'is-active':''}/></span></div>
        <div className="dashboard-panel-actions"><Button variant="ghost" onClick={()=>goToScope(panelView==='tasks'?`from=${range[0]}&to=${range[1]}`:'view=projects')}>{vi.dashboard.viewAll}</Button>
          <button type="button" aria-label={vi.dashboard.previousPanel} onClick={()=>setPanelView(value=>value==='tasks'?'projects':'tasks')}><ChevronLeft/></button>
          <button type="button" aria-label={vi.dashboard.nextPanel} onClick={()=>setPanelView(value=>value==='tasks'?'projects':'tasks')}><ChevronRight/></button></div></div>
        {panelView==='tasks'?<><div className="dashboard-task-tabs" role="tablist" aria-label={vi.dashboard.myTasks}>
          {[['recent',vi.dashboard.recent],['today',vi.dashboard.today],['upcoming',vi.dashboard.upcoming],['overdue',vi.dashboard.overdue]].map(([value,label])=><button
            key={value} role="tab" aria-selected={taskTab===value} onClick={()=>setTaskTab(value)}>{label}<span>{taskLists[value].length}</span></button>)}
        </div><div className="dashboard-task-list">{activeTasks.length?activeTasks.map(task=><DashboardTask key={task.id} task={task} indexes={indexes}
          emphasis={task.id===urgentId} onToggle={()=>toggleTask(task)} onOpen={()=>goToScope(`q=${encodeURIComponent(task.title)}`)}/>)
          :<p className="dashboard-empty">{vi.dashboard.emptyTasks}</p>}</div></>:<section className="dashboard-projects">
          <div className="dashboard-project-grid">{projectRows.slice(0,6).map(({project,index,tasks,progress})=><button type="button"
            className={`dashboard-project-card label-theme-${index%8+1} ${project.id===nearestProject?'is-emphasis':''}`} key={project.id}
            onClick={()=>goToScope(`projectId=${project.id}`)}><span className="project-card-top"><i/><small>{vi.dashboard.tasks(tasks.length)}</small></span>
            <strong>{project.name}</strong><span>{project.dueDate?formatDate(project.dueDate):vi.dashboard.noDue}</span><ProgressBar value={progress}/></button>)}</div>
          <div className="mini-bars" role="img" aria-label={projectRows.length
            ?projectRows.map(item=>`${item.project.name}: ${item.tasks.length} ${vi.common.task}`).join(', ')
            :vi.dashboard.projects}>
            {projectRows.slice(0,6).map((item,index)=><div className="mini-bar-item" key={item.project.id}><span className={`mini-bar label-theme-${index%8+1}`}
              style={{width:`${Math.max(8,item.tasks.length/Math.max(1,...projectRows.map(row=>row.tasks.length))*100)}%`}}/><small title={item.project.name}>{item.project.name}</small><strong>{item.tasks.length}</strong></div>)}</div>
        </section>}</Card></>}
    </section>
    <aside className="dashboard-right" aria-label={vi.dashboard.longDate}>
      <div className="dashboard-profile"><Avatar name={name}/><span><small>{vi.dashboard.morning}</small><strong>{name}</strong></span>
        <button type="button" aria-label={vi.shell.reminders(0,summary.overdue.length)} onClick={()=>goToScope('due=overdue')}><Bell size={20}/>{summary.overdue.length>0&&<i>{summary.overdue.length}</i>}</button></div>
      <div className="dashboard-date-head"><span><CalendarDays size={18}/>{longDate}</span><Button icon={Plus} {...blockedCreateProps}
        onClick={()=>openCreate('task')}>{vi.dashboard.addTask}</Button></div>
      <Card className="dashboard-week"><div className="section-row"><h2>{vi.dashboard.week}</h2><span>
        <button aria-label={vi.dashboard.previousWeek} onClick={()=>setWeekOffset(value=>value-1)}><ChevronLeft/></button>
        <button aria-label={vi.dashboard.nextWeek} onClick={()=>setWeekOffset(value=>value+1)}><ChevronRight/></button></span></div>
        <div className="week-strip">{weekDays.map(day=><button className={day.date===today?'is-today':''} key={day.date}
          onClick={()=>goToScope(`from=${day.date}&to=${day.date}`)}><small>{day.label}</small><strong>{day.date.slice(-2)}</strong>
          <i className={(indexes.tasksByDue.get(day.date)||[]).length?'has-tasks':''}/></button>)}</div></Card>
      <Card className="dashboard-timeline"><h2>{vi.dashboard.longDate}</h2>{summary.today.length||todayTrips.length?<div className="timeline-list">
        {summary.today.map(task=><article className={`timeline-item ${task.id===nextTimelineId?'is-next':''}`} key={task.id}>
          <button aria-label={task.status==='done'?vi.completeToggle.reopen(task.title):vi.completeToggle.complete(task.title)} aria-pressed={task.status==='done'}
            onClick={()=>toggleTask(task)}>{task.status==='done'&&<Check size={15}/>}</button><span><strong>{task.title}</strong><small>{vi.priority[task.priority]||vi.dashboard.allDay}</small></span></article>)}
        {todayTrips.map(trip=><article className="timeline-item is-trip" key={trip.id}><span className="timeline-dot"/><span><strong>{trip.name}</strong><small>{trip.location}</small></span></article>)}</div>
        :<p className="dashboard-empty">{vi.dashboard.timelineEmpty}</p>}</Card>
    </aside>
  </div></Page>
}

export default memo(Dashboard)
