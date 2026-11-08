import { EmptyState, Button, StatusBadge } from '@/components/ui'
import TaskCard from '@/components/task/TaskCard'
import { STATUS_KEYS, vi } from '@/i18n/vi'
export default function KanbanView({
  data,
  filtered,
  grouped,
  hasFilters,
  setParams,
  taskProps,
  changeStatus,
  dropTask,
  setDragging,
  setEditing
}) {
  if(!data.tasks.length)return <EmptyState
    title="Chưa có nhiệm vụ"
    description="Tạo nhiệm vụ đầu tiên để bắt đầu bảng Kanban."
    action={<Button onClick={()=>setEditing({})}>Tạo nhiệm vụ</Button>}
  />
  if(!filtered.length&&hasFilters)return <EmptyState
    title="Không có nhiệm vụ khớp bộ lọc"
    action={<Button variant="secondary" onClick={()=>setParams({})}>Đặt lại</Button>}
  />
  return <div className="kanban" aria-label="Bảng Kanban">{STATUS_KEYS.map(key=><section
    className="kanban-column"
    key={key}
    onDragOver={event=>event.preventDefault()}
    onDrop={event=>dropTask(event,key,grouped[key].length)}
  >
<div className="column-head">
<StatusBadge value={key} />
<strong>{grouped[key].length}</strong>
</div>
<div className="column-body">{grouped[key].map((task, index) => <div className="kanban-task-shell" draggable onDragStart={event => {
          event.dataTransfer.setData('text/task-id', task.id)
          event.dataTransfer.effectAllowed = 'move'
          setDragging(task.id)
        }} onDragEnd={() => setDragging('')} onDragOver={event => event.preventDefault()} onDrop={event => {
          event.stopPropagation()
          dropTask(event, key, index)
        }} key={task.id}>
<TaskCard {...taskProps(task)} />
<label className="sr-only" htmlFor={`move-task-${task.id}`}>Chuyển sang… {task.title}</label>
<select id={`move-task-${task.id}`} aria-label={`Chuyển sang… ${task.title}`} value="" onChange={event => {
            if (event.target.value) changeStatus(task, event.target.value)
          }}>
<option value="">Chuyển sang…</option>
{STATUS_KEYS.filter(status=>status!==task.status).map(status=><option key={status} value={status}>
  {vi.status[status]}
</option>)}</select>
</div>)}{!grouped[key].length && <p className="column-empty">Chưa có nhiệm vụ</p>}</div>
</section>)}</div>
}
