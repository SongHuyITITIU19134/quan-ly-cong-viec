# Báo cáo sửa bố cục, hiệu năng và quản lý Dự án

Ngày bắt đầu: 23/10/2026  
Nhánh: `fix/ui-layout-projects`  
Baseline: commit `439c53f` từ `feature/ui-refresh`

## 1. Phạm vi và giả định

- Giữ nguyên các route hiện tại; quản lý Dự án nằm trong tab **Dự án** của `/cong-viec` và dùng query `?view=projects&project=<id>` để bookmark chi tiết.
- Dữ liệu cũ được nâng cấp tại lớp repository. Migration phải idempotent và không xóa trường cũ ngoài việc chuẩn hóa `projectId`.
- Màu dự án lưu bằng khóa palette `1`–`8`, đồng thời tiếp tục đọc được mã màu hex cũ.
- Modal xác nhận xóa vẫn là hộp thoại giữa màn hình; các form nhập liệu dùng Drawer/Sheet.
- Kiểm thử ảnh dùng dữ liệu seed local để có kết quả ổn định. Firebase được kiểm tra bằng unit/schema và build; kiểm thử Emulator Suite thật được ghi ở mục đề xuất nếu môi trường chưa có emulator.

## 2. Giai đoạn 0 — Tái hiện và đo trước khi sửa

Script: `scripts/ui-fix-baseline.mjs`  
Dữ liệu thô: `docs/audit/fix-before-measurements.json`  
Ảnh: `docs/screenshots/fix-before/` — 160 ảnh, gồm 5 trang × 16 viewport × 2 theme.

### Ma trận đã đo

- Laptop: 1280×720, 1366×768, 1440×900, 1512×982, 1536×864.
- Desktop: 1920×1080, 2560×1440.
- Tablet: 768×1024, 820×1180, 1024×768.
- Điện thoại: 360×640, 375×667, 390×844, 412×915, 430×932 và ngang 844×390.

### Lỗi tái hiện được

| Mức | Lỗi trước sửa | Viewport / bước tái hiện | Nguyên nhân gốc | Trạng thái sau |
| --- | --- | --- | --- | --- |
| 🔴 | Nút **Lưu** của form nhiệm vụ không nằm trong viewport ở 16/16 viewport | Mở `/cong-viec` → **Tạo nhiệm vụ** | Modal cuộn cả khối, footer không tách khỏi body; form dài hơn `max-height` | ✅ Drawer/Sheet có body cuộn và footer cố định |
| 🔴 | Dock che phần tử tương tác/nội dung khi cuộn và trong ảnh full-page; phép đo ghi nhận nhiều giao nhau thật giữa dock với card/ô lịch | Mở trang dài, cuộn qua vị trí dock | `.floating-dock { position: fixed }`, ngoài flow; nội dung chỉ bù padding ước lượng | ✅ Dock nằm trong hàng grid riêng, không che main |
| 🟡 | Dashboard tràn ngang 26px ở 1280×720, cả light/dark | Mở `/` tại 1280×720 | Grid/tile có intrinsic width lớn hơn vùng sheet ở chế độ chiều cao thấp | ✅ Có compact mode, main `min-width:0` và container responsive |
| 🟡 | Filter menu vượt đáy viewport ở 844×390 | Mở `/cong-viec`, bấm **Trạng thái** | Popover định vị absolute/fixed thủ công, không collision detection | ✅ Portal ra body, tự lật và giới hạn theo viewport |
| 🟡 | Nhãn dock thay đổi `width` khi hover/active, có nguy cơ đẩy icon ở laptop hẹp | Hover các mục dock tại 1024–1366px | Animation `width: 0 → auto`, layout chạy lại và item không có track cố định | ✅ Năm track cố định; mobile dùng chấm active |
| 🟡 | Scrim làm tối gần như toàn màn hình | Mở form ở light/dark | Overlay hiện là 64% light, 74% dark | ✅ 22% light / 45% dark, không blur |
| 🟡 | Menu thẻ nằm trong Kanban `overflow-x:auto` và dùng `z-index:10` cục bộ | Mở menu `…` gần mép cột | Popover không portal; stacking context và overflow cha có thể cắt menu | ✅ Dùng Popover portal chung, click ngoài/Esc/trả focus |

