# Nhịp việc — Quản lý công việc & lịch công tác

> Dành cho AI tiếp tục phát triển: đọc [README_AI.md](README_AI.md) để nắm code và chức năng hiện tại, cùng [AGENTS.md](AGENTS.md) để tuân thủ quy ước làm việc.

## Dự án này là gì?

**Nhịp việc** là ứng dụng web quản lý công việc cá nhân và nhóm nhỏ bằng tiếng Việt. Ứng dụng gom nhiệm vụ, dự án, lịch, chuyến công tác và danh bạ vào một luồng làm việc thống nhất: tạo việc, phân công, theo dõi tiến độ, xem trên lịch, liên kết với chuyến đi và tra cứu người liên quan.

Đây là một Single Page Application viết bằng React 18 và Vite. App có thể chạy hoàn toàn trên trình duyệt với `localStorage`, hoặc chuyển sang Firebase Authentication + Cloud Firestore để đăng nhập và đồng bộ dữ liệu giữa nhiều thiết bị.

Giao diện dùng phong cách **soft brutalist**: nền chuyển sắc xanh mint, mặt giấy sáng, viền mực rõ, bóng đổ cứng và các mảng lime/lavender/pastel có chức năng. Toàn bộ giao diện, thông báo và nội dung nghiệp vụ đều dùng tiếng Việt.

### Luồng sử dụng chính

1. Tạo dự án hoặc dùng ứng dụng không cần dự án.
2. Tạo nhiệm vụ, đặt trạng thái, ưu tiên, hạn, nhãn và người phụ trách.
3. Theo dõi công việc bằng Dashboard, Kanban, danh sách, nhóm dự án hoặc sơ đồ.
4. Xem nhiệm vụ và chuyến công tác trên lịch ngày/tuần/tháng.
5. Gắn nhiệm vụ với chuyến công tác và chia theo giai đoạn trước/trong/sau chuyến đi.
6. Quản lý danh bạ để chọn người giao, người phụ trách và người phối hợp.
7. Dùng chế độ local không cần tài khoản, hoặc đăng nhập Firebase để đồng bộ dữ liệu.

