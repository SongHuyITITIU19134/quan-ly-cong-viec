import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TripForm } from '@/pages/Trips'
import { compareTrips, findTripOverlaps, formatTripRange, normalizeTrip, tripDaySession } from '@/lib/trips'

vi.mock('@/hooks/useData',()=>({useData:()=>({data:{projects:[],tasks:[],contacts:[],trips:[]}})}))

const trip=(fields={})=>({id:'a',name:'Họp',location:'Hà Nội',startDate:'2026-10-26',endDate:'2026-10-26',...fields})

describe('buổi công tác',()=>{
  it('chuẩn hóa dữ liệu cũ thành cả ngày',()=>expect(normalizeTrip(trip())).toMatchObject({completed:false,completedAt:null,startSession:'sang',endSession:'chieu'}))
  it('phân biệt giao nhau theo nửa ngày',()=>{expect(findTripOverlaps([trip({endSession:'sang'}),trip({id:'b',startSession:'chieu'})])).toHaveLength(0);expect(findTripOverlaps([trip(),trip({id:'b',startSession:'chieu'})])).toHaveLength(1)})
  it('bỏ chuyến hoàn thành và lọc overlap theo ngày',()=>{const trips=[trip({endDate:'2026-10-28'}),trip({id:'b',startDate:'2026-10-27',endDate:'2026-10-29'})];expect(findTripOverlaps(trips,'2026-10-26')).toHaveLength(0);expect(findTripOverlaps(trips,'2026-10-27')).toHaveLength(1);expect(findTripOverlaps([{...trips[0],completed:true},trips[1]])).toHaveLength(0)})
  it('định dạng, xác định buổi và sắp xếp',()=>{const value=trip({endDate:'2026-10-28',startSession:'chieu',endSession:'sang'});expect(formatTripRange(value,{short:true})).toBe('26/10 (Chiều) → 28/10 (Sáng)');expect(['2026-10-26','2026-10-27','2026-10-28'].map(date=>tripDaySession(value,date))).toEqual(['Chiều','','Sáng']);expect([trip({id:'b',startSession:'chieu'}),trip()].sort(compareTrips).map(item=>item.id)).toEqual(['a','b'])})
  it('chặn Chiều đến Sáng trong cùng ngày',()=>{const save=vi.fn(),{container}=render(<TripForm trip={trip()} onSave={save}/>);fireEvent.click(within(screen.getByRole('group',{name:'Buổi đi'})).getByLabelText('Chiều'));const end=within(screen.getByRole('group',{name:'Buổi về'})).getByLabelText('Sáng');fireEvent.click(end);fireEvent.submit(container.querySelector('form'));expect(save).not.toHaveBeenCalled();expect(screen.getByRole('alert')).toHaveTextContent('Buổi về phải bằng hoặc sau buổi đi')})
  it('cho phép Chiều đến Sáng ngày tiếp theo',()=>{const save=vi.fn().mockResolvedValue(true),{container}=render(<TripForm trip={trip({endDate:'2026-10-27',startSession:'chieu',endSession:'sang'})} onSave={save}/>);fireEvent.submit(container.querySelector('form'));expect(save).toHaveBeenCalledWith(expect.objectContaining({startSession:'chieu',endSession:'sang'}))})
  it('lưu dự án và nhiều liên hệ',async()=>{const save=vi.fn().mockResolvedValue(true),{container}=render(<TripForm trip={trip()} projects={[{id:'p1',name:'Dự án'}]} contacts={[{id:'c1',fullName:'An'},{id:'c2',fullName:'Bình'}]} onSave={save}/>);await userEvent.selectOptions(screen.getByLabelText('Dự án'),'p1');await userEvent.selectOptions(screen.getByLabelText('Liên hệ tham gia'),['c1','c2']);fireEvent.submit(container.querySelector('form'));await waitFor(()=>expect(save).toHaveBeenCalledWith(expect.objectContaining({projectId:'p1',contactIds:['c1','c2']})))})
})
