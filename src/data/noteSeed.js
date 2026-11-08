export function localNoteSeed(now=new Date().toISOString()){
  const notebookId='notebook-welcome'
  return{
    notebooks:[{id:notebookId,name:'Sổ tay đầu tiên',color:0,pinned:true,archived:false,createdAt:now,updatedAt:now}],
    notes:[
      {id:'note-welcome',notebookId,title:'Chào mừng đến Sổ tay',body:'Ghi lại ý tưởng, nội dung cuộc họp và những điều cần nhớ tại đây.',tags:['Bắt đầu'],pinned:true,links:{},createdAt:now,updatedAt:now},
      {id:'note-tips',notebookId,title:'Mẹo sử dụng',body:'Bạn có thể gắn ghi chú với dự án, chuyến công tác hoặc một liên hệ.',tags:[],pinned:false,links:{},createdAt:now,updatedAt:now},
    ],
  }
}
