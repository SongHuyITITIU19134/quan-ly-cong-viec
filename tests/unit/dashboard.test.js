import { describe, expect, it } from 'vitest'
import { completionSeries } from '@/lib/dashboard'

describe('completionSeries',()=>{
  it('ưu tiên completedAt và dùng updatedAt cho dữ liệu cũ',()=>{
    const tasks=[{status:'done',completedAt:'2026-11-02T10:00:00Z',updatedAt:'2026-11-01T00:00:00Z'},{status:'done',updatedAt:'2026-11-01T12:00:00Z'},{status:'doing',updatedAt:'2026-11-02T12:00:00Z'}]
    expect(completionSeries(tasks,['2026-11-01','2026-11-02'])).toEqual([1,1])
  })
})