Production: [https://quan-ly-cong-viec-sable.vercel.app](https://quan-ly-cong-viec-sable.vercel.app)

> Trạng thái truy cập production phụ thuộc cấu hình Deployment Protection của Vercel project.

## 1. Những hạng mục đã hoàn thành

### Sản phẩm và nghiệp vụ

- Dashboard theo dõi tổng số nhiệm vụ, việc đang làm, hoàn thành, sắp đến hạn và quá hạn.
- Quản lý nhiệm vụ theo ba góc nhìn: Kanban, danh sách và dự án; CRUD dự án đầy đủ.
- Tạo, xem, sửa, hoàn thành, đổi trạng thái và xóa nhiệm vụ.
- Tìm kiếm tiếng Việt không dấu; lọc đồng thời nhiều trạng thái, mức ưu tiên và nhãn.
- Sắp xếp theo thứ tự mặc định, hạn gần nhất hoặc ưu tiên cao nhất.
- Checklist, tiến độ tự động/thủ công, người giao, người phụ trách, dự án và chuyến công tác liên quan.
- Việc lặp ngày/tuần/tháng, nhắc việc khi app đang mở, quick-add tiếng Việt và báo cáo tuần có thể sao chép.
- Kéo-thả Kanban kèm menu “Chuyển sang…” cho bàn phím/di động; hoàn tác giữ đúng snapshot và task lặp sinh lần kế tiếp idempotent.
- Lịch ngày/tuần/tháng kết hợp nhiệm vụ và chuyến công tác.
- Quản lý chuyến đi, phát hiện lịch trùng và chia việc theo trước/trong/sau chuyến đi.
- Quản lý danh bạ và hiển thị các nhiệm vụ liên quan theo vai trò.
- Sổ tay/ghi chú có nhãn và backlinks tới dự án, chuyến đi, liên hệ; quản lý nhãn task + note trong một batch.
- Command palette `Ctrl/Cmd+K`, trang Cài đặt, xuất JSON/CSV/ICS, nhập JSON có preview và xóa local xác nhận hai bước.
- Onboarding ba bước cho lần dùng đầu, lựa chọn dữ liệu mẫu hoặc bắt đầu trống; có thể mở lại và xóa nhanh dữ liệu mẫu.
- Lưu dữ liệu bền vững bằng localStorage hoặc Firebase/Firestore.
- PWA precache app shell, chạy lại offline sau lần tải đầu và thông báo khi có phiên bản mới; không cache request Firebase/Auth.

### UI/UX

- Design tokens tập trung cho màu, bề mặt, viền, chữ, bóng cứng, bo góc, spacing và chuyển động.
- Hệ màu semantic riêng cho trạng thái, mức ưu tiên, hạn chót, lỗi và chuyến công tác.
- Palette tám màu pastel dành cho dự án và 12 màu tương phản dành cho nhãn.
- Light mode và dark mode; tự nhận cài đặt hệ thống, cho phép chuyển thủ công và ghi nhớ lựa chọn.
- Touch target tối thiểu 44px, bố cục kiểm thử tại 360px, 768px và 1280px.
- Topbar có tìm kiếm toàn cục, theme, thông báo và hồ sơ; floating dock thống nhất điều hướng ở mọi viewport.
- Hiệu ứng route transition, reveal, count-up, chart drawing, hover, active, focus và hoàn thành nhiệm vụ; tôn trọng `prefers-reduced-motion`.
- Empty state, loading state, error banner, trạng thái đang lưu và toast phản hồi.
- Xác nhận trước khi xóa; nhiệm vụ đã xóa có thể hoàn tác trong sáu giây.

### Accessibility

- Modal có focus trap, đóng bằng `Escape` và trả focus về vị trí ban đầu.
- Các trường form có `label`, `id`, giới hạn dữ liệu và thông báo lỗi liên kết đúng.
- Nút chỉ có icon đều có tên truy cập bằng `aria-label`.
- Progress bar có đầy đủ role và thuộc tính ARIA.
- Toast dùng live region, có nút đóng và tạm dừng thời gian khi hover/focus.
- Trạng thái không chỉ truyền đạt bằng màu mà luôn có chữ, chấm trạng thái hoặc icon.
- Các cặp màu semantic đạt tối thiểu WCAG AA 4.5:1 cho chữ thường.

### Độ tin cậy và hiệu năng

- Mutation thất bại không đóng form và hiển thị lỗi bằng tiếng Việt.
- Bắt lỗi quota/security của localStorage.
- Dữ liệu mẫu chỉ được thêm khi người dùng chọn trong onboarding; dữ liệu Firebase được phân vùng theo tài khoản và không ghi đè dữ liệu local nếu người dùng chưa chọn nhập.
- Firestore sử dụng persistent local cache nhiều tab.
- Lazy-load từng phân hệ; Firebase chỉ import động khi thực sự bật chế độ Firebase.
- Biểu đồ được xây bằng SVG/HTML/CSS nhẹ thay vì thư viện biểu đồ nặng.
- Các trang được tách thành chunk lazy-load; bản build hiện không có chunk vượt 500 kB.

## 2. Mô tả từng phân hệ

### 2.1. Tổng quan

Đường dẫn: `/`

Mục tiêu của phân hệ là cho người dùng nhìn nhanh tình hình công việc mà không cần mở từng danh sách.

Chức năng:

- Chọn phạm vi **Hôm nay**, **Tuần này** hoặc **Tháng này**.
- Năm KPI: tổng nhiệm vụ, đang thực hiện, hoàn thành, sắp đến hạn và quá hạn.
- Bấm KPI để mở trang Công việc với bộ lọc tương ứng.
- Theo dõi tiến độ của từng dự án.
- Biểu đồ donut phân bổ nhiệm vụ theo trạng thái.
- Hai nhóm tập trung: việc hôm nay và việc trong bảy ngày tới.
- Tick hoàn thành trực tiếp ngay trên Dashboard.
- Danh sách ba chuyến công tác sắp tới và cảnh báo nếu lịch bị trùng.
- Biểu đồ cột thể hiện khối lượng nhiệm vụ theo dự án.

Giao diện:

- Desktop dùng sheet lớn, tile KPI nổi bật và dashboard nhiều cột theo tinh thần mẫu tham chiếu.
- Tablet tự chuyển xuống hai cột; dock thu gọn thương hiệu nhưng giữ đủ các phân hệ chính.
- Mobile xếp card thành một cột, tile có vùng cuộn snap riêng và giữ floating dock ở đáy.
- Số KPI count-up nhẹ; biểu đồ đường, cột và donut có nhãn/summary tương đương cho screen reader.

### 2.2. Công việc

Đường dẫn: `/cong-viec`

Đây là phân hệ trung tâm để quản lý toàn bộ vòng đời nhiệm vụ.

Chức năng:

- Tìm theo tên, mô tả và ghi chú; hỗ trợ tìm không dấu.
- Lọc đồng thời nhiều trạng thái: Chưa bắt đầu, Đang thực hiện, Chờ phản hồi, Hoàn thành, Tạm dừng.
- Lọc đồng thời nhiều mức ưu tiên: Thấp, Trung bình, Cao, Khẩn cấp.
- Lọc theo dự án, nhiều nhãn theo điều kiện ANY và các nhóm hạn chót từ Dashboard.
- Sắp xếp theo thứ tự mặc định, hạn gần nhất hoặc ưu tiên cao nhất.
- Nút **Đặt lại** để xóa toàn bộ bộ lọc.
- Ba kiểu hiển thị:
  - **Kanban:** chia nhiệm vụ theo năm trạng thái.
  - **Danh sách:** bảng chi tiết trạng thái, ưu tiên, hạn, tiến độ và người phụ trách.
  - **Dự án:** card dự án, số nhiệm vụ và tiến độ tổng hợp.
- Tạo/sửa nhiệm vụ với tiêu đề, nhãn, mô tả, trạng thái, ưu tiên, ngày bắt đầu, hạn, dự án, chuyến đi, người giao, người phụ trách và ghi chú.
- Mỗi nhiệm vụ có trường `tags: string[]`, tối đa 5 nhãn; mỗi tên dài 1–24 ký tự sau chuẩn hóa NFC, bỏ `#`, gộp khoảng trắng và khử trùng không phân biệt hoa thường.
- **Quản lý nhãn** hỗ trợ đổi tên, gộp, xóa và chọn lại một trong 12 màu; route DEV `/__tags` dùng để xem trước toàn bộ palette và không có trong bundle production.
- Registry màu nằm ngoài task: local dùng `nhip-viec-tag-colors`; Firebase dùng `users/{uid}/meta/tagColors` với map `c.<tagKey> = 0..11`.
- Checklist con và tiến độ tự động; có thể chuyển sang tiến độ thủ công.
- Hoàn thành/mở lại bằng nút tick trên thẻ mà không cần mở form.
- Đổi trạng thái từ menu trên thẻ hoặc select trong bảng.
- Cảnh báo bằng chữ và icon cho “Hạn hôm nay”, “Sắp đến hạn” và “Quá hạn”.
- Xác nhận xóa và hỗ trợ hoàn tác trong sáu giây.
- Giữ bộ lọc trên URL để có thể bookmark hoặc quay lại đúng ngữ cảnh.

Giao diện:

- Thẻ nhiệm vụ hiển thị ưu tiên, tiêu đề, hạn, tiến độ, trạng thái, người phụ trách và dự án.
- Nhiệm vụ hoàn thành được gạch chữ và giảm độ nổi bật.
- Tiêu đề dài được giới hạn 120 ký tự và line-clamp để không phá bố cục.
- Kanban mobile dùng các cột rộng theo viewport, cuộn ngang có snap.
- Nút **Tạo việc** màu lime ở floating dock mở trực tiếp form qua `?new=1`.
- Form hiển thị dạng drawer bên phải trên desktop và bottom sheet tối đa 92dvh trên mobile; footer lưu luôn nằm trong viewport.

### Quản lý dự án

- Tạo, sửa, lưu trữ, khôi phục và xóa dự án; tên tối đa 60 ký tự trên giao diện và không được trùng kể cả khác dấu/hoa thường.
- Chọn một trong tám màu pastel, trạng thái, ngày bắt đầu/hạn và người phụ trách từ Danh bạ.
- Detail drawer có tiến độ, metadata, CTA thêm việc đã chọn sẵn dự án và chuyển hàng loạt nhiệm vụ.
- Khi xóa, nhiệm vụ được giữ và gỡ liên kết hoặc chuyển sang dự án khác; có hoàn tác sáu giây.
- Dự án lưu trữ ẩn mặc định; bộ lọc hiển thị số việc. Dữ liệu cũ được migration tự động trên localStorage và Firestore.

### 2.3. Lịch

Đường dẫn: `/lich`

Phân hệ Lịch đặt nhiệm vụ và chuyến công tác trên cùng một trục thời gian.

Chức năng:

- Chuyển giữa chế độ ngày, tuần và tháng.
- Đi tới hôm nay hoặc chuyển khoảng thời gian trước/sau.
- Mỗi ô ngày hiển thị nhiệm vụ đến hạn và chuyến công tác đang diễn ra.
- Chọn một ngày để xem agenda chi tiết bên dưới.
- Bấm nhiệm vụ để mở form chỉnh sửa.
- Bấm đúp ô ngày để tạo nhiệm vụ mới với ngày đã chọn.
- Đổi hạn nhiệm vụ bằng date input; ngày bắt đầu được dịch theo cùng khoảng thời gian.
- Sau khi đổi ngày có toast hoàn tác.
- Ô ngày có accessible name chứa ngày, số nhiệm vụ và số chuyến công tác.

Giao diện:

- Desktop hiển thị lưới lịch đầy đủ với chip nhiệm vụ và dải chuyến đi.
- Mobile rút gọn chip thành các chấm màu để tránh tràn nội dung; agenda bên dưới giữ đầy đủ tên và trạng thái.
- Chuyến đi sử dụng palette pastel; nhiệm vụ dùng màu trạng thái semantic.
- Ngày hiện tại, ngày được chọn và ngày có lịch trùng có trạng thái thị giác riêng.

### 2.4. Công tác

Đường dẫn: `/cong-tac`

Phân hệ này quản lý chuyến công tác và các nhiệm vụ liên quan trước, trong và sau chuyến đi.

Chức năng:

- Tạo/sửa chuyến đi với tên, địa điểm, ngày đi, ngày về, mục đích, ghi chú và màu nhận diện.
- Kiểm tra ngày về không được trước ngày đi.
- Tự chia chuyến thành ba nhóm: Đang diễn ra, Sắp tới và Đã qua.
- Cảnh báo khi hai hoặc nhiều chuyến công tác bị trùng thời gian.
- Card chuyến đi hiển thị thời gian, địa điểm, mục đích, số nhiệm vụ và tiến độ chuẩn bị.
- Chi tiết chuyến đi chia nhiệm vụ thành ba giai đoạn: trước chuyến, trong chuyến và sau chuyến.
- Tick hoàn thành nhiệm vụ ngay trong chi tiết chuyến đi.
- Hiển thị riêng các việc đến hạn trong thời gian đi, kể cả việc chưa gắn chuyến.
- Khi xóa chuyến, nhiệm vụ được giữ lại và chỉ gỡ liên kết với chuyến đó.

Giao diện:

- Chuyến đi hiển thị dưới dạng card có viền màu nhận diện.
- Banner màu hổ phách kèm icon cảnh báo lịch trùng.
- Desktop dùng lưới nhiều cột; mobile chuyển thành một cột.
- Trạng thái rỗng có CTA tạo chuyến mới.

### 2.5. Danh bạ

Đường dẫn: `/danh-ba`

Danh bạ lưu thông tin những người tham gia công việc và dùng làm nguồn chọn người giao/phụ trách.

Chức năng:

- Tìm theo họ tên hoặc đơn vị.
- Tạo/sửa họ tên, chức danh, đơn vị, số điện thoại, email và ghi chú.
- Kiểm tra định dạng email và số điện thoại.
- Gọi điện hoặc soạn email trực tiếp từ card liên hệ.
- Xem hồ sơ liên hệ và các nhiệm vụ liên quan theo ba vai trò: giao việc, phụ trách và phối hợp.
- Liên hệ “Tôi” được giữ làm người phụ trách mặc định.
- Khi xóa liên hệ, nhiệm vụ và chuyến đi vẫn được giữ; hệ thống chỉ gỡ hoặc thay thế liên kết an toàn.
- Modal xác nhận cho biết trước số nhiệm vụ/chuyến đi bị ảnh hưởng.

Giao diện:

- Card liên hệ gồm avatar chữ cái, tên, chức danh, đơn vị và action gọi/email.
- Chi tiết hiển thị profile header và các nhóm nhiệm vụ liên quan.
- Lưới tự chuyển từ nhiều cột sang một cột trên mobile.
- Trạng thái rỗng có nút thêm liên hệ đầu tiên.

### 2.6. Đăng nhập và dữ liệu

Trang đăng nhập chỉ xuất hiện khi ứng dụng chạy ở chế độ Firebase.

Chức năng:

- Đăng nhập bằng email/mật khẩu.
- Tạo tài khoản email/mật khẩu.
- Đăng nhập bằng Google.
- Báo lỗi đăng nhập và khóa nút khi đang xử lý.
- Dữ liệu Firestore được phân vùng theo `users/{uid}`.

Hai chế độ dữ liệu:

- `local`: chế độ mặc định/demo, không cần tài khoản; dữ liệu lưu trong `localStorage` và không mất khi reload.
- `firebase`: xác thực người dùng, đồng bộ Firestore và dùng persistent cache.

## 3. Thành phần giao diện dùng chung

### Điều hướng

- Topbar: tìm kiếm toàn cục, phím tắt `/`, đổi sáng/tối, thông báo và hồ sơ.
- Floating dock: thương hiệu, các phân hệ chính và CTA **Tạo việc**. Trên mobile, nhãn được ẩn trực quan nhưng accessible name vẫn đầy đủ.
- Sau mỗi lần đổi route, focus được chuyển về tiêu đề `h1`; trình duyệt hỗ trợ View Transitions sẽ dùng chuyển cảnh native.

### Hệ màu

- Màu nền: mint `#E3F1D3` → `#CDE7BE`; màu nhấn chính: lime `#A8ED75`; màu nhấn phụ: lavender `#AFA8F4`.
- Ink cố định `#0B0B0C`, paper `#FCFDF9`, peach `#FFC49B`; màu semantic vẫn được ánh xạ qua alias tương thích.
- Trạng thái có năm cặp foreground/background độc lập.
- Ưu tiên cao/khẩn dùng đỏ-cam; trung bình dùng hổ phách; thấp dùng xanh lá.
- Quá hạn dùng đỏ, sắp đến hạn dùng hổ phách.
- Nhãn dùng palette 12 màu tương phản, với registry màu ổn định riêng cho localStorage và Firestore.
- Token light/dark được quản lý tập trung trong `src/styles/tokens.css`.

### Modal, toast và trạng thái hệ thống

- Modal hỗ trợ bàn phím đầy đủ và không để focus thoát ra nền.
- Toast thông báo lưu, đổi trạng thái, lỗi và hoàn tác.
- Banner lỗi toàn cục có thể đóng.
- Loading state và empty state dùng chung giữa các phân hệ.

## 4. Phím tắt

- `N`: mở form tạo nhiệm vụ khi đang ở trang Công việc.
- `/`: đưa con trỏ vào ô tìm kiếm nhiệm vụ.
- `Esc`: đóng modal hiện tại.
- `Tab` / `Shift + Tab`: di chuyển focus trong modal; focus được giữ bên trong modal.

## 5. Công nghệ và cấu trúc dự án

Stack chính:

- React 18 và React Router.
- Vite.
- Firebase Authentication và Cloud Firestore.
- date-fns.
- Lucide React.
- CSS thuần với design tokens; không phụ thuộc UI framework.
- Vitest, Testing Library và Playwright.

Luồng dữ liệu chính:

```text
React pages/components
        │
        ▼
DataProvider + useData
        │
        ▼
repository.js ── local mode ──► localStorage
        │
        └────── firebase mode ─► Firebase Auth + Cloud Firestore
```

`repository.js` chọn repository theo cấu hình build. Nhờ cùng một giao diện thao tác dữ liệu (`subscribe`, `create`, `update`, `remove`, `batch`), phần giao diện không cần biết dữ liệu đang nằm trong trình duyệt hay Firestore.

Cấu trúc:

```text
src/
├── app/                 # Router, Page và Header
├── components/
│   ├── layout/          # Topbar, dock, command palette và onboarding
│   ├── mindmap/         # Dựng dữ liệu và hiển thị mind map/tree-map
│   ├── project/         # Form và nghiệp vụ giao diện dự án
│   ├── tags/            # Nhập, lọc, hiển thị và quản lý nhãn
│   ├── task/            # TaskCard, TaskForm
│   └── ui/              # Button, Modal, Badge, Toast, trạng thái dùng chung
├── data/                # localStorage repo, Firebase repo, seed
├── contexts/            # Data, Actions, Auth và Toast context tách biệt
├── hooks/               # Facade useData và hook theme, PWA, motion, transition
├── i18n/                # Chuỗi giao diện tiếng Việt
├── lib/                 # Logic lọc, tiến độ, ngày, chuyến đi
├── pages/               # Dashboard, các phân hệ nghiệp vụ, cài đặt và đăng nhập
│   └── tasks/           # TasksPage, Kanban/List/Projects, filter và actions
├── tags/                # Chuẩn hóa nhãn, màu nhãn và mutation hàng loạt
└── styles/              # Tokens, layout, animation, biểu đồ CSS

tests/                   # Unit và component test
e2e/                     # Playwright smoke, keyboard và axe accessibility
AUDIT.md                 # Đánh giá UI/UX trước khi sửa
CHANGELOG.md             # Thay đổi, bảng màu và kết quả kiểm chứng
DESIGN.md                # Hệ thiết kế và wireframe trước triển khai
docs/audit/              # Báo cáo Lighthouse và kiểm định cuối
docs/screenshots/        # Ảnh before/after ở 3 viewport × 2 theme
firestore.rules          # Quy tắc bảo mật Firestore
```

## 6. Chạy dự án trên máy

Yêu cầu: Node.js 24 và pnpm. Project dùng pnpm; không dùng `npm install` và không tạo `package-lock.json`.

```bash
pnpm install
pnpm dev
```

Nếu không khai báo Firebase, app chạy với dữ liệu local trên trình duyệt. Có thể đặt rõ chế độ này bằng:

```env
VITE_DATA_MODE=local
```

## 7. Kết nối Firebase

1. Tạo Firebase project và Web App trong Firebase Console.
2. Bật Authentication cho Google và Email/Mật khẩu.
3. Tạo Cloud Firestore ở production mode.
4. Tạo `.env.local` ở thư mục gốc của project.
5. Đặt `VITE_DATA_MODE=firebase` và điền các biến `VITE_FIREBASE_*`.
6. Deploy `firestore.rules` trước khi dùng production.

Ví dụ:

```env
VITE_DATA_MODE=firebase
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_RECAPTCHA_SITE_KEY=...
VITE_APPCHECK_DEBUG=...
```

Không commit `.env.local` hoặc thông tin nhạy cảm.

## 8. Kiểm thử và build

```bash
pnpm lint
pnpm test
pnpm test:coverage
pnpm build
pnpm e2e
pnpm test:pwa
pnpm lh
JAVA_HOME="$HOME/.local/jdk21/Contents/Home" pnpm test:rules
```

Kết quả gần nhất:

- ESLint: đạt, không có lỗi/cảnh báo.
- Unit/component test: 54 file, 275/275 test đạt; thời gian gần nhất 19,47 giây không coverage.
- Coverage V8 theo lines: toàn `src` 71,50%; `src/lib` 97,19%; `src/tags` 97,22%; `src/data` 82,39%.
- Firestore Emulator: 14/14 rules test đạt; `firebase-tools` 15 cần JDK 21.
- Production build: đạt với Node.js 24 và Vite 8.3.5.
- E2E có sẵn cho Project CRUD, responsive, smoke, reduced-motion, axe và keyboard; chỉ chạy khi cần kiểm tra trình duyệt đầy đủ.
- Viewport E2E: 360×800, 768×1024 và 1280×800.
- Production build hiện không có chunk vượt 500 kB.
- Toàn bộ E2E 57/57 đạt; năm flow Phase 6 và onboarding chạy trên ba viewport; axe 0 lỗi critical/serious trên 10 route, light/dark, 3 viewport.
- Playwright 5.000 task: Dashboard 127,7 ms, Calendar 61,2 ms, Tasks 94,5 ms; JS gzip route `/` là 110,1 kB.
- Lighthouse mobile: Performance 95, Accessibility 100, Best Practices 100; `pnpm lh` fail nếu dưới 90/95/95.
- Contrast token: 12/12 cặp đạt WCAG AA, thấp nhất 6,85:1.

## 9. Deploy Vercel

Project đã liên kết với Vercel. Có thể deploy production bằng:

```bash
vercel --prod
```

Sau khi deploy, xác minh kể cả khi Deployment Protection đang bật:

```bash
vercel curl https://quan-ly-cong-viec-sable.vercel.app
```

## 10. Giả định nghiệp vụ

- Một nhiệm vụ thuộc tối đa một dự án và một chuyến công tác.
- Nhiệm vụ con được quản lý dưới dạng checklist.
- Tuần bắt đầu từ Thứ Hai.
- Múi giờ nghiệp vụ là `Asia/Ho_Chi_Minh`.
- Ngày lưu dưới dạng `YYYY-MM-DD` và hiển thị `DD/MM/YYYY`.
- “Sắp đến hạn” là nhiệm vụ chưa hoàn thành có hạn trong ba ngày tới.
- “Quá hạn” là nhiệm vụ chưa hoàn thành có hạn trước hôm nay.
- Bộ lọc chạy phía trình duyệt, phù hợp với quy mô dữ liệu cá nhân/nhóm nhỏ.

## 11. Đề xuất nâng cấp tiếp theo

- Cân nhắc đưa cổng Lighthouse cục bộ hiện tại vào CI khi runner đủ ổn định.
- Nâng bộ ảnh before/after hiện có thành visual regression có ngưỡng pixel diff.
- Theo dõi UX nút “Xem thêm” Kanban và phân trang danh sách ở tập dữ liệu lớn.
- Dùng Firebase Emulator để kiểm thử migration/rules và xung đột đa thiết bị.
- Kiểm thử Firebase Rules, offline queue và xung đột đa thiết bị bằng Emulator Suite.

Xem thêm:

- `AUDIT.md`: báo cáo đánh giá trước khi nâng cấp.
- `CHANGELOG.md`: bảng màu chi tiết, danh sách file thay đổi và kết quả kiểm thử.
