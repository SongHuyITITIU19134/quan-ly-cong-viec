const safeWeight=item=>Number.isFinite(Number(item.weight))&&Number(item.weight)>0?Number(item.weight):1
const worst=(row,side)=>{
  const areas=row.map(item=>item.area),sum=areas.reduce((total,value)=>total+value,0)
  if(!sum||!side)return Infinity
  return Math.max((side*side*Math.max(...areas))/(sum*sum),(sum*sum)/(side*side*Math.min(...areas)))
}
const placeRow=(row,rect,result)=>{
  const area=row.reduce((total,item)=>total+item.area,0)
  if(rect.width>=rect.height){
    const width=rect.height?area/rect.height:0
    let y=rect.y
    row.forEach((item,index)=>{const height=index===row.length-1?rect.y+rect.height-y:item.area/width;result.push({...item.item,x:rect.x,y,width,height});y+=height})
    return{x:rect.x+width,y:rect.y,width:Math.max(0,rect.width-width),height:rect.height}
  }
  const height=rect.width?area/rect.width:0
  let x=rect.x
  row.forEach((item,index)=>{const width=index===row.length-1?rect.x+rect.width-x:item.area/height;result.push({...item.item,x,y:rect.y,width,height});x+=width})
  return{x:rect.x,y:rect.y+height,width:rect.width,height:Math.max(0,rect.height-height)}
}

export function squarify(items,rect){
  if(!items?.length||!rect||rect.width<=0||rect.height<=0)return[]
  const total=items.reduce((sum,item)=>sum+safeWeight(item),0),scale=rect.width*rect.height/total
  const queue=items.map(item=>({item,area:safeWeight(item)*scale})).sort((a,b)=>b.area-a.area)
  const result=[]
  let row=[],remaining={...rect}
  while(queue.length){
    const candidate=queue[0],side=Math.min(remaining.width,remaining.height)
    if(!row.length||worst([...row,candidate],side)<=worst(row,side)){row.push(queue.shift());continue}
    remaining=placeRow(row,remaining,result);row=[]
  }
  if(row.length)placeRow(row,remaining,result)
  return result
}
