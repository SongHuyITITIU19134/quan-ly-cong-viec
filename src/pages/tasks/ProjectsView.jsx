import { useState } from 'react'
import { Archive, Check, Clock3, FolderKanban, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button, Card, Drawer, EmptyState, Modal, Popover, ProgressBar, StatusBadge } from '@/components/ui'
import ProjectForm from '@/components/project/ProjectForm'
import { PROJECT_STATUS_LABELS } from '@/lib/projects'
import { projectProgress } from '@/lib/progress'
import { sortProjectsCompletedLast } from '@/lib/sortProjects'
import { formatDate } from '@/lib/dates'
import { useTransitionNavigate } from '@/hooks/useTransitionNavigate'
import { vi } from '@/i18n/vi'
export default function ProjectsView({
  active,
  editing,
  data,
  loading,
  projectStatus,
  changeParam,
  setView,
  projectEditing,
  setProjectEditing,
  projectConfirm,
  setProjectConfirm,
  deleteTarget,
  setDeleteTarget,
  moveTarget,
  setMoveTarget,
  selectedProject,
  setEditing,
  saveProject,
  archiveProject,
  deleteProject,
  moveProjectTasks
}) {
  const [showArchived, setShowArchived] = useState(false),
    navigate = useTransitionNavigate(),
    projectFormId = 'project-editor-form'
  const visible = data.projects.filter(project => showArchived || projectStatus(project) !== 'archived')
  return <>
    {active && <>
<div className="project-toolbar">{data.projects.length > 0 && <Button icon={Plus} onClick={() => setProjectEditing({})}>Tạo dự án</Button>}<label>
<input type="checkbox" checked={showArchived} onChange={event => setShowArchived(event.target.checked)} /> Hiện dự án lưu trữ</label>
</div>
<div className="project-grid">{sortProjectsCompletedLast(visible, data.tasks, {
          loading
        }).map(project => {
          const count = data.tasks.filter(task => task.projectId === project.id).length,
            color = project.colorIndex || 1
          return <Card
            key={project.id}
            className={`project-solid-card label-theme-${color} ${projectStatus(project)==='done'?'is-done':''}`}
          >
<div className="section-row">
<span className="project-icon">
<FolderKanban size={18} />
</span>
<Popover align="end" className="project-menu" accessibleLabel={`Thao tác ${project.name}`} label={<MoreHorizontal size={20} />}>
<button role="menuitem" onClick={() => setProjectEditing(project)}>
<Pencil size={16} /> Chỉnh sửa</button>
<button role="menuitem" onClick={() => archiveProject(project)}>
<Archive size={16} /> {projectStatus(project) === 'archived' ? 'Khôi phục' : 'Lưu trữ'}</button>
<button role="menuitem" className="text-danger" onClick={() => setProjectConfirm(project)}>
<Trash2 size={16} /> Xóa</button>
</Popover>
</div>
{projectStatus(project)==='waiting'?<StatusBadge value="waiting"/>:<span className="project-status">
  {projectStatus(project)==='done'&&<Check size={14} aria-hidden="true"/>}
  {PROJECT_STATUS_LABELS[projectStatus(project)]||PROJECT_STATUS_LABELS.running}
</span>}
<h3>{project.name}</h3>
<p>{project.description || 'Chưa có mô tả'}</p>
<ProgressBar value={projectProgress(data.tasks, project.id)} />
<p>{count} nhiệm vụ · Hạn {project.dueDate ? formatDate(project.dueDate) : 'chưa đặt'}</p>
<div className="project-card-actions">
<Button variant="secondary" onClick={() => {
                changeParam('projectId', project.id)
                setView('kanban')
              }}>Xem nhiệm vụ</Button>
<Button variant="ghost" onClick={() => changeParam('project', project.id)}>Chi tiết</Button>
</div>
</Card>
        })}</div>{!visible.length&&<EmptyState
          title="Chưa có dự án"
          description="Tạo dự án để nhóm và theo dõi tiến độ công việc."
          action={<Button icon={Plus} onClick={()=>setProjectEditing({})}>Tạo dự án</Button>}
        />}</>}
    {projectEditing && <Drawer title={projectEditing.id ? 'Chỉnh sửa dự án' : 'Tạo dự án'} onClose={() => setProjectEditing(null)} actions={<>
<Button variant="secondary" onClick={() => setProjectEditing(null)}>Hủy</Button>
<Button type="submit" form={projectFormId}>Lưu dự án</Button>
</>}>
<ProjectForm
  formId={projectFormId} project={projectEditing} projects={data.projects}
  tasks={data.tasks} loading={loading} contacts={data.contacts} onSave={saveProject}
/>
</Drawer>}
    {selectedProject && !projectEditing && !editing && <Drawer title={selectedProject.name} onClose={() => changeParam('project', '')} actions={<>
<Button variant="secondary" onClick={() => setProjectEditing(selectedProject)}>Chỉnh sửa</Button>
<Button icon={Plus} onClick={() => setEditing({
        projectId: selectedProject.id
      })}>Thêm nhiệm vụ</Button>
</>}>
<div className={`project-detail label-theme-${selectedProject.colorIndex||1}`}>
{projectStatus(selectedProject)==='waiting'
  ?<StatusBadge value="waiting"/>
  :<span className="project-status">{PROJECT_STATUS_LABELS[projectStatus(selectedProject)]}</span>}
{projectStatus(selectedProject)==='waiting'&&selectedProject.status!=='waiting'&&<p role="note">
<Clock3 size={16} aria-hidden="true" /> {vi.projects.autoWaiting}</p>}<p>{selectedProject.description || 'Chưa có mô tả.'}</p>
<ProgressBar value={projectProgress(data.tasks, selectedProject.id)} />
<dl>
<div>
<dt>Người phụ trách</dt>
<dd>{data.contacts.find(contact => contact.id === selectedProject.ownerId)?.fullName || 'Chưa chọn'}</dd>
</div>
<div>
<dt>Thời gian</dt>
<dd>{selectedProject.startDate ? formatDate(selectedProject.startDate) : '—'} → {selectedProject.dueDate ? formatDate(selectedProject.dueDate) : '—'}</dd>
</div>
<div>
<dt>Nhiệm vụ</dt>
<dd>{data.tasks.filter(task => task.projectId === selectedProject.id).length}</dd>
</div>
</dl>
<section className="related-block">
<h3>Chuyến công tác</h3>
{data.trips.filter(trip=>trip.projectId===selectedProject.id).map(trip=><p key={trip.id}>{trip.name}</p>)}
<h3>Ghi chú liên quan</h3>
{data.notes.filter(note=>note.links?.projectId===selectedProject.id).map(note=><p key={note.id}>{note.title}</p>)}
<Button variant="secondary" onClick={()=>navigate(`/so-tay?new=note&projectId=${selectedProject.id}`)}>
  Tạo ghi chú liên kết
</Button>
</section>
<div className="field">
<label htmlFor="bulk-project">Chuyển toàn bộ nhiệm vụ sang</label>
<div className="field-inline">
<select id="bulk-project" value={moveTarget} onChange={event => setMoveTarget(event.target.value)}>
<option value="">Chọn dự án</option>
{data.projects
  .filter(project=>project.id!==selectedProject.id&&projectStatus(project)!=='archived')
  .map(project=><option key={project.id} value={project.id}>{project.name}</option>)}</select>
<Button variant="secondary" disabled={!moveTarget} onClick={() => moveProjectTasks(selectedProject)}>Chuyển</Button>
</div>
</div>
</div>
</Drawer>}
    {projectConfirm && <Modal title="Xóa dự án?" onClose={() => setProjectConfirm(null)} actions={<>
<Button variant="secondary" onClick={() => setProjectConfirm(null)}>Hủy</Button>
<Button variant="danger" onClick={deleteProject}>Xóa dự án</Button>
</>}>
<p>
  Dự án “{projectConfirm.name}” có
  {' '}{data.tasks.filter(task=>task.projectId===projectConfirm.id).length} nhiệm vụ.
  {' '}Chọn nơi chuyển chúng trước khi xóa.
</p>
<div className="field">
<label htmlFor="delete-project-target">Xử lý nhiệm vụ</label>
<select id="delete-project-target" value={deleteTarget} onChange={event => setDeleteTarget(event.target.value)}>
<option value="">Giữ nhiệm vụ, gỡ khỏi dự án</option>
{data.projects
  .filter(project=>project.id!==projectConfirm.id&&projectStatus(project)!=='archived')
  .map(project=><option key={project.id} value={project.id}>Chuyển sang {project.name}</option>)}</select>
</div>
</Modal>}
  </>
}
