# AUDIT UI/UX — Nhịp việc

Ngày đánh giá: 23/10/2026  
Phạm vi: toàn bộ `src/`, cấu hình build/test, repository localStorage/Firebase và bản production hiện tại.  
Đây là ảnh chụp hiện trạng **trước khi sửa** ở Giai đoạn 2–3.

## Tóm tắt điều hành

Ứng dụng đã có nền tảng tốt: kiến trúc màn hình rõ ràng, dữ liệu mẫu hữu ích, localStorage bền vững, thao tác chính có phản hồi toast, bộ lọc nằm trên URL, typography Be Vietnam Pro phù hợp tiếng Việt và các màn hình chính đã responsive cơ bản. Baseline kỹ thuật: ESLint đạt, 24/24 test đạt, build đạt.

Các rủi ro ưu tiên cao nhất là: nút tạo nhanh trên mobile không mở form, lỗi ghi dữ liệu không được bắt/hoàn lại, modal thiếu cơ chế focus/Escape, một số nhãn màu không đạt WCAG AA và bundle JavaScript quá lớn. Hệ màu hiện còn hard-code nhiều nơi và chưa có dark mode.

## 1. UI

| Mức | Vấn đề hiện trạng | Tác động | Vị trí |
|---|---|---|---|
| 🟡 Nên sửa | Màu được khai báo một phần ở tokens nhưng vẫn hard-code dày đặc trong CSS, biểu đồ, seed và inline style. | Khó duy trì, dark mode không thể nhất quán. | `src/styles/base.css`, `src/pages/Dashboard.jsx`, `src/data/seed.js`, `src/components/ui/index.jsx` |
| 🟡 Nên sửa | Badge `waiting`, `done`, `todo` không đạt tỷ lệ 4.5:1: lần lượt khoảng 3.07:1, 3.15:1 và 4.34:1 trên nền hiện tại. | Chữ nhỏ khó đọc và không đạt WCAG AA. | `src/styles/base.css:26` |
| 🟡 Nên sửa | Phần lớn bề mặt/KPI/progress cùng một tông indigo hoặc trắng-xám; thiếu màu chức năng phân biệt loại thông tin. | Phân cấp thị giác chưa nhanh, dễ mỏi khi dùng lâu. | `src/styles/tokens.css`, `src/styles/base.css:42` |
| 🟡 Nên sửa | Nhiều chú thích dùng cỡ 9–10px. | Khó đọc trên màn hình 360px và màn hình mật độ cao. | `src/styles/base.css` (`.kpi-card em`, `.legend`, `.project-line`) |
| 🟡 Nên sửa | Tiêu đề nhiệm vụ dài không có giới hạn nhập hoặc line-clamp. | Có thể làm thẻ Kanban cao bất thường và phá nhịp bảng. | `src/components/task/TaskForm.jsx`, `src/components/task/TaskCard.jsx`, `src/pages/Tasks.jsx` |
| 🟢 Nâng cấp thêm | Khoảng cách và bo góc nhìn chung nhất quán (8–18px, radius 9–14px), nhưng chưa có token spacing/radius đầy đủ. | Chưa gây lỗi, nhưng khó mở rộng. | `src/styles/base.css`, `src/styles/tokens.css` |
| 🟢 Nâng cấp thêm | Icon dự án lấy màu động nhưng không có palette giới hạn. | Người dùng/dữ liệu có thể tạo màu quá chói hoặc tương phản kém. | `src/data/seed.js`, `src/pages/Tasks.jsx` |

## 2. UX

