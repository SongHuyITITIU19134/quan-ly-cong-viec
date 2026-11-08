import { useCallback, useEffect, useRef, useState } from 'react'
import { registerPwa } from '@/lib/pwa'

export function usePwa(toast) {
  const [installPrompt,setInstallPrompt]=useState(null)
  const reloadRequested=useRef(false)
  useEffect(()=>{
    const capture=event=>{event.preventDefault();setInstallPrompt(event)}
    window.addEventListener('beforeinstallprompt',capture)
    return()=>window.removeEventListener('beforeinstallprompt',capture)
  },[])
  useEffect(()=>{
    let reloading=false
    const onControllerChange=()=>{if(reloadRequested.current&&!reloading){reloading=true;window.location.reload()}}
    navigator.serviceWorker?.addEventListener('controllerchange',onControllerChange)
    registerPwa(activate=>toast('Có bản mới, tải lại.',{label:'Tải lại',onClick:()=>{reloadRequested.current=true;activate()}})).catch(()=>{})
    return()=>navigator.serviceWorker?.removeEventListener('controllerchange',onControllerChange)
  },[toast])
  const install=useCallback(async()=>{
    if(!installPrompt)return false
    await installPrompt.prompt()
    const choice=await installPrompt.userChoice
    setInstallPrompt(null)
    return choice.outcome==='accepted'
  },[installPrompt])
  return {canInstall:Boolean(installPrompt),install}
}
