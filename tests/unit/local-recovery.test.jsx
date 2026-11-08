import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { localRepo } from '@/data/localRepo'
import { migrateData } from '@/lib/projects'
import Dashboard from '@/pages/Dashboard'

vi.mock('@/lib/projects',async importOriginal=>{const actual=await importOriginal();return {...actual,migrateData:vi.fn(actual.migrateData)}})
const dashboardData={projects:[],tasks:[{id:'t',title:'Việc',status:'todo',dueDate:'2099-01-01'}],contacts:[],trips:[]}
vi.mock('@/hooks/useData',()=>({
  useData:()=>({data:dashboardData,update:vi.fn(),toast:vi.fn()}),
  useDataState:()=>({data:dashboardData,loading:false}),
  useActions:()=>({batch:vi.fn()}),
  useToast:()=>vi.fn(),
}))
vi.mock('@/app/App',()=>({Page:({children})=><main>{children}</main>,Header:()=>null}))
vi.mock('@/hooks/useTransitionNavigate',()=>({useTransitionNavigate:()=>vi.fn()}))
vi.mock('@/hooks/useCountUp',()=>({useCountUp:()=>({current:null})}))

const KEY='nhip-viec-v1'
const self={id:'self',fullName:'Tôi',isSelf:true}
const empty={projects:[],tasks:[],contacts:[],trips:[]},initialized={...empty,contacts:[self]}
const read=()=>{let result;const off=localRepo.subscribe('*',data=>{result=data});off();return result}
beforeEach(()=>{localStorage.clear()})
afterEach(()=>{cleanup();vi.restoreAllMocks()})

describe('bảo vệ dữ liệu local',()=>{
 it('giữ JSON hỏng, sao lưu và chặn ghi đè',()=>{
  localStorage.setItem(KEY,'{broken')
  expect(read().recoveryError).toBeTruthy()
  const backup=Object.keys(localStorage).find(key=>key.startsWith(`${KEY}.corrupt-`))
  expect(localStorage.getItem(backup)).toBe('{broken')
  expect(()=>localRepo.create('tasks',{title:'Không ghi'})).toThrow()
  expect(localStorage.getItem(KEY)).toBe('{broken')
  expect(localStorage.getItem('nhip-viec-initialized')).toBeNull()
 })
 it('chuỗi rỗng là lỗi, không tạo dữ liệu hoặc backup rỗng',()=>{
  localStorage.setItem(KEY,'')
  expect(read()).toEqual({...empty,notebooks:[],notes:[],recoveryError:expect.any(String)})
  expect(localStorage.getItem(KEY)).toBe('');expect(localStorage.length).toBe(1)
 })
 it('lỗi getItem không ghi bất cứ khóa nào',()=>{
  vi.spyOn(Storage.prototype,'getItem').mockImplementation(()=>{throw new Error('blocked')})
  const write=vi.spyOn(Storage.prototype,'setItem')
  expect(read().recoveryError).toBeTruthy();expect(write).not.toHaveBeenCalled()
 })
 it('lỗi migration không sửa dữ liệu gốc',()=>{
  const raw=JSON.stringify(empty);localStorage.setItem(KEY,raw)
  vi.mocked(migrateData).mockImplementationOnce(()=>{throw new Error('migration failed')})
  const write=vi.spyOn(Storage.prototype,'setItem')
  expect(read().recoveryError).toBeTruthy();expect(write).not.toHaveBeenCalled();expect(localStorage.getItem(KEY)).toBe(raw)
 })
 it('sao lưu trước migration đúng một lần và giữ tên dài',()=>{
  const name='  '+ 'Dự án dài '.repeat(12)+'  ',raw=JSON.stringify({...empty,projects:[{id:'p',name}]})
  localStorage.setItem(KEY,raw);expect(read().projects[0].name).toBe(name)
  expect(localStorage.getItem(`${KEY}.pre-migration`)).toBe(raw)
  read();expect(localStorage.getItem(`${KEY}.pre-migration`)).toBe(raw)
 })
 it('backup thất bại không ghi đè dữ liệu đang có',()=>{
  const raw=JSON.stringify(empty);localStorage.setItem(KEY,raw)
  vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('quota')})
  expect(read().recoveryError).toBeTruthy();expect(localStorage.getItem(KEY)).toBe(raw)
 })
 it('lần đầu giữ cấu trúc lõi rỗng và seed riêng sổ tay; tải lại không đổi',()=>{
  const first=read();expect(first).toEqual(expect.objectContaining(initialized));expect(first.notebooks).toHaveLength(1);expect(first.notes).toHaveLength(2);const raw=localStorage.getItem(KEY)
  expect(JSON.parse(raw)).toEqual(initialized);expect(localStorage.getItem('nhip-viec-initialized')).toBe('true')
  expect(read().notebooks).toHaveLength(1);expect(localStorage.getItem(KEY)).toBe(raw)
  localStorage.removeItem(KEY)
  expect(read()).toEqual(expect.objectContaining(initialized));expect(JSON.parse(localStorage.getItem(KEY))).toEqual(initialized)
 })
 it('xóa hết nhiệm vụ rồi tải lại vẫn trống',async()=>{
  await localRepo.create('tasks',{id:'only',title:'Việc duy nhất'});await localRepo.remove('tasks','only')
  expect(read().tasks).toEqual([]);expect(read().tasks).toEqual([])
 })
 it('khử trùng dự án chuỗi theo tên trim, entity theo id; migration idempotent',()=>{
  const input={...empty,projects:[' Dự án A ','Dự án A','Dự án B',{id:'p',name:'Gốc'},{id:'p',name:'Trùng'}]}
  const once=migrateData(input)
  expect(once.projects.map(project=>project.name)).toEqual(['Dự án A','Dự án B','Gốc'])
  expect(migrateData(once)).toEqual(once)
 })
 it('lưu kỳ Dashboard qua remount; giá trị sai quay về tuần',()=>{
  const first=render(<Dashboard/>);const select=screen.getByLabelText('Phạm vi báo cáo')
  expect(select.value).toBe('week');fireEvent.change(select,{target:{value:'month'}})
  expect(localStorage.getItem('nhip-viec-period')).toBe('month')
  first.unmount();const second=render(<Dashboard/>);expect(screen.getByLabelText('Phạm vi báo cáo').value).toBe('month')
  second.unmount();localStorage.setItem('nhip-viec-period','invalid');render(<Dashboard/>);expect(screen.getByLabelText('Phạm vi báo cáo').value).toBe('week')
 })
})
