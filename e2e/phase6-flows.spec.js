import { test, expect } from '@playwright/test'

const isoDate=offset=>{const value=new Date();value.setDate(value.getDate()+offset);return value.toISOString().slice(0,10)}
const seed=()=>({
  projects:[{id:'p1',name:'Dự án nền',description:'',colorIndex:1,status:'running',ownerId:'',startDate:'',dueDate:'',archived:false}],
  tasks:[
    {id:'t1',title:'Việc lịch',description:'',projectId:'p1',status:'todo',priority:'medium',startDate:isoDate(0),dueDate:isoDate(0),assigneeId:'self',assignerId:'',collaboratorIds:[],checklist:[],progress:0,progressMode:'auto',order:1,tags:['chung']},
    {id:'repeat-base',seriesId:'repeat-base',title:'Việc lặp',description:'',projectId:'p1',status:'todo',priority:'high',startDate:isoDate(0),dueDate:isoDate(0),assigneeId:'self',assignerId:'',collaboratorIds:[],checklist:[{id:'c1',text:'Kiểm tra',done:true}],progress:0,progressMode:'auto',order:2,tags:[],repeat:{freq:'daily',interval:1}},
  ],
  contacts:[{id:'self',fullName:'Tôi',organization:'',title:'',phone:'',email:'',notes:'',isSelf:true}],
  trips:[{id:'r1',name:'Chuyến nền',location:'Hà Nội',purpose:'Kiểm thử',startDate:isoDate(1),endDate:isoDate(2),startSession:'morning',endSession:'afternoon',projectId:'p1',contactIds:[],color:'#2563eb'}],
  notebooks:[{id:'b1',name:'Sổ kiểm thử',color:0,pinned:false,archived:false}],
  notes:[{id:'n1',notebookId:'b1',title:'Ghi chú liên kết',body:'Nội dung',tags:['chung'],pinned:false,links:{projectId:'p1'}}],
})

test.beforeEach(async({page})=>{
  await page.addInitScript(value=>{localStorage.setItem('nhip-viec-v1',JSON.stringify(value));localStorage.setItem('nhip-viec-notebooks',JSON.stringify(value.notebooks));localStorage.setItem('nhip-viec-notes',JSON.stringify(value.notes));localStorage.setItem('nhip-viec-initialized','true')},seed())
  await page.goto('/')
  await expect(page.locator('.page h1')).toBeVisible()
})

test('dự án → task → kéo Kanban và menu chuyển trạng thái',async({page})=>{
  await page.goto('/cong-viec')
  await page.getByRole('tab',{name:'Dự án'}).click()
  await page.getByRole('button',{name:'Tạo dự án'}).first().click()
  await page.getByLabel('Tên dự án *').fill('Dự án E2E')
  await page.getByRole('button',{name:'Lưu dự án'}).click()
  await page.getByRole('tab',{name:'Kanban'}).click()
  await page.keyboard.press('n')
  await page.getByLabel('Tên nhiệm vụ *').fill('Task E2E')
  await page.getByText('Liên kết',{exact:true}).click()
  await page.getByLabel('Dự án',{exact:true}).selectOption({label:'Dự án E2E'})
  await page.getByRole('button',{name:'Lưu thay đổi'}).click()
  const shell=page.locator('.kanban-task-shell').filter({hasText:'Task E2E'})
  const doing=page.locator('.kanban-column').nth(1)
  const transfer=await page.evaluateHandle(()=>new DataTransfer())
  await shell.dispatchEvent('dragstart',{dataTransfer:transfer})
  await doing.dispatchEvent('drop',{dataTransfer:transfer})
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('nhip-viec-v1')).tasks.find(item=>item.title==='Task E2E').status)).toBe('doing')
  await shell.getByRole('button',{name:'Tùy chọn cho Task E2E'}).click()
  await page.getByRole('menuitem',{name:'Hoàn thành'}).click()
  await expect(page.locator('.toast').filter({hasText:'Đã chuyển Task E2E sang Hoàn thành.'})).toBeVisible()
  const task=await page.evaluate(()=>JSON.parse(localStorage.getItem('nhip-viec-v1')).tasks.find(item=>item.title==='Task E2E'))
  expect(task).toMatchObject({status:'done',progress:100})
  expect(task.completedAt).toBeTruthy()
})

