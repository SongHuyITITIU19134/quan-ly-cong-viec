import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import TaskCard from '@/components/task/TaskCard'

describe('nhãn trên thẻ nhiệm vụ',()=>{
  it('hiện hai chip và nút +N',()=>{render(<TaskCard task={{id:'t1',title:'Việc',status:'todo',priority:'medium',tags:['Một','Hai','Ba','Bốn']}} onOpen={vi.fn()} onStatus={vi.fn()} onToggle={vi.fn()} tagRegistry={{c:{một:1,hai:2,ba:3,bốn:4}}}/>);expect(screen.getByText('Một')).toBeInTheDocument();expect(screen.getByText('Hai')).toBeInTheDocument();expect(screen.queryByText('Ba')).not.toBeInTheDocument();expect(screen.getByRole('button',{name:'Xem thêm 2 nhãn'})).toHaveTextContent('+2')})
  it('chip bật/tắt filter mà không mở card',async()=>{const filter=vi.fn(),open=vi.fn();render(<TaskCard task={{id:'t1',title:'Việc',status:'todo',priority:'medium',tags:['Họp']}} onOpen={open} onStatus={vi.fn()} onToggle={vi.fn()} onTagToggle={filter} selectedTags={[]} tagRegistry={{c:{họp:1}}}/>);await userEvent.click(screen.getByRole('button',{name:'Họp'}));expect(filter).toHaveBeenCalledWith('họp');expect(open).not.toHaveBeenCalled()})
  it('menu dấu ba chấm đổi trạng thái mà không có select riêng',async()=>{const onStatus=vi.fn();render(<TaskCard task={{id:'t1',title:'Việc',status:'todo',priority:'medium',tags:[]}} onOpen={vi.fn()} onStatus={onStatus} onToggle={vi.fn()} tagRegistry={{c:{}}}/>);expect(screen.queryByRole('combobox',{name:/Chuyển sang/u})).not.toBeInTheDocument();await userEvent.click(screen.getByRole('button',{name:'Tùy chọn cho Việc'}));await userEvent.click(screen.getByRole('menuitem',{name:'Hoàn thành'}));expect(onStatus).toHaveBeenCalledWith('done')})
})
