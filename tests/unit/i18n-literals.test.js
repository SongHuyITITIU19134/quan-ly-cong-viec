import { readFileSync, readdirSync } from 'node:fs'
import { extname, join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'
import { i18nLiteralAllowlist } from '../fixtures/i18n-literal-allowlist'

const root=process.cwd(),roots=['src/pages','src/components'],accent=/[À-ỹĐđ]/u
const files=directory=>readdirSync(join(root,directory),{withFileTypes:true}).flatMap(entry=>{
  const name=join(directory,entry.name)
  return entry.isDirectory()?files(name):['.js','.jsx'].includes(extname(entry.name))?[name]:[]
})

describe('literal giao diện tập trung trong vi.js',()=>{
  it('không còn tiếng Việt rải rác ngoài allowlist có lý do',()=>{
    const violations=roots.flatMap(files).flatMap(file=>readFileSync(join(root,file),'utf8').split('\n').flatMap((text,index)=>{
      if(!accent.test(text))return[]
      const allowed=i18nLiteralAllowlist.some(item=>item.file===relative(root,file)&&text.includes(item.text)&&item.reason)
      return allowed?[]:[`${file}:${index+1}`]
    }))
    expect(violations).toEqual([])
  })
})
