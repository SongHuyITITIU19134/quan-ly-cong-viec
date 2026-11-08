import { useMemo, useState } from 'react'
import { Popover } from '@/components/ui'
import TagChip from './TagChip'
import ManageTagsDialog from './ManageTagsDialog'
import { normalizeText } from '@/lib/tasks'
import { tagKey } from '@/tags/tagUtils'
import { vi } from '@/i18n/vi'

export default function TagFilter({catalog,selected,onToggle,onClear,onReplace,scope='all'}){
  const[query,setQuery]=useState(''),[managing,setManaging]=useState(false),keys=new Set(selected),items=useMemo(()=>catalog.filter(item=>normalizeText(item.name).includes(normalizeText(query))),[catalog,query])
  const chosen=catalog.filter(item=>keys.has(item.key))
  const label=chosen.length?<span className="tag-filter-label">{chosen.slice(0,2).map(item=><TagChip key={item.key} name={item.name} color={item.color}/>)}{chosen.length>2&&<b>+{chosen.length-2}</b>}</span>:vi.generated.TagFilter_11_0(selected.length?` (${selected.length})`:'')
  return <><Popover className="filter-menu tag-filter" panelClassName="filter-panel tag-filter-panel" role="dialog" accessibleLabel={vi.generated.TagFilter_12_1} label={label}>
    <label className="sr-only" htmlFor="tag-filter-search">{vi.generated.TagFilter_13_2}</label><input id="tag-filter-search" type="search" role="combobox" aria-expanded="true" aria-controls="tag-filter-options" value={query} onChange={event=>setQuery(event.target.value)} placeholder={vi.generated.TagFilter_13_3}/>
    <div id="tag-filter-options" className="tag-filter-options" role="listbox" aria-multiselectable="true">{items.map(item=><button type="button" role="option" aria-selected={keys.has(item.key)} key={item.key} onClick={()=>onToggle(item.key)}><TagChip name={item.name} color={item.color}/><small>{item.count}</small></button>)}</div>
    {!items.length&&<p className="field-hint">{vi.generated.TagFilter_15_4}</p>}
    <div className="tag-filter-actions"><button type="button" disabled={!selected.length} onClick={onClear}>{vi.generated.TagFilter_16_5}</button><button type="button" onClick={()=>setManaging(true)}>{vi.generated.TagFilter_16_6}</button></div>
  </Popover>{managing&&<ManageTagsDialog scope={scope} onClose={()=>setManaging(false)} onMutation={(mutation,result)=>{if(mutation.type==='delete')onReplace(selected.filter(key=>key!==mutation.key));if(mutation.type==='rename')onReplace([...new Set(selected.map(key=>key===mutation.key?tagKey(result.targetName):key))])}}/>}</>
}
