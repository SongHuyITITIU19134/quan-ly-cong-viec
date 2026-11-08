const collections={task:'tasks',project:'projects',trip:'trips',contact:'contacts',notebook:'notebooks',note:'notes'}
const update=(collection,id,data)=>({type:'update',collection,id,data})
const remove=(collection,id)=>({type:'remove',collection,id})

const without=(values,id)=>(values||[]).filter(value=>value!==id)
const withoutLink=(links,key)=>{const next={...(links||{})};delete next[key];return next}

export function buildDeleteOps(kind,id,data){
  if(kind==='contact'&&id==='self')return[]
  const ops=[]
  if(kind==='project'){
    for(const task of data.tasks||[])if(task.projectId===id)ops.push(update('tasks',task.id,{projectId:null}))
    for(const trip of data.trips||[])if(trip.projectId===id)ops.push(update('trips',trip.id,{projectId:null}))
  }
  if(kind==='trip')for(const task of data.tasks||[])if(task.tripId===id)ops.push(update('tasks',task.id,{tripId:null,tripPhase:null}))
  if(kind==='contact'){
    for(const task of data.tasks||[]){
      const patch={}
      if(task.assignerId===id)patch.assignerId=null
      if(task.assigneeId===id)patch.assigneeId='self'
      if(task.collaboratorIds?.includes(id))patch.collaboratorIds=without(task.collaboratorIds,id)
      if(Object.keys(patch).length)ops.push(update('tasks',task.id,patch))
    }
    for(const trip of data.trips||[])if(trip.contactIds?.includes(id))ops.push(update('trips',trip.id,{contactIds:without(trip.contactIds,id)}))
    for(const project of data.projects||[])if(project.ownerId===id)ops.push(update('projects',project.id,{ownerId:null}))
  }
  const linkKey={task:'taskId',project:'projectId',trip:'tripId',contact:'contactId'}[kind]
  if(linkKey)for(const note of data.notes||[])if(note.links?.[linkKey]===id)ops.push(update('notes',note.id,{links:withoutLink(note.links,linkKey)}))
  if(kind==='notebook')for(const note of data.notes||[])if(note.notebookId===id)ops.push(remove('notes',note.id))
  const collection=collections[kind]
  if(collection)ops.push(remove(collection,id))
  return ops
}

export function buildRestoreOps(ops,data){
  const byCollection=new Map(Object.entries(data).map(([collection,items])=>[collection,new Map((items||[]).map(item=>[item.id,item]))]))
  return ops.map(op=>{const snapshot=byCollection.get(op.collection)?.get(op.id);return snapshot?{type:op.type==='remove'?'create':'update',collection:op.collection,id:op.id,data:snapshot}:null}).filter(Boolean).reverse()
}
