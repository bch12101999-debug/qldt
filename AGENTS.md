# Hệ thống Quản lý Đơn khiếu nại — Ủy ban nhân dân phường Hiệp Bình

## Tổng quan dự án

Hệ thống quản lý và giải quyết đơn khiếu nại, tố cáo cho **Ủy ban nhân dân phường Hiệp Bình** (không viết tắt "UBND" ở bất kỳ nội dung hiển thị nào — header, footer, tài liệu, email...). Monorepo gồm `frontend/` (React) và `server/` (Node/Express), giao tiếp qua REST API.

- **Đơn vị**: Ủy ban nhân dân phường Hiệp Bình
- **Địa chỉ**: 719 Quốc lộ 13, phường Hiệp Bình, Thành phố Hồ Chí Minh (không viết tắt "TP.")
- **Logo**: huy hiệu tròn nền xanh lá chính thức của phường, đặt tại `frontend/public/assets/logo-phuong-hiep-binh.png`, dùng ở Header và Footer.

## Tech stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS (tự xây component, không dùng thư viện UI có sẵn như antd/shadcn), React Router, TanStack Query, react-hook-form + zod.
- **Backend**: Node.js, Express, TypeScript, PostgreSQL (Prisma ORM), JWT cho auth, bcrypt cho mật khẩu, multer + SDK cloud storage (S3-compatible) cho upload file đính kèm — **không lưu file local filesystem**.

## Cấu trúc thư mục

- `frontend/src/pages/` — 8 module chính (xem "Các module chính"): `Dashboard` (route `/`, bao gồm luôn Báo cáo thống kê), `TaoDonMoi` (`/don-thu/tao-moi`), `DanhSachDon` (`/don-thu`), `ChoXuLy` (`/don-thu/cho-xu-ly`), `ChiTietDon` (`/don-thu/[id]` — route con, không phải mục sidebar riêng), `TraCuu` (`/tra-cuu`), `TrungTamThongBao` (`/thong-bao`), `QuanTriHeThong` (`/quan-tri`).
- `frontend/src/components/` — Sidebar, Header, Footer, StatusBadge, DataTable, FilterBar, FileUpload (multi-file), Pagination, RoleUserSelect, UserFormModal, ToastViewport, ConfirmDialog, ComplaintTimeline, ComplaintActionForm (form hành động động theo trạng thái + role, dùng trong `ChiTietDon`).
- `frontend/src/context/` — AuthContext (JWT thật), ToastContext, ConfirmContext.
- `frontend/src/hooks/` — `useUsers()` (danh sách người dùng qua API, dùng thay cho import tĩnh).
- `frontend/src/api/` — lớp gọi REST API thật tới backend (`client.ts`, dùng `fetch` + JWT Bearer token, không còn mock).
- `frontend/src/types/` — type định nghĩa domain (Complaint, ComplaintStepData, ComplaintAttachment, User, Department...).
- `server/src/routes/`, `server/src/controllers/`, `server/src/services/`, `server/src/middlewares/` (auth, phân quyền theo vai trò + theo bước), `server/prisma/schema.prisma`.

## Quy tắc bắt buộc (áp dụng cho mọi lần code)

1. **Sau mỗi lần thay đổi giao diện lớn, phải chụp screenshot** trang đã thay đổi và so sánh với ảnh thiết kế gốc (2 ảnh mẫu Danh sách đơn thư và Tạo đơn khiếu nại mới) trước khi coi là hoàn thành.
2. **Toàn bộ giao diện phải mobile-friendly**: sidebar thu gọn thành menu ẩn/hamburger trên mobile, bảng dữ liệu cuộn ngang hoặc chuyển dạng card trên màn hình nhỏ. Responsive tối thiểu từ 375px (mobile) đến 1280px (desktop), mobile-first với Tailwind breakpoints (`sm`/`md`/`lg`).
3. **Mọi section trên trang phải có animation khi cuộn tới** (scroll-triggered: fade-in/slide-up khi phần tử xuất hiện trong viewport, dùng IntersectionObserver hoặc `framer-motion`), không lặp lại animation gây rối mắt khi cuộn qua lại nhiều lần.
4. **`index.html` (entry point của app React/Vite) phải luôn chạy được thật, không phải giao diện tĩnh/placeholder**: mọi nút bấm, form, bộ lọc, phân trang... phải thực sự hoạt động (gọi API thật hoặc mock có phản hồi hợp lý, cập nhật state, chuyển trạng thái đơn...).
5. Sau mỗi thay đổi UI đáng kể, phải **kiểm tra chức năng thật trên trình duyệt** (click nút, nhập form, chọn filter, chuyển trang...) — không chỉ so sánh hình ảnh tĩnh. Không báo cáo một thay đổi là "hoàn thành" nếu chưa làm cả 2 bước (screenshot + kiểm tra chức năng).

