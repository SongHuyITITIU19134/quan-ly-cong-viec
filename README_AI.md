# Nhịp việc — tài liệu tiếp nhận dự án cho AI

Tài liệu mô tả mã nguồn được rà soát ngày 08/11/2026. Đây là bản đồ để tìm đúng nơi sửa code, không phải cam kết rằng mọi chức năng đã được kiểm thử trên production. Khi code thay đổi, cập nhật tài liệu tương ứng.

## 1. Đọc trước khi làm việc

1. Đọc [AGENTS.md](AGENTS.md): quy ước của workspace và yêu cầu bảo vệ dữ liệu.
2. Đọc tài liệu này để hiểu phạm vi nghiệp vụ và kiến trúc.
3. Kiểm tra `git status --short`; bảo toàn thay đổi đang có của người dùng.
4. Dùng `rg -n` tìm ký hiệu/chức năng liên quan, chỉ đọc những đoạn cần thiết.
5. Đọc test liên quan trước khi đổi hành vi; xác minh tương xứng với phạm vi sửa.

Không đọc, in hoặc đưa vào tài liệu các file `.env*`, API key, token, mã xác thực. Không tự commit, push, deploy hay deploy Firestore rules. Chỉ chạy e2e khi được yêu cầu. Mỗi phiên tập trung một việc; báo cáo ngắn bằng tiếng Việt.

## 2. Sản phẩm và stack

Nhịp việc là ứng dụng web tiếng Việt để quản lý công việc, dự án, lịch công tác, danh bạ và ghi chú. Dữ liệu có thể lưu cục bộ hoặc đồng bộ theo tài khoản Firebase. Firestore hiện phân vùng theo người dùng; không suy diễn rằng ứng dụng đã có workspace chia sẻ, phân quyền nhóm hay giao việc thời gian thực giữa nhiều tài khoản.

- React 18, Vite, React Router; JavaScript/JSX, ES modules.
- CSS thuần; design tokens trong `src/styles/tokens.css`; icon Lucide, font Manrope.
- date-fns cho ngày; Firebase Authentication, Firestore và App Check tùy cấu hình.
- pnpm là trình quản lý gói; dùng Node 24. Không dùng `npm install`, không tạo `package-lock.json`.
- Vitest + Testing Library cho unit/component; Playwright dành cho e2e được yêu cầu riêng.
- Alias `@` trỏ tới `src`, cấu hình trong `vite.config.js`.

Dependency trong `package.json` dùng phiên bản cụ thể và được khóa trong `pnpm-lock.yaml`. Không tự nâng cấp dependency chỉ để làm một thay đổi giao diện.

## 3. Routes và chức năng đang có

Router ở `src/app/App.jsx`. Các trang nghiệp vụ được lazy-load. `RouteGuard` hiển thị màn đăng nhập khi chạy Firebase mà chưa có user; local không bắt buộc đăng nhập.