Phép dò cặp bounding-box ghi nhận 1.540 giao nhau trong toàn ma trận. Một phần là giao nhau có chủ đích giữa control và nội dung con; các nhóm có dock/card, dock/ô lịch và menu thẻ là lỗi thật đã được xác minh bằng ảnh. Script sau sửa sẽ loại nested pairs khỏi thống kê để giảm false positive.

### Hiệu năng trước sửa — CPU throttle 4×

Kịch bản gồm đổi năm route, mở/đóng form, hover dock và chờ animation hoàn tất tại 1366×768.

| Chỉ số | Trước | Mục tiêu | Sau |
| --- | ---: | ---: | ---: |
| Long task > 50ms | 2 (95ms, 67ms) | 0 trong animation | 0 |
| Frame interval p95 | 33,3ms | ≤ 16,7–20ms | 16,7ms |
| Frame tệ nhất | 83,3ms | < 50ms | 33,2ms |
| Frame trễ > 25ms | 19/240 | Gần 0 | 1/180 |
| Lighthouse Performance | 99 mobile / 100 desktop | ≥ 95 | Chưa đo lại |
| Lighthouse Accessibility | 100 | 100 | Chưa đo lại |
| CLS | 0 | 0 | Chưa đo lại |

### Nghi phạm xác nhận từ source

- View Transition đang bao toàn document bằng `document.startViewTransition`.
- Count-up dùng `setState` trong mỗi frame.
- Card hover animate `box-shadow`; dock animate `width`; chart glow dùng SVG filter.
- Reveal selector áp lại cho `.page > *` mỗi lần page remount; nhiều card cùng chạy `pop`.
- Nhiều z-index số rời rạc: 1, 2, 10, 12, 35, 50, 55, 60, 80, 100.
- App dùng `100vh`; dock fixed; body/main và Kanban/table tạo nhiều vùng cuộn.

## 3. Nhật ký sửa theo giai đoạn

### Giai đoạn 1 — Khung ứng dụng

- `app-shell` đổi thành grid ba hàng: topbar / main cuộn duy nhất / dock trong flow; dùng `100dvh`, `100svh` và safe-area.
- Dock dùng năm track cố định; nhãn desktop nằm dưới icon, mobile chỉ còn icon + chấm active.
- Thêm thang `--z-*` tập trung trong `tokens.css`; popover/menu dùng portal với collision detection.
- Toast dùng offset theo `--dock-height`; thêm compact mode cho chiều cao ≤ 800px và container query cho màn hình lớn.
- Thêm `viewport-fit=cover`, theme-color sáng/tối, meta Apple standalone và `manifest.webmanifest`.
- Sau sửa: ESLint đạt, 24/24 unit đạt, build đạt, 27/27 E2E + axe đạt.

### Giai đoạn 2 — Hiệu năng animation

- Count-up ghi trực tiếp vào `textContent` qua ref, không `setState` mỗi frame.
- View Transition chỉ đặt tên vùng main, bỏ animation root và tự tắt trên thiết bị ít CPU/RAM hoặc reduced motion.
- Bỏ animation width/box-shadow/filter; progress đổi sang `scaleX`; chart glow không còn SVG filter.
- Card/Kanban có containment; TaskCard dùng `React.memo`; tìm kiếm debounce 150ms.
- `scripts/check-motion.mjs` chặn `transition: all` và `backdrop-filter`.
- Đo lại CPU throttle 4× sau warm-up route: 0 long task, p95 16,7ms, 1 frame >25ms. Dữ liệu: `fix-after-performance.json`.
- Sau sửa: motion check đạt, ESLint đạt, 24/24 unit đạt, build đạt, 27/27 E2E + axe đạt.

### Giai đoạn 3 — Drawer và form

