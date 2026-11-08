import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks=vi.hoisted(()=>({batches:[],getDoc:vi.fn(),getDocs:vi.fn()}))
vi.mock('firebase/firestore',()=>({
  collection:(_db,...parts)=>parts.join('/'),doc:(_db,...parts)=>parts.join('/'),deleteDoc:vi.fn(),FieldPath:class FieldPath{constructor(...parts){this.parts=parts}},limit:value=>value,query:value=>value,setDoc:vi.fn(),onSnapshot:vi.fn(),serverTimestamp:()=>({server:true}),
  getDoc:mocks.getDoc,getDocs:mocks.getDocs,
  writeBatch:()=>{const operations=[];const batch={set:vi.fn((path,value,options)=>operations.push({path,value,options})),delete:vi.fn(),commit:vi.fn(async()=>{})};mocks.batches.push({batch,operations});return batch},
}))
vi.mock('@/data/firebase',()=>({auth:{currentUser:{uid:'u1',displayName:'An'}},firestore:{}}))
vi.mock('@/lib/projects',()=>({migrateData:value=>value}))
import { firebaseRepo } from '@/data/firebaseRepo'

const empty=()=>({empty:true,docs:[]})
describe('khởi tạo và nhập Firebase',()=>{
  beforeEach(()=>{localStorage.clear();mocks.batches.length=0;mocks.getDoc.mockReset();mocks.getDocs.mockReset()})
  it('đăng nhập lần đầu chỉ tạo contact self',async()=>{
    mocks.getDocs.mockResolvedValue(empty())
    expect(await firebaseRepo.prepareUserData('u1')).toBe(true)
    expect(mocks.batches[0].operations).toEqual([expect.objectContaining({path:'users/u1/contacts/self',value:{id:'self',fullName:'An',isSelf:true}})])
  })
  it('không ghi lại contact self đã tồn tại',async()=>{mocks.getDocs.mockImplementation(path=>Promise.resolve(path.endsWith('/contacts')?{docs:[{id:'self',data:()=>({fullName:'An',isSelf:true})}]}:empty()));expect(await firebaseRepo.prepareUserData('u1')).toBe(false);expect(mocks.batches).toHaveLength(0)})
  it('nhập local nhưng bỏ qua ID đã có',async()=>{
    localStorage.setItem('nhip-viec-v1',JSON.stringify({projects:[{name:''}],tasks:[{id:'old',title:'Đã có'},{id:'new',title:'Mới',status:'sai',priority:'sai',progress:999,tags:[' #Họp ','họp','x'.repeat(25)]}],contacts:[],trips:[]}))
    localStorage.setItem('nhip-viec-tag-colors',JSON.stringify({c:{họp:3,'không dùng':8}}))
    mocks.getDocs.mockImplementation(path=>Promise.resolve(path.endsWith('/tasks')?{empty:false,docs:[{id:'old',data:()=>({title:'Cloud'})}]}:empty()))
    const result=await firebaseRepo.importLocalData('u1')
    expect(result).toEqual({imported:1,skipped:1,invalid:1})
    expect(mocks.batches[0].operations.map(item=>item.path)).toEqual(['users/u1/tasks/new'])
    expect(mocks.batches[0].operations[0].value).toEqual(expect.objectContaining({status:'todo',priority:'medium',progress:100,tags:['Họp']}))
    expect(mocks.batches[1].operations[0].value).toEqual({c:{họp:3}})
    expect(Object.keys(localStorage).some(key=>key.startsWith('nhip-viec-v1.imported-'))).toBe(true)
    expect(localStorage.getItem('nhip-viec-v1')).toContain('"old"')
  })
  it('lưu task và màu mới trong cùng batch',async()=>{await firebaseRepo.saveTaskTags('t1',['#Họp'],{c:{}},'u1');expect(mocks.batches).toHaveLength(1);expect(mocks.batches[0].operations.map(item=>item.path)).toEqual(['users/u1/tasks/t1','users/u1/meta/tagColors']);expect(mocks.batches[0].operations[1].options.mergeFields[0].parts).toEqual(['c','họp'])})
  it('đăng ký một màu đúng một lần khi batch lưu task',async()=>{await firebaseRepo.batch([{type:'create',collection:'tasks',id:'t1',data:{title:'Một',status:'todo',priority:'medium',progress:0,tags:['Mới']}},{type:'create',collection:'tasks',id:'t2',data:{title:'Hai',status:'todo',priority:'medium',progress:0,tags:['mới']}}],{c:{}});expect(mocks.batches).toHaveLength(1);expect(mocks.batches[0].operations.filter(item=>item.path==='users/u1/meta/tagColors')).toHaveLength(1);expect(mocks.batches[0].operations.at(-1).options.mergeFields).toHaveLength(1)})
  it('không xóa nhãn khi batch chỉ cập nhật trường khác',async()=>{await firebaseRepo.batch([{type:'update',collection:'tasks',id:'t1',data:{projectId:null}}],{c:{}});expect(mocks.batches[0].operations[0].value).not.toHaveProperty('tags');expect(mocks.batches[0].operations).toHaveLength(1)})
  it('đổi màu chỉ ghi registry',async()=>{await firebaseRepo.manageTags([],{c:{họp:9}},'u1');expect(mocks.batches).toHaveLength(1);expect(mocks.batches[0].operations).toEqual([expect.objectContaining({path:'users/u1/meta/tagColors',value:{c:{họp:9}}})])})
  it('ghi sổ và ghi chú vào collection mới theo uid',async()=>{await firebaseRepo.batch([{type:'create',collection:'notebooks',id:'b1',data:{name:'Sổ',color:0,pinned:false,archived:false}},{type:'create',collection:'notes',id:'n1',data:{notebookId:'b1',title:'Ghi chú',body:'',tags:[],pinned:false,links:{}}}],{c:{}});expect(mocks.batches[0].operations.map(item=>item.path)).toEqual(['users/u1/notebooks/b1','users/u1/notes/n1'])})
})