| Route | File chính | Chức năng hiện có |
| --- | --- | --- |
| `/` | `src/pages/Dashboard.jsx` | Lọc kỳ hôm nay/tuần/tháng; thống kê trạng thái, tiến độ dự án, biểu đồ; việc hôm nay và 7 ngày tới; tối đa 3 chuyến chưa hoàn thành còn thời gian; cảnh báo trùng lịch. |
| `/cong-viec` | `src/pages/tasks/TasksPage.jsx` | Kanban kéo-thả/menu bàn phím, danh sách, dự án; quick-add, việc lặp/nhắc, lọc và quản lý nhãn task + note. |
| `/lich` | `src/pages/Calendar.jsx` | Lịch ngày/tuần/tháng cho nhiệm vụ và công tác; agenda ngày được chọn; sửa ngày đến hạn, tạo nhiệm vụ; hiển thị buổi công tác và cảnh báo trùng buổi. |
| `/cong-tac` | `src/pages/Trips.jsx` | Tạo/sửa/xóa chuyến đi; buổi đi/về; hoàn thành/mở lại; nhóm đang diễn ra/sắp tới/đã qua; xem nhiệm vụ trước/trong/sau chuyến đi và việc đến hạn trong chuyến. |
| `/danh-ba` | `src/pages/Contacts.jsx` | Tìm tên/đơn vị, tạo/sửa/xóa liên hệ; gọi điện/gửi email bằng liên kết; xem công việc và chuyến đi liên quan. |
| `/so-do` | `src/pages/MindMap.jsx` | Mind map, tree-map và danh sách; lọc dự án/trạng thái; hiển thị nhiệm vụ, công tác liên quan và nhóm công tác chưa gắn dự án. |
| `/so-tay` | `src/pages/Notebooks.jsx` | Tổng quan sổ tay dạng lưới/danh sách, mẫu sổ, tìm kiếm, ghim, lưu trữ, sắp xếp. |
| `/so-tay/:notebookId` | `src/pages/Notebooks.jsx` | Tạo/sửa/xóa/chuyển ghi chú; tìm nội dung, lọc nhãn; ghim; liên kết dự án/công tác/liên hệ; hoàn tác khi xóa. |
| `/cai-dat` | `src/pages/Settings.jsx` | Theme, trang mặc định, kỳ báo cáo; xuất JSON/CSV/ICS, nhập JSON preview/xử lý trùng và xóa local hai bước. |
| `/login` | `src/app/App.jsx` | Redirect về `/`; đăng nhập Firebase do `RouteGuard` hiển thị tại route nghiệp vụ khi chưa có user. |
| `*` | `src/pages/NotFound.jsx` | Trang 404 có nút quay về trang chủ. |
| `/__tags` | `src/components/tags/TagPreview.jsx` | Trang xem nhãn chỉ được đưa vào router ở DEV. |

Đăng nhập nằm trong `src/pages/Login.jsx`, không phải route `/login` riêng. Có email/password, đăng ký, xác minh email, đặt lại mật khẩu, đăng nhập Google và đăng xuất. Logic xác thực/mapping lỗi nằm trong `src/data/firebase.js`, `src/auth/` và `useData`.

Layout chung ở `src/components/layout/AppLayout.jsx`: điều hướng, tìm kiếm, menu tạo nhanh, tài khoản, theme, thông báo lỗi và các banner xác minh/nhập local. `src/components/create/CreateCombo.jsx` xử lý tạo kết hợp dự án và nhiệm vụ.

## 4. Kiến trúc và đường đi dữ liệu

```text
src/main.jsx → ToastProvider / DataProvider / BrowserRouter → App → RouteGuard → AppLayout → Page
                                │
Page / component → hook hẹp hoặc useData facade → ActionsContext → repository.js
                                ├─ localRepo.js → localStorage
                                └─ firebaseRepo.js → users/{uid}/...
Repository subscription → DataProvider cập nhật state → giao diện render lại
```

`src/contexts/` tách `DataContext`, `ActionsContext`, `AuthContext`, `ToastContext`; `src/hooks/useData.jsx` giữ facade tương thích. Trang mới ưu tiên hook hẹp để tránh render lại do state không liên quan. Không gọi trực tiếp localStorage/Firestore từ component nghiệp vụ để thay thế mutation path đang có.

API thường dùng từ `useData()`:

- `data`: `{ projects, tasks, contacts, trips, notebooks, notes }`; có thể có `recoveryError` khi local bị lỗi.
- `create(collection, item)`, `update(collection, id, patch)`, `remove(collection, id)`.
- `batch(ops)`: các operation `{ type: 'create' | 'update' | 'remove', collection, id, data? }`.
- `tagRegistry`, `tagCatalog`, `saveTaskTags`, `manageTags`.
- `toast(message, { label, onClick }?)`, cùng trạng thái loading/error/auth và các action đăng nhập.

Wrapper `run` trong `useData` trả kết quả hoặc `true` khi repository thành công nhưng không trả giá trị; trả `null` và hiện lỗi khi thất bại. Kiểm tra kết quả trước khi đóng form, xóa lựa chọn hay báo thành công. Repository local có thể ném lỗi đồng bộ; repository Firebase trả Promise.