## Quy ước code

- Text hiển thị: tiếng Việt có dấu, luôn dùng tên đơn vị và địa chỉ đầy đủ như trên.
- Tên biến/hàm/component: tiếng Anh, camelCase/PascalCase.
- Function component + hooks, không dùng class component.

## Luồng xử lý nghiệp vụ (Workflow đơn khiếu nại)

Đây là phần cốt lõi của hệ thống — mọi thiết kế API, bảng dữ liệu, màn hình chi tiết đơn phải bám theo đúng luồng này. Có **2 kênh tiếp nhận với luồng khác nhau ở giai đoạn đầu**, hội tụ về chung một luồng từ bước "Chuyên viên xử lý" trở đi.

**Bảng so sánh 2 kênh:**

| | Đơn trực tiếp | Đơn bưu điện |
|---|---|---|
| Nguồn gốc | Công dân đến UBND phường | Gửi qua đường bưu điện |
| Người tạo đơn | Văn thư | Văn thư |
| Bước khác biệt đầu luồng | Tư pháp tiếp nhận → phát Thông báo tiếp nhận | Lãnh đạo bút phê → phân công |
| Trạng thái khởi đầu | `CHO_TIEP_NHAN_TU_PHAP` | `CHO_LANH_DAO_PHAN_CONG` |
| Bước chung (từ giữa luồng) | Chuyên viên xử lý → Đối thoại → Quyết định | giống hệt cột bên trái |

**A. Đơn trực tiếp:**
1. **Văn thư** tạo đơn → đính kèm đơn gốc (PDF/JPG/PNG, bắt buộc) → trạng thái `CHO_TIEP_NHAN_TU_PHAP`.
2. **Tư pháp** tiếp nhận, nhập Số thông báo/Ngày ban hành/Ghi chú **và bắt buộc đính kèm file Thông báo tiếp nhận (PDF/JPG/PNG)** → trạng thái `DA_TIEP_NHAN` → chuyển cho Chuyên viên.
3. **Chuyên viên** xử lý chuyên môn, nhập Nội dung xác minh/Kết quả xử lý/Đề xuất hướng giải quyết **và bắt buộc đính kèm file kết quả xử lý (PDF/JPG/PNG)** → trạng thái `DA_XU_LY_CHUYEN_MON` → chuyển lại Tư pháp.
4. **Tư pháp** tổ chức đối thoại — 2 bước con:
   - 4a. Lên lịch (Ngày đối thoại, Địa điểm, Thành phần tham dự) → trạng thái `CHO_DOI_THOAI`.
   - 4b. Sau đối thoại, **bắt buộc đính kèm file Biên bản đối thoại (PDF/JPG/PNG)** → trạng thái `DA_DOI_THOAI`.
5. **Tư pháp** ban hành **Quyết định giải quyết**, nhập Số quyết định/Ngày ký/Nội dung tóm tắt **và bắt buộc đính kèm file Quyết định giải quyết (PDF/JPG/PNG)** → trạng thái `HOAN_THANH`.

**B. Đơn bưu điện:**
1. **Văn thư** tạo đơn → đính kèm đơn gốc (bắt buộc) → trạng thái `CHO_LANH_DAO_PHAN_CONG`.
2. **Lãnh đạo** bút phê/chỉ đạo (Nội dung chỉ đạo, Ghi chú; file không bắt buộc) → trạng thái `DA_PHAN_CONG` → chuyển cho Chuyên viên.
3. **Chuyên viên** xử lý chuyên môn, nhập dữ liệu và **bắt buộc đính kèm file kết quả xử lý (PDF/JPG/PNG)** — cùng cấu trúc như kênh trực tiếp → trạng thái `DA_XU_LY_CHUYEN_MON` → chuyển Tư pháp.
4. **Tư pháp** tổ chức đối thoại — tách 2 bước con giống hệt kênh trực tiếp:
   - 4a. Lên lịch (Ngày đối thoại, Địa điểm, Thành phần tham dự) → trạng thái `CHO_DOI_THOAI`.
   - 4b. Sau đối thoại, **bắt buộc đính kèm file Biên bản đối thoại (PDF/JPG/PNG)** → trạng thái `DA_DOI_THOAI`.
