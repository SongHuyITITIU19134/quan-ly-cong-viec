import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ProjectForm from '@/components/project/ProjectForm'

const project={id:'p',name:'Dự án A',status:'running',colorIndex:1}
const task={id:'t',projectId:'p',status:'done'}
const props={project,projects:[project],contacts:[],onSave:()=>{}}

describe('form trạng thái dự án',()=>{
 it('ẩn hai lựa chọn khi mọi việc done, rồi hiện lại khi mở lại/thêm việc',()=>{
  const {rerender}=render(<ProjectForm {...props} tasks={[task]}/>)
  const select=screen.getByLabelText('Trạng thái')
  expect(select).toHaveValue('waiting')
  expect(within(select).queryByRole('option',{name:'Đang thực hiện'})).not.toBeInTheDocument()
  expect(within(select).queryByRole('option',{name:'Tạm dừng'})).not.toBeInTheDocument()
  expect(within(select).getAllByRole('option')).toHaveLength(3)
  expect(screen.getByRole('note')).toHaveTextContent('Tất cả nhiệm vụ đã hoàn thành')
  expect(select).toHaveAttribute('aria-describedby',screen.getByRole('note').id)
  rerender(<ProjectForm {...props} tasks={[{...task,status:'todo'}]}/>)
  expect(select).toHaveValue('running')
  expect(within(select).getByRole('option',{name:'Đang thực hiện'})).toBeEnabled()
  expect(within(select).getByRole('option',{name:'Tạm dừng'})).toBeEnabled()
  expect(screen.queryByRole('note')).not.toBeInTheDocument()
  rerender(<ProjectForm {...props} tasks={[task,{...task,id:'new',status:'doing'}]}/>)
  expect(within(select).getByRole('option',{name:'Đang thực hiện'})).toBeEnabled()
 })
 it('loading không nháy waiting dù đã có mảng nhiệm vụ done',()=>{
  const {rerender}=render(<ProjectForm {...props} tasks={[task]} loading/>)
  expect(screen.getByLabelText('Trạng thái')).toHaveValue('running')
  expect(screen.queryByRole('note')).not.toBeInTheDocument()
  rerender(<ProjectForm {...props} tasks={[task]} loading={false}/>)
  expect(screen.getByLabelText('Trạng thái')).toHaveValue('waiting')
 })
 it('lưu metadata không ghi waiting hoặc trạng thái nền đang bị ẩn',()=>{
  const onSave=vi.fn(),{container}=render(<ProjectForm {...props} tasks={[task]} onSave={onSave}/>)
  fireEvent.change(screen.getByLabelText('Tên dự án *'),{target:{value:'Tên mới'}})
  fireEvent.submit(container.querySelector('form'))
  expect(onSave).toHaveBeenCalledOnce()
  const value=onSave.mock.calls[0][0]
  expect(value.name).toBe('Tên mới')
  expect(value).not.toHaveProperty('status')
  expect(value).not.toHaveProperty('archived')
 })
 it.each(['done','archived'])('cho phép người dùng chọn lưu %s rõ ràng',status=>{
  const onSave=vi.fn(),{container}=render(<ProjectForm {...props} tasks={[task]} onSave={onSave}/>)
  fireEvent.change(screen.getByLabelText('Trạng thái'),{target:{value:status}})
  fireEvent.submit(container.querySelector('form'))
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({status,archived:status==='archived'}))
 })
 it.each(['done','archived'])('giữ trạng thái %s đã lưu, không tự thay đổi hoặc tự gọi onSave',status=>{
  const onSave=vi.fn()
  render(<ProjectForm {...props} project={{...project,status}} tasks={[task]} onSave={onSave}/>)
  expect(screen.getByLabelText('Trạng thái')).toHaveValue(status)
  expect(screen.queryByRole('note')).not.toBeInTheDocument()
  expect(onSave).not.toHaveBeenCalled()
 })
})
