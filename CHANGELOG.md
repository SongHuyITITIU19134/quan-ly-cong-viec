# CHANGELOG — Nâng cấp UI/UX Nhịp việc

Ngày cập nhật: 08/11/2026

## Phase 6a — kiểm chứng và hoàn thiện

- Sửa vòng render vô hạn khi tạo sổ/ghi chú mới và giữ input quick-add qua ranh giới `await`.
- Vitest có timeout rõ ràng; 49 file, 265 test đạt trong 17,56 giây. Coverage lines đạt 71,85% toàn src, 96,33% lib, 97,22% tags và 81,48% data.
- Firestore Emulator dùng JDK 21: 14/14 rules test đạt. CI tách `verify`, `coverage`, `e2e`, `rules` trên Node 24/pnpm frozen lockfile.
- Playwright 5.000 task: Dashboard 71,3 ms, Calendar 40,6 ms, Tasks 3.330,7 ms; JS gzip lần đầu route `/` là 103,8 kB.
- PWA đã xác minh offline reload, toast cập nhật, thay cache cũ và không cache Firebase/Auth; sửa cache match với `Vary` và race cleanup khi worker đổi phiên bản.
- Thêm năm flow E2E chạy trên ba viewport và axe 10 route × light/dark × ba viewport, 0 lỗi serious/critical.

## Nhãn nhiệm vụ

- Thêm `tags: string[]` (tối đa 5 nhãn, 1–24 ký tự), chuẩn hóa NFC và catalog theo tần suất/lần dùng gần nhất.
- Thêm palette 12 màu sáng/tối, `TagInput`, chip trên Kanban/danh sách, tìm kiếm và lọc nhiều nhãn theo ANY.
- Thêm hộp **Quản lý nhãn** để đổi tên, gộp, xóa, đổi màu; Firebase chia tối đa 400 write/batch, local cập nhật task một lượt.
- Registry màu tách riêng tại `nhip-viec-tag-colors` hoặc `users/{uid}/meta/tagColors`; route `/__tags` chỉ có ở DEV.
- Import local → Firebase chuẩn hóa nhãn và chỉ mang theo màu của nhãn thực sự được nhập.

## Bổ sung vòng sửa bố cục và Dự án

- App shell ba hàng, một vùng cuộn; dock vào flow; popover portal có collision và thang z-index tập trung.
- Drawer/Sheet dùng chung cho nhiệm vụ, dự án, chuyến đi và danh bạ; guard thay đổi chưa lưu, VisualViewport và footer cố định.
- Project CRUD, migration localStorage/Firestore, màu/trạng thái/người phụ trách, detail bookmark, bulk move, lưu trữ và xóa an toàn có hoàn tác.
- Animation chỉ dùng transform/opacity; count-up không re-render mỗi frame; TaskCard memo; tìm kiếm debounce.
- Ma trận responsive kiểm tra các trạng thái drawer, dock và nội dung dài tại 360/768/1280.
- Lighthouse production preview: mobile 98 Performance / 100 Accessibility; desktop 100 / 100; CLS 0.

## Tổng quan

Đợt nâng cấp xử lý toàn bộ vấn đề 🔴 và 🟡 trong `AUDIT.md`, giữ nguyên mô hình dữ liệu, URL và nội dung tiếng Việt. Giao diện được chuyển sang soft brutalist theo mẫu tham chiếu: nền mint gradient, sheet giấy, viền mực, bóng cứng, tile lime/lavender và floating dock. Không thêm thư viện UI/animation/chart nặng; chỉ thêm axe và Lighthouse ở devDependencies để kiểm định.

## Hệ màu mới

Toàn bộ token nằm tại `src/styles/tokens.css`, có biến thể sáng/tối. Các cặp chữ/nền semantic đã được kiểm tra bằng công thức WCAG; tỷ lệ thấp nhất trong bộ kiểm định hiện tại là 6,85:1, đạt AA cho chữ thường.