Toast hiện tồn tại 6 giây, hỗ trợ action hoàn tác và tạm dừng timer khi hover/focus. `ToastHost.jsx` hiển thị toast. Giữ nguyên snapshot cũ khi triển khai undo; không chỉ đảo một field nếu hành vi hiện tại khôi phục nhiều field.

## 5. Chế độ lưu trữ và bảo vệ dữ liệu

### Local

`src/data/localRepo.js` dùng các khóa:

| Khóa | Nội dung |
| --- | --- |
| `nhip-viec-v1` | `projects`, `tasks`, `contacts`, `trips` |
| `nhip-viec-notebooks` | Sổ tay |
| `nhip-viec-notes` | Ghi chú |
| `nhip-viec-initialized` | Đánh dấu đã khởi tạo dữ liệu lõi |
| `nhip-viec-tag-colors` | Registry màu nhãn `{ c: { [tagKey]: colorIndex } }` |
| `nhip-viec-theme` | Theme `light`, `dark`, `system` |
| `nhip-viec-period` | Kỳ Dashboard |
| `nhip-viec-notebooks-view` | Kiểu xem sổ tay |

`emptyData()` khởi tạo dữ liệu lõi rỗng. Khi cả hai khóa sổ tay/ghi chú chưa có, `localNoteSeed()` tạo một sổ và ghi chú chào mừng; không nhầm dữ liệu mẫu này với nhiệm vụ mặc định.

Đọc dữ liệu lõi gọi `migrateData` trong `src/lib/projects.js` và chuẩn hóa công tác. Có backup `.pre-migration`, backup `.corrupt-…` khi JSON hỏng và cơ chế chặn ghi khi recovery thất bại. Không thay thuật toán recovery/backup, không ghi đè dữ liệu lỗi bằng mảng rỗng. Muốn mở rộng model phải giữ dữ liệu cũ đọc được và migration chạy lặp không đổi kết quả.

Subscription local nghe custom event và sự kiện `storage`; mutation phát thông báo để cập nhật giao diện.

### Firebase

- Cấu hình SDK: `src/data/firebase.js`; repository: `src/data/firebaseRepo.js`.
- Profile ở `users/{uid}`; collection nghiệp vụ ở `users/{uid}/{projects,tasks,contacts,trips,notebooks,notes}`.
- Registry nhãn ở `users/{uid}/meta/tagColors`.
- Dùng snapshot subscriptions và persistent local cache; dữ liệu phụ thuộc quyền user đang đăng nhập.
- `prepareUserData` migration dự án/nhiệm vụ; công tác cũ được chuẩn hóa lúc đọc snapshot, không bulk rewrite các document công tác.
- Có đề nghị nhập local lên tài khoản: bỏ qua ID đã tồn tại, chuẩn hóa bản nhập, chia batch và lưu quyết định nhập/bỏ qua theo user.
- Rules ở `firestore.rules`: task/project/notebook/note có validation; contacts/trips/meta kiểm tra chủ sở hữu. Không suy diễn rằng rules đã xác thực mọi field của mọi model.

### Chọn mode và biến build

`repository.js` chỉ chọn Firebase khi `VITE_DATA_MODE === 'firebase'` và đủ `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`; thiếu biến sẽ cảnh báo tên biến và fallback local, không in giá trị.

Tên biến được code sử dụng: `VITE_DATA_MODE`, `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_RECAPTCHA_SITE_KEY`, `VITE_APPCHECK_DEBUG`. Chỉ kiểm tra nơi chúng được tham chiếu trong source; không đọc giá trị file môi trường. Các biến `VITE_*` được nhúng lúc build. Khóa AI/server không được mang tiền tố `VITE_`.

## 6. Model và quy tắc nghiệp vụ

Các model là object JavaScript, không có schema TypeScript tập trung. Repository thường bổ sung `id`, `createdAt`, `updatedAt`; hãy kiểm tra đường `create` và `batch` trước khi giả định field luôn tồn tại ở dữ liệu cũ.

### Nhiệm vụ (`tasks`)

Field chính: `title`, `description`, `projectId`, `status`, `priority`, `startDate`, `dueDate`, `assignerId`, `assigneeId`, `collaboratorIds`, `notes`, `checklist`, `progress`, `progressMode`, `tripId`, `tripPhase`, `order`, `tags`, `completedAt`, `repeat`, `seriesId`, `remindBefore`.

