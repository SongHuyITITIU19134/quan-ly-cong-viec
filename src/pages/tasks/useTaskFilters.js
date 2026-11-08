import { useEffect, useMemo, useState } from 'react'
import { STATUS_KEYS } from '@/i18n/vi'
import { applyFilters, sortTasks } from '@/lib/tasks'
export function useTaskFilters(data, params, setParams) {
  const q = params.get('q') || '',
    statusValue = params.get('status') || '',
    priorityValue = params.get('priority') || '',
    tagValue = params.get('tags') || '',
    projectId = params.get('projectId') || '',
    due = params.get('due') || '',
    sort = params.get('sort') || 'order'
  const [searchInput, setSearchInput] = useState(q)
  const status = useMemo(() => statusValue ? statusValue.split(',').filter(Boolean) : [], [statusValue])
  const priority = useMemo(() => priorityValue ? priorityValue.split(',').filter(Boolean) : [], [priorityValue])
  const tagFilters = useMemo(() => tagValue ? tagValue.split(',').filter(Boolean) : [], [tagValue])
  const filtered = useMemo(() => sortTasks(applyFilters(data.tasks, {
    q,
    status,
    priority,
    tags: tagFilters,
    projectId,
    due
  }), sort), [data.tasks, q, status, priority, tagFilters, projectId, due, sort])
  const grouped = useMemo(() => Object.fromEntries(STATUS_KEYS.map(key => [key, filtered.filter(task => task.status === key)])), [filtered])
  const hasFilters = Boolean(q || status.length || priority.length || tagFilters.length || projectId || due)
  useEffect(() => setSearchInput(q), [q])
  useEffect(() => {
    if (searchInput === q) return undefined
    const timer = window.setTimeout(() => {
      const next = new URLSearchParams(params)
      searchInput ? next.set('q', searchInput) : next.delete('q')
      setParams(next, {
        replace: true
      })
    }, 150)
    return () => window.clearTimeout(timer)
  }, [params, q, searchInput, setParams])
  const changeParam = (key, value) => {
    const next = new URLSearchParams(params)
    value ? next.set(key, value) : next.delete(key)
    setParams(next)
  }
  const toggleParamValue=(key,current,value)=>changeParam(
    key,
    current.includes(value)?current.filter(item=>item!==value).join(','):[...current,value].join(','),
  )
  return {
    q,
    status,
    priority,
    tagFilters,
    projectId,
    due,
    sort,
    searchInput,
    setSearchInput,
    filtered,
    grouped,
    hasFilters,
    changeParam,
    toggleParamValue
  }
}
