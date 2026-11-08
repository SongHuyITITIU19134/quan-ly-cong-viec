# Báo cáo kiểm định UI refresh

Ngày kiểm định: 23/10/2026  
Nhánh: `feature/ui-refresh`

## Kết quả tự động

| Hạng mục | Kết quả |
| --- | --- |
| ESLint | Đạt, 0 cảnh báo |
| Unit/component | 24/24 đạt |
| E2E smoke + reduced motion | 18/18 đạt trên 360px, 768px, 1280px |
| Axe + keyboard | 9/9 đạt; 0 lỗi critical/serious trên 5 route + đăng nhập, light/dark, 3 viewport |
| Contrast token | 12/12 cặp đạt WCAG AA; thấp nhất 6,85:1 |
| Production build | Đạt, không có chunk >500 kB |

## Lighthouse production preview

| Thiết bị | Performance | Accessibility | FCP | LCP | TBT | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Mobile | 99 | 100 | 1.666 giây | 1.783 giây | 69 ms | 0 |
| Desktop | 100 | 100 | 0.432 giây | 0.459 giây | 0 ms | 0 |

Báo cáo máy đầy đủ: `lighthouse-mobile.json` và `lighthouse-desktop.json` trong cùng thư mục.

## Bundle production

- Gói khởi động ứng dụng: 61,38 kB minified / 20,49 kB gzip, dưới ngân sách khoảng 80 kB minified.
- CSS: 66,59 kB minified / 13,26 kB gzip sau khi dọn style sidebar cũ.
- Route lớn nhất hiện tại: Dashboard 13,34 kB minified / 4,33 kB gzip.
- React vendor: 178,23 kB minified / 58,90 kB gzip.
- Firebase được import động theo `VITE_DATA_MODE`; bản local không tải trước Auth/Firestore. Bản Firebase chỉ tải các chunk này khi được cấu hình.

## Kiểm tra thủ công và hình ảnh

- Không có tràn ngang toàn trang tại 360px; Kanban/tile dùng vùng cuộn snap riêng có chủ đích.
- Vùng chạm chính của dock, toolbar, icon button và control đạt tối thiểu 44px.
- Focus sau đổi route về H1; modal giữ focus trap, đóng bằng Esc và trả focus.
- Light/dark đã được ghi ảnh cho 6 màn hình tại 360, 768 và 1280px.
- Tổng số ảnh “sau”: 36, lưu trong `docs/screenshots/after/`.
- `prefers-reduced-motion: reduce` đưa motion token về 1ms, tắt translate/scale/count-up/chart drawing/shimmer.

## Các lỗi được phát hiện và sửa trong kiểm định

- Tên truy cập của link dock từng bị mất khi nhãn bị ẩn bằng `display:none` ở tablet/mobile.
- Tên truy cập của avatar, nút tạo việc, ô lịch và tile chuyến đi chưa chứa nhãn hiển thị đầy đủ.
- Metadata sắp hạn/quá hạn dùng màu semantic tối trực tiếp trên dark card nên không đủ tương phản.
- Firebase Auth/Firestore từng bị module-preload cả ở chế độ local, làm Lighthouse mobile giảm còn 91; đổi sang dynamic import đưa điểm lên 99.
- Trang Tổng quan từng có intrinsic width gây tràn ở 360px; chuyển grid sang `minmax(0,1fr)` và khóa `min-width:0`.