| Mức | Vấn đề hiện trạng | Tác động | Vị trí |
|---|---|---|---|
| 🔴 Nghiêm trọng | FAB mobile điều hướng tới `/cong-viec?new=1`, nhưng `Tasks` không đọc `new=1` để mở modal. | Nút tạo nhanh nổi — CTA chính trên mobile — không hoàn thành tác vụ. | `src/components/layout/AppLayout.jsx`, `src/pages/Tasks.jsx` |
| 🔴 Nghiêm trọng | `create/update/remove/batch` được gọi trực tiếp, hầu như không `try/catch`; `error` trong DataProvider không bao giờ được dùng để render lỗi và không có rollback. | Quota localStorage, lỗi Firestore hoặc mất mạng có thể làm thao tác thất bại im lặng/đóng form sai. | `src/hooks/useData.jsx`, toàn bộ `src/pages/*.jsx` |
| 🟡 Nên sửa | Hoàn thành việc từ Kanban cần mở menu rồi chọn trạng thái; ở Dashboard có checkbox một bước, nhưng thẻ Kanban không có tick nhanh. | Luồng thường dùng chưa đồng nhất. | `src/components/task/TaskCard.jsx`, `src/pages/Dashboard.jsx` |
| 🟡 Nên sửa | Xóa có xác nhận ở nhiệm vụ/chuyến đi/danh bạ nhưng không có hoàn tác sau xóa; message nhiệm vụ nói “không thể hoàn tác”. | Dễ mất dữ liệu do thao tác nhầm. | `src/pages/Tasks.jsx`, `Trips.jsx`, `Contacts.jsx` |
| 🟡 Nên sửa | Toolbar có lọc nhưng không có điều khiển sắp xếp; code luôn dùng `order`. Chỉ chọn được một trạng thái và một ưu tiên. | Không đáp ứng kỳ vọng “lọc/tìm kiếm/sắp xếp” đầy đủ. | `src/pages/Tasks.jsx`, `src/lib/tasks.js` |
| 🟡 Nên sửa | Empty state chưa luôn có CTA theo ngữ cảnh; lỗi/đang tải có primitive nhưng ErrorState không được nối vào dữ liệu thật. | Người dùng không biết hành động tiếp theo hoặc cách phục hồi. | `src/components/ui/index.jsx`, `src/hooks/useData.jsx`, các trang |
| 🟡 Nên sửa | Toast tự ẩn sau 6 giây nhưng không có nút đóng, không tạm dừng khi hover/focus. | Có thể bỏ lỡ thông báo hoặc hành động hoàn tác. | `src/components/ui/ToastHost.jsx`, `src/hooks/useData.jsx` |
| 🟡 Nên sửa | Tạo/sửa là 2–3 bước hợp lý; xóa là 3 bước có xác nhận; đổi trạng thái có hoàn tác. Tuy nhiên form đóng ngay sau promise mà không có trạng thái “đang lưu”. | Có thể bấm lặp hoặc không rõ ứng dụng đang xử lý. | `TaskForm.jsx`, `Tasks.jsx`, `Trips.jsx`, `Contacts.jsx` |
| 🟢 Nâng cấp thêm | Query string giúp giữ bộ lọc và mở KPI đúng danh sách. | Điểm tốt, nên giữ. | `src/pages/Tasks.jsx`, `Dashboard.jsx` |

## 3. Mobile và responsive

| Mức | Vấn đề hiện trạng | Tác động | Vị trí |
|---|---|---|---|
| 🔴 Nghiêm trọng | FAB tạo nhanh mobile không hoạt động (xem UX). | Chặn luồng chính ở 360px. | `AppLayout.jsx`, `Tasks.jsx` |
| 🟡 Nên sửa | Nhiều vùng chạm nhỏ hơn 44px: segmented 36px, nút lịch 38px, icon danh bạ 38px, avatar/menu khoảng 28px. | Khó thao tác bằng ngón tay, không đạt hướng dẫn touch target. | `src/styles/base.css` |
| 🟡 Nên sửa | Kanban ở mobile là 5 cột 280px cuộn ngang, không có gợi ý cuộn hoặc snap. | Người dùng có thể không nhận ra các trạng thái bên phải. | `src/styles/base.css:37`, `src/pages/Tasks.jsx` |
| 🟡 Nên sửa | Toolbar nhiều select có thể xuống dòng dày ở 360px; nút action header bị ẩn chữ bằng `font-size: 0`. | Mất ngữ cảnh hành động và chiếm nhiều chiều cao. | `src/styles/base.css` media 767px |
| 🟡 Nên sửa | Breakpoint có 767/1100 nhưng chưa tối ưu riêng cho tablet 768px; sidebar 240px làm vùng nội dung hẹp. | Dashboard/table có thể chật đúng mốc tablet. | `src/styles/base.css` |
| 🟢 Nâng cấp thêm | Bảng danh sách có container cuộn, lịch mobile rút chip thành chấm, nav dưới đáy và FAB đúng mô hình mobile. | Nền tảng responsive tốt, cần hoàn thiện chi tiết. | `src/styles/base.css` |

