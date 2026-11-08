# Hệ thiết kế Nhịp việc — Soft Brutalist Refresh

Phiên bản: 1.0  
Ngày chốt: 23/10/2026  
Trạng thái: đặc tả trước triển khai

## 1. Mục tiêu và nguyên tắc

Giao diện mới mượn nhịp điệu thị giác từ ảnh tham chiếu Softnet nhưng giữ nguyên bài toán quản lý công việc, route, dữ liệu, bộ lọc URL và nội dung tiếng Việt của Nhịp việc.

1. **Rõ trước, vui mắt sau:** phân cấp bằng kích thước, khoảng trắng, viền và chữ; màu củng cố ý nghĩa chứ không phải tín hiệu duy nhất.
2. **Một tờ giấy làm việc:** mọi phân hệ nằm trong sheet lớn nổi trên nền gradient, tạo một vùng tập trung ổn định.
3. **Tương tác có tính vật lý:** viền mực, bóng cứng và dịch chuyển nhỏ giúp nút/tile có affordance rõ mà không gây nhiễu.
4. **Màu có nhiệm vụ:** lime cho hành động/tiến triển, lavender cho hoàn thành/phụ trợ, ink cho điều hướng và điểm nhấn mạnh; semantic colors vẫn có icon và nhãn chữ.
5. **Nhanh và dễ chịu:** animation chỉ dùng transform/opacity, ngắn, không chặn thao tác và biến mất gần như hoàn toàn khi người dùng chọn giảm chuyển động.
6. **A11y là ràng buộc thiết kế:** tương phản chữ thường tối thiểu 4.5:1, vùng chạm tối thiểu 44px, thứ tự focus hợp lý, trạng thái không chỉ biểu đạt bằng màu.

## 2. Giả định đã chọn

- Giữ nguyên năm route hiện có. Tìm kiếm toàn cục điều hướng sang `/cong-viec?q=...`; các KPI dùng URL filter đang có thay vì tạo route mới.
- Component đăng nhập hiện chưa được nối vào router. Giai đoạn này làm mới component và ghi ảnh kiểm định bằng harness độc lập, không tự thêm luồng xác thực hoặc route vì đó là thay đổi chức năng.
- Dock cố định ở đáy viewport; nội dung có `padding-bottom` gồm chiều cao dock và `env(safe-area-inset-bottom)` để không bị che.
- Font chọn **Manrope** với hai weight dùng thường xuyên là 500 và 700, có glyph tiếng Việt, `font-display: swap`, fallback `system-ui, sans-serif`.
- Dark mode dùng sheet `#141816`, nền xanh rêu gần đen; lime/lavender giữ độ tươi và luôn đi với chữ ink. Tile ink có viền sáng để không chìm vào sheet.
- Danh sách từ 50 mục trở lên không stagger; các danh sách dài chỉ animate item mới hoặc item trong viewport.
- Không thêm thư viện biểu đồ hay animation. Đường, cột và donut dùng SVG/CSS; ba hook nhỏ phụ trách reduced motion, count-up và in-view.

## 3. Design tokens

### 3.1 Màu nền và chữ

| Token dự kiến | Light | Dark | Mục đích |
| --- | --- | --- | --- |
| `--color-ink` | `#0B0B0C` | `#F4F7EF` | Chữ chính và nét mực theo theme |
| `--color-ink-fixed` | `#0B0B0C` | `#0B0B0C` | Chữ trên lime/lavender, không đổi theo theme |
| `--color-paper` | `#FFFFFF` | `#141816` | Sheet và card chính |
| `--color-surface` | `#F5F7F0` | `#1B211D` | Bề mặt phụ |
| `--color-surface-raised` | `#FFFFFF` | `#222923` | Bề mặt nổi/modal |
| `--color-text` | `#0B0B0C` | `#F4F7EF` | Nội dung chính |
| `--color-text-muted` | `#525750` | `#B8C2B4` | Mô tả và metadata |
| `--color-border` | `#0B0B0C` | `#AAB6A6` | Viền mực 1.5px |
| `--color-border-subtle` | `#C9CEC4` | `#465047` | Hàng dữ liệu và phân cách |
| `--color-page-start` | `#E3F1D3` | `#0D140E` | Đầu gradient trang |
| `--color-page-end` | `#CFE8B9` | `#182317` | Cuối gradient trang |
| `--color-lime` | `#A6EA6B` | `#A6EA6B` | CTA, tiến độ, tile đang làm |
| `--color-lavender` | `#A9A8F6` | `#A9A8F6` | Tile hoàn thành, chuyến đi |
| `--color-focus` | `#2456D8` | `#B9CBFF` | Focus ring có tương phản |
| `--color-danger-dot` | `#C7352A` | `#FF786F` | Chấm chuông; luôn kèm số/nhãn |

