import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'

let environment
const verified={email:'owner@example.test',email_verified:true}
const task={id:'t1',title:'Việc',status:'todo',priority:'medium',progress:0,tags:[],createdAt:'2026-01-01',updatedAt:'2026-01-01'}
const owner=()=>environment.authenticatedContext('owner',verified).firestore()

beforeAll(async()=>{environment=await initializeTestEnvironment({projectId:'demo-nhip-viec',firestore:{rules:readFileSync(resolve(process.cwd(),'firestore.rules'),'utf8')}})})
beforeEach(()=>environment.clearFirestore())
afterAll(()=>environment.cleanup())

describe('Firestore rules',()=>{
  it('owner đã verify đọc và ghi được',async()=>{const ref=doc(owner(),'users/owner/tasks/t1');await assertSucceeds(setDoc(ref,task));await assertSucceeds(getDoc(ref))})
  it('user khác không đọc hoặc ghi dữ liệu owner',async()=>{const other=environment.authenticatedContext('other',{email_verified:true}).firestore();await environment.withSecurityRulesDisabled(context=>setDoc(doc(context.firestore(),'users/owner/tasks/t1'),task));await assertFails(getDoc(doc(other,'users/owner/tasks/t1')));await assertFails(setDoc(doc(other,'users/owner/tasks/t2'),{...task,id:'t2'}))})
  it('email chưa verify chỉ đọc, không ghi',async()=>{await environment.withSecurityRulesDisabled(context=>setDoc(doc(context.firestore(),'users/owner/tasks/t1'),task));const unverified=environment.authenticatedContext('owner',{email_verified:false}).firestore();await assertSucceeds(getDoc(doc(unverified,'users/owner/tasks/t1')));await assertFails(updateDoc(doc(unverified,'users/owner/tasks/t1'),{title:'Đổi'}))})
  it('field lạ và độ dài vượt giới hạn bị chặn',async()=>{await assertFails(setDoc(doc(owner(),'users/owner/tasks/bad'),{...task,unknown:true}));await assertFails(setDoc(doc(owner(),'users/owner/contacts/long'),{id:'long',fullName:'x'.repeat(121),isSelf:false}))})
  it('tagColors chỉ nhận chỉ số màu hợp lệ',async()=>{await assertSucceeds(setDoc(doc(owner(),'users/owner/meta/tagColors'),{c:{họp:3}}));await assertFails(setDoc(doc(owner(),'users/owner/meta/tagColors'),{c:{họp:12}}))})
  it('không cho xóa contact self',async()=>{const ref=doc(owner(),'users/owner/contacts/self');await assertSucceeds(setDoc(ref,{id:'self',fullName:'Tôi',isSelf:true}));await assertFails(deleteDoc(ref))})
  it('doc có field legacy lạ vẫn sửa field hợp lệ',async()=>{await environment.withSecurityRulesDisabled(context=>setDoc(doc(context.firestore(),'users/owner/tasks/legacy'),{id:'legacy',title:'Cũ',unknownLegacy:'giữ nguyên',createdAt:'2025-01-01'}));await assertSucceeds(updateDoc(doc(owner(),'users/owner/tasks/legacy'),{description:'Đã cập nhật'}))})
  it('update thêm field lạ bị chặn',async()=>{await environment.withSecurityRulesDisabled(context=>setDoc(doc(context.firestore(),'users/owner/tasks/legacy'),task));await assertFails(updateDoc(doc(owner(),'users/owner/tasks/legacy'),{newUnknown:'không hợp lệ'}))})
  it('create có field lạ bị chặn',async()=>{await assertFails(setDoc(doc(owner(),'users/owner/tasks/new'),{...task,id:'new',unknownLegacy:true}))})
  it('repeat, seriesId và remindBefore hợp lệ được ghi',async()=>{await assertSucceeds(setDoc(doc(owner(),'users/owner/tasks/repeat'),{...task,id:'repeat',seriesId:'root',repeat:{freq:'monthly',interval:30,until:'2027-01-01'},remindBefore:1440}))})
  it('repeat sai shape hoặc nhắc sai mốc bị chặn',async()=>{await assertFails(setDoc(doc(owner(),'users/owner/tasks/repeat-bad'),{...task,id:'repeat-bad',repeat:{freq:'yearly',interval:31}}));await assertFails(setDoc(doc(owner(),'users/owner/tasks/remind-bad'),{...task,id:'remind-bad',remindBefore:10}))})
  it('seriesId vượt giới hạn bị chặn',async()=>{await assertFails(setDoc(doc(owner(),'users/owner/tasks/series-bad'),{...task,id:'series-bad',seriesId:'x'.repeat(201)}))})
  it('settings chỉ nhận key và enum hợp lệ',async()=>{const ref=doc(owner(),'users/owner');await assertSucceeds(setDoc(ref,{createdAt:'2026-01-01',settings:{theme:'dark',defaultView:'tasks',reportPeriod:'month'}}));await assertFails(updateDoc(ref,{settings:{theme:'neon',defaultView:'tasks',reportPeriod:'month'}}));await assertFails(updateDoc(ref,{settings:{theme:'dark',defaultView:'tasks',reportPeriod:'month',secret:true}}))})
  it('cloud cập nhật key settings mới mà không đổi createdAt',async()=>{const ref=doc(owner(),'users/owner');await assertSucceeds(setDoc(ref,{createdAt:'2026-01-01',settings:{theme:'system',defaultView:'dashboard',reportPeriod:'week'}}));await assertSucceeds(updateDoc(ref,{'settings.reportPeriod':'month'}));const snapshot=await getDoc(ref);expect(snapshot.data().settings.reportPeriod).toBe('month');expect(snapshot.data().createdAt).toBe('2026-01-01')})
})
