# UI Spec: Nhịp việc redesign

Reference: `docs/design/reference-dashboard.jpg`. Take the STYLE only. Do not use its logo, photos or names.
Brand: letter "n." inside a black rhombus (own SVG) + wordmark "Nhịp việc". Avatars = initials on pastel fill.

## 1. Tokens (src/styles/tokens.css; keep old aliases so other CSS does not break)
Light: --accent #FBBF1B; --on-accent #111; --accent-text #8A5A00 (yellow-ish TEXT on white); --ink #0E0E10; --bg #FFF; --fill #F4F4F2; --line #ECECE8; --text #0E0E10; --text-2 #5F5F66 (lightest allowed for secondary text).
Dark: --bg #0C0C0D; --surface #17171A; --fill #212126; --line #2C2C32; --text #F5F5F2; --text-2 #A6A6AD.
Radius: card 24, inner 16, control 14, pill 999. Card shadow: 0 8px 30px rgb(0 0 0/.06); dark: no shadow, 1px --line. Font: Manrope 500/700 (already installed). H1 28-32/700; labels 12-13/700. 4px spacing grid.
Color rules: yellow is only a FILL (black text on it), a progress bar, a dot/border accent, or an accent on black. Never light-yellow text on white (use --accent-text). All text >= 4.5:1. No pale grey (#B0B0B0-like) text.
EMPHASIS card = #0E0E10 fill, white text, yellow progress. Max 1 per section. Dark mode: #000 + 1px #3A3A40 border; active nav = yellow with black text.

## 2. Shell
>=1280: sidebar 248px: logo; vertical nav (lucide icon + label), active = black pill r16 white text. Items: Tổng quan, Công việc, Lịch, Công tác, Danh bạ, Sơ đồ, Sổ tay. Bottom: Cài đặt + "Không gian" chip (Local / account; menu: theme, sign out). Right panel 340px only on Tổng quan, Lịch (agenda), Công tác (detail).
768-1279: sidebar collapses to 72px icon rail (tooltip + aria-label); right panel moves below content.
<768: top header (greeting, bell, avatar); bottom tab bar: Tổng quan, Công việc, round yellow "+" in the middle (create menu), Lịch, Sổ tay; the rest in a "Khác" sheet. Touch targets >= 44px, safe-area insets. Search field opens the existing command palette (Ctrl/Cmd+K).

## 3. Shared components (src/components/ui; keep existing props/API)
Button: primary black/white text, accent yellow/black text, ghost, icon 44px. Chip/Tab: pill segmented, active black. Card. Input: --fill, r14, no border, focus ring 2px black + 2px yellow offset. Avatar + AvatarStack (overlap -8px, max 4 then "+N"). ProgressBar: track --fill, yellow fill (track #2A2A2E on black card). Priority badge: colored dot + text. Modal/Drawer: r24, 40% scrim, black primary action. Toast: black, Undo in yellow text. Empty state: --fill panel, icon, CTA.

## 4. Pages
- Tổng quan. Center: "Chào {name}," (--text-2) + H1 "Hôm nay bạn có N việc"; search; 4 KPI chips (Hôm nay / Quá hạn / Sắp hạn / Xong trong tuần; keep existing period logic and query navigation); "Việc của tôi" tabs Gần đây | Hôm nay | Sắp tới | Quá hạn -> task cards (title, 1-line description, project chip, AvatarStack, progress %, due); most urgent/overdue = emphasis card; below, "Dự án" grid with progress (nearest-due project = emphasis). Right: profile + existing reminder bell; "Thêm nhanh" card (input using parseQuickAdd + yellow "+" button; NO new data, replaces the reference's time tracker); long date + black "+ Thêm việc"; 7-day week strip (today = yellow dot, small dot if tasks, prev/next week); vertical timeline for today (tasks by due + trips). Tasks have NO time of day: order by priority then `order`, show priority label or "Cả ngày", never invent hours. Next item = yellow card with a check button to complete.
- Công việc. Title + segmented (Bảng / Danh sách / Dự án) + filter chips + black "+ Thêm việc". Kanban: 5 lanes on --fill r24, header (colored dot + count), white r16 cards (priority dot, title, tags, AvatarStack, due, thin progress); "gấp" priority = emphasis card. Keep drag-and-drop, keyboard "move to" menu, 40-card window per lane, 100-row pages.
- Lịch. Large week strip + month grid r24; today = yellow circle black text; tasks = grey pill with priority dot; trips = yellow pill; agenda on the right = same timeline as Tổng quan.
- Công tác. Trip cards (name, place, dates + half-day, prep progress); ongoing = emphasis; upcoming = yellow left border; detail has before/during/after as a timeline.
- Danh bạ. List + 2-column detail, initials avatars, org chips.
- Sơ đồ. Keep canvas; floating pill controls; root node black, project yellow (black text), task white with --line border; status always has a text label, never color alone.
- Sổ tay. Notebook cards r24 with a colored top strip, pinned = yellow dot; compact note rows.
- Cài đặt. Group cards (Giao diện, Dữ liệu, Thông báo, Tài khoản), large switches, danger actions with red outline.
- Login. Split screen: left yellow block (logo, one short value line, own geometric shapes), right form on white; <768: form only with a thin yellow strip on top.
- NotFound, onboarding tour, command palette, empty states: same language (r24, black buttons, yellow accents).

## 5. Constraints
UI ONLY. Do not touch src/lib, src/data, firestore.rules, routes, mutation logic, prop/hook names. No new dependencies (lucide icons and Manrope exist). New user-facing strings go to src/i18n/vi.js (a test scans for literals). Keep testids/roles/labels used by e2e; edit tests only when the UI intentionally changed, and say why. Keep light/dark/system, reduced motion (150-200ms transitions), targets >= 44px, aria-label on icon-only buttons.
Gates: axe 0 serious/critical on all routes (light+dark, 360/768/1280); Lighthouse mobile >= 90/95/95; Dashboard 5000 tasks < 150ms; Tasks 5000 < 500ms; JS gzip on "/" <= 130kB.
Code style: no semicolons, single quotes, max-len 160.