- Thêm Drawer/Sheet dùng chung: portal, focus trap, Esc, trả focus, scrim nhạt, guard thay đổi chưa lưu và Visual Viewport.
- Desktop trượt từ phải, rộng `clamp(420px,36vw,560px)`; mobile là bottom sheet tối đa 92dvh có tay kéo.
- Header/footer cố định, body cuộn độc lập; TaskForm gom thành Cơ bản, Chi tiết và Liên kết.
- Form nhiệm vụ, chuyến công tác và liên hệ đã dùng Drawer; modal xác nhận vẫn là hộp thoại giữa màn hình.
- Thêm E2E kiểm tra focus, nút Lưu trong viewport và guard chưa lưu trên ba viewport.
- Sau sửa: motion check đạt, ESLint đạt, 24/24 unit đạt, build đạt, 30/30 E2E + axe đạt.

### Giai đoạn 4 — Quản lý Dự án

- Bổ sung entity Project đầy đủ: tên duy nhất (không phân biệt hoa/thường/dấu), mô tả, 8 màu, trạng thái, ngày, người phụ trách và timestamps.
- Migration idempotent cho localStorage và Firestore; dữ liệu cũ có `projectName` được tạo entity và nối `projectId`, không nhân đôi khi chạy lại.
- CRUD trong Drawer, menu card, lưu trữ/khôi phục, detail bookmark `?project=<id>`, thêm việc đã chọn sẵn dự án và chuyển hàng loạt.
- Xóa dự án mặc định giữ nhiệm vụ và gỡ liên kết; có thể chuyển sang dự án khác; toast hoàn tác 6 giây.
- Bộ lọc hiển thị số nhiệm vụ; dự án lưu trữ ẩn mặc định; TaskForm hỗ trợ tạo nhanh.
- Firestore Rules kiểm tra tên, trạng thái và màu. Unit migration/validate/delete-move và E2E vòng đời dự án đều đạt.

### Giai đoạn 5 — Responsive hoàn thiện

- Chụp 160 ảnh: 5 route × 16 viewport × 2 theme tại `docs/screenshots/fix-after/`; thêm ảnh kiểm chứng drawer ngang 844×390.
- Kết quả đo sau sửa: 0 overflow ngang, 0 giao nhau thật, 0 nút Lưu bị khuất và 0 dock che phần tử cuối.
- Sửa nguyên nhân footer drawer tràn ở màn hình ngang thấp bằng grid row tường minh; body là hàng co giãn duy nhất.
- CPU throttle 4× sau warm-up: 0 long task >50ms, p95 16,8ms, frame tệ nhất 33,3ms, 2/201 frame >25ms.
- Toàn bộ 33/33 E2E đạt trên 360×800, 768×1024 và 1280×800; axe light/dark đạt.

### Giai đoạn 6 — Kiểm định phát hành

| Hạng mục | Kết quả |
| --- | --- |
| ESLint | Đạt, 0 lỗi/cảnh báo |
| Unit/component | 27/27 đạt |
| Build production | Đạt |
| E2E + keyboard + axe | 33/33 đạt; 0 critical/serious |
| Contrast/motion guard | Đạt |
| Lighthouse mobile | Performance 98, Accessibility 100, CLS 0 |
| Lighthouse desktop | Performance 100, Accessibility 100, CLS 0 |
| Bundle app entry | 68,52 kB min / 22,54 kB gzip; không chunk >500 kB |

Dữ liệu thô: `fix-after-measurements.json`, `lighthouse-fix-mobile.json`, `lighthouse-fix-desktop.json`.

## 4. Việc chưa làm / đề xuất vòng tiếp theo

1. Kiểm thử migration/rules với Firebase Emulator và tài khoản staging thật; môi trường hiện tại chỉ kiểm tra schema, unit và build.
2. Đưa Lighthouse, axe và ảnh ma trận vào CI với performance budget/pixel-diff.
3. Virtualize Kanban/bảng khi dữ liệu tăng đến hàng nghìn nhiệm vụ.
4. Đổi “tạo nhanh dự án” trong TaskForm từ prompt gọn sang popover form con nếu cần nhập đầy đủ metadata ngay lúc tạo.