test('lịch đổi hạn và hoàn tác → chuyến trùng lịch',async({page})=>{
  await page.goto('/lich')
  const due=page.getByLabel('Đổi ngày').first()
  await due.fill(isoDate(3))
  await page.getByRole('button',{name:'Hoàn tác'}).click()
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('nhip-viec-v1')).tasks.find(item=>item.id==='t1').dueDate)).toBe(isoDate(0))
  await page.goto('/cong-tac')
  await page.getByRole('button',{name:'Tạo chuyến',exact:true}).click()
  await page.getByLabel('Tên chuyến *').fill('Chuyến trùng')
  await page.getByLabel('Địa điểm *').fill('Đà Nẵng')
  await page.getByLabel('Ngày đi').fill(isoDate(1))
  await page.getByLabel('Ngày về').fill(isoDate(2))
  await page.getByRole('button',{name:'Lưu chuyến đi'}).click()
  await expect(page.locator('.warning-banner')).toContainText('lịch công tác trùng nhau')
})

test('ghi chú giữ backlinks và đổi nhãn cho task + note',async({page})=>{
  await page.goto('/so-tay/b1')
  await expect(page.getByText('Dự án: Dự án nền')).toBeVisible()
  await page.goto('/cong-viec')
  await page.getByRole('button',{name:'Lọc theo nhãn'}).click()
  await page.getByRole('button',{name:'Quản lý nhãn'}).click()
  await page.getByRole('button',{name:'Đổi tên chung'}).click()
  await page.getByLabel('Tên mới cho chung').fill('đã đổi')
  await page.getByRole('button',{name:'Lưu tên chung'}).click()
  await expect.poll(()=>page.evaluate(()=>{const data=JSON.parse(localStorage.getItem('nhip-viec-v1')),notes=JSON.parse(localStorage.getItem('nhip-viec-notes'));return [data.tasks.find(item=>item.id==='t1').tags,notes.find(item=>item.id==='n1').tags]})).toEqual([['đã đổi'],['đã đổi']])
})

test('xuất JSON → xóa local → nhập lại giữ repeat và seriesId',async({page})=>{
  await page.goto('/cai-dat')
  const downloadPromise=page.waitForEvent('download')
  await page.getByRole('button',{name:'Tải JSON'}).click()
  const download=await downloadPromise,path=await download.path()
  await page.getByRole('button',{name:'Xóa dữ liệu local'}).click()
  await page.getByLabel('Mã xác nhận').fill('XOA')
  const backupPromise=page.waitForEvent('download')
  await page.getByRole('button',{name:'Tải bản sao lưu và xóa'}).click()
  await backupPromise
  await page.getByLabel('Tệp JSON cần nhập').setInputFiles(path)
  await expect(page.getByRole('dialog',{name:'Xem trước dữ liệu nhập'})).toBeVisible()
  await page.getByRole('button',{name:'Nhập dữ liệu'}).click()
  const restored=await page.evaluate(()=>JSON.parse(localStorage.getItem('nhip-viec-v1')).tasks.find(item=>item.id==='repeat-base'))
  expect(restored).toMatchObject({seriesId:'repeat-base',repeat:{freq:'daily',interval:1}})
})

test('palette → cài đặt → hoàn thành và hoàn tác việc lặp',async({page})=>{
  await page.keyboard.press('ControlOrMeta+k')
  const palette=page.getByRole('dialog',{name:'Bảng lệnh'})
  await palette.getByRole('combobox').fill('cai dat')
  await palette.getByRole('option',{name:/Cài đặt/}).click()
  await expect(page).toHaveURL(/cai-dat/)
  await page.getByRole('combobox',{name:'Giao diện'}).selectOption('dark')
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark')
  await page.goto('/cong-viec')
  await page.getByRole('button',{name:'Tùy chọn cho Việc lặp'}).click()
  await page.getByRole('menuitem',{name:'Hoàn thành'}).click()
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('nhip-viec-v1')).tasks.some(item=>item.id.startsWith('repeat-base-r')))).toBe(true)
  await page.getByRole('button',{name:'Hoàn tác'}).click()
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('nhip-viec-v1')).tasks.some(item=>item.id.startsWith('repeat-base-r')))).toBe(false)
})
