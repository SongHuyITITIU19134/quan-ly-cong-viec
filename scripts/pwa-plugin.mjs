const serviceWorker = files => `const PREFIX='nhip-viec-'
const CACHE=PREFIX+'${Date.now()}'
const PRECACHE=${JSON.stringify(files)}
const cleanup=()=>caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key))))
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(PRECACHE))))
self.addEventListener('activate',event=>event.waitUntil(cleanup().then(()=>self.clients.claim())))
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting()})
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url)
  if(request.method!=='GET'||url.origin!==self.location.origin)return
  event.waitUntil(cleanup())
  if(request.mode==='navigate'){
    event.respondWith(fetch(request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put('/',copy));return response}).catch(()=>caches.match('/',{ignoreVary:true})))
    return
  }
  event.respondWith(caches.match(request,{ignoreVary:true}).then(cached=>cached||fetch(request).then(response=>{if(response.ok&&['script','style','font','image'].includes(request.destination)){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy))}return response})))
})
`

export function pwaPlugin() {
  return {
    name: 'nhip-viec-pwa',
    apply: 'build',
    generateBundle(_options, bundle) {
      const generated=Object.values(bundle).map(item=>`/${item.fileName}`).filter(file=>!file.endsWith('.map'))
      const files=[...new Set(['/','/manifest.webmanifest','/icon-192.svg','/icon-512.svg',...generated])]
      this.emitFile({type:'asset',fileName:'sw.js',source:serviceWorker(files)})
    },
  }
}