| Token | Light | Dark | Dùng cho |
|---|---:|---:|---|
| `--color-lime` | `#A8ED75` | `#91D760` | CTA, KPI, trạng thái tích cực |
| `--color-lavender` | `#AFA8F4` | `#9B94E5` | Điểm nhấn phụ, biểu đồ |
| `--color-page-start` | `#E3F1D3` | `#182319` | Đầu gradient nền |
| `--color-page-end` | `#CDE7BE` | `#101711` | Cuối gradient nền |
| `--color-paper` | `#FCFDF9` | `#171A17` | Sheet, card và control |
| `--color-ink-fixed` | `#0B0B0C` | `#0B0B0C` | Dock, viền mực, chữ trên màu sáng |
| `--color-text` | `#171A17` | `#F4F7EF` | Chữ chính |
| `--color-text-muted` | `#4E584D` | `#BDC8B9` | Chữ phụ |
| `--color-peach` | `#FFC49B` | `#E9A97E` | Cảnh báo mềm, tile bổ sung |
| `--todo` / `--todo-bg` | `#475569` / `#e2e8f0` | `#d4dbea` / `#344155` | Chưa bắt đầu |
| `--doing` / `--doing-bg` | `#1d4ed8` / `#dbeafe` | `#bfdbfe` / `#193c73` | Đang thực hiện |
| `--waiting` / `--waiting-bg` | `#92400e` / `#fef3c7` | `#fde68a` / `#5f3a13` | Chờ phản hồi |
| `--done` / `--done-bg` | `#166534` / `#dcfce7` | `#bbf7d0` / `#174c2d` | Hoàn thành |
| `--paused` / `--paused-bg` | `#6b21a8` / `#f3e8ff` | `#e9d5ff` / `#4b2467` | Tạm dừng |
| `--danger` / `--danger-bg` | `#b91c1c` / `#fee2e2` | `#fecaca` / `#5c2025` | Quá hạn, lỗi, xóa |
| `--priority-high` / `--priority-high-bg` | `#9a3412` / `#ffedd5` | `#fed7aa` / `#653017` | Ưu tiên cao |
| `--priority-medium` / `--priority-medium-bg` | `#854d0e` / `#fef9c3` | `#fef08a` / `#554510` | Ưu tiên trung bình |
| `--priority-low` / `--priority-low-bg` | `#166534` / `#dcfce7` | `#bbf7d0` / `#174c2d` | Ưu tiên thấp |

Palette nhãn/dự án gồm tám cặp `--label-1…8` và `--label-1-ink…8`: xanh dương, tím, hồng, cam, hổ phách, xanh lá, teal và slate. Mỗi cặp có bản dark tương ứng, được áp dụng tuần tự cho dự án/biểu đồ để tránh màu tùy ý làm giảm tương phản.

## Thay đổi theo nhóm

### Giao diện và responsive

- Tập trung màu, bề mặt, viền mực, bóng cứng, radius, spacing và motion vào `src/styles/tokens.css`; thêm `shell.css`, `dashboard.css`, `motion-system.css` và các style theo phân hệ.
- Thay sidebar/mobile nav cũ bằng topbar + floating dock thống nhất; dọn toàn bộ CSS sidebar/FAB cũ.
- Thêm dark mode tự nhận hệ thống, nút đổi thủ công và lưu `nhip-viec-theme` trong `src/hooks/useTheme.js`, `src/components/layout/AppLayout.jsx`.
- Thêm route transition, reveal, count-up, chart drawing và micro-interaction 150–250ms; tôn trọng `prefers-reduced-motion` trong `src/styles/motion-system.css`.
- Nâng vùng chạm lên tối thiểu 44px, Kanban mobile có snap/gợi ý cuộn, bố cục riêng cho 360/768/1280px.
- Thêm màu semantic, nhãn chữ và icon cho trạng thái, ưu tiên, sắp/quá hạn; nhiệm vụ hoàn thành được gạch/mờ nhẹ.

### Luồng công việc và phản hồi

