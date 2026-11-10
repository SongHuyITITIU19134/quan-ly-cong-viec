import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button, Card, EmptyState, PriorityBadge, ProgressBar, StatusBadge } from '@/components/ui'
import CompleteToggle from '@/components/ui/CompleteToggle'
import TaskTags from '@/components/tags/TaskTags'
import { STATUS_KEYS, vi } from '@/i18n/vi'
import { formatDate } from '@/lib/dates'
import { taskProgress } from '@/lib/progress'
import { getDueState } from '@/lib/tasks'
export const LIST_PAGE_SIZE=100
export default function ListView({
  data,
  filtered,
  tagRegistry,
  tagFilters,
  toggleTag,
  changeStatus,
  setEditing,
  setConfirm,
  setParams
}) {
  const[page,setPage]=useState(1)
  const pageCount=Math.max(1,Math.ceil(filtered.length/LIST_PAGE_SIZE))
  const visible=filtered.slice((page-1)*LIST_PAGE_SIZE,page*LIST_PAGE_SIZE)
  useEffect(()=>setPage(1),[filtered])
  return <Card className="table-wrap">{filtered.length ? <table>
<thead>
<tr>
<th>{vi.generated.ListView_28_0}</th>
<th className="tags-column">{vi.generated.ListView_29_1}</th>
<th>{vi.generated.ListView_30_2}</th>
<th>{vi.generated.ListView_31_3}</th>
<th>{vi.generated.ListView_32_4}</th>
<th>{vi.generated.ListView_33_5}</th>
<th>{vi.generated.ListView_34_6}</th>
<th>
<span className="sr-only">{vi.generated.ListView_36_7}</span>
</th>
</tr>
</thead>
<tbody>{visible.map(task => {const due=getDueState(task),project=(data.projects||[]).find(item=>item.id===task.projectId);return <tr key={task.id}
  className={`${task.status==='done'?'is-complete':''} ${due==='overdue'?'due-overdue':''} ${project?`has-project label-theme-${project.colorIndex||1}`:''}`}>
<td>
<div className="task-table-title">
<CompleteToggle checked={task.status === 'done'} onChange={checked => changeStatus(task, checked ? 'done' : 'todo')} label={task.title} showLabel />
<button className="link-button" onClick={() => setEditing(task)}>{task.title}</button>
</div>
<TaskTags className="task-tags-mobile" tags={task.tags} registry={tagRegistry} selected={tagFilters} onToggle={toggleTag} />
</td>
<td className="tags-column">
<TaskTags tags={task.tags} registry={tagRegistry} selected={tagFilters} onToggle={toggleTag} />
</td>
<td>
<StatusBadge value={task.status} />
<select
  aria-label={vi.generated.ListView_53_8(task.title)}
  value={task.status}
  onChange={event=>changeStatus(task,event.target.value)}
>{STATUS_KEYS.map(key=><option value={key} key={key}>{vi.status[key]}</option>)}</select>
</td>
<td>
<PriorityBadge value={task.priority} />
</td>
<td><span className={due==='overdue'?'overdue-date':''}>{formatDate(task.dueDate)}</span>
{['overdue','today','soon'].includes(due)&&<StatusBadge value={due}/>}</td>
<td className="progress-cell">
<ProgressBar value={taskProgress(task)} label={false} />
<small>{taskProgress(task)}%</small>
</td>
<td>{data.contacts.find(contact => contact.id === task.assigneeId)?.fullName}</td>
<td>
<button className="text-danger icon-hit" aria-label={vi.generated.ListView_68_9(task.title)} onClick={() => setConfirm(task)}>
<Trash2 size={16} />
</button>
</td>
</tr>})}</tbody>
</table>:<EmptyState
  title={data.tasks.length?vi.generated.ListView_74_10:vi.generated.ListView_74_11}
  description={data.tasks.length?vi.generated.ListView_75_12:vi.generated.ListView_75_13}
  action={data.tasks.length
    ?<Button variant="secondary" onClick={()=>setParams({})}>{vi.generated.ListView_77_14}</Button>
    :<Button onClick={()=>setEditing({})}>{vi.generated.ListView_78_15}</Button>}
/>}{filtered.length>LIST_PAGE_SIZE&&<nav className="list-pagination" aria-label={vi.generated.ListView_79_16}>
<Button variant="secondary" disabled={page===1} onClick={()=>setPage(value=>Math.max(1,value-1))}>{vi.generated.ListView_80_17}</Button>
<span>Trang {page}/{pageCount}</span>
<Button variant="secondary" disabled={page===pageCount} onClick={()=>setPage(value=>Math.min(pageCount,value+1))}>Trang sau</Button>
</nav>}</Card>
}
