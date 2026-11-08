import { describe, expect, it } from 'vitest'
import { getProjectEffectiveStatus, isProjectFullyDone } from '@/lib/projectStatus'
import { sortProjectsCompletedLast } from '@/lib/sortProjects'

const project={id:'p',status:'running'}
const task=(status='done',projectId='p')=>({id:'t',projectId,status})

describe('trạng thái dự án suy ra',()=>{
 it('không có nhiệm vụ không được coi là hoàn thành',()=>{
  expect(isProjectFullyDone(project,[])).toBe(false)
  expect(getProjectEffectiveStatus(project,[])).toBe('running')
 })
 it.each(['running','paused'])('mọi nhiệm vụ done chuyển %s sang waiting',status=>{
  expect(getProjectEffectiveStatus({...project,status},[task(),{...task(),id:'t2'}])).toBe('waiting')
 })
 it('chỉ xét status nhiệm vụ, không đếm checklist hoặc progress',()=>{
  expect(getProjectEffectiveStatus(project,[{...task('doing'),progress:100,checklist:[{done:true}]}])).toBe('running')
  expect(getProjectEffectiveStatus(project,[{...task(),checklist:[{done:false}]}])).toBe('waiting')
 })
 it.each([{status:'done'},{status:'archived'},{status:'paused',archived:true}])('giữ nguyên hoàn thành thủ công/lưu trữ %j',fields=>{
  expect(getProjectEffectiveStatus({...project,...fields},[task()])).toBe(fields.status)
 })
 it('không lấy nhiệm vụ từ dự án khác hoặc nhiệm vụ không gắn dự án',()=>{
  expect(getProjectEffectiveStatus(project,[task('done','other'),task('done',null)])).toBe('running')
  expect(getProjectEffectiveStatus(project,[task(),task('doing','other')])).toBe('waiting')
  expect(isProjectFullyDone({},[{status:'done'}])).toBe(false)
 })
 it('đang tải hoặc chưa có danh sách nhiệm vụ dùng trạng thái lưu',()=>{
  expect(getProjectEffectiveStatus(project,[task()],{loading:true})).toBe('running')
  expect(getProjectEffectiveStatus(project,undefined)).toBe('running')
  expect(getProjectEffectiveStatus(project,null)).toBe('running')
 })
 it('mở lại, thêm hoặc chuyển việc chưa xong vào dự án tự hoàn nguyên',()=>{
  expect(getProjectEffectiveStatus(project,[task()])).toBe('waiting')
  expect(getProjectEffectiveStatus(project,[task('todo')])).toBe('running')
  expect(getProjectEffectiveStatus(project,[task(),{...task('todo'),id:'new'}])).toBe('running')
  const moved={...task('doing','other'),id:'moved'}
  expect(getProjectEffectiveStatus(project,[task(),moved])).toBe('waiting')
  expect(getProjectEffectiveStatus(project,[task(),{...moved,projectId:'p'}])).toBe('running')
 })
 it('xóa việc chưa xong cuối cùng chuyển sang waiting, xóa hết thì hoàn nguyên',()=>{
  expect(getProjectEffectiveStatus(project,[task(),{...task('todo'),id:'open'}])).toBe('running')
  expect(getProjectEffectiveStatus(project,[task()])).toBe('waiting')
  expect(getProjectEffectiveStatus(project,[])).toBe('running')
 })
 it('không sửa dữ liệu đầu vào và không xếp waiting xuống cuối',()=>{
  const frozen=Object.freeze({...project}),tasks=Object.freeze([Object.freeze(task())]),done={id:'done',status:'done'},paused={id:'paused',status:'paused'}
  expect(getProjectEffectiveStatus(frozen,tasks)).toBe('waiting')
  expect(frozen.status).toBe('running')
  expect(sortProjectsCompletedLast([done,frozen,paused],tasks).map(item=>item.id)).toEqual(['p','paused','done'])
 })
})
