// Display-only status: never persist the result back to the project.
export function isProjectFullyDone(project,tasks,{loading=false}={}){
  if(loading||!project?.id||!Array.isArray(tasks))return false
  const own=tasks.filter(task=>task.projectId===project.id)
  return own.length>0&&own.every(task=>task.status==='done')
}

export function getProjectEffectiveStatus(project,tasks,options){
  if(project.status==='done'||project.status==='archived'||project.archived)return project.status
  return isProjectFullyDone(project,tasks,options)?'waiting':project.status
}
