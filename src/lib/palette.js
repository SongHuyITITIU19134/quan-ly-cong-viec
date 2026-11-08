export const searchText=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/gu,'').replace(/đ/gu,'d').replace(/Đ/gu,'D').toLocaleLowerCase('vi').trim()

export function paletteItems(data={}){
  const fixed=[
    {id:'nav-dashboard',label:'Tổng quan',group:'Điều hướng',to:'/'},{id:'nav-tasks',label:'Công việc',group:'Điều hướng',to:'/cong-viec'},{id:'nav-calendar',label:'Lịch',group:'Điều hướng',to:'/lich'},{id:'nav-trips',label:'Công tác',group:'Điều hướng',to:'/cong-tac'},{id:'nav-notes',label:'Sổ tay',group:'Điều hướng',to:'/so-tay'},{id:'nav-settings',label:'Cài đặt',group:'Điều hướng',to:'/cai-dat'},
    {id:'create-task',label:'Tạo nhiệm vụ',group:'Tạo mới',action:'task'},{id:'create-note',label:'Tạo ghi chú',group:'Tạo mới',to:'/so-tay?new=note'},{id:'create-trip',label:'Tạo chuyến công tác',group:'Tạo mới',to:'/cong-tac?new=trip'},{id:'theme',label:'Đổi giao diện sáng / tối',group:'Thao tác',action:'theme'},
  ]
  const dynamic=[
    ...(data.tasks||[]).map(item=>({id:`task-${item.id}`,label:item.title,group:'Nhiệm vụ',to:`/cong-viec?q=${encodeURIComponent(item.title)}`})),
    ...(data.projects||[]).map(item=>({id:`project-${item.id}`,label:item.name,group:'Dự án',to:`/cong-viec?project=${encodeURIComponent(item.id)}`})),
    ...(data.trips||[]).map(item=>({id:`trip-${item.id}`,label:item.name,group:'Công tác',to:`/cong-tac?trip=${encodeURIComponent(item.id)}`})),
    ...(data.notes||[]).map(item=>({id:`note-${item.id}`,label:item.title,group:'Ghi chú',to:`/so-tay/${encodeURIComponent(item.notebookId)}?note=${encodeURIComponent(item.id)}`})),
  ]
  return[...fixed,...dynamic]
}

export function filterPalette(items,query,limit=12){const value=searchText(query);if(!value)return items.slice(0,limit);return items.filter(item=>searchText(`${item.label} ${item.group}`).includes(value)).slice(0,limit)}

export const shouldOpenPalette=event=>Boolean((event.metaKey||event.ctrlKey)&&event.key.toLocaleLowerCase()==='k'&&event.target?.tagName!=='TEXTAREA'&&!event.target?.isContentEditable)
