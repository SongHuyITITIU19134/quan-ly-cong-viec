import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Search, SlidersHorizontal, Trash2 } from 'lucide-react'
import { Header, Page } from '@/app/App'
import { Button, Drawer, LoadingState, Modal, Popover, PriorityBadge, StatusBadge } from '@/components/ui'
import TaskForm from '@/components/task/TaskForm'
import TagFilter from '@/components/tags/TagFilter'
import { useActions, useDataState, useToast } from '@/hooks/useData'
import { PRIORITY_KEYS, STATUS_KEYS, vi } from '@/i18n/vi'
import { todayISO } from '@/lib/dates'
import { parseQuickAdd } from '@/lib/quickAdd'
import KanbanView from './KanbanView'
import ListView from './ListView'
import ProjectsView from './ProjectsView'
import { useTaskActions } from './useTaskActions'
import { useTaskFilters } from './useTaskFilters'
export default function TasksPage() {
  const {
      data,
      loading,
      tagCatalog = [],
      tagRegistry = {
        c: {}
      }
    } = useDataState(),
    {
      create,
      update,
      batch
    } = useActions(),
    toast = useToast()
  const [params, setParams] = useSearchParams(),
    [view, setView] = useState(params.get('view') || 'kanban')
  const [editing, setEditing] = useState(params.get('new') === 'task' ? {} : null),
    [confirm, setConfirm] = useState(null)
  const [projectEditing, setProjectEditing] = useState(null),
    [projectConfirm, setProjectConfirm] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(''),
    [moveTarget, setMoveTarget] = useState(''),
    [quickText, setQuickText] = useState('')
  const filters = useTaskFilters(data, params, setParams),
    quickParsed = useMemo(() => parseQuickAdd(quickText, todayISO()), [quickText])
  const actions = useTaskActions({
    data,
    loading,
    create,
    update,
    batch,
    toast,
    params,
    setParams,
    editing,
    setEditing,
    confirm,
    setConfirm,
    projectEditing,
    setProjectEditing,
    projectConfirm,
    setProjectConfirm,
    deleteTarget,
    setDeleteTarget,
    moveTarget,
    setMoveTarget,
    quickParsed,
    setQuickText,
    tagRegistry,
    tagFilters: filters.tagFilters,
    toggleParamValue: filters.toggleParamValue
  })
  const selectedProject = data.projects.find(project => project.id === params.get('project')),
    taskFormId = 'task-editor-form'
  useEffect(() => {
    if (params.get('new') === 'task') setEditing(current => current || {})
    if (params.get('new') === 'project') setProjectEditing(current => current || {})
  }, [params])
  useEffect(() => {
    const fn = event => {
      if ((event.key === 'n' || event.key === 'N') && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        event.preventDefault()
        setEditing({})
      }
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [])
  if (loading) return <Page>
<LoadingState />
</Page>
  return <Page>
    <Header title={vi.nav.tasks} description={`${filters.filtered.length} nhiệm vụ đang hiển thị`} action={<Button icon={Plus} onClick={() => {
      const next = new URLSearchParams(params)
      next.set('new', '1')
      setParams(next)
    }}>{vi.action.create}</Button>} />
    <span className="sr-only" data-render-complete="true">
      Đã chuẩn bị {filters.filtered.length} nhiệm vụ
    </span>
    <div className="quick-add-task">
<label htmlFor="task-quick-add">Thêm nhanh</label>
<input
  id="task-quick-add"
  value={quickText}
  onChange={event=>setQuickText(event.target.value)}
  onKeyDown={actions.quickAdd}
  placeholder="Ví dụ: Họp khách thứ 6 #sale !cao"
/>
{quickText&&<small className="field-hint">
  Nhận diện: {quickParsed.title||'chưa có tiêu đề'}
  {quickParsed.dueDate?` · ${quickParsed.dueDate}`:''}
  {quickParsed.tags.length?` · #${quickParsed.tags.join(' #')}`:''} · {vi.priority[quickParsed.priority]}
</small>}</div>
    <div className="underline-tabs task-view-tabs" role="tablist" aria-label="Kiểu hiển thị công việc">
<button className="underline-tab" role="tab" aria-selected={view === 'kanban'} onClick={() => setView('kanban')}>Kanban</button>
<button className="underline-tab" role="tab" aria-selected={view === 'list'} onClick={() => setView('list')}>Danh sách</button>
<button className="underline-tab" role="tab" aria-selected={view === 'projects'} onClick={() => setView('projects')}>Dự án</button>
</div>
    <div className="toolbar">
<div className="search">
<Search size={18} />
<input
  id="task-search"
  value={filters.searchInput}
  onChange={event=>filters.setSearchInput(event.target.value)}
  placeholder="Tìm tên, mô tả, ghi chú, nhãn…"
  aria-label="Tìm nhiệm vụ"
/>
</div>
<Popover
  className="filter-menu"
  panelClassName="filter-panel"
  role="dialog"
  label={<>Trạng thái{filters.status.length?` (${filters.status.length})`:''}</>}
>
<fieldset>
<legend className="sr-only">Lọc theo trạng thái</legend>{STATUS_KEYS.map(key => <label key={key}>
<input type="checkbox" checked={filters.status.includes(key)} onChange={() => filters.toggleParamValue('status', filters.status, key)} />
<StatusBadge value={key} />
</label>)}</fieldset>
</Popover>
<Popover
  className="filter-menu"
  panelClassName="filter-panel"
  role="dialog"
  label={<>Ưu tiên{filters.priority.length?` (${filters.priority.length})`:''}</>}
>
<fieldset>
<legend className="sr-only">Lọc theo ưu tiên</legend>{PRIORITY_KEYS.map(key => <label key={key}>
<input type="checkbox" checked={filters.priority.includes(key)} onChange={() => filters.toggleParamValue('priority', filters.priority, key)} />
<PriorityBadge value={key} />
</label>)}</fieldset>
</Popover>
<TagFilter
  catalog={tagCatalog}
  selected={filters.tagFilters}
  onToggle={actions.toggleTag}
  onClear={()=>filters.changeParam('tags','')}
  onReplace={keys=>filters.changeParam('tags',keys.join(','))}
/>
<select aria-label="Lọc dự án" value={filters.projectId} onChange={event => filters.changeParam('projectId', event.target.value)}>
<option value="">Mọi dự án ({data.tasks.length})</option>
{data.projects.filter(project=>actions.projectStatus(project)!=='archived').map(project=><option
  key={project.id}
  value={project.id}
>{project.name} ({data.tasks.filter(task=>task.projectId===project.id).length})</option>)}</select>
<select aria-label="Sắp xếp nhiệm vụ" value={filters.sort} onChange={event => filters.changeParam('sort', event.target.value)}>
<option value="order">Thứ tự mặc định</option>
<option value="dueDate">Hạn gần nhất</option>
<option value="priority">Ưu tiên cao nhất</option>
</select>{filters.hasFilters&&filters.filtered.length>0&&<Button
  variant="secondary"
  icon={SlidersHorizontal}
  onClick={()=>setParams({})}
>Đặt lại</Button>}</div>
    <p className="sr-only" aria-live="polite">{actions.announcement}</p>
    {view==='kanban'&&<KanbanView
      data={data} filtered={filters.filtered} grouped={filters.grouped} hasFilters={filters.hasFilters}
      setParams={setParams} taskProps={actions.taskProps} changeStatus={actions.changeStatus}
      dropTask={actions.dropTask} setDragging={actions.setDragging} setEditing={setEditing}
    />}
    {view==='list'&&<ListView
      data={data} filtered={filters.filtered} tagRegistry={tagRegistry} tagFilters={filters.tagFilters}
      toggleTag={actions.toggleTag} changeStatus={actions.changeStatus} setEditing={setEditing}
      setConfirm={setConfirm} setParams={setParams}
    />}
    <ProjectsView
      active={view==='projects'} editing={editing} data={data} loading={loading}
      projectStatus={actions.projectStatus} changeParam={filters.changeParam} setView={setView}
      projectEditing={projectEditing} setProjectEditing={setProjectEditing}
      projectConfirm={projectConfirm} setProjectConfirm={setProjectConfirm}
      deleteTarget={deleteTarget} setDeleteTarget={setDeleteTarget}
      moveTarget={moveTarget} setMoveTarget={setMoveTarget} selectedProject={selectedProject}
      setEditing={setEditing} saveProject={actions.saveProject} archiveProject={actions.archiveProject}
      deleteProject={actions.deleteProject} moveProjectTasks={actions.moveProjectTasks}
    />
    {editing && <Drawer title={editing.id ? 'Chi tiết nhiệm vụ' : 'Tạo nhiệm vụ'} onClose={actions.closeEditor} actions={<>
<Button variant="secondary" onClick={actions.closeEditor}>Hủy</Button>
<Button type="submit" form={taskFormId}>Lưu thay đổi</Button>
</>}>
<TaskForm
  formId={taskFormId} showActions={false} task={editing} projects={data.projects}
  contacts={data.contacts} trips={data.trips} tagCatalog={tagCatalog} tagRegistry={tagRegistry}
  onQuickProject={actions.quickProject} onSave={actions.save} onCancel={actions.closeEditor}
/>
{editing.id&&<Button variant="danger" icon={Trash2} onClick={()=>setConfirm(editing)}>
  Xóa nhiệm vụ
</Button>}</Drawer>}
    {confirm && <Modal title="Xóa nhiệm vụ?" onClose={() => setConfirm(null)} actions={<>
<Button variant="secondary" onClick={() => setConfirm(null)}>Hủy</Button>
<Button variant="danger" onClick={actions.deleteTask}>Xóa</Button>
</>}>
<p>
  Nhiệm vụ <span className="modal-long-title" title={confirm.title}>“{confirm.title}”</span> sẽ bị xóa.
  {' '}Bạn có thể hoàn tác trong 6 giây sau khi xóa.
</p>
</Modal>}
  </Page>
}