5. **Tư pháp** ban hành Quyết định giải quyết, nhập Số quyết định/Ngày ký/Nội dung tóm tắt **và bắt buộc đính kèm file Quyết định giải quyết (PDF/JPG/PNG)** → trạng thái `HOAN_THANH`.

**Sơ đồ trạng thái tổng hợp:**
```
                        VĂN THƯ TẠO ĐƠN
              TRỰC TIẾP  │            │  BƯU ĐIỆN
                   ▼      │            │      ▼
   CHO_TIEP_NHAN_TU_PHAP  │            │  CHO_LANH_DAO_PHAN_CONG
            │ [Tư pháp]   │            │   [Lãnh đạo] │
            ▼                                          ▼
     DA_TIEP_NHAN                              DA_PHAN_CONG
            │  [→ Chuyên viên]         [→ Chuyên viên]  │
            └───────────────┬──────────────────────────┘
                             ▼
                   DA_XU_LY_CHUYEN_MON
                             │ [Chuyên viên → Tư pháp]
              ┌──────────────┴──────────────┐
         TRỰC TIẾP                      BƯU ĐIỆN
              ▼                              ▼
       CHO_DOI_THOAI ──[upload biên bản]──► DA_DOI_THOAI ◄──[upload biên bản]
                                               │ [Tư pháp]
                                               ▼
                                          HOAN_THANH
```

**Ma trận quyền theo bước xử lý** (nguồn tham chiếu duy nhất cho middleware phân quyền ở backend — không định nghĩa lại quyền ở nơi khác để tránh lệch nhau):

| Bước | Người thực hiện | Role |
|---|---|---|
| Tạo đơn | Nhân viên Văn thư | `VAN_THU` |
| Tiếp nhận + Thông báo (đơn trực tiếp) | Chuyên viên Tư pháp | `TU_PHAP` |
| Bút phê + Phân công (đơn bưu điện) | Lãnh đạo **hoặc** Trưởng phòng | `LANH_DAO` / `TRUONG_PHONG` |
| Xử lý chuyên môn + upload kết quả | Chuyên viên chuyên môn | `CHUYEN_VIEN` |
| Lên lịch đối thoại | Chuyên viên Tư pháp | `TU_PHAP` |
| Upload biên bản đối thoại | Chuyên viên Tư pháp | `TU_PHAP` |
| Ban hành Quyết định | Chuyên viên Tư pháp | `TU_PHAP` |

**Lưu ý `TRUONG_PHONG`**: role này có quyền workflow **tương đương hoàn toàn** với `LANH_DAO` ở bước "Bút phê + Phân công" (cùng `canAct`, cùng được xem toàn bộ hồ sơ/báo cáo không giới hạn) — khác biệt **chỉ nằm ở thứ bậc hiển thị/tổ chức** (badge màu riêng trong Quản lý người dùng), không phải một cấp duyệt riêng. Cả `services/workflow.ts` (backend) và `lib/workflow.ts` (frontend) đều coi 2 role này tương đương tại mọi điểm kiểm tra quyền — sửa 1 bên phải sửa bên còn lại.

**Quy tắc chuyển trạng thái & validate:**

| Từ trạng thái | Hành động | Điều kiện bắt buộc | Sang trạng thái |
|---|---|---|---|
| `CHO_TIEP_NHAN_TU_PHAP` | Tư pháp tiếp nhận | soThongBao + ngayBanHanh + ≥1 file | `DA_TIEP_NHAN` |
| `CHO_LANH_DAO_PHAN_CONG` | Lãnh đạo bút phê | noiDungChiDao (file không bắt buộc) | `DA_PHAN_CONG` |
| `DA_TIEP_NHAN` | Chuyển chuyên viên | chọn người phụ trách | `DA_XU_LY_CHUYEN_MON`\* (chờ chuyên viên submit) |
| `DA_PHAN_CONG` | Chuyển chuyên viên | chọn người phụ trách | `DA_XU_LY_CHUYEN_MON`\* (chờ chuyên viên submit) |
| `DA_XU_LY_CHUYEN_MON`\* | Chuyên viên submit kết quả | nội dung xác minh/kết quả/đề xuất + ≥1 file | đưa về Tư pháp (vẫn ở `DA_XU_LY_CHUYEN_MON`, đã submit) |
| `DA_XU_LY_CHUYEN_MON` (đã submit) | Tư pháp lên lịch đối thoại | ngayDoiThoai + diaDiem + thanhPhan | `CHO_DOI_THOAI` |
| `CHO_DOI_THOAI` | Tư pháp upload biên bản | ≥1 file biên bản đối thoại | `DA_DOI_THOAI` |
| `DA_DOI_THOAI` | Tư pháp ban hành quyết định | soQuyetDinh + ngayKy + noiDungTomTat + ≥1 file | `HOAN_THANH` |

