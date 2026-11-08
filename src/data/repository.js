import { localRepo } from './localRepo'
export function selectDataMode(env=import.meta.env,warn=console.warn){
 const mode=env.VITE_DATA_MODE
 if(mode==='local')return'local'
 const required=['VITE_DATA_MODE','VITE_FIREBASE_API_KEY','VITE_FIREBASE_PROJECT_ID'],missing=required.filter(name=>!env[name])
 if(mode!=='firebase'&&!missing.includes('VITE_DATA_MODE'))missing.unshift('VITE_DATA_MODE')
 if(missing.length){warn(`[Data] Thiếu biến: ${[...new Set(missing)].join(', ')}; dùng local.`);return'local'}
 return'firebase'
}
export const dataMode=selectDataMode()
export const repository = dataMode==='firebase'?(await import('./firebaseRepo')).firebaseRepo:localRepo
