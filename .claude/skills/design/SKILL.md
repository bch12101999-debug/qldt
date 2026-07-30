---
name: design
description: Kiểm tra và tinh chỉnh UI/UX cho hệ thống Quản lý Khiếu nại phường Hiệp Bình (React + Vite + Tailwind CSS v4, tự xây component — không dùng shadcn/antd). Dùng khi thiết kế trang mới, sửa/refactor component, chọn màu/typography/spacing, review UI theo accessibility/consistency, làm animation/responsive, hoặc khi UI "trông chưa chuyên nghiệp" mà chưa rõ nguyên nhân. Đúc kết từ github.com/nextlevelbuilder/ui-ux-pro-max-skill, đã lược bỏ phần chỉ áp dụng cho app native/mobile (haptic, safe-area, tab bar iOS...) và phần phụ thuộc shadcn/ui hay script Python/CSV không có trong dự án này.
license: MIT
metadata:
  author: adapted-from-ui-ux-pro-max
  version: "1.0.0"
---

# Thiết kế UI — Hệ thống Quản lý Khiếu nại phường Hiệp Bình

Skill này là bản đúc kết **một file duy nhất**, tự chứa (không phụ thuộc script/CSV ngoài), rút ra từ bộ skill `ui-ux-pro-max` + `ui-styling` + `design-system` của `nextlevelbuilder/ui-ux-pro-max-skill`, đã lược bỏ:
- Mọi thứ giả định dùng **shadcn/ui + Radix** — dự án này **tự xây component** trong `frontend/src/components/` (xem CLAUDE.md: "không dùng thư viện UI có sẵn như antd/shadcn").
- Mọi rule chỉ áp dụng cho **app native/mobile** (haptic feedback, safe-area/notch, tab bar iOS, gesture nav Android, dynamic type...) — đây là web app nội bộ, không phải app.
- Hệ thống search Python/CSV (84 styles, 192 palettes...) — không cần thiết cho 1 app nội bộ đã có design system cố định; toàn bộ token/màu/font đã chốt sẵn trong `CLAUDE.md` và `frontend/src/index.css`.

**Luôn đọc `CLAUDE.md` ở gốc dự án trước** — đó là nguồn quyết định cuối cùng về màu sắc, layout, workflow. Skill này bổ sung *cách kiểm tra chất lượng UI một cách hệ thống*, không thay thế CLAUDE.md.

## Khi nào dùng

Dùng khi: tạo trang/component mới, sửa layout, chọn spacing/màu/typography, review UI trước khi báo "hoàn thành", debug UI "trông rẻ tiền"/thiếu nhất quán, thêm animation, hoặc kiểm tra responsive/accessibility.

Bỏ qua khi: chỉ sửa logic backend, API, DB, hoặc script không ảnh hưởng đến giao diện.

## Nguồn token hiện có — không tự bịa token mới

Toàn bộ màu/spacing/font đã định nghĩa tại `frontend/src/index.css` (`@theme` block) và mô tả lại ở `CLAUDE.md` §Design system. Ba lớp token (primitive → semantic → component) áp dụng như sau — **luôn dùng lớp semantic, không hardcode hex trong component**:

```
Primitive (hex thật)          Semantic (--color-*)            Dùng trong component
#1a5ba8                  →    --color-primary            →    bg-primary, text-primary
#0d4080                  →    --color-primary-dark       →    hover:bg-primary-dark
#e8f0fb                  →    --color-primary-light      →    active nav item, badge nhạt
#00a84f                  →    --color-brand-green         →   badge "Hoàn thành"
#d32f2f / #f57c00 / ...  →    --color-accent-red/orange/green/gray → cảnh báo, quá hạn, thành công
--color-status-*         →    badge trạng thái đơn (STATUS_COLORS trong types/domain.ts)
--color-bg-page/-card/-sidebar/-sidebar-border → nền trang/card/sidebar
```

Nếu cần thêm 1 màu/spacing mới: thêm vào `@theme` trong `index.css` trước, **rồi mới dùng** — không viết `bg-[#xxxxxx]` tùy tiện trong JSX.

## Checklist theo mức ưu tiên (rút gọn cho web app, bỏ phần chỉ dành app native)

Thứ tự 1→8 khi review hoặc quyết định nên tập trung sửa gì trước:

| # | Nhóm | Mức độ | Việc phải có | Tránh |
|---|------|--------|---------------|-------|
| 1 | Accessibility | CRITICAL | Contrast chữ thường ≥4.5:1, chữ lớn ≥3:1; focus ring rõ (2–4px, không `outline:none` mà không thay thế); `aria-label` cho nút chỉ có icon; alt text ảnh có nghĩa; tab order đúng thứ tự thị giác | Xóa focus ring không thay bằng gì; button chỉ có icon không label |
| 2 | Touch & tương tác | CRITICAL | Vùng chạm tối thiểu 44×44px (đặc biệt nút trên mobile/table action); cách nhau ≥8px; disable + loading spinner khi đang submit async | Dựa hoàn toàn vào hover (không hoạt động trên mobile); đổi trạng thái tức thời 0ms không có feedback |
| 3 | Performance | HIGH | `loading="lazy"` cho ảnh dưới fold; giữ chỗ trước cho nội dung async (tránh layout shift khi data load xong — vd bảng/card đang fetch); debounce ô tìm kiếm | Layout nhảy khi list/card load xong; fetch lại toàn bộ danh sách chỉ để đổi 1 filter nhỏ |
| 4 | Nhất quán style | HIGH | Dùng đúng icon set `lucide-react` xuyên suốt (đã dùng trong dự án), không emoji làm icon chức năng; badge màu theo đúng `STATUS_COLORS`/`ROLE_BADGE_COLORS`; shadow/radius nhất quán (`rounded-lg`, `shadow-sm`) | Tự chế 1 shadow/radius riêng cho 1 trang; trộn icon filled và outline cùng cấp |
| 5 | Layout & Responsive | HIGH | Mobile-first, test tối thiểu ở 375px; sidebar → hamburger/drawer dưới `lg`; bảng dữ liệu cuộn ngang hoặc card trên mobile; `min-h-svh` không dùng `100vh` cứng | Cuộn ngang toàn trang trên mobile; ẩn zoom (`user-scalable=no`); độ rộng cố định bằng px |
| 6 | Typography & màu | MEDIUM | Cỡ chữ body tối thiểu 14–16px; `line-height` 1.5; heading dùng `font-bold`/`font-semibold` nhất quán theo cấp; không truyền đạt trạng thái chỉ bằng màu (badge trạng thái luôn kèm chữ, xem `StatusBadge.tsx`) | Chữ xám nhạt trên nền xám (contrast thấp); chỉ tô màu đỏ mà không có chữ "Quá hạn" đi kèm |
| 7 | Animation | MEDIUM | Scroll-reveal dùng `Reveal` component có sẵn (`frontend/src/components/Reveal.tsx`, `whileInView` + `viewport once:true`) — **không tự viết animation riêng lẻ**; duration 150–400ms; `ease-out` khi vào, không animate width/height (chỉ opacity/transform) | Animate lặp lại mỗi lần cuộn qua lại (vi phạm CLAUDE.md §3); animate `width`/`height`/`top` gây giật layout; hiệu ứng >500ms |
| 8 | Form & Feedback | MEDIUM | Label hiển thị (không chỉ placeholder); lỗi field hiển thị ngay dưới field (inline, không dùng toast); toast cho kết quả thao tác (`useToast()`); confirm dialog cho hành động nguy hiểm (`useConfirm()`); validate trên blur, không validate từng keystroke | Toast dùng để báo lỗi validate field; xóa/khóa tài khoản không có confirm; lỗi chỉ hiện ở đầu form xa field liên quan |

## Trạng thái tương tác (Interactive states)

Thứ tự ưu tiên khi nhiều state cùng áp dụng: `disabled` > `loading` > `active` > `focus` > `hover` > `default`.

| State | Cách thể hiện trong dự án |
|-------|---------------------------|
| default | Class nền/chữ theo token semantic (`bg-primary`, `text-gray-700`...) |
| hover | `hover:bg-primary-dark` (nút), `hover:bg-gray-100` (item list/sidebar) |
| focus | `focus:outline-none focus:ring-1 focus:ring-primary` hoặc `focus-within:border-primary` (đã dùng ở input Login) — **không bỏ focus ring mà không thay** |
| active/selected | Sidebar: `border-l-4 border-primary bg-primary-light text-primary` (đã có ở `Sidebar.tsx`) |
| disabled | `disabled:opacity-60` + thuộc tính `disabled` thật (không chỉ CSS) |
| loading | Đổi label nút thành "Đang xử lý..."/"Đang lưu..." + `disabled` trong lúc `mutation.isPending` |

