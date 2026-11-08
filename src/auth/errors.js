export function authErrorMessage(error){
  const code=error?.code||'unknown'
  console.error('[Firebase Auth]',code)
  const messages={
    'auth/email-already-in-use':'Email này đã được sử dụng.',
    'auth/invalid-email':'Email không hợp lệ.',
    'auth/weak-password':'Mật khẩu chưa đủ mạnh.',
    'auth/invalid-credential':'Email hoặc mật khẩu không đúng.',
    'auth/wrong-password':'Email hoặc mật khẩu không đúng.',
    'auth/user-not-found':'Email hoặc mật khẩu không đúng.',
    'auth/too-many-requests':'Bạn thao tác quá nhiều lần. Vui lòng thử lại sau.',
    'auth/popup-blocked':'Trình duyệt đã chặn cửa sổ đăng nhập.',
    'auth/popup-closed-by-user':'Bạn đã đóng cửa sổ đăng nhập.',
    'auth/cancelled-popup-request':'Yêu cầu đăng nhập trước đã bị hủy.',
    'auth/network-request-failed':'Không thể kết nối Firebase. Hãy kiểm tra mạng và thử lại.',
    'auth/unauthorized-domain':'Tên miền này chưa được cho phép đăng nhập trong Firebase Console.',
    'auth/operation-not-allowed':'Phương thức đăng nhập này chưa được bật trong Firebase Console.',
  }
  if(code.includes('app-check'))return 'Không thể xác minh bảo mật ứng dụng. Vui lòng tải lại trang.'
  return messages[code]||'Không thể xác thực. Vui lòng thử lại.'
}