## 4. Accessibility

| Mức | Vấn đề hiện trạng | Tác động | Vị trí |
|---|---|---|---|
| 🔴 Nghiêm trọng | Modal không khóa focus, không đóng bằng Escape, không tự focus tiêu đề/nút đầu và không trả focus cho trigger. | Người dùng bàn phím/screen reader có thể bị “lọt” ra nền hoặc mất vị trí. | `src/components/ui/index.jsx` (`Modal`) |
| 🟡 Nên sửa | Phần lớn `<label>` trong form không liên kết `htmlFor/id`; chỉ ô tên có aria-label. | Screen reader không đọc đúng tên trường. | `TaskForm.jsx`, `Trips.jsx`, `Contacts.jsx`, `Login.jsx` |
| 🟡 Nên sửa | Nút icon xóa trong bảng chỉ có SVG, không `aria-label`; một số button chỉ dựa vào tooltip/title hoặc text ẩn bằng CSS. | Tên truy cập thiếu/khó hiểu. | `src/pages/Tasks.jsx`, CSS mobile header |
| 🟡 Nên sửa | `ProgressBar` dùng `aria-label` trên div nhưng không có `role="progressbar"`, `aria-valuenow/min/max`. | Screen reader không nhận đây là tiến độ. | `src/components/ui/index.jsx` |
| 🟡 Nên sửa | Toast dùng `role=status` tốt nhưng container không có live-region rõ và nút hoàn tác không có thời gian/đóng. | Phản hồi động chưa mạnh với công nghệ hỗ trợ. | `ToastHost.jsx` |
| 🟡 Nên sửa | Focus ring dùng alpha thấp; một số phần tử `<summary>`, nút nền trong suốt không có vùng focus/touch rõ. | Khó theo dõi focus trên nền sáng/tối. | `src/styles/base.css` |
| 🟢 Nâng cấp thêm | Có semantic `nav/main/aside/article/section/table`, aria-label cho điều hướng và icon button dùng chung. | Điểm tốt, nên duy trì. | Layout và components |

## 5. Lỗi và rủi ro dữ liệu

| Mức | Vấn đề hiện trạng | Tác động | Vị trí |
|---|---|---|---|
| 🔴 Nghiêm trọng | Firebase `seedIfEmpty()` thực tế không kiểm tra collection rỗng và có thể ghi đè toàn bộ seed khi được gọi sau đăng nhập; hiện lại được gọi trước khi có user nên có lúc không seed gì. | Nguy cơ ghi đè dữ liệu hoặc tài khoản mới không có seed. | `src/data/firebaseRepo.js`, `src/hooks/useData.jsx` |
| 🟡 Nên sửa | localStorage bền qua reload và có bắt lỗi JSON, nhưng `write` không bắt quota/security error. | Ghi thất bại không được báo, UI có thể hiểu nhầm là đã lưu. | `src/data/localRepo.js` |
| 🟡 Nên sửa | Tiêu đề chỉ kiểm tra `trim()`, không có `maxLength`; text dài không được normalize/giới hạn. | Rủi ro UI vỡ và dữ liệu khó dùng. | `TaskForm.jsx` |
| 🟡 Nên sửa | Trạng thái quá hạn có viền/biểu tượng ở một số nơi nhưng chưa có nhãn chữ “Quá hạn” trên thẻ. | Người mù màu không nhận ra đầy đủ trạng thái hạn. | `TaskCard.jsx` |
| 🟡 Nên sửa | DataProvider có `error` nhưng không set khi subscribe/write lỗi; các trang chỉ xử lý loading. | Không có đường phục hồi khi backend lỗi. | `useData.jsx`, các trang |
| 🟢 Nâng cấp thêm | Xóa contact/trip gỡ liên kết thay vì xóa nhiệm vụ; đây là xử lý dữ liệu an toàn. | Điểm tốt. | `Contacts.jsx`, `Trips.jsx` |