\* `DA_XU_LY_CHUYEN_MON` dùng chung cho 2 tình trạng khác nhau (đã giao cho chuyên viên nhưng chưa submit / đã submit xong) — không cần thêm trạng thái enum riêng trong DB, phân biệt bằng cờ phụ (VD `daSubmitKetQua: boolean` hoặc field `buocXuLy` trên `complaint_step_data`).

**Trạng thái "Quá hạn"**: không phải một bước trong luồng mà là **cờ tính toán** (derived) áp lên bất kỳ trạng thái nào ở trên khi vượt quá hạn xử lý (dựa trên `ngày tiếp nhận` + số ngày quy định) — hiển thị đè lên badge trạng thái hiện tại, không thay thế nó.

**Lịch sử xử lý**: mỗi lần chuyển trạng thái phải ghi lại người thực hiện, vai trò, thời điểm, trạng thái trước/sau, dữ liệu nhập (nếu có) — dùng cho timeline trong `ChiTietDon` và báo cáo thống kê trên Dashboard.

**Quy tắc thông báo tự động** (backend tự sinh thông báo, hiển thị qua icon chuông trên Header/Dashboard):

| Sự kiện | Người nhận thông báo |
|---|---|
| Văn thư tạo đơn trực tiếp | Đúng Chuyên viên Tư pháp được Văn thư chọn khi tạo đơn (không còn gửi cho tất cả Tư pháp) |
| Văn thư tạo đơn bưu điện | Đúng Lãnh đạo được Văn thư chọn khi tạo đơn (không còn gửi cho tất cả Lãnh đạo) |
| Tư pháp / Lãnh đạo phân công chuyên viên | Chuyên viên được chọn |
| Chuyên viên submit kết quả | Tư pháp |
| Tư pháp lên lịch đối thoại | Tất cả người liên quan đến đơn (Văn thư + Chuyên viên + Lãnh đạo nếu là đơn bưu điện) |
| Tư pháp hoàn thành (`HOAN_THANH`) | Văn thư + Lãnh đạo |

## Phân quyền người dùng

| Role | Mô tả | Quyền trong hệ thống |
|---|---|---|
| `ADMIN` | Quản trị viên hệ thống | Toàn quyền: quản lý và phân quyền user, danh mục, nhật ký. **Không có bước workflow nào gán cho role này** — vì vậy trang "Đơn chờ xử lý" luôn trống với `ADMIN` theo thiết kế (không phải lỗi). |
| `VAN_THU` | Nhân viên Văn thư | Tạo đơn, chỉnh sửa đơn trước khi chuyển, xem tiến độ đơn mình tạo |
| `LANH_DAO` | Lãnh đạo UBND (Chủ tịch / Phó Chủ tịch) | Bút phê + phân công đơn bưu điện, xem toàn bộ hồ sơ, xem báo cáo |
| `TRUONG_PHONG` | Trưởng phòng | Quyền workflow **giống hệt** `LANH_DAO` (bút phê + phân công đơn bưu điện, xem toàn bộ hồ sơ/báo cáo) — chỉ khác thứ bậc hiển thị/tổ chức, xem ghi chú ở Ma trận quyền phía trên |
| `TU_PHAP` | Chuyên viên Tư pháp | Tiếp nhận đơn trực tiếp, tổ chức đối thoại, upload biên bản, ban hành quyết định |
| `CHUYEN_VIEN` | Chuyên viên chuyên môn | Nhận đơn được phân công, cập nhật kết quả xử lý, upload tài liệu |

Quy tắc chung: **tất cả role khi vào Danh sách đơn đều có quyền xem lịch sử xử lý đơn** (timeline), không giới hạn theo bước hiện tại — chỉ quyền **thao tác/chuyển trạng thái** mới giới hạn theo Ma trận quyền ở trên. `CHUYEN_VIEN` chỉ xử lý được đơn đã phân công cho chính mình; `LANH_DAO`, `TRUONG_PHONG` và `ADMIN` xem toàn bộ hồ sơ/báo cáo không giới hạn.

**Chọn người tiếp nhận ngay khi tạo đơn**: Văn thư bắt buộc chỉ định đích danh **Chuyên viên Tư pháp tiếp nhận** (đơn Trực tiếp) hoặc **Lãnh đạo bút phê** (đơn Bưu điện) ngay tại màn hình Tạo đơn mới — không còn để trống cho "ai đúng role cũng nhận được" ở bước khởi đầu (quy tắc "chưa gán thì ai đúng role cũng thao tác được" vẫn áp dụng bình thường cho các bước sau, không đổi).

