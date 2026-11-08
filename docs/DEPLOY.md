# Triển khai an toàn

## Firestore rules

Không deploy rules trực tiếp từ nhánh đang phát triển. Quy trình đề nghị:

1. Chốt commit rules đang chạy để có điểm quay lại và chạy `pnpm test:rules` bằng JDK 21.
2. Export/backup Firestore production trước khi thay đổi; ghi lại project ID, thời điểm và vị trí bản export.
3. Tạo một Firebase project thử nghiệm riêng, nạp dữ liệu đại diện gồm document hiện tại và legacy.
4. Deploy vào project thử nghiệm bằng `pnpm exec firebase deploy --only firestore:rules --project <staging-project>`.
5. Kiểm tra đăng nhập email/Google, quyền owner, tài khoản chưa xác minh, CRUD và cập nhật document legacy.
6. Chỉ sau khi kiểm tra đạt mới deploy đúng commit vào production, theo dõi log từ chối quyền và luồng đăng nhập.

Quay lại khi có sự cố: lấy `firestore.rules` từ commit ổn định đã ghi ở bước 1, chạy lại Emulator test, deploy file cũ vào đúng project rồi xác minh các luồng đọc/ghi. Không chỉnh dữ liệu để né rules lỗi.

## Security headers và CSP

`vercel.json` đặt các header bảo vệ chung. CSP hiện dùng `Content-Security-Policy-Report-Only` để quan sát Firebase Auth, Firestore, Google Sign-In và reCAPTCHA mà không chặn người dùng.

Trước khi chuyển CSP sang chế độ chặn:

1. Deploy report-only vào môi trường thử nghiệm và kiểm tra console/report trên toàn bộ luồng đăng nhập, đồng bộ và App Check.
2. Bổ sung chính xác origin bị thiếu; không dùng wildcard rộng hơn chỉ để xóa cảnh báo.
3. Chạy E2E, đăng nhập Google/email, reCAPTCHA và Firestore trên staging.
4. Đổi tên header thành `Content-Security-Policy`, triển khai staging lần nữa, rồi mới cân nhắc production.