Quy tắc: lime và lavender là **màu nền/fill**; chữ trên hai màu này luôn dùng `--color-ink-fixed`. Lime chỉ được dùng làm chữ/nét khi nền là ink/dark.

### 3.2 Semantic colors

| Ý nghĩa | Nền | Chữ/nét | Tín hiệu không phụ thuộc màu |
| --- | --- | --- | --- |
| Chưa làm | `#E8E9E5` | `#343833` | Vòng tròn rỗng + “Chưa làm” |
| Đang làm | `#D5E3FF` | `#173F80` | Vòng tròn nửa đầy + “Đang làm” |
| Hoàn thành | `#C9EFD7` | `#14532D` | Dấu tick + “Hoàn thành” |
| Quá hạn / ưu tiên cao | `#FFD8CF` | `#7A1F10` | Tam giác cảnh báo + nhãn chữ |
| Sắp đến hạn / ưu tiên TB | `#FFE49B` | `#614500` | Đồng hồ + nhãn chữ |
| Ưu tiên thấp | `#D6E9FF` | `#174A75` | Mũi tên xuống + “Thấp” |
| Thông tin | `#D7E8FF` | `#183F75` | Icon thông tin + nhãn |

Trong dark mode, badge semantic vẫn dùng các cặp nền/chữ pastel cố định để giữ tương phản và nhận diện ổn định.

### 3.3 Palette dự án, nhãn, chuyến đi và avatar

| Token | Giá trị | Dùng cho |
| --- | --- | --- |
| `--palette-lime` | `#A6EA6B` | Dự án 1 / avatar |
| `--palette-lavender` | `#A9A8F6` | Dự án 2 / avatar |
| `--palette-peach` | `#FFC6A8` | Dự án 3 / avatar |
| `--palette-sky` | `#A9D9F7` | Dự án 4 / avatar |
| `--palette-rose` | `#F5B6CE` | Dự án 5 / avatar |
| `--palette-butter` | `#F6DA79` | Dự án 6 / avatar |
| `--palette-mint` | `#A8E3CF` | Dự án 7 / avatar |
| `--palette-periwinkle` | `#C3C8FF` | Dự án 8 / avatar |

Các màu palette chỉ làm nền hoặc marker lớn và đi với ink cố định. Tên/initial/icon luôn hiện cùng màu.

### 3.4 Typography

| Token | Giá trị | Dùng cho |
| --- | --- | --- |
| `--font-sans` | `Manrope, system-ui, sans-serif` | Toàn ứng dụng |
| `--font-weight-medium` | `500` | Body, control, metadata |
| `--font-weight-bold` | `700` | Heading, KPI, active state |
| `--text-xs` | `0.75rem / 1.4` | Nhãn phụ |
| `--text-sm` | `0.875rem / 1.45` | Metadata, control |
| `--text-base` | `1rem / 1.55` | Body |
| `--text-lg` | `1.25rem / 1.3` | Heading card |
| `--text-xl` | `clamp(1.75rem, 3vw, 2.5rem) / 1.08` | Tiêu đề trang |
| `--text-kpi` | `clamp(2.5rem, 5vw, 3.5rem) / 0.95` | Số KPI |

KPI dùng `font-variant-numeric: tabular-nums`. Không tải weight khác; trình duyệt không được giả lập chữ quá mảnh.

### 3.5 Hình học, khoảng cách và bóng

| Token | Giá trị |
| --- | --- |
| `--space-1…8` | `4, 8, 12, 16, 24, 32, 48, 64px` |
| `--radius-sm` | `12px` |
| `--radius-md` | `20px` |
| `--radius-lg` | `28px` |
| `--radius-sheet` | `clamp(24px, 3vw, 32px)` |
| `--radius-pill` | `999px` |
| `--border-ink` | `1.5px solid var(--color-border)` |
| `--shadow-hard` | `3px 3px 0 var(--color-shadow-hard)` |
| `--shadow-hard-hover` | `5px 5px 0 var(--color-shadow-hard)` |
| `--shadow-hard-active` | `1px 1px 0 var(--color-shadow-hard)` |
| `--shadow-sheet` | `0 24px 70px rgb(37 61 24 / 16%)` |

`--color-shadow-hard` là ink ở light; ở dark là `rgb(204 218 198 / 45%)` để bóng vẫn tách được khỏi nền tối.

### 3.6 Motion