## Các module chính (trang & route)

1. **Dashboard (Trang chủ)** — route `/`:
   - Bộ lọc theo ngày/tháng/năm.
   - Thẻ thống kê: Tổng đơn | Đơn mới hôm nay | Đang xử lý | Sắp hết hạn | Đã hoàn thành.
   - Biểu đồ đường theo ngày (Quá hạn/Đang xử lý/Hoàn thành/Mới hôm nay) + biểu đồ donut phân loại trạng thái.
   - Bảng "Đơn đang chờ tôi xử lý" — lọc theo role người đăng nhập, ưu tiên Quá hạn → Đang xử lý → Hoàn thành.
   - Cảnh báo đơn quá hạn (highlight đỏ), thông báo chưa đọc (icon chuông).
   - **Bao gồm luôn phần Báo cáo thống kê** (không tách trang riêng): tổng hợp theo tháng/quý/năm, phân theo kênh tiếp nhận, thời gian xử lý trung bình, xuất PDF (`@react-pdf/renderer`, có logo phường + tiêu đề).
2. **Tạo đơn (Văn thư)** — route `/don-thu/tao-moi`: section Kênh tiếp nhận (radio Trực tiếp/Bưu điện, quyết định luồng) + section chọn người tiếp nhận (Chuyên viên Tư pháp cho Trực tiếp / Lãnh đạo cho Bưu điện, bắt buộc) + section Thông tin đơn (họ tên, số CCCD, địa chỉ, SĐT, nội dung khiếu nại, upload **nhiều file** đơn gốc bắt buộc PDF/JPG/PNG tối đa 10MB/file). Sau khi lưu: sinh mã số tự động, chuyển trạng thái khởi đầu theo kênh, gửi thông báo cho đúng người được chọn, có thể in Phiếu tiếp nhận.
3. **Danh sách đơn thư** — route `/don-thu`: bảng phân trang (20 dòng/trang), cột Mã số/Ngày tiếp nhận/Họ tên/Kênh/Trạng thái/Người phụ trách/Thao tác, bộ lọc (Kênh/Trạng thái/Khoảng ngày/Từ khóa), badge màu theo trạng thái, nút "Xem chi tiết". Mỗi role chỉ thấy đơn liên quan đến mình, trừ `ADMIN`, `LANH_DAO`, `TRUONG_PHONG` thấy tất cả.
4. **Đơn chờ xử lý** — route `/don-thu/cho-xu-ly`: danh sách đơn mà **người đăng nhập hiện tại** có quyền xử lý ngay (lọc bằng `canAct`), cột Mã số/Người khiếu nại/Kênh/Hành động cần làm/Hạn xử lý/Thao tác, badge số lượng trên Sidebar. `ADMIN` luôn thấy trang trống (không có bước workflow nào gán cho role này) — hành vi thiết kế có chủ đích, không phải lỗi.
5. **Chi tiết đơn & xử lý theo bước** — route `/don-thu/[id]` (không phải mục sidebar riêng, chỉ truy cập qua nút "Xem" từ Danh sách đơn): gồm 3 phần — (A) Thông tin đơn read-only; (B) Timeline xử lý (người thực hiện, thời gian, nội dung, file đính kèm, trạng thái hiện tại highlight); (C) Form hành động (upload nhiều file), **chỉ hiện khi người đăng nhập có quyền thực hiện đúng bước tiếp theo** (tra theo Ma trận quyền + trạng thái hiện tại). Chuyển trạng thái đơn dùng Optimistic UI (cập nhật giao diện ngay, rollback + toast lỗi nếu server từ chối).
6. **Tra cứu** — route `/tra-cuu`: tìm nhanh theo mã số đơn; tìm nâng cao theo Kênh/Trạng thái/Khoảng ngày/Tên người khiếu nại/Chuyên viên phụ trách; xuất kết quả ra Excel.
7. **Trung tâm thông báo** — route `/thong-bao`: toàn bộ thông báo của người dùng (phân trang), chưa đọc/đã đọc phân biệt bằng màu nền + chấm tròn, click 1 dòng để đánh dấu đã đọc + điều hướng tới đơn liên quan, nút "Đánh dấu tất cả đã đọc". Kết hợp với polling 30 giây + `Notification` API của trình duyệt (không phải Web Push/Service Worker chuẩn) để bắn thông báo hệ điều hành khi có tin mới.
8. **Quản trị hệ thống (Admin)** — route `/quan-tri`: quản lý người dùng đầy đủ (Họ tên/Email/Tên đăng nhập/SĐT/Vai trò — 6 role/Phòng ban/Chức vụ/Trạng thái, tạo tài khoản có gợi ý mật khẩu, sửa, reset mật khẩu, khóa/mở khóa — đều có confirm dialog cho hành động nguy hiểm), nhật ký hành động (audit log), cấu hình hạn xử lý mặc định (số ngày).

