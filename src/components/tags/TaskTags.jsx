import { Popover } from '@/components/ui'
import TagChip from './TagChip'
import { colorFallback, normalizeTags, tagKey } from '@/tags/tagUtils'

export default function TaskTags({tags,registry={c:{}},max=2,className='',selected=[],onToggle}){
  const items=normalizeTags(tags),visible=items.slice(0,max),hidden=items.slice(max),color=name=>registry?.c?.[tagKey(name)]??colorFallback(tagKey(name))
  const chip=name=><TagChip key={tagKey(name)} name={name} color={color(name)} variant={onToggle?'toggle':'static'} pressed={selected.includes(tagKey(name))} onToggle={()=>onToggle?.(tagKey(name))}/>
  if(!items.length)return null
  return <div className={`task-tags ${className}`.trim()} onClick={event=>event.stopPropagation()}>{visible.map(chip)}{hidden.length>0&&<Popover role="dialog" className="tag-more" panelClassName="tag-more-pop" accessibleLabel={`Xem thêm ${hidden.length} nhãn`} label={`+${hidden.length}`}><div className="tag-more-list">{hidden.map(chip)}</div></Popover>}</div>
}
