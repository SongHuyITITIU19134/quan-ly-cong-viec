import { test, expect } from '@playwright/test'

const seed={
  projects:[{id:'p1',name:'Dự án kiểm thử',description:'',colorIndex:1,status:'running',ownerId:'',startDate:'',dueDate:'',archived:false}],
  tasks:[
    {id:'t1',title:'Hoàn thiện số liệu báo cáo quy hoạch',description:'',projectId:'p1',status:'doing',priority:'high',startDate:'2020-01-01',dueDate:'2020-01-02',assigneeId:'self',checklist:[],progress:40,progressMode:'manual',order:1,tags:[]},
    {id:'t2',title:'Chốt phương án kệ kho',description:'',projectId:'p1',status:'todo',priority:'medium',startDate:'2020-01-01',dueDate:'2020-01-03',assigneeId:'self',checklist:[],progress:0,progressMode:'auto',order:2,tags:[]},
  ],
  contacts:[{id:'self',fullName:'Tôi',organization:'',title:'',phone:'',email:'',notes:'',isSelf:true}],
  trips:[],
}

test.beforeEach(async({page})=>{await page.addInitScript(value=>{localStorage.setItem('nhip-viec-v1',JSON.stringify(value));localStorage.setItem('nhip-viec-initialized','true')},seed);await page.goto('/')})
test('mở ứng dụng và giữ dữ liệu tự tạo', async ({ page }) => {
  await expect(page.getByRole('heading', { name: /Chào buổi sáng/ })).toBeVisible()
  await page.getByRole('button',{name:'Bảng tiếp theo'}).click()
  await expect(page.locator('.dashboard-project-card>strong',{hasText:'Dự án kiểm thử'})).toBeVisible()
  await page.reload()
  await page.getByRole('button',{name:'Bảng tiếp theo'}).click()
  await expect(page.locator('.dashboard-project-card>strong',{hasText:'Dự án kiểm thử'})).toBeVisible()
})
test('tạo nhiệm vụ bằng phím N và tìm không dấu',async({page})=>{await page.getByRole('link',{name:'Công việc'}).click();await expect(page.getByRole('heading',{name:'Công việc'})).toBeVisible();await page.keyboard.press('n');await page.getByLabel('Tên nhiệm vụ *').fill('Kiểm thử nhiệm vụ mới');await page.getByRole('button',{name:'Lưu thay đổi'}).click();await expect(page.getByRole('button',{name:'Kiểm thử nhiệm vụ mới',exact:true})).toBeVisible();await page.getByLabel('Tìm nhiệm vụ').fill('quy hoach');await expect(page.getByRole('button',{name:'Hoàn thiện số liệu báo cáo quy hoạch',exact:true})).toBeVisible()})
test('KPI quá hạn mở đúng bộ lọc',async({page})=>{await page.getByRole('button',{name:/Quá hạn/}).click();await expect(page).toHaveURL(/due=overdue/);await expect(page.getByRole('button',{name:'Hoàn thiện số liệu báo cáo quy hoạch',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Chốt phương án kệ kho',exact:true})).toBeVisible()})
test('chế độ tối được lưu và dock mở form trên mobile',async({page},testInfo)=>{const themeButton=page.getByRole('button',{name:'Chuyển sang giao diện tối'}).first();await themeButton.click();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await page.reload();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');if(testInfo.project.name==='mobile-360'){await page.getByRole('button',{name:'Tạo',exact:true}).click();await expect(page.getByRole('dialog',{name:'Tạo dự án + nhiệm vụ'})).toBeVisible()}})
test('dock và command palette hỗ trợ bàn phím, tìm không dấu',async({page})=>{const nav=page.getByRole('navigation',{name:'Điều hướng chính'});await expect(nav).toBeVisible();await expect(nav.getByRole('link',{name:'Tổng quan'})).toHaveAttribute('aria-current','page');const trigger=page.getByRole('button',{name:'Đi tới hôm nay'});await trigger.focus();await page.keyboard.press('ControlOrMeta+k');const dialog=page.getByRole('dialog',{name:'Bảng lệnh'}),search=dialog.getByRole('combobox');await expect(search).toBeFocused();await search.fill('quy hoach');await expect(dialog.getByRole('option',{name:/Hoàn thiện số liệu báo cáo quy hoạch/})).toBeVisible();await search.press('Escape');await expect(dialog).toBeHidden();await expect(trigger).toBeFocused()})
test('tôn trọng chế độ giảm chuyển động',async({page})=>{await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await expect.poll(()=>page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--motion-base').trim())).toBe('1ms');await expect(page.locator('.page')).toBeVisible()})
