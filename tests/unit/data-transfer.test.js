import { describe, expect, it, vi } from 'vitest'
import { buildImportOps, buildJsonExport, dataToIcs, importPreview, parseJsonImport, runImportBatches, stringifyJsonExport, tasksToCsv } from '@/lib/dataTransfer'
import { IMPORT_FILE_MAX_BYTES } from '@/lib/limits'

const empty={projects:[],tasks:[],contacts:[],trips:[],notebooks:[],notes:[]}
const task={id:'t1',title:'Họp, "gấp"',status:'todo',priority:'high',progress:0,tags:['sale'],dueDate:'2026-11-08',seriesId:'root',repeat:{freq:'monthly',interval:1}}

describe('xuất nhập dữ liệu',()=>{
  it('vòng tròn giữ seriesId và repeat',()=>{const source={...empty,tasks:[task]},parsed=parseJsonImport(stringifyJsonExport(source,'2026-01-01')).data;expect(parsed.tasks[0].seriesId).toBe('root');expect(parsed.tasks[0].repeat).toEqual({freq:'monthly',interval:1})})
  it('JSON có schemaVersion và đủ collection',()=>{const value=buildJsonExport(empty);expect(value.schemaVersion).toBe(2);expect(Object.keys(value.data)).toEqual(['projects','tasks','contacts','trips','notebooks','notes'])})
  it('JSON loại uid và token khỏi item',()=>{const value=buildJsonExport({...empty,tasks:[{...task,uid:'u1',token:'secret'}]});expect(value.data.tasks[0]).not.toHaveProperty('uid');expect(value.data.tasks[0]).not.toHaveProperty('token')})
  it('báo lỗi JSON hỏng',()=>{expect(()=>parseJsonImport('{bad')).toThrow('Tệp JSON không hợp lệ')})
  it('báo lỗi schema tương lai',()=>{expect(()=>parseJsonImport('{"schemaVersion":99,"data":{}}')).toThrow('Phiên bản dữ liệu')})
  it('chặn tệp quá lớn',()=>{expect(()=>parseJsonImport('{}',{size:IMPORT_FILE_MAX_BYTES+1})).toThrow('vượt quá giới hạn')})
  it('preview đếm mục và ID trùng',()=>{const preview=importPreview({...empty,tasks:[task]},{...empty,tasks:[task]});expect(preview.total).toBe(1);expect(preview.conflicts).toEqual([{collection:'tasks',id:'t1'}])})
  it('bỏ qua ID trùng',()=>{expect(buildImportOps({...empty,tasks:[task]},{...empty,tasks:[task]},'skip')).toEqual([])})
  it('ghi đè ID trùng bằng update',()=>{expect(buildImportOps({...empty,tasks:[task]},{...empty,tasks:[task]},'overwrite')[0]).toMatchObject({type:'update',collection:'tasks',id:'t1'})})
  it('ID mới dùng create',()=>{expect(buildImportOps({...empty,tasks:[task]},empty)[0]).toMatchObject({type:'create',id:'t1'})})
  it('CSV có BOM và escape dấu phẩy, dấu nháy',()=>{const csv=tasksToCsv([task]);expect(csv.charCodeAt(0)).toBe(0xFEFF);expect(csv).toContain('"Họp, ""gấp"""');expect(csv).toContain('\r\n')})
  it('CSV chứa series và repeat',()=>{const csv=tasksToCsv([task]);expect(csv).toContain('"seriesId"');expect(csv).toContain('"root"');expect(csv).toContain('"{""freq"":""monthly"",""interval"":1}"')})
  it('ICS dùng CRLF và DTEND ngày kế tiếp',()=>{const ics=dataToIcs({...empty,tasks:[task]});expect(ics).toContain('DTSTART;VALUE=DATE:20261108\r\nDTEND;VALUE=DATE:20261109');expect(ics.split('\r\n').at(-1)).toBe('')})
  it('ICS escape dấu phẩy, chấm phẩy và xuống dòng',()=>{const ics=dataToIcs({...empty,trips:[{id:'x',name:'Đi A, B; C',location:'Hà Nội',purpose:'Dòng 1\nDòng 2',startDate:'2026-11-08',endDate:'2026-11-09'}]});expect(ics).toContain('SUMMARY:Đi A\\, B\\; C');expect(ics).toContain('DESCRIPTION:Dòng 1\\nDòng 2');expect(ics).toContain('DTEND;VALUE=DATE:20261110')})
  it('đếm item không hợp lệ thay vì ghi',()=>{const parsed=parseJsonImport(JSON.stringify({schemaVersion:2,data:{tasks:[{title:'thiếu id'}]}}));expect(parsed.invalid).toBe(1);expect(parsed.data.tasks).toEqual([])})
  it.each(['=SUM(A1:A2)','+cmd','-1','@name','\tformula'])('CSV vô hiệu hóa công thức %s',value=>{expect(tasksToCsv([{...task,title:value}])).toContain(`"'${value}"`)})
  it('nhập loại field ngoài schema trước khi tạo ops',()=>{const parsed=parseJsonImport(JSON.stringify({schemaVersion:2,data:{tasks:[{...task,unknown:'x',token:'secret',repeat:{...task.repeat,extra:true}}]}}));expect(parsed.data.tasks[0]).not.toHaveProperty('unknown');expect(parsed.data.tasks[0]).not.toHaveProperty('token');expect(parsed.data.tasks[0].repeat).toEqual(task.repeat)})
  it('kiểm tra hết tệp rồi chỉ giữ document hợp lệ',()=>{const parsed=parseJsonImport(JSON.stringify({schemaVersion:2,data:{tasks:[task,{id:'bad',title:''},task]}}));expect(parsed.invalid).toBe(1);expect(parsed.data.tasks.map(item=>item.id)).toEqual(['t1','t1'])})
  it('cloud chia hơn 450 thao tác thành nhiều đợt',async()=>{const write=vi.fn().mockResolvedValue(true),ops=Array.from({length:901},(_,index)=>({id:String(index)})),result=await runImportBatches(ops,write);expect(write).toHaveBeenCalledTimes(3);expect(write.mock.calls.map(call=>call[0].length)).toEqual([450,450,1]);expect(result).toEqual({written:901,batches:3})})
  it('dừng khi đợt lỗi và báo số mục đã ghi',async()=>{const write=vi.fn().mockResolvedValueOnce(true).mockRejectedValueOnce(new Error('quota')),ops=Array.from({length:500},(_,index)=>({id:String(index)}));await expect(runImportBatches(ops,write)).rejects.toMatchObject({message:'Đợt 2/2 lỗi; đã ghi 450 mục',written:450});expect(write).toHaveBeenCalledTimes(2)})
})
