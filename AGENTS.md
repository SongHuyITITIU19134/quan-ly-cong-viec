# Nhịp việc – hướng dẫn cho Codex

- Stack: React 18, Vite, React Router, Firebase (import động), CSS thuần. Dùng pnpm; không chạy npm install, không tạo package-lock.json.
- Lệnh: pnpm lint | pnpm test (vitest run) | pnpm build | pnpm e2e (chỉ chạy khi được yêu cầu).
- Dữ liệu: src/data (localRepo.js, firebase.js, repository.js). Khóa chính `nhip-viec-v1`; registry màu nhãn dùng `nhip-viec-tag-colors` hoặc `users/{uid}/meta/tagColors`. Không đổi tầng dữ liệu nếu không được yêu cầu.
- Nhiệm vụ có `tags: string[]`: tối đa 5 nhãn, mỗi nhãn 1–24 ký tự sau chuẩn hóa; không tạo nhãn mặc định. Route `/__tags` chỉ dành cho DEV.
- Giao diện tiếng Việt, chuỗi ở src/i18n. Giới hạn: tiêu đề việc 120 ký tự, tên dự án 60.
- Không đọc/in file .env\*; không commit .env, .vercel, dist, node_modules.
- Deploy: vercel --prod (project đã liên kết, không tạo project mới). Không push remote.
- Cách làm: dùng rg -n, chỉ mở đoạn cần thiết, báo cáo ngắn bằng tiếng Việt.
- Môi trường: Node 24 qua nvm (`nvm use 24`). Mở VS Code bằng `code .` từ terminal đã nạp nvm; bash không tự nạp nvm nên có thể báo `node: not found`.
- Route chính: /cong-viec, /lich, /cong-tac, /danh-ba, /so-do (Sơ đồ: mind map, tree-map, danh sách). `vercel.json` có rewrite SPA, giữ nguyên.
- Chế độ dữ liệu: `VITE_DATA_MODE=local` (localStorage) hoặc `firebase` (Firestore). Thiếu biến Firebase thì app tự chạy local. Biến `VITE_*` nhúng lúc build, đổi biến phải redeploy.
- Firestore: dữ liệu ở `users/{uid}/{projects,tasks,contacts,trips,meta}`. Rules ở `firestore.rules`; chỉ deploy khi được yêu cầu: `npx -y firebase-tools deploy --only firestore:rules`. Không sửa rules nếu không được yêu cầu.
- Không đọc/in/commit `.env.local`, khóa API, token, mã xác thực. Khóa phía máy chủ (AI) không bao giờ có tiền tố `VITE_`.
- Mỗi phiên một việc; báo cáo kết quả lint/test; không chạy `pnpm e2e` trừ khi được yêu cầu.
## Working rules
- Read minimum: only named files + targeted grep. Never read node_modules, pnpm-lock.yaml, docs/audit, docs/screenshots.
- Small patches, no whole-file rewrites, no pasting long code/logs.
- Style: no semicolons, single quotes, max-len 160. New UI strings go to src/i18n/vi.js.
- Gates: run `pnpm gates` (and `pnpm gates:e2e` when UI changed); report failures only. For single-file edits run only that file's test.
- One logical change = one short commit. No push, no rules deploy. Never edit a test to pass when the bug is in code.
- Final report in Vietnamese, <= 8 lines: done / measured numbers / gates pass-fail / remaining.
