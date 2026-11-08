export const completionSeries=(tasks=[],dates=[])=>dates.map(date=>tasks.filter(task=>task.status==='done'&&String(task.completedAt||task.updatedAt||'').slice(0,10)===date).length)
