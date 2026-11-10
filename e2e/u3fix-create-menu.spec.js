import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'

const demo=JSON.parse(await readFile(new URL('../docs/design/demo-data.json',import.meta.url),'utf8')).data
const choices=['Dự án','Nhiệm vụ','Dự án + nhiệm vụ']

test.beforeEach(async({page})=>{
  await page.addInitScript(value=>{
    localStorage.setItem('nhip-viec-v1',JSON.stringify(value))
    localStorage.setItem('nhip-viec-notebooks',JSON.stringify(value.notebooks||[]))
    localStorage.setItem('nhip-viec-notes',JSON.stringify(value.notes||[]))
    localStorage.setItem('nhip-viec-initialized','true')
    localStorage.setItem('nhip-viec-settings',JSON.stringify({onboardingSeen:true,theme:'light'}))
  },demo)
})

const expectChoices=async page=>expect(await page.getByRole('menuitem').allTextContents()).toEqual(choices)

test('sidebar và Tổng quan mở cùng menu ba lựa chọn',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='desktop-1280','Sidebar đầy đủ chỉ có ở desktop')
  await page.goto('/')
  await page.getByRole('button',{name:'Tạo mới'}).click();await expectChoices(page)
  await page.getByRole('menuitem',{name:'Nhiệm vụ',exact:true}).click();await expect(page.getByRole('dialog',{name:'Tạo nhiệm vụ'})).toBeVisible()
  await page.getByRole('dialog').getByRole('button',{name:'Đóng'}).click()
  await page.getByRole('button',{name:'Thêm việc'}).click();await expectChoices(page)
  await page.getByRole('menuitem',{name:'Dự án + nhiệm vụ'}).click();await expect(page.getByRole('dialog',{name:'Tạo dự án + nhiệm vụ'})).toBeVisible()
})

test('Công việc mở cùng menu và luồng tạo dự án hiện hữu',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='desktop-1280','Kiểm tra menu desktop')
  await page.goto('/cong-viec')
  await page.getByRole('button',{name:'Thêm việc'}).click();await expectChoices(page)
  await page.getByRole('menuitem',{name:'Dự án',exact:true}).click();await expect(page.getByRole('dialog',{name:'Tạo dự án'})).toBeVisible()
})
