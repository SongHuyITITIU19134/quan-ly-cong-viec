# Baseline trước khi làm mới giao diện

Ngày ghi nhận: 23/10/2026  
Nhánh: `feature/ui-refresh`  
Mốc mã nguồn: `e3e044d`

## Kết quả kiểm tra tự động

| Hạng mục | Kết quả |
| --- | --- |
| ESLint | Đạt, không có cảnh báo (`eslint . --max-warnings 0`) |
| Unit/component test | Đạt 24/24 bài kiểm tra trong 3 tệp, 2,58 giây |
| Production build | Đạt |
| E2E responsive | Đạt 12/12 bài kiểm tra tại 360px, 768px và 1280px, 9,4 giây |

Do trình bao `pnpm` được môi trường Codex quản lý tự khởi tạo lại `node_modules` khi chạy không có TTY, các lệnh kiểm tra tương đương được gọi trực tiếp bằng Node từ đúng package đã khóa. Không có thay đổi dependency hoặc cấu hình để làm cho baseline đạt.

## Kích thước build

| Gói | Minified | Gzip |
| --- | ---: | ---: |
| Mã ứng dụng | 56,01 kB | 18,79 kB |
| React vendor | 178,23 kB | 58,90 kB |
| Firebase Firestore | 460,80 kB | 134,79 kB |

Build không phát sinh cảnh báo chunk lớn hơn 500 kB.

## Ma trận ảnh chụp

Ảnh trước nâng cấp được lưu trong `docs/screenshots/before/`, gồm sáu màn hình:

- Tổng quan (`dashboard`)
- Công việc (`tasks`)
- Lịch (`calendar`)
- Công tác (`trips`)
- Danh bạ (`contacts`)
- Đăng nhập (`login`)

Mỗi màn hình được ghi nhận ở 360×800, 768×1024 và 1280×800, cho cả chế độ sáng và tối: tổng cộng 36 ảnh.

> Ghi chú: màn hình đăng nhập tồn tại dưới dạng component nhưng chưa được gắn vào router của bản baseline. Ảnh baseline đăng nhập được render bằng đúng class và nội dung của component trên nền stylesheet hiện hành, không thay đổi source ứng dụng.
