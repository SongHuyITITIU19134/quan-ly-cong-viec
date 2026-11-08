import { test, expect } from '@playwright/test'

test.beforeEach(async({page})=>{await page.goto('/cong-viec');await page.evaluate(()=>{localStorage.clear();localStorage.setItem('nhip-viec-initialized','true');localStorage.setItem('nhip-viec-settings',JSON.stringify({onboardingSeen:true}))});await page.reload()})

test('drawer giữ nút lưu, focus và bảo vệ thay đổi chưa lưu',async({page})=>{
  await page.getByRole('button',{name:'Tạo nhiệm vụ'}).click()
  const drawer=page.getByRole('dialog',{name:'Tạo nhiệm vụ'})
  await expect(drawer).toBeVisible()
  await expect(page.getByLabel('Tên nhiệm vụ *')).toBeFocused()
  await expect(drawer.getByRole('button',{name:'Lưu thay đổi'})).toBeInViewport()
  await page.getByLabel('Tên nhiệm vụ *').fill('Nhiệm vụ chưa lưu')
  await page.keyboard.press('Escape')
  await expect(drawer.getByText('Bạn có thay đổi chưa lưu.')).toBeVisible()
  await drawer.getByRole('button',{name:'Tiếp tục chỉnh sửa'}).click()
  await page.keyboard.press('Escape')
  await drawer.getByRole('button',{name:'Bỏ thay đổi'}).click()
  await expect(drawer).toBeHidden()
})