| Token | Giá trị | Dùng cho |
| --- | --- | --- |
| `--motion-instant` | `120ms` | Active, focus, trạng thái nhỏ |
| `--motion-fast` | `200ms` | Hover, tab, chip |
| `--motion-base` | `320ms` | Route fallback, modal, item |
| `--motion-slow` | `600ms` | Count-up, hoàn thành |
| `--motion-chart` | `900ms` | SVG line, bar, donut |
| `--ease-out-expo` | `cubic-bezier(.16,1,.3,1)` | Hầu hết chuyển động |
| `--ease-spring` | `cubic-bezier(.34,1.56,.64,1)` | Pop/nhấc nhẹ |
| `--stagger-step` | `40ms` | Vào trang, tối đa 12 item |

Với `prefers-reduced-motion: reduce`, duration về gần 0, tắt translate/scale/count-up/stroke drawing/shimmer/stagger; chỉ giữ opacity tối đa 120ms nếu cần giúp nhận biết đổi trạng thái.

## 4. Kiểm tra tương phản

Tỷ lệ được tính theo WCAG 2.x từ sRGB. Các cặp dưới đây đều vượt 4.5:1 cho chữ thường.

| Chữ / nền | Tỷ lệ |
| --- | ---: |
| Ink `#0B0B0C` / paper `#FFFFFF` | 19.67:1 |
| Ink / lime `#A6EA6B` | 13.68:1 |
| Ink / lavender `#A9A8F6` | 9.01:1 |
| Muted `#525750` / paper | 7.40:1 |
| Muted `#525750` / surface `#F5F7F0` | 6.85:1 |
| Dark text `#F4F7EF` / sheet `#141816` | 16.55:1 |
| Dark muted `#B8C2B4` / sheet | 9.74:1 |
| Lime / dark sheet | 12.46:1 |
| High `#7A1F10` / `#FFD8CF` | 7.87:1 |
| Medium `#614500` / `#FFE49B` | 7.13:1 |
| Done `#14532D` / `#C9EFD7` | 7.29:1 |
| Doing `#173F80` / `#D5E3FF` | 7.90:1 |
| Todo `#343833` / `#E8E9E5` | 9.79:1 |

Kiểm tra tự động ở giai đoạn nền tảng sẽ khóa các cặp cốt lõi này. Màu focus được kiểm tra trên cả paper, surface và ink.

## 5. Kiến trúc shell

### Desktop / tablet rộng

```text
╭──────────── nền mint → lime ───────────────────────────────────────╮
│ ╭──────────────────── sheet trắng, bo 32 ───────────────────────╮ │
│ │ TÊN TRANG                [⌕ Tìm kiếm / ][📅][🔔2][☾][Tôi]    │ │
│ │ tab 1 ───  tab 2  tab 3                                     │ │
│ │                                                               │ │
│ │                   NỘI DUNG PHÂN HỆ                            │ │
│ │                                                               │ │
│ ╰───────────────────────────────────────────────────────────────╯ │
│    ╭ dock ink ──────────────────────────────────────────────╮     │
│    │ Nhịp việc  [Tổng quan] [□] [□] [□] [□]   [+ Tạo việc] │     │
│    ╰────────────────────────────────────────────────────────╯     │
╰───────────────────────────────────────────────────────────────────╯
```

### Mobile 360px

```text
╭──── nền gradient ────╮
│╭──── sheet 24px ────╮│
││ TÊN TRANG     [Tôi]││
││ [⌕ Tìm kiếm /    ] ││
││ tab ─ tab ─ tab    ││
││                    ││
││ NỘI DUNG 1 CỘT     ││
││                    ││
│╰────────────────────╯│
│╭──── dock + safe ───╮│
││ [⌂][✓][▦][✈][☏][+]││
│╰────────────────────╯│
╰──────────────────────╯
```

Dock có `aria-label="Điều hướng chính"`; mỗi mục dùng `aria-current="page"`; focus nhìn rõ và mọi target ít nhất 44×44px.

## 6. Wireframe từng phân hệ

### Tổng quan

```text
DESKTOP
┌ Nhịp việc hôm nay ─────────────────────┬ Nhịp hoàn thành (ink) ───┐
│ [phạm vi⌄] [Xem báo cáo]  legend       │  12  +18%   ~~~~~●        │
│ [Đang làm lime][Xong lavender][Quá hạn]│  mini bars / trục ngày   │
│ [Tổng] [Sắp hạn]  [T2][T3]...[CN]      │                           │
├ Tiến độ dự án ─────────────────────────┼ Cần chú ý ───────────────┤
│ [dự án ───── 68%  8 việc]              │ Việc hôm nay | 7 ngày tới│
│ [dự án ── 42%  5 việc]                 │ □ hàng công việc          │
│ [donut]        [cột theo dự án]         │ ✈ chuyến đi / ⚠ lịch trùng│
└────────────────────────────────────────┴───────────────────────────┘

MOBILE
[phạm vi] [báo cáo]
< tile lime | tile lavender | tile ink >  (snap ngang)
[Tổng][Sắp hạn] / chip ngày
[thẻ Nhịp hoàn thành]
[Tiến độ dự án]
[Cần chú ý: hôm nay]
[7 ngày tới] [Công tác]
```

