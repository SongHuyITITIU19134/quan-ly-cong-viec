export default function TagChip({name,color=0,variant='static',pressed=false,onRemove,onToggle}){
  const index=((Number(color)||0)%12+12)%12,label=<><span className="tag-chip-hash" aria-hidden="true">#</span><span className="tag-chip-label" title={name}>{name}</span></>
  if(variant==='toggle')return <button type="button" className={`tag-chip tag-${index}`} aria-pressed={pressed} onClick={onToggle}>{label}</button>
  if(variant==='removable')return <span className={`tag-chip tag-chip-removable tag-${index}`}>{label}<button type="button" className="tag-chip-remove" aria-label={`Xóa nhãn ${name}`} onClick={onRemove}>×</button></span>
  return <span className={`tag-chip tag-${index}`}>{label}</span>
}