## Domain model tóm tắt

- **Đơn khiếu nại** (`complaints`): mã số tự sinh dạng `SỐ/NĂM/KN-KÊNH`, kênh tiếp nhận (Trực tiếp/Bưu điện), thông tin người khiếu nại (họ tên, CCCD, địa chỉ, SĐT), nội dung, ngày tiếp nhận, hạn xử lý, trạng thái workflow chi tiết (8 giá trị enum ở trên), cờ quá hạn (derived), người phụ trách hiện tại, phòng ban.
- **Dữ liệu theo bước xử lý** (`complaint_step_data`): dữ liệu nhập riêng cho từng bước (Số thông báo/Ngày ban hành/Ghi chú; Nội dung xác minh/Kết quả xử lý/Đề xuất; Ngày đối thoại/Địa điểm/Thành phần; Số quyết định/Ngày ký/Nội dung tóm tắt) — mỗi bản ghi gắn với 1 đơn + 1 loại bước.
- **Tài liệu đính kèm** (`complaint_attachments`): mỗi file gắn với 1 loại tài liệu cụ thể theo bước, định dạng **PDF/JPG/PNG**, lưu trên cloud storage ở production (hiện dev đang dùng local disk tạm thời — xem mục "Trạng thái hiện tại"). **Bắt buộc** ở mọi bước trừ bút phê của Lãnh đạo (ngoại lệ duy nhất): Đơn gốc, Thông báo tiếp nhận, Kết quả xử lý chuyên môn, Biên bản đối thoại, Quyết định giải quyết đều bắt buộc. Backend phải chặn việc chuyển trạng thái nếu thiếu file bắt buộc của bước hiện tại.
- **Lịch sử xử lý** (`complaint_status_history`): người thực hiện, vai trò, thời điểm, trạng thái trước/sau.
- **Thông báo** (`notifications`): người nhận (`user_id`), loại sự kiện, đơn liên quan, nội dung, cờ đã đọc/chưa đọc, thời điểm.
- **Người dùng** (`users`): role enum (`ADMIN`, `VAN_THU`, `LANH_DAO`, `TRUONG_PHONG`, `TU_PHAP`, `CHUYEN_VIEN`), `email` + `tenDangNhap` (duy nhất, tự suy từ email nếu không nhập), `soDienThoai`, `chucVu`, `daKhoa`, thuộc phòng ban.
- **Phòng ban** (`departments`).

## Design system

**Bảng màu chính thức (CSS variables):**
```css
/* Primary - Xanh chính phủ (header, button, sidebar) */
--primary: #1a5ba8;        /* Header bar, button chính */
--primary-dark: #0d4080;   /* Hover state */
--primary-light: #e8f0fb;  /* Background highlight nhẹ */

/* Logo color - Xanh lá phường Hiệp Bình */
--brand-green: #00a84f;      /* Màu logo phường, dùng cho accent đặc biệt */
--brand-green-dark: #007a38;

/* Accent trạng thái */
--accent-red: #d32f2f;     /* Cảnh báo, khẩn cấp */
--accent-orange: #f57c00;  /* Sắp hết hạn, ưu tiên cao */
--accent-green: #2e7d32;   /* Đã giải quyết, hoàn thành */
--accent-gray: #546e7a;    /* Text phụ */

/* Background */
--bg-page: #f0f4f8;             /* Nền trang */
--bg-card: #ffffff;             /* Card, bảng */
--bg-sidebar: #ffffff;          /* Sidebar SÁNG (đổi từ tối #1a3a5c sang trắng, theo phong cách tham khảo mới) */
--bg-sidebar-border: #e5e7eb;   /* Viền phải sidebar trên nền sáng */
```
Logo phường có màu xanh lá `#00A84F` — dùng làm điểm nhấn (badge "Hoàn thành"). Header dùng xanh chính phủ `#1A5BA8` làm màu chủ đạo (không đổi). **Sidebar dùng nền sáng/trắng** — active item: nền `--primary-light`, chữ/icon `--primary`, viền trái 4px `--primary`; item thường: chữ xám đậm `text-gray-600/700`, hover nền xám nhạt.