### Công việc

```text
DESKTOP
Kanban ───  Danh sách  Dự án
[⌕ tìm] [Trạng thái⌄][Ưu tiên⌄][Dự án⌄][Sắp xếp⌄] [Đặt lại]
┌ Chưa làm 5 ─┐ ┌ Đang làm 3 ─┐ ┌ Chờ 1 ──────┐ ┌ Xong 7 ──────┐
│ card nhiệm vụ│ │ card nhiệm vụ│ │ card nhiệm vụ│ │ card nhiệm vụ│
│ icon + ưu tiên│ │ ...          │ │ ...          │ │ ...          │
└───────────────┘ └──────────────┘ └──────────────┘ └──────────────┘

MOBILE
[Kanban][Danh sách][Dự án] (cuộn ngang)
[⌕ tìm kiếm]
[Bộ lọc] [Sắp xếp] [Đặt lại]
< cột Kanban snap ngang > hoặc hàng danh sách 1 cột
```

### Lịch

```text
DESKTOP
[‹] Tháng 10/2026 [›]          [Ngày][Tuần][Tháng]
┌ T2 ┬ T3 ┬ T4 ┬ T5 ┬ T6 ┬ T7 ┬ CN ┐
│ ô ngày; hôm nay lime; chọn ink; trip lavender │
└───────────────────────────────────────────────┘
Agenda: [giờ][icon][tiêu đề][trạng thái] ...

MOBILE
[‹] Tháng 10 [›]
[Ngày][Tuần][Tháng]
[lưới tháng cuộn vừa 360px]
[Agenda theo ngày, hàng 44px+]
```

### Công tác

```text
DESKTOP
[⚠ banner lịch trùng]
[tile lime: Hà Nội / số việc / %] [tile lavender] [tile peach/ink]
Chi tiết chuyến
┌ Trước chuyến ┐ ─ ┌ Trong chuyến ┐ ─ ┌ Sau chuyến ┐

MOBILE
[banner]
< tile chuyến snap ngang >
[header chuyến]
[timeline dọc: trước → trong → sau]
```

### Danh bạ

```text
DESKTOP
[⌕ tìm] [Nhóm⌄]
[avatar pastel  Tên / chức vụ  (gọi)(mail)] × lưới 3–4 cột
[profile header màu đặc khi mở chi tiết]

MOBILE
[⌕ tìm]
[avatar][Tên + metadata]          [(gọi)(mail)]
[các hàng danh bạ 1 cột]
```

### Đăng nhập

```text
DESKTOP / MOBILE
╭──────── nền gradient toàn màn hình ────────╮
│       ╭──── card paper, bo lớn ─────╮      │
│       │ Nhịp việc / Đăng nhập       │      │
│       │ [Email] [Mật khẩu]          │      │
│       │ [ Đăng nhập ink + shadow ]  │      │
│       │ [Google] [Dùng bản cục bộ]  │      │
│       ╰─────────────────────────────╯      │
╰────────────────────────────────────────────╯
```

## 7. Bản đồ animation

| Nhóm | Cách làm | A11y / hiệu năng |
| --- | --- | --- |
| Chuyển route | `document.startViewTransition` bọc navigate; fallback page fade + translateY(12px) | Sau route focus H1; reduce chỉ fade ngắn |
| Vào trang | `.reveal-item` với delay `index × 40ms`, tối đa 12 | Không chạy lại khi lọc; bỏ với >50 item |
| Dock | Active capsule bằng transform; nhãn dùng opacity/scaleX | Không thay đổi thứ tự DOM; focus tức thời |
| Tab/segment | Underline/capsule trượt bằng transform | `aria-selected`, phím mũi tên nếu role tab |
| Nút/tile | Hover translateY(-2px), shadow dài; active translate(2px,2px), shadow co | Focus ring riêng, không bị shadow che |
| KPI | DOM giữ số cuối cho screen reader; lớp `aria-hidden` count-up 600ms | Reduce hiển thị số cuối ngay |
| Chart | SVG dashoffset; bar scaleY; donut dasharray; progress scaleX | SVG có title/summary text; reduce hiện trạng thái cuối |
| Hoàn thành | Tick stroke, strike overlay scaleX, card opacity | Text/trạng thái cập nhật ngay, animation chỉ trang trí |
| Thêm/xóa | Add opacity + scale; delete grid rows 1fr→0fr | Không giữ focus trong node đã xóa; toast có undo |
| Modal/sheet | Backdrop opacity; modal scale; mobile translateY | Giữ focus trap/Esc/restore focus |
| Toast | TranslateY từ dưới, nằm trên dock; progress 6 giây | `role=status`; pause khi hover/focus; undo 44px |
| Loading | Skeleton cùng kích thước, shimmer bằng transform | `aria-busy`; reduce tắt shimmer |
| Lịch | Tháng translateX theo hướng, ngày chọn spring nhẹ | Reduce đổi tức thời; không gây layout shift |
| Chuông | Rung một lần khi số quá hạn mới tăng | Không lặp; reduce tắt rung; badge số vẫn hiện |

