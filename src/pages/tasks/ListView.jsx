import { Trash2 } from 'lucide-react'
import { Button, Card, EmptyState, PriorityBadge, ProgressBar } from '@/components/ui'
import CompleteToggle from '@/components/ui/CompleteToggle'
import TaskTags from '@/components/tags/TaskTags'
import { STATUS_KEYS, vi } from '@/i18n/vi'
import { formatDate } from '@/lib/dates'
import { taskProgress } from '@/lib/progress'
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
  return <Card className="table-wrap">{filtered.length ? <table>
<thead>
<tr>
<th>Nhiệm vụ</th>
<th className="tags-column">Nhãn</th>
<th>Trạng thái</th>
<th>Ưu tiên</th>
<th>Hạn</th>
<th>Tiến độ</th>
<th>Phụ trách</th>
<th>
<span className="sr-only">Thao tác</span>
</th>
</tr>
</thead>
<tbody>{filtered.map(task => <tr key={task.id} className={task.status === 'done' ? 'is-complete' : ''}>
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
<select
  aria-label={`Trạng thái ${task.title}`}
  value={task.status}
  onChange={event=>changeStatus(task,event.target.value)}
>{STATUS_KEYS.map(key=><option value={key} key={key}>{vi.status[key]}</option>)}</select>
</td>
<td>
<PriorityBadge value={task.priority} />
</td>
<td>{formatDate(task.dueDate)}</td>
<td className="progress-cell">
<ProgressBar value={taskProgress(task)} label={false} />
<small>{taskProgress(task)}%</small>
</td>
<td>{data.contacts.find(contact => contact.id === task.assigneeId)?.fullName}</td>
<td>
<button className="text-danger icon-hit" aria-label={`Xóa ${task.title}`} onClick={() => setConfirm(task)}>
<Trash2 size={16} />
</button>
</td>
</tr>)}</tbody>
</table>:<EmptyState
  title={data.tasks.length?'Không có nhiệm vụ khớp bộ lọc':'Chưa có nhiệm vụ'}
  description={data.tasks.length?'Hãy thay đổi hoặc đặt lại bộ lọc.':'Tạo nhiệm vụ đầu tiên để bắt đầu.'}
  action={data.tasks.length
    ?<Button variant="secondary" onClick={()=>setParams({})}>Đặt lại</Button>
    :<Button onClick={()=>setEditing({})}>Tạo nhiệm vụ</Button>}
/>}</Card>
}
