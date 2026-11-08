import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'

const root=path.resolve('src/styles')
const files=(await readdir(root)).filter(file=>file.endsWith('.css'))
const violations=[]
for(const file of files){
  const source=await readFile(path.join(root,file),'utf8')
  for(const [pattern,label] of [[/transition\s*:\s*all\b/g,'transition: all'],[/backdrop-filter\s*:/g,'backdrop-filter']]){
    for(const match of source.matchAll(pattern))violations.push(`${file}:${source.slice(0,match.index).split('\n').length} ${label}`)
  }
}
if(violations.length){console.error(violations.join('\n'));process.exit(1)}
console.log(`✓ ${files.length} tệp CSS không dùng transition: all hoặc backdrop-filter`)