## 6. Hiệu năng

| Mức | Vấn đề hiện trạng | Tác động | Vị trí |
|---|---|---|---|
| 🟡 Nên sửa | Bundle chính 1,381 kB minified / 419 kB gzip; Vite cảnh báo chunk >500 kB. Firebase, Recharts và toàn bộ page được tải ngay. | First load chậm hơn cần thiết, nhất là mobile. | `src/app/App.jsx`, `package.json`, build output |
| 🟡 Nên sửa | Import 4 weight font ở cả Vietnamese, latin-ext, latin tạo nhiều asset; tổng dist khoảng 1.7 MB. | Thêm request/font không cần thiết. | `src/main.jsx` |
| 🟡 Nên sửa | DataContext chứa toàn bộ data, toasts và inline action function trong một value; mọi thay đổi toast/data làm tất cả trang dùng context render lại. | Render thừa khi dữ liệu tăng. | `src/hooks/useData.jsx` |
| 🟡 Nên sửa | Nhiều phép `filter/find` lặp trong render (Kanban theo 5 cột, Dashboard, Contacts). | O(n×số khối), hiện nhỏ nhưng tăng rõ với vài nghìn việc. | `Tasks.jsx`, `Dashboard.jsx`, `Contacts.jsx` |
| 🟢 Nâng cấp thêm | Không có ảnh raster nặng; animation chủ yếu transform/opacity và có reduced motion. | Điểm tốt. | `animations.css`, Framer Motion config |

## Kế hoạch sửa bắt buộc cho Giai đoạn 2–3

1. Tập trung toàn bộ màu giao diện vào design tokens light/dark; thêm palette 8 màu và kiểm tra contrast.
2. Thêm theme provider/hook, tự nhận hệ thống, nút đổi theme và lưu lựa chọn.
3. Sửa FAB `?new=1`; thêm sort; nhãn hạn bằng icon + chữ; trạng thái hoàn thành có gạch/mờ.
4. Nâng touch target lên 44px và điều chỉnh layout 360/768/1280.
5. Nâng Modal: Escape, focus trap, trả focus; chuẩn hóa label/id và progressbar ARIA.
6. Bắt lỗi mutation, giữ modal khi lưu lỗi, hiển thị ErrorState và toast lỗi; bảo vệ localStorage/Firebase seed.
7. Hoàn tác xóa nhiệm vụ; thêm empty state có CTA; giới hạn tiêu đề hợp lý.
8. Lazy-load các page để chia chunk; giảm font không cần thiết; memo hóa các phép nhóm/lọc chính.

## Giả định

- Không đổi mô hình dữ liệu hoặc URL hiện có.
- Màu dự án/chuyến đi từ dữ liệu sẽ được ánh xạ/fallback vào palette an toàn, vẫn giữ dữ liệu cũ.
- Theme được lưu tại localStorage riêng, không đồng bộ Firebase.
- “Sửa tất cả 🔴/🟡” áp dụng trong phạm vi frontend hiện có; kiểm chứng Firebase production vẫn cần biến môi trường/tài khoản Firebase thật.
