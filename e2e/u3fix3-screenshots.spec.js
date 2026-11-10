import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'

const demo=JSON.parse(await readFile(new URL('../docs/design/demo-data.json',import.meta.url),'utf8')).data

test('chụp các màn hình U3-fix3 ở 1280x720',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='desktop-1280','Chỉ tạo ảnh chuẩn desktop')
  await page.setViewportSize({width:1280,height:720})
  await page.addInitScript(value=>{
    localStorage.setItem('nhip-viec-v1',JSON.stringify(value))
    localStorage.setItem('nhip-viec-initialized','true')
    localStorage.setItem('nhip-viec-settings',JSON.stringify({onboardingSeen:true,theme:'light'}))
    localStorage.setItem('nhip-viec-theme','light')
  },demo)

  await page.goto('/')
  await expect(page.locator('.dashboard-layout')).toBeVisible()
  await page.screenshot({path:'docs/design/u3fix3/tong-quan-light.png',fullPage:false})

  await page.evaluate(()=>{
    const settings=JSON.parse(localStorage.getItem('nhip-viec-settings'))
    localStorage.setItem('nhip-viec-settings',JSON.stringify({...settings,theme:'dark'}))
    localStorage.setItem('nhip-viec-theme','dark')
  })
  await page.evaluate(()=>{
    document.documentElement.dataset.theme='dark'
    document.documentElement.style.colorScheme='dark'
  })
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark')
  await page.waitForTimeout(250)
  await page.screenshot({path:'docs/design/u3fix3/tong-quan-dark.png',fullPage:false})

  await page.evaluate(()=>{
    const settings=JSON.parse(localStorage.getItem('nhip-viec-settings'))
    localStorage.setItem('nhip-viec-settings',JSON.stringify({...settings,theme:'light'}))
    localStorage.setItem('nhip-viec-theme','light')
    document.documentElement.dataset.theme='light'
    document.documentElement.style.colorScheme='light'
  })
  await page.goto('/cong-viec')
  await page.getByRole('button',{name:/Xem thêm \d+ việc/u}).first().click()
  await expect(page.getByRole('button',{name:'Thu gọn'}).first()).toBeVisible()
  await page.evaluate(()=>{
    document.querySelector('.main').scrollTop=0
    document.querySelector('.kanban').scrollLeft=0
  })
  await page.screenshot({path:'docs/design/u3fix3/cong-viec-kanban-mo-rong.png',fullPage:false})

  await page.goto('/cong-viec?view=projects')
  await page.getByRole('button',{name:'Chi tiết',exact:true}).first().click()
  await expect(page.getByRole('heading',{name:'NHIỆM VỤ'})).toBeVisible()
  await page.waitForTimeout(250)
  await page.screenshot({path:'docs/design/u3fix3/chi-tiet-du-an.png',fullPage:false})
})
