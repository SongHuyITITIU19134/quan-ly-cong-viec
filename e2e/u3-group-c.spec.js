import { test, expect } from '@playwright/test'
import { makeDemoData } from '../scripts/make-demo-data.mjs'

const demo=makeDemoData().data

test.beforeEach(async({page})=>{
  await page.addInitScript(value=>{
    localStorage.setItem('nhip-viec-v1',JSON.stringify(value))
    localStorage.setItem('nhip-viec-initialized','true')
    localStorage.setItem('nhip-viec-settings',JSON.stringify({onboardingSeen:true,theme:'light'}))
    localStorage.setItem('nhip-viec-theme','light')
  },demo)
})

test('Sơ đồ chuyển giữa mind map, tree-map và danh sách',async({page})=>{
  await page.goto('/so-do')
  await expect(page.locator('.mind-root')).toBeVisible()
  await page.getByRole('button',{name:'Tree-map'}).click()
  await expect(page.locator('.tree-map')).toBeVisible()
  await page.getByRole('button',{name:'Danh sách',exact:true}).click()
  await expect(page.locator('.mind-canvas.is-list')).toBeVisible()
})

test('Cài đặt có đủ bốn nhóm và lưu công tắc thông báo',async({page})=>{
  await page.goto('/cai-dat')
  for(const name of ['Giao diện','Dữ liệu','Thông báo','Tài khoản'])await expect(page.getByRole('region',{name:`Nhóm ${name}`})).toBeVisible()
  await page.getByLabel('Thông báo trong ứng dụng').uncheck()
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('nhip-viec-settings')).notifications)).toBe(false)
})

test('bảng lệnh báo trạng thái rỗng và đóng bằng Escape',async({page})=>{
  await page.goto('/')
  await page.keyboard.press('ControlOrMeta+k')
  const palette=page.getByRole('dialog',{name:'Bảng lệnh'})
  await palette.getByRole('combobox').fill('không có kết quả này')
  await expect(palette).toContainText('Không tìm thấy kết quả')
  await page.keyboard.press('Escape')
  await expect(palette).toBeHidden()
})