- Trạng thái: `todo`, `doing`, `waiting`, `done`, `paused`; ưu tiên: `low`, `medium`, `high`, `urgent`.
- `checklist`: các mục `{ id, text, done }`; `progressMode`: `auto` hoặc `manual`.
- `taskProgress` trả 100 khi `done`; tự tính tỷ lệ checklist khi auto và có checklist; còn lại dùng progress đã giới hạn.
- Dùng `withStatus(task, status)` khi đổi trạng thái để giữ progress/completedAt đồng bộ; mở lại giới hạn progress tối đa 99.
- Tìm kiếm bỏ dấu, lọc và sắp xếp: `src/lib/tasks.js`; nhãn được lọc theo ANY trong nhóm nhãn đã chọn.
- `getDueState` phân biệt không hạn, quá hạn, hôm nay, sắp hạn trong 3 ngày và bình thường; nhiệm vụ hoàn thành không bị quá hạn.
- `order` dùng để sắp thứ tự; Kanban dùng HTML5 DnD và menu “Chuyển sang…”, có rebalance và undo snapshot.
- `repeat` hỗ trợ ngày/tuần/tháng; `seriesId` neo chuỗi và task kế tiếp có id `${seriesId}-r${nextDue}`. Nhắc việc chỉ chạy khi app đang mở và dedupe bằng localStorage.

### Dự án (`projects`)

Field chính: `name`, `description`, `colorIndex` (1–8), `status`, `ownerId`, `startDate`, `dueDate`, `archived`. Trạng thái: `running`, `paused`, `done`, `archived`.

`src/lib/projects.js` xử lý validation, chuẩn hóa tên, migration dữ liệu cũ và operation gỡ/chuyển nhiệm vụ khi xóa dự án. Tiến độ dự án là trung bình tiến độ các nhiệm vụ thuộc dự án, không phải phần trăm số nhiệm vụ hoàn thành đơn thuần.

### Công tác (`trips`)

Field chính: `name`, `location`, `startDate`, `endDate`, `purpose`, `contactIds`, `notes`, `color`, cùng bốn field mở rộng:

```js
{
  completed: false,
  completedAt: null,       // ISO timestamp khi hoàn thành; null khi mở lại
  startSession: 'sang',   // 'sang' | 'chieu'
  endSession: 'chieu',
}
```

`normalizeTrip` trong `src/lib/trips.js` là normalizer dùng chung cho local và Firebase. Mặc định Sáng → Chiều giữ hành vi cả ngày của dữ liệu cũ.

- `formatTripRange` định dạng ngày và buổi; `{ short: true }` cho chỗ hẹp.
- `tripSlot`/`tripSlots` dùng `differenceInCalendarDays` từ epoch cố định, mỗi ngày hai slot; khoảng đầu/cuối đều bao gồm.
- Sáng riêng và Chiều riêng cùng ngày không trùng; chuyến cả ngày trùng cả hai buổi.
- `tripsOverlap`/`findTripOverlaps` bỏ chuyến `completed`; có thể giới hạn cảnh báo theo ngày.
- `compareTrips` sắp theo ngày đi rồi buổi đi. Trong từng nhóm Công tác, chuyến hoàn thành đứng sau chuyến chưa hoàn thành.
- Form chặn ngày về trước ngày đi, hoặc Chiều → Sáng trong cùng ngày.
- Hoàn thành độc lập với ngày đi/về; không tự đánh dấu theo thời gian. Dashboard loại chuyến hoàn thành.
- `getTripPhase` tôn trọng `task.tripPhase` nếu có; nếu không, suy ra `before`/`during`/`after` theo ngày đến hạn. Không đổi grouping nhiệm vụ khi chỉnh buổi công tác.
- Xóa chuyến hiện gỡ `tripId`/`tripPhase` ở nhiệm vụ, không xóa các nhiệm vụ đó.

### Danh bạ (`contacts`)