Transition chuẩn cho mọi element tương tác: `transition-colors` (150ms) cho màu/nền/viền; `transition-transform` (200ms, `ease-out`) nếu có scale/translate.

## Animation — bám theo quy tắc đã có, không phát minh lại

- Mọi section cuộn tới phải bọc trong `<Reveal delay={...}>` (đã dùng ở toàn bộ trang hiện có) — tuân CLAUDE.md quy tắc bắt buộc #3.
- Toast (`ToastViewport.tsx`) và Confirm Dialog (`ConfirmDialog.tsx`) dùng `framer-motion` với `AnimatePresence`, duration ~150–200ms — theo đúng pattern đã dựng, không thêm thư viện animation khác.
- Khi chụp screenshot bằng Playwright để so sánh thiết kế: dùng `page.screenshot({ animations: 'disabled' })` hoặc cuộn qua toàn trang trước khi chụp — nếu không, `whileInView` có thể chưa kịp trigger hoặc compositor headless chưa kịp paint (đã gặp lỗi này, xem lịch sử — không phải bug thật, chỉ là artifact chụp ảnh).

## Navigation / Sidebar / Header — lỗi đã từng gặp, tránh lặp lại

- `NavLink` phải có `end={to === '/' || to === '/don-thu'}` — nếu không, 2 mục sidebar sẽ cùng sáng khi ở route con (đã fix, xem `Sidebar.tsx`).
- Badge số lượng dùng chung 1 query key giữa `Header.tsx`/`Sidebar.tsx` (vd `['notifications', userId, 1, 20]`) để TanStack Query dedupe, tránh gọi API trùng.
- Sidebar thu gọn trên desktop (`lg:w-16`) chỉ ẩn label/badge bằng class `lg:hidden` trên chính label — **không** dùng biến state riêng cho mobile, vì mobile luôn hiện full-label bất kể trạng thái `collapsed` (chỉ áp dụng ở `lg:` trở lên).
- ID đơn có thể chứa ký tự `/` (mã số dạng `009/2026/KN-TT`) → luôn `encodeURIComponent(id)` khi build route `/don-thu/:id`.

## Biểu đồ (Dashboard — Recharts)

- Luôn có legend hiển thị (`<Legend/>`), tooltip khi hover (`<Tooltip/>`).
- Không dùng pie/donut khi >5 nhóm dữ liệu — chuyển sang bar chart.
- Trạng thái rỗng: hiển thị message rõ ràng ("Không có dữ liệu") thay vì chart trống không giải thích.
- Số liệu dùng locale Việt Nam khi format ngày (`toLocaleDateString('vi-VN')`, đã dùng trong `ChiTietDon.tsx`).

## Checklist trước khi báo "hoàn thành" (gộp với CLAUDE.md quy tắc #1 và #5)

Không báo hoàn thành một thay đổi UI nếu chưa làm đủ các bước sau:

- [ ] Chạy `npm run typecheck` sạch (`frontend/` và `server/` nếu có đổi backend).
- [ ] Chụp screenshot **desktop (≥1280px)** và **mobile (375px)** sau khi đổi, so sánh với ảnh thiết kế gốc/ảnh tham khảo nếu có.
- [ ] Kiểm tra chức năng thật trên trình duyệt (click nút, submit form, đổi filter, phân trang...) — không chỉ nhìn ảnh tĩnh.
- [ ] Contrast chữ/nền đạt tối thiểu 4.5:1 (đặc biệt chữ xám trên nền `--bg-page`/`--bg-card`).
- [ ] Vùng chạm nút/link trên mobile ≥44px, cách nhau đủ để không bấm nhầm.
- [ ] Section mới có `Reveal` animation, không lặp lại animation khi cuộn qua lại.
- [ ] Nếu có hành động nguy hiểm (xóa, khóa, reset mật khẩu) → đã bọc `useConfirm()`.
- [ ] Nếu có mutation thành công/thất bại → đã gọi `useToast()` tương ứng, lỗi field vẫn hiển thị inline (không dùng toast thay validate).
- [ ] Không có màu hex hardcode mới trong component — mọi màu mới đã được thêm vào `@theme` ở `index.css` trước.
- [ ] Không dùng thư viện UI ngoài (shadcn/antd/MUI...) — mọi component vẫn tự xây trong `frontend/src/components/`.
