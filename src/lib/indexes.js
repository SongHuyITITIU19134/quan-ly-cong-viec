const addToMap = (map, key, value) => {
  if (!key) return
  const items = map.get(key)
  if (items) items.push(value)
  else map.set(key, [value])
}

const nextDay = value => {
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day + 1)
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()].map(part => String(part).padStart(2, '0')).join('-')
}

export const indexById = items => new Map(items.map(item => [item.id, item]))

export function buildIndexes(data) {
  const tasks = data.tasks || [], trips = data.trips || [], contacts = data.contacts || []
  const tasksByDue = new Map(), tasksByProject = new Map(), tripsByDay = new Map(), contactRelations = new Map()
  const relationFor = id => {
    if (!contactRelations.has(id)) contactRelations.set(id, { assign: [], assignee: [], collab: [], trips: [], notes: [] })
    return contactRelations.get(id)
  }
  for (const contact of contacts) relationFor(contact.id)
  for (const task of tasks) {
    addToMap(tasksByDue, task.dueDate, task)
    addToMap(tasksByProject, task.projectId, task)
    if (task.assignerId) relationFor(task.assignerId).assign.push(task)
    if (task.assigneeId) relationFor(task.assigneeId).assignee.push(task)
    for (const id of task.collaboratorIds || []) relationFor(id).collab.push(task)
  }
  for (const trip of trips) {
    if (trip.startDate && trip.endDate) {
      for (let day = trip.startDate; day <= trip.endDate; day = nextDay(day)) addToMap(tripsByDay, day, trip)
    }
    for (const id of trip.contactIds || []) relationFor(id).trips.push(trip)
  }
  for (const note of data.notes || []) {
    if (note.links?.contactId) relationFor(note.links.contactId).notes.push(note)
  }
  return {
    byId: {
      projects: indexById(data.projects || []), tasks: indexById(tasks), contacts: indexById(contacts), trips: indexById(trips),
    },
    tasksByDue,
    tasksByProject,
    tripsByDay,
    contactRelations,
  }
}
