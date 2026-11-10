import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'

const demo=JSON.parse(await readFile(new URL('../docs/design/demo-data.json',import.meta.url),'utf8')).data
const empty={projects:[],tasks:[],contacts:[demo.contacts[0]],trips:[],notebooks:[],notes:[]}

const init=async(page,data=demo)=>{
  const issues=[]
  page.on('console',message=>{if(message.type()==='error')issues.push(`console: ${message.text()}`)})
  page.on('pageerror',error=>issues.push(`pageerror: ${error.message}`))
  page.on('requestfailed',request=>issues.push(`request: ${request.method()} ${request.url()} ${request.failure()?.errorText||''}`))
  await page.addInitScript(value=>{
    localStorage.setItem('nhip-viec-v1',JSON.stringify(value))
    localStorage.setItem('nhip-viec-notebooks',JSON.stringify(value.notebooks||[]))
    localStorage.setItem('nhip-viec-notes',JSON.stringify(value.notes||[]))
    localStorage.setItem('nhip-viec-initialized','true')
    localStorage.setItem('nhip-viec-settings',JSON.stringify({onboardingSeen:true,theme:'light'}))
  },data)
  return issues
}
const stored=async(page,collection,title)=>expect.poll(()=>page.evaluate(({key,value})=>JSON.parse(localStorage.getItem('nhip-viec-v1'))[key].some(item=>(item.title||item.name)===value),{key:collection,value:title})).toBe(true)
const saveTask=async(page,title)=>{
  const dialog=page.getByRole('dialog',{name:'Tạo nhiệm vụ'})
  await expect(dialog).toBeVisible()
  await dialog.getByLabel('Tên nhiệm vụ *').fill(title)
  await dialog.getByRole('button',{name:/^(Tạo|Lưu thay đổi)$/}).click()
  await stored(page,'tasks',title)
}
const expectClean=issues=>expect(issues).toEqual([])

test('nút Tạo nhiệm vụ ở shell tạo và hiển thị việc',async({page},testInfo)=>{
  test.skip(testInfo.project.name==='mobile-360','Shell desktop được thay bằng dock mobile')
  const issues=await init(page);await page.goto('/');await page.getByRole('button',{name:'Tạo nhiệm vụ'}).click()
  await saveTask(page,'U2c shell');await expect(page.getByText('U2c shell',{exact:true})).toBeVisible();expectClean(issues)
})

test('Công việc + Thêm việc tạo và hiển thị việc',async({page})=>{
  const issues=await init(page);await page.goto('/cong-viec');await expect(page.getByRole('heading',{name:'Công việc'})).toBeVisible()
  await page.getByRole('button',{name:'Thêm việc'}).click();await saveTask(page,'U2c tasks')
  await expect(page.getByRole('button',{name:'U2c tasks',exact:true})).toBeVisible();expectClean(issues)
})

test('Tổng quan rỗng tạo dự án đầu tiên',async({page})=>{
  const issues=await init(page,empty);await page.goto('/');await page.getByRole('button',{name:'Tạo dự án đầu tiên'}).click()
  const dialog=page.getByRole('dialog',{name:'Tạo dự án'});await dialog.getByLabel('Tên dự án *').fill('U2c empty project')
  await dialog.getByRole('button',{name:'Lưu dự án'}).click();await stored(page,'projects','U2c empty project')
  await expect(page.getByText('U2c empty project',{exact:true})).toBeVisible();expectClean(issues)
})

test('Tổng quan + Thêm việc tạo và hiển thị việc',async({page})=>{
  const issues=await init(page);await page.goto('/');await page.getByRole('button',{name:'Thêm việc'}).click()
  await saveTask(page,'U2c dashboard');await expect(page.getByRole('button',{name:'U2c dashboard',exact:true})).toBeVisible();expectClean(issues)
})

test('dock mobile + tạo dự án và nhiệm vụ',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='mobile-360','Nút giữa chỉ có trên mobile')
  const issues=await init(page);await page.goto('/');await page.getByRole('button',{name:'Tạo',exact:true}).click()
  const dialog=page.getByRole('dialog',{name:'Tạo dự án + nhiệm vụ'});await dialog.getByLabel('Tên dự án *').fill('U2c mobile project')
  await dialog.getByRole('button',{name:'Tiếp tục'}).click();await dialog.getByLabel('Tên nhiệm vụ *').fill('U2c mobile task')
  await dialog.getByRole('button',{name:'Tạo',exact:true}).click();await stored(page,'projects','U2c mobile project');await stored(page,'tasks','U2c mobile task');expectClean(issues)
})

test('Dự án + Tạo dự án tạo và hiển thị dự án',async({page})=>{
  const issues=await init(page);await page.goto('/cong-viec?view=projects');await page.getByRole('button',{name:'Tạo dự án'}).click()
  const dialog=page.getByRole('dialog',{name:'Tạo dự án'});await dialog.getByLabel('Tên dự án *').fill('U2c projects view')
  await dialog.getByRole('button',{name:'Lưu dự án'}).click();await stored(page,'projects','U2c projects view')
  await expect(page.getByText('U2c projects view',{exact:true})).toBeVisible();expectClean(issues)
})

test('phím N tạo và hiển thị nhiệm vụ',async({page})=>{
  const issues=await init(page);await page.goto('/cong-viec');await expect(page.getByRole('heading',{name:'Công việc'})).toBeVisible()
  await page.keyboard.press('n');await saveTask(page,'U2c keyboard')
  await expect(page.getByRole('button',{name:'U2c keyboard',exact:true})).toBeVisible();expectClean(issues)
})

test('lỗi lưu hiện trên drawer ở mọi viewport',async({page})=>{
  await init(page);await page.goto('/cong-viec');await expect(page.getByRole('heading',{name:'Công việc'})).toBeVisible()
  await page.getByRole('button',{name:'Thêm việc'}).click()
  const dialog=page.getByRole('dialog',{name:'Tạo nhiệm vụ'});await dialog.getByLabel('Tên nhiệm vụ *').fill('U2c mutation fail')
  await page.evaluate(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='nhip-viec-v1')throw new DOMException('U2c quota','QuotaExceededError');return original.call(this,key,value)}})
  await dialog.getByRole('button',{name:'Lưu thay đổi'}).click()
  const toast=page.locator('.toast').filter({hasText:'Không thể lưu'});await expect(toast).toBeVisible()
  await expect(dialog).toBeVisible()
  const layers=await page.evaluate(()=>({toast:Number(getComputedStyle(document.querySelector('.toast-stack')).zIndex),drawer:Number(getComputedStyle(document.querySelector('.drawer-layer')).zIndex)}))
  expect(layers.toast).toBeGreaterThan(layers.drawer)
})
