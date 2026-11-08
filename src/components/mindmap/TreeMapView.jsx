import { useEffect, useMemo, useRef, useState } from 'react'
import { Flag, Plane, X } from 'lucide-react'
import { formatDate } from '@/lib/dates'
import { vi } from '@/i18n/vi'
import { squarify } from './squarify'

const percent=(value,total)=>`${total?value/total*100:0}%`
const position=(item,width,height)=>({left:percent(item.x,width),top:percent(item.y,height),width:percent(item.width,width),height:percent(item.height,height)})

function useSize(){
  const ref=useRef(null),[size,setSize]=useState({width:1000,height:600})
  useEffect(()=>{const node=ref.current;if(!node)return undefined;const measure=()=>{const box=node.getBoundingClientRect();if(box.width&&box.height)setSize({width:box.width,height:box.height})};measure();if(typeof ResizeObserver==='undefined')return undefined;const observer=new ResizeObserver(measure);observer.observe(node);return()=>observer.disconnect()},[])
  return[ref,size]
}

function StatusBlock({group,box,canvas,onTask,mobile}){
  const[moreOpen,setMoreOpen]=useState(false),header=38,bodyHeight=Math.max(1,box.height-header),all=group.allItems||group.items
  const initial=squarify(all.map(task=>({...task,weight:1})),{x:0,y:0,width:box.width,height:bodyHeight})
  const minWidth=mobile?88:64,minHeight=mobile?52:40,visibleIds=new Set(initial.filter(tile=>tile.width>=minWidth&&tile.height>=minHeight).map(tile=>tile.id))
  const visible=all.filter(task=>visibleIds.has(task.id)),hidden=all.filter(task=>!visibleIds.has(task.id))
  const tiles=squarify([...visible.map(task=>({...task,kind:'task',weight:1})),...(hidden.length?[{id:'__more__',kind:'more',weight:Math.max(1,hidden.length)}]:[])],{x:0,y:0,width:box.width,height:bodyHeight})
  return <section className={`tm-status-block tm-${group.status}`} style={position(box,canvas.width,canvas.height)}><h3>{group.label} · {group.count}</h3><div className="tm-block-body">{tiles.map(tile=>tile.kind==='more'?<button type="button" className="tm-task-tile tm-more-tile" style={position(tile,box.width,bodyHeight)} key={tile.id} onClick={()=>setMoreOpen(true)}>+{hidden.length} nữa</button>:<button type="button" className="tm-task-tile" style={position(tile,box.width,bodyHeight)} key={tile.id} title={tile.title} aria-label={`${tile.title}, ${group.label}`} onClick={()=>onTask(tile)}><strong>{tile.title}</strong>{tile.width>=110&&tile.height>=64&&<small>{formatDate(tile.dueDate)}{tile.priority&&<Flag size={12} aria-label={`Ưu tiên ${vi.priority[tile.priority]||tile.priority}`}/>}</small>}</button>)}{moreOpen&&<div className="tm-overflow-popover" role="dialog" aria-label={`Nhiệm vụ ${group.label}`}><button type="button" className="tm-popover-close" aria-label="Đóng" onClick={()=>setMoreOpen(false)}><X size={16}/></button>{hidden.map(task=><button type="button" key={task.id} title={task.title} onClick={()=>onTask(task)}>{task.title}</button>)}</div>}</div></section>
}

function TripBlock({trips,box,canvas}){
  const all=trips.items||[],bodyHeight=Math.max(1,box.height-38),tiles=squarify(all.map(trip=>({...trip,weight:1})),{x:0,y:0,width:box.width,height:bodyHeight})
  return <section className="tm-status-block tm-trips" style={position(box,canvas.width,canvas.height)}><h3><Plane size={15}/> Công tác · {all.length+trips.more}</h3><div className="tm-block-body">{tiles.map(trip=><div className="tm-trip-tile" style={position(trip,box.width,bodyHeight)} key={trip.id} title={trip.name}><strong>{trip.name}</strong><small>{formatDate(trip.startDate)} – {formatDate(trip.endDate)}</small></div>)}{trips.more>0&&<span className="tm-trip-more">+{trips.more} nữa</span>}</div></section>
}

export default function TreeMapView({tree,selectedId,onSelect,onTask}){
  const[ref,size]=useSize(),selected=tree.projects.find(project=>project.id===selectedId),mobile=size.width<=480
  const projects=useMemo(()=>squarify(tree.projects.map(project=>({...project,weight:Math.max(1,project.taskCount)})),{x:0,y:0,width:size.width,height:size.height}),[tree.projects,size])
  const groups=selected?[...selected.statusGroups.map(group=>({...group,kind:'status',weight:group.count})),...((selected.trips.items.length+selected.trips.more)>0?[{id:'__trips__',kind:'trips',weight:selected.trips.items.length+selected.trips.more}]:[])]:[]
  const blocks=selected?squarify(groups,{x:0,y:0,width:size.width,height:size.height}):[]
  const noMatches=!selected&&tree.projects.some(project=>project.totalTaskCount>0)&&tree.projects.every(project=>project.taskCount===0)&&tree.projects.every(project=>project.trips.items.length===0)
  return <div className={`tree-map ${selected?'tree-map-detail':''}`}><div className="tm-breadcrumb">{selected?<button type="button" className="tree-map-back" onClick={()=>onSelect('')}>← {vi.mindMap.allProjects} › <span title={selected.name}>{selected.name}</span></button>:<strong>{vi.mindMap.allProjects}</strong>}</div><div className="tm-surface" ref={ref}>{noMatches?<p className="tm-empty">{vi.mindMap.noMatches}</p>:selected?blocks.map(block=>block.kind==='trips'?<TripBlock key={block.id} trips={selected.trips} box={block} canvas={size}/>:<StatusBlock key={block.status} group={block} box={block} canvas={size} onTask={onTask} mobile={mobile}/>):projects.map(project=><button type="button" className={`tree-map-project ${project.unlinked?'tm-unlinked':''}`} style={position(project,size.width,size.height)} key={project.id} title={project.name} aria-label={`${project.name}, ${project.taskCount} nhiệm vụ, ${project.progress}%`} aria-expanded="false" onClick={()=>onSelect(project.id)}><strong>{project.name}</strong><span>{project.unlinked?`${project.trips.items.length+project.trips.more} công tác`:`${project.taskCount} nhiệm vụ · ${project.progress}%`}</span><span className="tree-map-stripes" aria-hidden="true">{project.statusGroups.map(group=><i className={`tm-${group.status}`} style={{flexGrow:group.count}} key={group.status}/>)}{project.trips.items.length+project.trips.more>0&&<i className="tm-trips" style={{flexGrow:project.trips.items.length+project.trips.more}}/>}</span></button>)}</div></div>
}
