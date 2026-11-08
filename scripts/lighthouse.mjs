import { spawn } from 'node:child_process'
import { chromium } from '@playwright/test'
import { preview } from 'vite'

const url='http://127.0.0.1:4173'
const server=await preview({preview:{host:'127.0.0.1',port:4173,strictPort:true}})

try{
  for(let attempt=0;attempt<50;attempt+=1){
    try{if((await fetch(url)).ok)break}catch{/* Preview chưa sẵn sàng. */}
    if(attempt===49)throw new Error('Vite preview không khởi động')
    await new Promise(resolve=>setTimeout(resolve,100))
  }
  const result=await new Promise((resolve,reject)=>{
    const child=spawn('pnpm',[
    'exec','lighthouse',url,'--quiet','--output=json','--output-path=stdout',
    '--only-categories=performance,accessibility,best-practices',
    `--chrome-path=${chromium.executablePath()}`,'--chrome-flags=--headless --no-sandbox'
    ],{env:{...process.env,CHROME_PATH:chromium.executablePath()}})
    let stdout='',stderr=''
    child.stdout.on('data',chunk=>{stdout+=chunk})
    child.stderr.on('data',chunk=>{stderr+=chunk})
    child.on('error',reject)
    child.on('close',status=>resolve({status,stdout,stderr}))
  })
  if(result.status!==0)throw new Error(result.stderr.trim()||'Lighthouse chạy lỗi')
  const report=JSON.parse(result.stdout),scores={
    Performance:Math.round(report.categories.performance.score*100),
    Accessibility:Math.round(report.categories.accessibility.score*100),
    'Best Practices':Math.round(report.categories['best-practices'].score*100)
  }
  console.table(scores)
  const failed=[]
  if(scores.Performance<90)failed.push('Performance < 90')
  if(scores.Accessibility<95)failed.push('Accessibility < 95')
  if(scores['Best Practices']<95)failed.push('Best Practices < 95')
  if(failed.length)throw new Error(failed.join(', '))
}finally{
  await server.close()
}
