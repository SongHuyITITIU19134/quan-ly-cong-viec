export const selfContact=displayName=>({id:'self',fullName:String(displayName||'').trim()||'Tôi',isSelf:true})

export function ensureSelfContact(data,displayName=''){
  const contacts=Array.isArray(data?.contacts)?data.contacts:[],desired=selfContact(displayName),index=contacts.findIndex(contact=>contact.id==='self')
  if(index<0)return{data:{...data,contacts:[desired,...contacts]},changed:true}
  const current=contacts[index]
  if(current.fullName===desired.fullName&&current.isSelf===true)return{data,changed:false}
  const next=[...contacts];next[index]={...current,...desired}
  return{data:{...data,contacts:next},changed:true}
}
