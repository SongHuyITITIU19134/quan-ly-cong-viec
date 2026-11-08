import { useEffect, useRef } from 'react'
import { ToastContext } from './ToastContext'

export default function ToastProvider({children}){
  const storeRef=useRef(null)
  if(!storeRef.current){
    const listeners=new Set()
    const timers=new Map()
    const store={items:[]}
    const emit=()=>listeners.forEach(listener=>listener())
    const dismiss=id=>{
      window.clearTimeout(timers.get(id))
      timers.delete(id)
      store.items=store.items.filter(item=>item.id!==id)
      emit()
    }
    const schedule=(id,delay)=>{
      window.clearTimeout(timers.get(id))
      timers.set(id,window.setTimeout(()=>dismiss(id),delay))
    }
    const toast=(message,action)=>{
      const id=crypto.randomUUID(),duration=6000
      store.items=[...store.items,{id,message,action,remaining:duration,expiresAt:Date.now()+duration}]
      emit()
      schedule(id,duration)
      return id
    }
    const pauseToast=id=>{
      window.clearTimeout(timers.get(id))
      timers.delete(id)
      store.items=store.items.map(item=>item.id===id?{
        ...item,
        remaining:Math.max(0,item.expiresAt-Date.now()),
      }:item)
      emit()
    }
    const resumeToast=id=>{
      store.items=store.items.map(item=>{
        if(item.id!==id)return item
        const remaining=item.remaining||3000
        schedule(id,remaining)
        return{...item,expiresAt:Date.now()+remaining}
      })
      emit()
    }
    storeRef.current={
      toast,
      dismiss,
      pauseToast,
      resumeToast,
      subscribe:listener=>{listeners.add(listener);return()=>listeners.delete(listener)},
      getSnapshot:()=>store.items,
      clear:()=>{
        for(const timer of timers.values())window.clearTimeout(timer)
        timers.clear()
      },
    }
  }
  useEffect(()=>()=>storeRef.current.clear(),[])
  return <ToastContext.Provider value={storeRef.current}>{children}</ToastContext.Provider>
}
