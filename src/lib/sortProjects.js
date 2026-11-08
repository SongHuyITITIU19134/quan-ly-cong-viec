import { getProjectEffectiveStatus } from './projectStatus'

// Stable partition by effective status; derived waiting projects stay active.
export function sortProjectsCompletedLast(projects,tasks,options){
  return [
    ...projects.filter(project=>getProjectEffectiveStatus(project,tasks,options)!=='done'),
    ...projects.filter(project=>getProjectEffectiveStatus(project,tasks,options)==='done'),
  ]
}
