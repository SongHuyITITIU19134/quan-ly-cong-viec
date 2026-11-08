import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import TaskCard from '@/components/task/TaskCard'

describe('nhãn trên thẻ nhiệm vụ',()=>{
  it('hiện hai chip và nút +N',()=>{render(<TaskCard task={{id:'t1',title:'Việc',status:'todo',priority:'medium',tags:['Một','Hai','Ba','Bốn']}} onOpen={vi.fn()} onStatus={vi.fn()} onToggle={vi.fn()} tagRegistry={{c:{một:1,hai:2,ba:3,bốn:4}}}/>);expect(screen.getByText('Một')).toBeInTheDocument();expect(screen.getByText('Hai')).toBeInTheDocument();expect(screen.queryByText('Ba')).not.toBeInTheDocument();expect(screen.getByRole('button',{name:'Xem thêm 2 nhãn'})).toHaveTextContent('+2')})
  it('chip bật/tắt filter mà không mở card',async()=>{const filter=vi.fn(),open=vi.fn();render(<TaskCard task={{id:'t1',title:'Việc',status:'todo',priority:'medium',tags:['Họp']}} onOpen={open} onStatus={vi.fn()} onToggle={vi.fn()} onTagToggle={filter} selectedTags={[]} tagRegistry={{c:{họp:1}}}/>);await userEvent.click(screen.getByRole('button',{name:'Họp'}));expect(filter).toHaveBeenCalledWith('họp');expect(open).not.toHaveBeenCalled()})
})
