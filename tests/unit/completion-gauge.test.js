import { describe, expect, it } from 'vitest'
import { ACHIEVE_AT, getCompletionGauge } from '@/pages/dashboard/completionGauge'

describe('completion gauge mapping',()=>{
  it.each([
    [0,10,'danger',0],
    [1,10,'danger',10],
    [2,10,'warn',20],
    [5,10,'warn',50],
    [6,10,'ok',60],
    [7,10,'ok',70],
    [8,10,'good',80],
    [10,10,'achieved',100],
    [0,0,'empty',0]
  ])('%i/%i -> %s',(done,total,state,percent)=>expect(getCompletionGauge(done,total)).toMatchObject({done,total,state,percent}))

  it('xuất ngưỡng đạt mục tiêu để dễ thay đổi',()=>expect(ACHIEVE_AT).toBe(1))
})
