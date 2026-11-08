import { describe, expect, it } from 'vitest'
import { onboardingSample } from '@/data/onboardingSample'
import { buildImportOps, parseJsonImport, stringifyJsonExport } from '@/lib/dataTransfer'

const empty={projects:[],tasks:[],contacts:[],trips:[],notebooks:[],notes:[]}

describe('dữ liệu mẫu onboarding',()=>{
  it('đi qua pipeline import và giữ liên kết cùng cấu hình lặp',()=>{
    const parsed=parseJsonImport(stringifyJsonExport(onboardingSample())).data
    const ops=buildImportOps(parsed,empty,'skip')
    expect(ops).toHaveLength(5)
    expect(parsed.tasks.find(task=>task.id==='sample-task-repeat')).toMatchObject({
      projectId:'sample-project',seriesId:'sample-task-repeat',repeat:{freq:'weekly',interval:1}
    })
    expect(parsed.notes[0].links).toEqual({projectId:'sample-project'})
  })
})