**Layout shell:**
```
┌─────────────────────────────────────────────────────────┐
│  HEADER: Logo | Tên hệ thống | Tên phường     User | 🔔 │  h-14, bg-primary
├──────────────┬──────────────────────────────────────────┤
│              │  Quick nav / breadcrumb                   │
│   SIDEBAR    ├──────────────────────────────────────────┤
│   w-56       │                                          │
│   bg sáng    │         NỘI DUNG CHÍNH                   │
│   collapsible│         (scrollable)                     │
│   Menu items │                                          │
│   w/ icons   │                                          │
├──────────────┴──────────────────────────────────────────┤
│  FOOTER: Tên đơn vị | Địa chỉ | SĐT | Website          │  h-10, text-xs
└─────────────────────────────────────────────────────────┘
```
Header: logo phường bên trái + tên hệ thống + "Ủy ban nhân dân phường Hiệp Bình"; bên phải avatar/tên/vai trò + chuông thông báo (badge đỏ) + nút Đăng xuất. Footer: cùng logo, tên đầy đủ đơn vị, địa chỉ. Trên mobile: sidebar thu gọn thành hamburger/drawer.

**Trang đăng nhập (`/dang-nhap`)**: bố cục 2 cột — cột trái (banner, thu gọn thành dải trên cùng ở mobile) nền xanh chính phủ với họa tiết chấm nhẹ (SVG pattern), logo phường + tên hệ thống/đơn vị; cột phải card trắng với input Email (icon) + Mật khẩu (icon, có nút hiện/ẩn) + nút "ĐĂNG NHẬP". Không có SSO. Đăng nhập gọi thật `POST /api/auth/login`, không còn dropdown chọn user demo.

**Badge màu theo trạng thái đơn:**

| Enum | Nhãn hiển thị | Màu badge |
|---|---|---|
| `CHO_TIEP_NHAN_TU_PHAP` | Chờ Tư pháp tiếp nhận | Xám `#78909C` |
| `CHO_LANH_DAO_PHAN_CONG` | Chờ lãnh đạo phân công | Xám `#78909C` |
| `DA_TIEP_NHAN` | Đã tiếp nhận | Xanh dương `#1976D2` |
| `DA_PHAN_CONG` | Đã phân công | Xanh dương `#1976D2` |
| `DA_XU_LY_CHUYEN_MON` | Đã xử lý chuyên môn | Cam `#E65100` |
| `CHO_DOI_THOAI` | Chờ đối thoại | Vàng `#F9A825` |
| `DA_DOI_THOAI` | Đã đối thoại | Tím `#7B1FA2` |
| `HOAN_THANH` | Hoàn thành | Xanh lá `#00A84F` |

Cờ "Quá hạn" (derived) hiển thị đè thêm màu đỏ `#D32F2F` bất kể badge trạng thái nào ở trên.

**Quy tắc UI:**
- Font: `Inter` hoặc `Be Vietnam Pro` (Google Fonts) — hỗ trợ tiếng Việt có dấu tốt.
- Sidebar có thể thu gọn (chỉ còn icon) trên desktop, chuyển thành drawer/hamburger trên mobile.
- Bảng dữ liệu: border nhẹ, row hover highlight, sticky header; trên mobile chuyển thành card xếp dọc hoặc cuộn ngang.
- Mọi action nguy hiểm (xóa, từ chối, khóa tài khoản, reset mật khẩu) phải có confirm dialog — dùng `useConfirm()` (`frontend/src/context/ConfirmContext.tsx`).
- Toast notification cho thông báo thành công/lỗi — dùng `useToast()` (`frontend/src/context/ToastContext.tsx`); lỗi validate từng field trong form vẫn hiển thị inline dưới field, không dùng toast cho việc đó.
- Hỗ trợ in (print CSS) cho biên nhận, thông báo tiếp nhận, quyết định giải quyết.
- Không dùng gradient/hiệu ứng cầu kỳ, giữ tối giản: card trắng bo góc nhẹ (rounded-lg), shadow nhẹ, nền trang `--bg-page`.

## Bảo mật & phân quyền

