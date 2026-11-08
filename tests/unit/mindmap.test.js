import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { buildMindMap } from '@/components/mindmap/buildMindMap'
import TreeMapView from '@/components/mindmap/TreeMapView'
import { squarify } from '@/components/mindmap/squarify'

const project={id:'p1',name:'Dự án',status:'running'}
afterEach(cleanup)
describe('dựng cây sơ đồ',()=>{
  it('gom nhiệm vụ theo trạng thái thật',()=>{const tree=buildMindMap({projects:[project],tasks:[{id:'a',projectId:'p1',status:'todo'},{id:'b',projectId:'p1',status:'done'}],trips:[]});expect(tree.projects[0].statusGroups.map(group=>[group.status,group.count])).toEqual([['todo',1],['done',1]])})
  it('đưa chuyến không liên kết vào nhánh riêng',()=>{const tree=buildMindMap({projects:[project],tasks:[],trips:[{id:'t1',name:'Đi công tác'}]});expect(tree.projects.at(-1)).toMatchObject({id:'__unlinked__',name:'Công tác chưa gắn dự án'});expect(tree.projects.at(-1).trips.items).toHaveLength(1)})
  it('trả cây rỗng khi không có dữ liệu',()=>expect(buildMindMap({projects:[],tasks:[],trips:[]})).toEqual({name:'Nhịp việc',projects:[]}))
  it('squarify phủ kín, không chồng lấn và xử lý 0/1/50 mục cùng trọng số 0',()=>{
    const rect={x:0,y:0,width:1000,height:600}
    expect(squarify([],rect)).toEqual([])
    expect(squarify([{id:'one',weight:0}],rect)[0]).toMatchObject({...rect,id:'one'})
    const layout=squarify(Array.from({length:50},(_,index)=>({id:String(index),weight:index%4?index+1:0})),rect)
    const area=layout.reduce((sum,item)=>sum+item.width*item.height,0)
    expect(area).toBeCloseTo(rect.width*rect.height,5)
    for(let i=0;i<layout.length;i++)for(let j=i+1;j<layout.length;j++){const a=layout[i],b=layout[j],overlap=Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));expect(overlap).toBeLessThan(0.00001)}
  })
  it('dự án có 1 nhiệm vụ tạo 1 block trạng thái và 1 tile có kích thước dương',()=>{
    const tree=buildMindMap({projects:[project],tasks:[{id:'a',title:'Một việc',projectId:'p1',status:'todo',priority:'high',dueDate:'2026-10-30'}],trips:[]})
    const{container}=render(React.createElement(TreeMapView,{tree,selectedId:'p1',onSelect:vi.fn(),onTask:vi.fn()}))
    const block=container.querySelector('.tm-status-block'),tile=container.querySelector('.tm-task-tile')
    expect(container.querySelectorAll('.tm-status-block')).toHaveLength(1);expect(container.querySelectorAll('.tm-task-tile')).toHaveLength(1)
    expect(parseFloat(block.style.width)).toBeGreaterThan(0);expect(parseFloat(block.style.height)).toBeGreaterThan(0);expect(parseFloat(tile.style.width)).toBeGreaterThan(0);expect(parseFloat(tile.style.height)).toBeGreaterThan(0)
  })
})
