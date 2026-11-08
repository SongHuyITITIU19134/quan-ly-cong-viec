export function validateAuthForm(mode,values){
  const errors={}
  if(mode==='register'&&!values.displayName.trim())errors.displayName='Vui lòng nhập họ tên.'
  if(!/^\S+@\S+\.\S+$/.test(values.email.trim()))errors.email='Vui lòng nhập email hợp lệ.'
  if(values.password.length<8)errors.password='Mật khẩu phải có ít nhất 8 ký tự.'
  if(mode==='register'&&values.confirmPassword!==values.password)errors.confirmPassword='Mật khẩu nhập lại chưa khớp.'
  return errors
}