- Middleware kiểm tra role cho từng route/hành động theo đúng "Ma trận quyền theo bước xử lý" ở trên — nguồn tham chiếu duy nhất, không định nghĩa lại quyền ở nơi khác.
- Quyền **xem** (danh sách đơn, chi tiết, lịch sử xử lý/timeline) mở cho tất cả role đã đăng nhập; chỉ quyền **thao tác/chuyển trạng thái** mới giới hạn theo ma trận.
- API chuyển trạng thái đơn phải validate đúng thứ tự bước (không cho nhảy cóc hoặc chuyển trạng thái sai role) và validate đủ dữ liệu/file bắt buộc của bước đó trước khi cho phép chuyển tiếp.
- Validate input mọi endpoint (zod), giới hạn loại file upload (PDF/JPG/PNG, tối đa 10MB), không log dữ liệu CCCD/nhạy cảm ra console/log file.

## Trạng thái hiện tại

- **Bắt buộc chạy đồng thời Postgres (Docker) + `server/` + `frontend/`** thì app mới hoạt động được — **không còn** lớp mock độc lập. `frontend/src/api/client.ts` gọi thật `fetch()` tới `VITE_API_URL` (`frontend/.env`, mặc định `http://localhost:4000`) kèm JWT `Authorization: Bearer`. `frontend/src/data/mockUsers.ts` và `mockComplaints.ts` không còn được import ở bất kỳ đâu trong app (chỉ còn giá trị tham chiếu lịch sử, có thể xóa an toàn).
- **Auth thật**: đăng nhập bằng email/mật khẩu qua `POST /api/auth/login`, JWT lưu `localStorage` (`hiepbinh_token`), khôi phục phiên qua `GET /api/auth/me` khi tải lại trang, tự đăng xuất nếu token hết hạn/401.
- **Đã tích hợp đầy đủ**: trang "Đơn chờ xử lý" + badge Sidebar, quản lý người dùng đầy đủ (6 role gồm `TRUONG_PHONG`), upload nhiều file mỗi bước (`upload.array('files', 10)`), chọn người tiếp nhận khi tạo đơn, Toast + Confirm Dialog, push notification polling 30s + Trung tâm thông báo, Optimistic UI cho các thao tác cập nhật (chuyển trạng thái đơn, khóa/mở khóa user, đánh dấu đã đọc thông báo), sidebar nền sáng, trang Login 2 cột.
- **Backend** (`server/`): Express + TypeScript + Prisma (PostgreSQL). `services/workflow.ts` và `lib/workflow.ts` (frontend) là 2 bản sao **phải luôn khớp nhau** — đặc biệt quy tắc `TRUONG_PHONG` tương đương `LANH_DAO`. Đã test qua curl: login, tạo đơn nhiều file + chọn người tiếp nhận, action nhiều file, chặn sai quyền, `TRUONG_PHONG` bút phê thành công và ghi đúng role vào lịch sử.
- **Lưu file đính kèm**: hiện dùng **local disk** (`server/uploads/`, gitignore) để chạy dev/test nhanh. Khi triển khai thật, thay `multer.diskStorage` trong `server/src/middlewares/upload.ts` bằng SDK cloud storage (S3-compatible) đúng theo kiến trúc đã chốt — không lưu local ở production.
- **Database dev**: chạy PostgreSQL qua Docker: `docker run -d --name hiepbinh-postgres -e POSTGRES_USER=hiepbinh -e POSTGRES_PASSWORD=hiepbinh123 -e POSTGRES_DB=hiepbinh_khieunai -p 5544:5432 postgres:16-alpine` (dùng cổng `5544` thay vì `5432` mặc định — máy dev có thể có tiến trình cũ chiếm `5432`, kiểm tra bằng `netstat -ano | grep 5432` nếu đổi lại cổng chuẩn). Nếu container đã tồn tại nhưng dừng: `docker start hiepbinh-postgres`.
- **Tài khoản demo** (seed sẵn, mật khẩu chung `123456`): `admin@hiepbinh.gov.vn`, `vanthu@hiepbinh.gov.vn`, `lanhdao@hiepbinh.gov.vn`, `truongphong@hiepbinh.gov.vn`, `tuphap@hiepbinh.gov.vn`, `chuyenvien1@hiepbinh.gov.vn`, `chuyenvien2@hiepbinh.gov.vn` (tài khoản này bị khóa sẵn — dùng để test luồng "tài khoản bị khóa").

## Lệnh chính

- **Frontend** (chạy trong `frontend/`): `npm run dev` (cổng 5173), `npm run build`, `npm run lint`, `npm run typecheck`.
- **Backend** (chạy trong `server/`, cần `.env` theo mẫu `.env.example` và Postgres đang chạy): `npm run dev` (cổng 4000), `npm run build`, `npm run start`, `npm run migrate` (Prisma migrate dev), `npm run seed` (dữ liệu mẫu), `npm run prisma:studio` (xem DB trực quan), `npm run typecheck`.
