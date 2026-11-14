import { test, expect } from '@playwright/test'
import { makeDemoData } from '../scripts/make-demo-data.mjs'

const demo = makeDemoData().data
const iso = date => date.toISOString().slice(0, 10)
const addDays = amount => { const date = new Date(); date.setHours(12, 0, 0, 0); date.setDate(date.getDate() + amount); return iso(date) }
const today = addDays(0)
const template = demo.tasks[0]
const workingTasks = [
  ['overdue', -1, 'urgent'], ['today', 0, 'high'], ['tomorrow', 1, 'medium'], ['future', 5, 'low'], ['no due', null, 'low']
].map(([id, offset, priority], order) => ({ ...template, id: `working-${id}`, title: `Nhiệm vụ ${id}`, status: 'doing',
  priority, dueDate: offset === null ? '' : addDays(offset), order: order + 1 }))
const data = { ...demo, tasks: workingTasks }

async function install(page, theme = 'light') {
  await page.addInitScript(({ value, selectedTheme }) => {
    localStorage.setItem('nhip-viec-v1', JSON.stringify(value))
    localStorage.setItem('nhip-viec-initialized', 'true')
    localStorage.setItem('nhip-viec-settings', JSON.stringify({ onboardingSeen: true, theme: selectedTheme }))
    localStorage.setItem('nhip-viec-theme', selectedTheme)
  }, { value: data, selectedTheme: theme })
}

test('panel có tiêu đề mới, các nhóm hạn và nút hoàn thành rỗng', async ({ page }) => {
  await install(page)
  await page.goto('/')
  const panel = page.getByRole('complementary', { name: 'Nhiệm vụ đang làm' })
  await expect(panel.getByRole('heading', { name: 'Nhiệm vụ đang làm' })).toBeVisible()
  for (const heading of ['Quá hạn', 'Hôm nay', 'Ngày mai', 'Chưa có hạn']) await expect(panel.getByRole('heading', { name: heading })).toHaveCount(1)
  const first = panel.locator('.timeline-item').first()
  await expect(first).toHaveClass(/is-next/)
  await expect(first.locator('button svg')).toHaveCount(0)
  await expect(first.getByRole('button')).toHaveAttribute('aria-pressed', 'false')
})

test('agenda Lịch giữ tiêu đề và sắp xếp theo ngày', async ({ page }) => {
  await install(page)
  await page.goto('/lich')
  const agenda = page.locator('.day-agenda')
  await expect(agenda).toHaveAttribute('aria-label', 'Ngày đã chọn')
  await expect(agenda.locator('.timeline-item')).toHaveCount(1)
  await expect(agenda.locator('input[type="date"]')).toHaveValue(today)
})

for (const theme of ['light', 'dark']) test(`Tổng quan 1280x720 không cuộn và chụp panel ${theme}`, async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1280')
  await page.setViewportSize({ width: 1280, height: 720 })
  await install(page, theme)
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
  const dimensions = await page.evaluate(() => ({ document: document.scrollingElement.scrollHeight <= innerHeight,
    main: document.querySelector('.main').scrollHeight <= document.querySelector('.main').clientHeight }))
  expect(dimensions).toEqual({ document: true, main: true })
  await page.screenshot({ path: `docs/design/u3fix7/dashboard-${theme}.png`, fullPage: false })
})
