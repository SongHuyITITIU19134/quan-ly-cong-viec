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
<div className="project-toolbar">{data.projects.length > 0 && <Button
  icon={Plus} onClick={() => setProjectEditing({})}
>{vi.generated.ProjectsView_40_0}</Button>}<label>
<input type="checkbox" checked={showArchived} onChange={event => setShowArchived(event.target.checked)} />{vi.generated.ProjectsView_41_1}</label>
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
<Popover align="end" className="project-menu" accessibleLabel={vi.generated.ProjectsView_56_2(project.name)} label={<MoreHorizontal size={20} />}>
<button role="menuitem" onClick={() => setProjectEditing(project)}>
<Pencil size={16} />{vi.generated.ProjectsView_58_3}</button>
<button role="menuitem" onClick={() => archiveProject(project)}>
<Archive size={16} /> {projectStatus(project) === 'archived' ? vi.generated.ProjectsView_60_4 : vi.generated.ProjectsView_60_5}</button>
<button role="menuitem" className="text-danger" onClick={() => setProjectConfirm(project)}>
<Trash2 size={16} />{vi.generated.ProjectsView_62_6}</button>
</Popover>
</div>
{projectStatus(project)==='waiting'?<StatusBadge value="waiting"/>:<span className="project-status">
  {projectStatus(project)==='done'&&<Check size={14} aria-hidden="true"/>}
  {PROJECT_STATUS_LABELS[projectStatus(project)]||PROJECT_STATUS_LABELS.running}
</span>}
<h3>{project.name}</h3>
<p>{project.description || vi.generated.ProjectsView_70_7}</p>
<ProgressBar value={projectProgress(data.tasks, project.id)} />
<p>{count}{vi.generated.ProjectsView_72_8}{project.dueDate ? formatDate(project.dueDate) : vi.generated.ProjectsView_72_9}</p>
<div className="project-card-actions">
<Button variant="secondary" onClick={() => {
                changeParam('projectId', project.id)
                setView('kanban')
              }}>{vi.generated.ProjectsView_77_10}</Button>
<Button variant="ghost" onClick={() => changeParam('project', project.id)}>{vi.generated.ProjectsView_78_11}</Button>
</div>
</Card>
        })}</div>{!visible.length&&<EmptyState
          title={vi.generated.ProjectsView_82_12}
          description={vi.generated.ProjectsView_83_13}
          action={<Button icon={Plus} onClick={()=>setProjectEditing({})}>{vi.generated.ProjectsView_84_14}</Button>}
        />}</>}
    {projectEditing && <Drawer
      title={projectEditing.id ? vi.generated.ProjectsView_86_15 : vi.generated.ProjectsView_86_16}
      onClose={() => setProjectEditing(null)} actions={<>
<Button variant="secondary" onClick={() => setProjectEditing(null)}>{vi.generated.ProjectsView_87_17}</Button>
<Button type="submit" form={projectFormId}>{vi.generated.ProjectsView_88_18}</Button>
</>}>
<ProjectForm
  formId={projectFormId} project={projectEditing} projects={data.projects}
  tasks={data.tasks} loading={loading} contacts={data.contacts} onSave={saveProject}
/>
</Drawer>}
    {selectedProject && !projectEditing && !editing && <Drawer title={selectedProject.name} onClose={() => changeParam('project', '')} actions={<>
<Button variant="secondary" onClick={() => setProjectEditing(selectedProject)}>{vi.generated.ProjectsView_96_19}</Button>
<Button icon={Plus} onClick={() => setEditing({
        projectId: selectedProject.id
      })}>{vi.generated.ProjectsView_99_20}</Button>
</>}>
<div className={`project-detail label-theme-${selectedProject.colorIndex||1}`}>
{projectStatus(selectedProject)==='waiting'
  ?<StatusBadge value="waiting"/>
  :<span className="project-status">{PROJECT_STATUS_LABELS[projectStatus(selectedProject)]}</span>}
{projectStatus(selectedProject)==='waiting'&&selectedProject.status!=='waiting'&&<p role="note">
<Clock3 size={16} aria-hidden="true" /> {vi.projects.autoWaiting}</p>}<p>{selectedProject.description || vi.generated.ProjectsView_106_21}</p>
<ProgressBar value={projectProgress(data.tasks, selectedProject.id)} />
<dl>
<div>
<dt>{vi.generated.ProjectsView_110_22}</dt>
<dd>{data.contacts.find(contact => contact.id === selectedProject.ownerId)?.fullName || vi.generated.ProjectsView_111_23}</dd>
</div>
<div>
<dt>{vi.generated.ProjectsView_114_24}</dt>
<dd>{selectedProject.startDate ? formatDate(selectedProject.startDate) : '—'} → {selectedProject.dueDate ? formatDate(selectedProject.dueDate) : '—'}</dd>
</div>
<div>
<dt>{vi.generated.ProjectsView_118_25}</dt>
<dd>{data.tasks.filter(task => task.projectId === selectedProject.id).length}</dd>
</div>
</dl>
<section className="related-block">
<h3>{vi.generated.ProjectsView_123_26}</h3>
{data.trips.filter(trip=>trip.projectId===selectedProject.id).map(trip=><p key={trip.id}>{trip.name}</p>)}
<h3>{vi.generated.ProjectsView_125_27}</h3>
{data.notes.filter(note=>note.links?.projectId===selectedProject.id).map(note=><p key={note.id}>{note.title}</p>)}
<Button variant="secondary" onClick={()=>navigate(`/so-tay?new=note&projectId=${selectedProject.id}`)}>{vi.generated.ProjectsView_127_28}</Button>
</section>
<div className="field">
<label htmlFor="bulk-project">{vi.generated.ProjectsView_132_29}</label>
<div className="field-inline">
<select id="bulk-project" value={moveTarget} onChange={event => setMoveTarget(event.target.value)}>
<option value="">{vi.generated.ProjectsView_135_30}</option>
{data.projects
  .filter(project=>project.id!==selectedProject.id&&projectStatus(project)!=='archived')
  .map(project=><option key={project.id} value={project.id}>{project.name}</option>)}</select>
<Button variant="secondary" disabled={!moveTarget} onClick={() => moveProjectTasks(selectedProject)}>{vi.generated.ProjectsView_139_31}</Button>
</div>
</div>
</div>
</Drawer>}
    {projectConfirm && <Modal title={vi.generated.ProjectsView_144_32} onClose={() => setProjectConfirm(null)} actions={<>
<Button variant="secondary" onClick={() => setProjectConfirm(null)}>{vi.generated.ProjectsView_145_33}</Button>
<Button variant="danger" onClick={deleteProject}>{vi.generated.ProjectsView_146_34}</Button>
</>}>
<p>{vi.generated.ProjectsView_148_35}{projectConfirm.name}{vi.generated.ProjectsView_149_36}{' '}
{data.tasks.filter(task=>task.projectId===projectConfirm.id).length}{vi.generated.ProjectsView_150_37}{' '}
{vi.generated.ProjectsView_151_38}</p>
<div className="field">
<label htmlFor="delete-project-target">{vi.generated.ProjectsView_154_39}</label>
<select id="delete-project-target" value={deleteTarget} onChange={event => setDeleteTarget(event.target.value)}>
<option value="">{vi.generated.ProjectsView_156_40}</option>
{data.projects
  .filter(project=>project.id!==projectConfirm.id&&projectStatus(project)!=='archived')
  .map(project=><option key={project.id} value={project.id}>{vi.generated.ProjectsView_159_41}{project.name}</option>)}</select>
</div>
</Modal>}
  </>
}
