import { memo } from 'react'
import { AlertTriangle, CalendarClock, MoreHorizontal, Plane } from 'lucide-react'
import CompleteToggle from '@/components/ui/CompleteToggle'
import { Popover, StatusBadge, PriorityBadge, ProgressBar } from '@/components/ui'
import { formatDate } from '@/lib/dates'
import { getDueState } from '@/lib/tasks'
import { taskProgress } from '@/lib/progress'
import { vi, STATUS_KEYS } from '@/i18n/vi'
import TaskTags from '@/components/tags/TaskTags'

function TaskCard({task,project,projectIndex=0,contact,onOpen,onStatus,onToggle,tagRegistry,selectedTags,onTagToggle}){
  const due=getDueState(task)
  const dueLabel=due==='overdue'?vi.generated.TaskCard_13_0:due==='today'?vi.generated.TaskCard_13_1:due==='soon'?vi.generated.TaskCard_13_2:null
  return <article className={`task-card due-${due} ${task.status==='done'?'is-complete':''}`} onClick={event=>{if(!event.target.closest('button,input,a'))onOpen()}}>
    <div className="task-card-top"><PriorityBadge value={task.priority}/><Popover className="task-menu" align="end" panelClassName="task-menu-pop" accessibleLabel={vi.generated.TaskCard_15_3(task.title)} label={<MoreHorizontal size={18}/>}><strong>{vi.generated.TaskCard_15_4}</strong>{STATUS_KEYS.map(key=><button role="menuitem" key={key} onClick={()=>onStatus(key)}>{vi.status[key]}</button>)}</Popover></div>
    <div className="task-title-row"><CompleteToggle checked={task.status==='done'} onChange={onToggle} label={task.title}/><button className="task-title" onClick={onOpen} title={task.title}>{task.title}</button></div>
    <TaskTags tags={task.tags} registry={tagRegistry} selected={selectedTags} onToggle={onTagToggle}/>
    <div className="task-meta"><span className={due==='overdue'?'overdue':due==='soon'||due==='today'?'due-soon':''}><CalendarClock size={14}/>{formatDate(task.dueDate)}</span>{task.tripId&&<span><Plane size={14}/>{vi.generated.TaskCard_18_5}</span>}</div>
    {dueLabel&&<span className={`due-label due-label-${due}`}>{due==='overdue'&&<AlertTriangle size={13}/>} {dueLabel}</span>}
    <ProgressBar value={taskProgress(task)}/>
    <div className="task-card-foot"><StatusBadge value={task.status}/><span className="avatar" title={contact?.fullName} aria-label={vi.generated.TaskCard_21_6(contact?.fullName||vi.generated.TaskCard_assigneeEmpty)}>{contact?.fullName?.slice(0,1)||'?'}</span></div>
    {project&&<div className="project-line" title={project.name}><i style={{'--project-color':`var(--label-${projectIndex%8+1}-ink)`}}/>{project.name}</div>}
  </article>
}

export default memo(TaskCard,(previous,next)=>previous.task.id===next.task.id&&previous.task.updatedAt===next.task.updatedAt&&previous.project?.updatedAt===next.project?.updatedAt&&previous.contact?.updatedAt===next.contact?.updatedAt&&previous.projectIndex===next.projectIndex&&previous.tagRegistry===next.tagRegistry&&previous.selectedTags===next.selectedTags)
