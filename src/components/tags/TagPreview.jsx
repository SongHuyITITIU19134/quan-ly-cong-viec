import { useState } from 'react'
import { Header, Page } from '@/app/App'
import TagChip from './TagChip'
import { TAG_COLOR_NAMES } from '@/tags/tagUtils'

export default function TagPreview(){
  const[pressed,setPressed]=useState(()=>TAG_COLOR_NAMES.map((_,index)=>index%2===0))
  return <Page><Header title="Xem trước nhãn" description="12 màu và ba biến thể TagChip trên giao diện hiện tại"/><div className="tags-preview">{TAG_COLOR_NAMES.map((name,index)=><div className="tags-preview-row" key={name}><strong>{index}. {name}</strong><TagChip name={name} color={index}/><TagChip name={name} color={index} variant="removable"/><TagChip name={name} color={index} variant="toggle" pressed={pressed[index]} onToggle={()=>setPressed(values=>values.map((value,current)=>current===index?!value:value))}/></div>)}</div></Page>
}
