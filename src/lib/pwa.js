export async function registerPwa(onUpdate, options = {}) {
  const enabled=options.enabled ?? import.meta.env.PROD
  const serviceWorker=options.serviceWorker ?? globalThis.navigator?.serviceWorker
  if(!enabled||!serviceWorker)return null
  const registration=await serviceWorker.register('/sw.js')
  const notify=()=>onUpdate?.(()=>registration.waiting?.postMessage({type:'SKIP_WAITING'}))
  if(registration.waiting)notify()
  registration.addEventListener('updatefound',()=>{
    const worker=registration.installing
    worker?.addEventListener('statechange',()=>{
      if(worker.state==='installed'&&serviceWorker.controller)notify()
    })
  })
  return registration
}
