import { BriefcaseBusiness, CheckSquare2, FolderKanban, Plane } from 'lucide-react'
import { formatDate } from '@/lib/dates'

function Label({children,title,meta}){return <span className="mind-label"><strong title={title}>{children}</strong>{meta&&<small>{meta}</small>}</span>}

export default function MindMapView({tree,expandedId,onExpand,onTask,onTrip,transform,onPointerDown,onPointerMove,onPointerUp,mobile=false}){
  return <div className={`mind-canvas ${mobile?'is-list':''}`} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
    <div className="mind-stage" style={{transform}}>
      <button type="button" className="mind-node mind-root" aria-expanded="true"><BriefcaseBusiness/><Label title={tree.name}>{tree.name}</Label></button>
      <div className="mind-children mind-projects">{tree.projects.map(project=>{const expanded=project.id===expandedId;return <div className="mind-project-row" key={project.id}>
        <button type="button" className="mind-node mind-project" aria-expanded={expanded} onClick={()=>onExpand(expanded?'':project.id)}><FolderKanban/><Label title={project.name} meta={project.unlinked?`${project.trips.items.length+project.trips.more} chuyến`:`${project.progress}% · ${project.totalTaskCount} nhiệm vụ`}>{project.name}</Label></button>
        {expanded&&<div className="mind-children mind-groups">
          {project.statusGroups.length>0&&<section className="mind-group-block"><button type="button" className="mind-node mind-group" aria-expanded="true"><CheckSquare2/><Label title="Nhiệm vụ" meta={`${project.taskCount} mục`}>Nhiệm vụ</Label></button><div className="mind-status-list">{project.statusGroups.map(group=><div className="mind-status-branch" key={group.status}><button type="button" className={`mind-node mind-status status-${group.status}`} aria-expanded="true"><Label title={group.label} meta={`${group.count}`}>{group.label}</Label></button><div className="mind-leaves">{group.items.map(task=><button type="button" className="mind-node mind-leaf" key={task.id} title={task.title} onClick={()=>onTask(task)}><Label title={task.title} meta={group.label}>{task.title}</Label></button>)}{group.more>0&&<span className="mind-more">+{group.more} nữa</span>}</div></div>)}</div></section>}
          {(project.trips.items.length>0||project.trips.more>0)&&<section className="mind-group-block"><button type="button" className="mind-node mind-group" aria-expanded="true"><Plane/><Label title="Công tác" meta={`${project.trips.items.length+project.trips.more} chuyến`}>Công tác</Label></button><div className="mind-leaves">{project.trips.items.map(trip=><button type="button" className="mind-node mind-leaf mind-trip" key={trip.id} title={trip.name} onClick={()=>onTrip(trip)}><Label title={trip.name} meta={`${formatDate(trip.startDate)} – ${formatDate(trip.endDate)}`}>{trip.name}</Label></button>)}{project.trips.more>0&&<span className="mind-more">+{project.trips.more} nữa</span>}</div></section>}
        </div>}
      </div>})}</div>
    </div>
  </div>
}