Field chính: `fullName`, `organization`, `title`, `phone`, `email`, `notes`, `isSelf`. Các ID có thể được tham chiếu từ người giao/phụ trách/phối hợp, chủ dự án, công tác hoặc ghi chú. Khi sửa chức năng xóa, kiểm tra từng loại liên kết: code hiện có gỡ các vai trò nhiệm vụ và danh sách liên hệ của công tác, không có cơ chế cascade tổng quát cho mọi model.

### Sổ tay (`notebooks`) và ghi chú (`notes`)

- Sổ: `name`, `color` (0–7), `pinned`, `archived` và metadata.
- Ghi chú: `notebookId`, `title`, `body`, `tags`, `pinned`, `links` và metadata.
- `links` có thể chứa `projectId`, `tripId`, `contactId`; liên kết không còn tồn tại được giao diện xử lý.
- Tên sổ tối đa 60, tiêu đề ghi chú tối đa 120, nội dung tối đa 5000 ký tự.
- `src/lib/notes.js`: kiểm tra tên sổ, tìm kiếm/lọc, sắp xếp, đếm, trích đoạn và template.
- Xóa sổ xóa các ghi chú trong sổ bằng batch, kèm action undo. Chuyển ghi chú cập nhật `notebookId`.

### Nhãn và registry màu

`src/tags/tagUtils.js` là nguồn chuẩn hóa: bỏ dấu `#` đầu, trim, gộp khoảng trắng, chuẩn Unicode NFC, loại trùng không phân biệt hoa/thường; tối đa 5 nhãn và 1–24 ký tự mỗi nhãn. Không tự thêm nhãn mặc định vào nhiệm vụ mới.

`src/tags/tagMutations.js` và `src/components/tags/` xử lý quản lý/nhập/lọc/hiển thị. Dùng registry màu ổn định theo `tagKey`; ưu tiên batch path khi sửa tags để registry và dữ liệu liên quan được cập nhật đúng.

## 7. UI dùng chung và hệ thiết kế

- `src/components/ui/index.jsx`: Button, Card, Badge, ProgressBar, Modal, Drawer, Popover, empty/loading/error states.
- `src/components/ui/CompleteToggle.jsx`: nút hoàn thành dùng chung; component controlled, không tự lưu dữ liệu.
- `src/components/ui/ToastHost.jsx`: toast và action hoàn tác.
- `src/styles/tokens.css`: màu, spacing, radius, shadow, theme; `src/main.jsx` nạp CSS theo thứ tự.
- `src/i18n/vi.js`: chuỗi giao diện; source vẫn còn một số chuỗi viết trực tiếp trong component.
- `useTheme`, `useReducedMotion`, `useCountUp`, `useTransitionNavigate`: theme, giảm chuyển động, animation số và điều hướng.

API hoàn thành hiện có:

```jsx
<CompleteToggle
  checked={task.status === 'done'}
  onChange={nextChecked => changeStatus(task, nextChecked ? 'done' : 'todo')}
  label={task.title}
  size="md"             // md: 28px; lg: 36px
  showLabel={false}      // true: pill có chữ
  disabled={false}
/>
```

Dùng icon-only ở Kanban/thẻ công tác/checklist; pill ở bảng, Dashboard, chi tiết công tác và các nhóm nhiệm vụ trong chuyến. Nút có `aria-pressed`, tooltip, tên truy cập tiếng Việt, vùng chạm mở rộng tối thiểu 44px, chặn click/drag lan lên parent, hiệu ứng ngắn và chế độ reduced-motion. Mutation/toast/undo thuộc caller; không đưa logic nghiệp vụ vào component này.

Giữ `min-width: 0` trên cột/thẻ/title, cột grid dùng `minmax(0, 1fr)` khi cần, toggle không co và không làm rộng thẻ. Trạng thái cần icon/chữ, không chỉ màu. Khi sửa UI kiểm tra light/dark, keyboard, focus và màn hình hẹp.

## 8. Nơi sửa theo loại yêu cầu

