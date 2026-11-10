import { useEffect, useState } from 'react'
import { EmptyState, Button, StatusBadge } from '@/components/ui'
import TaskCard from '@/components/task/TaskCard'
import { STATUS_KEYS, vi } from '@/i18n/vi'
export const KANBAN_PAGE_SIZE=40
export default function KanbanView({
  data,
  filtered,
  grouped,
  hasFilters,
  setParams,
  taskProps,
  dropTask,
  setDragging,
  setEditing
}) {
  const[limits,setLimits]=useState(()=>Object.fromEntries(STATUS_KEYS.map(key=>[key,KANBAN_PAGE_SIZE])))
  const[expanded,setExpanded]=useState(()=>Object.fromEntries(STATUS_KEYS.map(key=>[key,false])))
  useEffect(()=>{
    setLimits(Object.fromEntries(STATUS_KEYS.map(key=>[key,KANBAN_PAGE_SIZE])))
    setExpanded(Object.fromEntries(STATUS_KEYS.map(key=>[key,false])))
  },[filtered])
  if(!data.tasks.length)return <EmptyState
    title={vi.generated.KanbanView_21_0}
    description={vi.generated.KanbanView_22_1}
    action={<Button onClick={()=>setEditing({})}>{vi.generated.KanbanView_23_2}</Button>}
  />
  if(!filtered.length&&hasFilters)return <EmptyState
    title={vi.generated.KanbanView_26_3}
    action={<Button variant="secondary" onClick={()=>setParams({})}>{vi.generated.KanbanView_27_4}</Button>}
  />
  return <div className="kanban" aria-label={vi.generated.KanbanView_29_5}>{STATUS_KEYS.map(key=><section
    className="kanban-column"
    key={key}
    onDragOver={event=>event.preventDefault()}
    onDrop={event=>dropTask(event,key,grouped[key].length)}
  >
<div className="column-head">
<StatusBadge value={key} />
<strong>{grouped[key].length}</strong>
</div>
<div className="column-body">{grouped[key].slice(0,expanded[key]?limits[key]:3).map((task, index) => <div
  className="kanban-task-shell"
  draggable
  onDragStart={event => {
          event.dataTransfer.setData('text/task-id', task.id)
          event.dataTransfer.effectAllowed = 'move'
          setDragging(task.id)
        }} onDragEnd={() => setDragging('')} onDragOver={event => event.preventDefault()} onDrop={event => {
          event.stopPropagation()
          dropTask(event, key, index)
        }} key={task.id}>
<TaskCard {...taskProps(task)} />
</div>)}
{!expanded[key]&&grouped[key].length>3&&<Button variant="secondary"
  onClick={()=>setExpanded(current=>({...current,[key]:true}))}
>{vi.tasks.expandLane(Math.min(grouped[key].length,limits[key])-3)}</Button>}
{expanded[key]&&grouped[key].length>limits[key]&&<Button
  variant="secondary"
  onClick={()=>setLimits(current=>({...current,[key]:current[key]+KANBAN_PAGE_SIZE}))}
>{vi.tasks.loadMore(grouped[key].length-limits[key])}</Button>}
{expanded[key]&&grouped[key].length>3&&<Button variant="ghost"
  onClick={()=>setExpanded(current=>({...current,[key]:false}))}
>{vi.tasks.collapseLane}</Button>}
{!grouped[key].length && <p className="column-empty">{vi.generated.KanbanView_61_10}</p>}</div>
</section>)}</div>
}