## 8. Quy tắc responsive

- **360px:** một cột, toolbar xuống dòng, table chuyển thành row card, tile/kanban có horizontal snap khi cần; không có cuộn ngang toàn trang.
- **768px:** sheet dùng gần toàn chiều rộng, dashboard linh hoạt 1–2 cột, dock giữ nhãn active, control tối thiểu 44px.
- **1280px:** sheet giới hạn khoảng 1440px, dashboard 2 cột, lưới danh bạ và chuyến đi nhiều cột.
- Nội dung có thể co; không dùng chiều rộng cố định cho chữ tiếng Việt. Tiêu đề dài dùng wrap hợp lý, không ellipsis ở nơi cần hiểu đầy đủ.

## 9. Kiểm định dự kiến

- ESLint, 24 unit/component tests, 12 E2E cũ phải tiếp tục đạt.
- Thêm E2E cho dock, tìm kiếm toàn cục, `?new=1`, keyboard shortcuts và reduced motion.
- Axe trên 6 màn hình × 3 viewport × 2 theme; không còn lỗi critical/serious.
- Lighthouse Performance và Accessibility mục tiêu ≥95; CLS gần 0.
- JS khởi động mục tiêu không quá khoảng 80 kB minified; không có chunk >500 kB. Firebase tiếp tục lazy-load và không tính vào mã khởi động nếu chưa dùng.
- Bộ ảnh sau nâng cấp đối xứng đủ 36 ảnh với baseline.

## 10. Ngoài phạm vi vòng này

- Không thiết kế luồng authentication mới hoặc tự gắn route đăng nhập.
- Không đổi mô hình Firebase/localStorage, schema dữ liệu hay logic nghiệp vụ.
- Không thêm drag-and-drop Kanban nếu hiện tại chưa có; animation chỉ làm mượt những thao tác sẵn có.
- Không thêm thư viện chart, icon hoặc animation nặng.

## 11. Trạng thái triển khai

Thiết kế trong tài liệu này đã được triển khai trên nhánh `feature/ui-refresh` ngày 23/10/2026. Các sai khác có chủ đích:

- Màn đăng nhập được làm mới và kiểm định bằng harness tương đương source, nhưng không tự gắn route mới vì authentication routing nằm ngoài phạm vi.
- Firebase dùng dynamic import theo chế độ dữ liệu để bản local không preload Auth/Firestore.
- Bộ kiểm định cuối đạt 27/27 Playwright, 24/24 unit, Lighthouse 99/100 trên mobile và 100/100 trên desktop; chi tiết tại `docs/audit/REPORT.md`.
- Bộ ảnh bàn giao gồm 36 ảnh before và 36 ảnh after tại `docs/screenshots/`.

## 12. Kiến trúc UI sau vòng sửa bố cục

- `app-shell`: grid `topbar / main minmax(0,1fr) / dock`; chỉ `main` cuộn; dùng `100dvh`, safe-area và compact mode khi cao ≤800px.
- Z-index: content < sticky < dock < popover < toast < drawer/modal < tooltip; popover render qua portal và tự tránh mép viewport.
- Drawer desktop rộng `clamp(420px,36vw,560px)`; mobile là sheet tối đa 92dvh. Grid row tường minh giữ header/footer trong viewport và body là vùng cuộn duy nhất.
- Project dùng `colorIndex` 1–8 và status `running/paused/done/archived`; mọi màu lấy từ label token, không nhận màu tùy ý.
- Ở ≥1600px, container queries mở rộng Kanban/project grid; ở mobile dock chỉ còn icon + dấu active, vùng chạm tối thiểu 44px.
