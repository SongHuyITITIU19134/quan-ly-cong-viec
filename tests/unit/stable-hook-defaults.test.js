import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source=file=>readFileSync(resolve(process.cwd(),file),'utf8')

describe('giá trị mặc định ổn định trong dependency hook',()=>{
  it('TagInput không tạo array hoặc object mặc định mới mỗi render',()=>{
    const code=source('src/components/tags/TagInput.jsx')
    expect(code).toContain('value=EMPTY_ARR')
    expect(code).toContain('catalog=EMPTY_ARR')
    expect(code).toContain('registry=EMPTY_REGISTRY')
    expect(code).not.toMatch(/function TagInput\([^)]*=\[\]/u)
  })

  it('ManageTagsDialog giữ registry mặc định ổn định cho useMemo',()=>{
    const code=source('src/components/tags/ManageTagsDialog.jsx')
    expect(code).toContain('tagRegistry=EMPTY_REGISTRY')
    expect(code).not.toContain('tagRegistry={c:{}}')
  })
})