- Sửa CTA **Tạo việc** trên dock với `?new=1` để mở đúng form tạo nhiệm vụ trong `src/pages/Tasks.jsx`.
- Thêm hoàn thành nhanh trên thẻ, sort theo thứ tự/hạn/ưu tiên, lọc đồng thời nhiều trạng thái và mức ưu tiên.
- Thêm hoàn tác xóa nhiệm vụ trong 6 giây; toast có nút đóng và tạm dừng khi hover/focus.
- Thêm CTA cho trạng thái rỗng, banner lỗi toàn cục, trạng thái đang lưu và giữ form mở khi mutation thất bại.
- Giới hạn tiêu đề 160 ký tự, clamp tiêu đề dài, kiểm tra ngày bắt đầu/hạn và ngày đi/ngày về.

### Accessibility

- Modal có focus trap, Escape, focus ban đầu và trả focus về trigger trong `src/components/ui/index.jsx`.
- Chuẩn hóa `label/htmlFor/id`, `aria-label`, live region, `role=progressbar` và tên truy cập của nút icon.
- Tăng focus ring và không chỉ dùng màu: badge luôn có chữ, hạn có icon + nhãn.

### Dữ liệu và độ tin cậy

- Bắt lỗi toàn bộ create/update/remove/batch, hiển thị thông báo tiếng Việt và không đóng form khi lưu lỗi trong `src/hooks/useData.jsx` và các trang.
- Bắt quota/security error của localStorage trong `src/data/localRepo.js`; dữ liệu local vẫn bền qua reload.
- Firebase chỉ seed từng collection thật sự rỗng sau khi xác thực, không ghi đè collection đã có trong `src/data/firebaseRepo.js`.
- Tách context toast khỏi data và ổn định callback mutation để giảm render thừa.

### Hiệu năng

- Lazy-load từng trang; import Firebase động chỉ khi `VITE_DATA_MODE=firebase` trong `src/data/repository.js`.
- Memo hóa nhóm/lọc chính ở Dashboard và Tasks.
- Giảm font từ bốn xuống ba weight.
- Thay hai biểu đồ Recharts bằng HTML/CSS semantic nhẹ trong `src/pages/Dashboard.jsx`, `src/styles/charts.css`.
- JS gzip tải lần đầu route `/` là **103,8 kB**; CSS **22,58 kB gzip**. Firebase vẫn dynamic import; Firestore chunk **142,40 kB gzip**.

## Kiểm chứng

- ESLint: đạt, 0 lỗi và 0 cảnh báo.
- Unit/component: 49 file, 265/265 test đạt.
- Năm flow Phase 6: 15/15 đạt trên viewport 360×800, 768×1024 và 1280×800.
- Axe: 0 lỗi critical/serious trên 10 route, light/dark, ba viewport; keyboard flow đạt.
- Build production: đạt; các route chunk dưới 12 kB gzip, React vendor 59,13 kB gzip; Firebase/Firestore là vendor động.
- Persistence: E2E tạo dữ liệu rồi reload vẫn còn; theme reload vẫn giữ.
- Contrast semantic: 12/12 đạt WCAG AA; thấp nhất 6,85:1 ở light và dark.
- Lighthouse production preview: mobile 99 Performance / 100 Accessibility; desktop 100 / 100; CLS đều bằng 0.

## Chưa làm / đề xuất vòng tiếp theo

Các mục dưới đây đều là nâng cấp 🟢, không chặn phát hành:

1. Đưa axe-core/Lighthouse đang chạy cục bộ vào CI và biến 36 ảnh after thành visual regression có ngưỡng pixel diff.
2. Thêm virtualization cho bảng/Kanban khi dữ liệu đạt hàng nghìn nhiệm vụ.
3. Thêm trình chọn palette 8 màu cho người dùng; hiện dự án được ánh xạ tự động vào palette, màu chuyến đi cũ vẫn được giữ để tương thích dữ liệu.
4. Kiểm thử offline queue và xung đột đa thiết bị bằng tài khoản staging thật; rules đã có 14 test Emulator.
5. Chuẩn hóa thêm spacing scale thành token; hiện radius và motion đã có token, spacing vẫn dùng thang giá trị nhất quán trong CSS.