| Yêu cầu | Bắt đầu từ |
| --- | --- |
| Sửa chức năng nhiệm vụ | `pages/Tasks.jsx`, `components/task/`, `lib/tasks.js`, `lib/progress.js` |
| Sửa nghiệp vụ công tác | `pages/Trips.jsx`, `lib/trips.js`, sau đó kiểm tra Calendar/Dashboard |
| Sửa sơ đồ | `components/mindmap/buildMindMap.js`, `MindMapView.jsx`, `TreeMapView.jsx`, `pages/MindMap.jsx` |
| Sửa sổ tay | `pages/Notebooks.jsx`, `components/notes/`, `lib/notes.js` |
| Sửa nhãn | `tags/`, `components/tags/`, mutation và registry ở cả hai repo |
| Sửa nút hoàn thành | `components/ui/CompleteToggle.jsx`, `styles/complete-toggle.css` và các caller |
| Thêm field dữ liệu | Model/helper liên quan, cả local/Firebase repo, form, nơi hiển thị và test |
| Sửa đăng nhập | `pages/Login.jsx`, `auth/`, `data/firebase.js`, `hooks/useData.jsx` |

## 9. Các điểm chưa đồng nhất cần biết

Đây là mô tả hiện trạng, không phải yêu cầu tự sửa ngoài phạm vi task:

- AGENTS quy định tiêu đề nhiệm vụ 120 ký tự; `TaskForm` hiện vẫn có validation 160. Tên dự án ở form là 60 nhưng helper validation/import và rules còn có ngưỡng 80. Không lấy giá trị cũ đó làm chuẩn cho code mới; nếu task đụng đến giới hạn, kiểm tra đồng bộ các lớp theo yêu cầu.
- Ngày nghiệp vụ dùng chuỗi `YYYY-MM-DD`; timestamp dùng ISO. Helper hiện dùng `parseISO`/thời gian local của trình duyệt, chưa ép múi giờ Asia/Ho_Chi_Minh ở mọi nơi. Tránh `new Date('YYYY-MM-DD')` vì cách parse UTC có thể lệch ngày.
- Biểu đồ hoàn thành 7 ngày của Dashboard hiện nhóm nhiệm vụ `done` theo `dueDate`, không theo `completedAt`. Không gọi đây là lịch sử thời điểm hoàn thành thực tế.
- Core local có recovery/backup, nhưng mutation nhiều khóa local không phải transaction nguyên tử như Firestore batch. Không hứa khôi phục mọi thay đổi nhiều collection khi một lần ghi thất bại.
- Có test và script contrast/motion không đồng nghĩa đã xác minh tất cả trạng thái UI hay Firebase production. Luôn báo rõ những kiểm tra thực sự đã chạy.

## 10. Lệnh chạy và xác minh

```bash
# Terminal đã có Node 24 và pnpm
pnpm install --frozen-lockfile
pnpm dev
pnpm lint
pnpm test
pnpm test:coverage
pnpm e2e
pnpm test:pwa
JAVA_HOME="$HOME/.local/jdk21/Contents/Home" pnpm test:rules
pnpm build
pnpm test:contrast
pnpm test:motion
```

Node 24 được quản lý bằng nvm trong môi trường phát triển này; shell có thể chưa nạp nvm. Tuân thủ yêu cầu cụ thể của người dùng về PATH/cài đặt, không mặc định tự sửa môi trường. Không đọc file môi trường để chẩn đoán.

`vite.config.js` cấu hình jsdom, timeout 10 giây, coverage V8 (toàn src 70%, lib/tags/data 80%) và các file `tests/**/*.test.{js,jsx}`. Rules test cần Firestore Emulator và JDK 21. Playwright có ba viewport 360/768/1280, năm flow đầy đủ và axe toàn route ở light/dark.

Khi bàn giao, ghi kết quả lint/test/build đã chạy; nếu thiếu tool hoặc không chạy, nói rõ, không dùng số test của phiên cũ làm kết quả phiên hiện tại. Không tự chạy `pnpm e2e`.

Vercel đã được liên kết trong môi trường dự án; khi người dùng yêu cầu deploy thì dùng `vercel --prod`, không tạo project mới, giữ SPA rewrite trong `vercel.json`. Firestore rules chỉ deploy khi có yêu cầu rõ ràng. Không commit `.env*`, `.vercel`, `dist`, `node_modules`.
