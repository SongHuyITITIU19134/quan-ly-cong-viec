import { test, expect } from '@playwright/test'
import { makeDemoData } from '../scripts/make-demo-data.mjs'

const demo=makeDemoData().data
demo.notebooks=[
  {id:'book-plan',name:'Kế hoạch ra mắt',color:5,pinned:true,archived:false,createdAt:new Date().toISOString()},
  {id:'book-meeting',name:'Ghi chép cuộc họp',color:2,pinned:false,archived:false,createdAt:new Date().toISOString()},
]
demo.notes=[
  {id:'note-1',notebookId:'book-plan',title:'Checklist phát hành',body:'Chốt nội dung và lịch phát hành.',tags:['Ra mắt'],pinned:true,links:{}},
  {id:'note-2',notebookId:'book-plan',title:'Thông điệp chính',body:'Ngắn gọn, rõ lợi ích.',tags:[],pinned:false,links:{}},
]

test.beforeEach(async({page})=>{
  await page.addInitScript(value=>{
    localStorage.setItem('nhip-viec-v1',JSON.stringify(value))
    localStorage.setItem('nhip-viec-notebooks',JSON.stringify(value.notebooks))
    localStorage.setItem('nhip-viec-notes',JSON.stringify(value.notes))
    localStorage.setItem('nhip-viec-initialized','true')
    localStorage.setItem('nhip-viec-settings',JSON.stringify({onboardingSeen:true,theme:'light'}))
    localStorage.setItem('nhip-viec-theme','light')
  },demo)
})

test('chi tiết danh bạ hiển thị hồ sơ và việc liên quan',async({page})=>{
  await page.goto('/danh-ba')
  await page.getByRole('button',{name:/Lan Anh/}).click()
  const detail=page.getByRole('dialog',{name:'Lan Anh'})
  await expect(detail).toContainText('Sản phẩm')
  await expect(detail).toContainText('Phỏng vấn khách hàng')
  await expect(detail.getByRole('link',{name:'lan@example.com'})).toBeVisible()
})

test('thẻ sổ tay hiển thị trạng thái ghim và số ghi chú',async({page})=>{
  await page.goto('/so-tay')
  const card=page.locator('.notebook-card',{hasText:'Kế hoạch ra mắt'})
  await expect(card).toHaveClass(/is-pinned/)
  await expect(card).toContainText('2 ghi chú')
})

test('thêm nhanh ghi chú trong sổ tay',async({page})=>{
  await page.goto('/so-tay/book-plan')
  const input=page.getByLabel('Thêm nhanh ghi chú')
  await input.fill('Ý tưởng nội dung mới')
  await input.press('Enter')
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('nhip-viec-notes')).some(note=>note.title==='Ý tưởng nội dung mới'))).toBe(true)
})
