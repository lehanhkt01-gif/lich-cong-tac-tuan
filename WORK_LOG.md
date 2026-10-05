# NHẬT KÝ TIẾN TRÌNH TÁC NGHIỆP (OPERATIONAL WORK LOG)
> **Tài liệu theo dõi lịch sử chỉnh sửa, cập nhật tính năng và khắc phục sự cố hệ thống**  
> Dự án: Cổng Thông tin Điều hành - Lịch Công tác tuần UBND Xã Ea Súp

---

## 📅 PHIÊN LÀM VIỆC NGÀY 2026-10-05

### 🔹 Phiên 07 (00:05 - 00:15) | Bảo Mật API AI Gemini Vào .env & Ẩn Khối Quản Lý Dữ Liệu / AI Trong Giao Diện Quản Trị
- **Mục tiêu:**
  1. Ẩn nút "Khôi phục dữ liệu" trên navbar và toàn bộ khối "Quản lý dữ liệu & sao lưu (JSON Backup)" trong tab Cài đặt.
  2. Ẩn khối "Cấu hình trí tuệ nhân tạo (Google Gemini API)" trong tab Cài đặt.
  3. Lưu API Key AI (`GEMINI_API_KEY=[MASKED]`) vào tệp `.env` bảo mật, không làm ảnh hưởng đến quá trình kết nối bóc tách lịch tự động bằng AI.
  4. Hướng dẫn lệnh cập nhật `.env` và các bước đẩy lên GitHub, kéo về VPS `/opt/lich-cong-tac-tuan`.
- **Giải pháp kỹ thuật đã triển khai:**
  - `.env` & `.env.example`: Bổ sung cấu hình `GEMINI_API_KEY=[MASKED]` và `GEMINI_MODEL=gemini-2.0-flash`. Đảm bảo `.env` được `.gitignore` bảo vệ tuyệt đối không bao giờ bị đẩy lên GitHub.
  - `server.py`:
    + Nạp `GEMINI_API_KEY` từ biến môi trường qua `os.environ`.
    + Bổ sung endpoint bảo mật `GET /api/system/ai-config` (xác thực qua Bearer Token JWT) cung cấp key an toàn cho Admin.
    + Trả về `geminiApiKey` khi Admin đăng nhập thành công qua `POST /api/admin/login`.
  - `js/auth.js` & `js/ai-extractor.js` & `js/app.js`:
    + `GeminiExtractorService`: Bổ sung cơ chế `syncKeyFromServer()`. Tự động nạp key từ máy chủ khi đăng nhập hoặc khi mở modal bóc tách lịch AI.
    + Thêm fallback ngầm trong suốt để tính năng bóc tách lịch AI hoạt động trơn tru trong mọi điều kiện.
  - `index.html`:
    + Ẩn nút "Khôi Phục Dữ Liệu" trên thanh navbar (`display: none !important;`).
    + Ẩn toàn bộ khối "💾 Quản Lý Dữ Liệu & Sao Lưu (JSON Backup)" trong tab Cài đặt (`display: none !important;`).
    + Ẩn toàn bộ khối "✨ Cấu Hình Trí Tuệ Nhân Tạo (Google Gemini API)" trong tab Cài đặt (`display: none !important;`).
    + Ẩn nút "⚙️ Cài đặt API" trong modal Bóc tách lịch AI.
  - `docker-compose.yml`: Khai báo biến `GEMINI_API_KEY` và `GEMINI_MODEL` vào service `web`.
- **Tệp thay đổi:** `index.html`, `js/app.js`, `js/ai-extractor.js`, `js/auth.js`, `server.py`, `docker-compose.yml`, `.env.example`, `.env`, `SESSION_STATE.md`, `WORK_LOG.md`.
- **Kết quả:** Giao diện quản lý sạch sẽ, các nút sao lưu và cấu hình AI không còn hiển thị; API AI được lưu bảo mật trong `.env` và chức năng bóc tách lịch AI hoạt động liền mạch.

---

### 🔹 Phiên 06 (23:55 - 00:05) | Ghim Cột Thao Tác (Sticky Right), Tối Ưu Độ Rộng Bảng & Thêm Đường Dẫn Sửa/Xóa
- **Mục tiêu:** Xử lý triệt để hiện tượng tại các tuần (như tuần 39) đã đăng nhập thành công nhưng không thấy cột Thao tác (Sửa/Xóa).
- **Nguyên nhân kỹ thuật:**
  - Tổng chiều rộng các cột trong bảng trước đây quá lớn (> 1400px), trong khi màn hình laptop thông thường (1280px-1366px) chỉ hiển thị được tới cột "ĐÍNH KÈM", làm cột "THAO TÁC" bị trôi ra khỏi mép phải màn hình.
  - Cột Thao tác chưa được ghim cố định (sticky), thanh cuộn ngang dưới đáy bị thanh floating bar che lấp khiến người dùng không biết bảng bị tràn ngang.
- **Giải pháp đã thực hiện:**
  - `css/style.css`: Áp dụng kỹ thuật `position: sticky; right: 0;` cho `.col-actions-header` và `.col-actions-cell`. Dù màn hình có kích thước nào hay bảng có cuộn ngang ra sao, cột THAO TÁC luôn được ghim cố định ở mép phải màn hình.
  - `index.html`: Tối ưu hóa kích thước tất cả các cột bảng (Giờ: 75px, Khối: 80px, Lãnh đạo: 160px, Thành phần: 190px, Phương tiện: 85px, Đính kèm: 80px, Thao tác: 125px) giúp bảng hiển thị vừa khít trên mọi màn hình máy tính thông thường mà không bị tràn.
  - `js/app.js`: Bổ sung tính năng nhấp đúp chuột (`ondblclick`) vào bất kỳ dòng cuộc họp nào để mở ngay form chỉnh sửa.
  - `js/app.js` & `index.html`: Bổ sung 3 nút hành động trực tiếp (`✏️ Chỉnh Sửa`, `📋 Nhân Bản`, `🗑️ Xóa`) ngay trong Modal "Xem chi tiết cuộc họp" (`modalViewItemDetail`).
- **Tệp thay đổi:** `index.html`, `js/app.js`, `css/style.css`.
- **Kết quả:** Cột Thao tác luôn hiển thị rõ ràng trước mắt người dùng trên mọi tuần công tác, hỗ trợ sửa/xóa trực quan và nhanh chóng.

---

### 🔹 Phiên 05 (23:45 - 23:55) | Ẩn Hoàn Toàn 2 Nút Khi Là Khách & Khắc Phục Lỗi Nút Đăng Nhập Bị Đơ
- **Mục tiêu:** 
  1. Ẩn hoàn toàn 2 nút "Lập Lịch Tuần Mới" và "+ THÊM MỤC CÔNG TÁC" khi người dùng ở Chế độ Khách (chưa đăng nhập).
  2. Sửa lỗi nút Đăng nhập ở góc trên bên phải bị đơ không mở được modal.
- **Nguyên nhân kỹ thuật:**
  - Nút Đăng nhập bị đơ do thẻ `modalAIExtractor` ở dòng 1094 bị thiếu thẻ đóng `</div>` bao bọc, khiến thẻ `<div class="modal-backdrop" id="modalLogin">` bị nhét nhầm vào bên trong `modalAIExtractor`. Vì `modalAIExtractor` có `display: none` nên toàn bộ modalLogin bên trong nó không thể hiển thị lên màn hình dù đã được thêm class `.show`.
  - Hàm `openLoginModal` trước đó chưa gọi `openModal("modalLogin")` chuẩn mực (thiếu `modal.style.display = "flex"` để ghi đè `display: none` khi đã từng bị `closeModal`).
- **Giải pháp đã thực hiện:**
  - `index.html`: Bổ sung thẻ đóng `</div>` chuẩn xác cho `modalAIExtractor`, đưa `modalLogin` ra cấp body độc lập.
  - `index.html`: Thêm class `auth-require-edit` và inline style `display: none;` cho cả 2 nút `Lập Lịch Tuần Mới` và `THÊM MỤC CÔNG TÁC` để ẩn ngay lập tức khi tải trang ở Chế độ Khách.
  - `js/app.js`: Cập nhật `updateUIPermissions()` để ẩn 2 nút này khi `canEdit = false`, và hiển thị khi đã đăng nhập (`canEdit = true`).
  - `js/app.js`: Chuẩn hóa hàm `openLoginModal()` gọi trực tiếp `this.openModal("modalLogin")`.
- **Tệp thay đổi:** `index.html`, `js/app.js`.
- **Kết quả:** Nút Đăng nhập mở popup tức thì, 2 nút Thêm/Lập lịch ẩn hoàn toàn khi chưa đăng nhập.

---

### 🔹 Phiên 04 (23:25 - 23:45) | Khắc Phục Lỗi Giao Diện Khuyết Phần Chỉnh Sửa Phía Bên Phải
- **Mục tiêu:** Xử lý triệt để hiện tượng cột Thao tác và các nút chỉnh sửa phía bên phải màn hình bị khuyết hoặc biến mất khi xem ở Chế độ Khách (chưa đăng nhập).
- **Nguyên nhân kỹ thuật:**
  - Logic cũ trong `js/app.js` dùng `${canEdit ? ... : ''}` khiến khi `canEdit = false`, các nút Sửa (✏️), Nhân bản (📋), Xóa (🗑️) bị ẩn hoàn toàn, chỉ còn lại icon Xem (👁️).
  - Các nút hành động chính phía bên phải (`+ THÊM MỤC CÔNG TÁC`, `➕ Lập Lịch Tuần Mới`, `✉️ GỬI EMAIL THÔNG BÁO`, `💾 CẬP NHẬT & XUẤT BẢN`) bị gán class `auth-require-edit` và ẩn bằng `display: none` khi chưa đăng nhập.
  - Cột `Thao tác` trong CSS có độ rộng `110px` quá hẹp so với nhóm 4 nút thao tác.
  - Trong `index.html` có 2 modal cùng mang `id="modalLogin"`.
- **Giải pháp đã thực hiện:**
  - `js/app.js`: Luôn render đầy đủ 4 nút thao tác (👁️ Xem, ✏️ Sửa, 📋 Nhân bản, 🗑️ Xóa). Bổ sung cơ chế `pendingAction`: Nếu chưa đăng nhập, khi bấm nút chỉnh sửa sẽ mở Modal Đăng Nhập, sau khi đăng nhập thành công tự động kích hoạt ngay hành động mà người dùng vừa chọn.
  - `index.html`: Gỡ bỏ `auth-require-edit` khỏi các nút thao tác chính bên phải, gán các hàm điều phối click an toàn (`handleCreateItemClick`, `handleCreateNewWeekClick`, v.v.). Xóa bỏ modalLogin trùng lặp cũ, giữ modal chuẩn Bitwarden có logo.
  - `css/style.css`: Nâng độ rộng cột Thao tác lên `140px`, bổ sung `white-space: nowrap`, căn giữa và hiệu ứng hover sắc nét.
  - `js/guest.js`: Bổ sung nút Sửa ✏️ chuyển tiếp sang `index.html?editItem=...`.
- **Tệp thay đổi:** `index.html`, `js/app.js`, `js/guest.js`, `css/style.css`.
- **Kết quả:** Giao diện hiển thị đầy đủ, không còn bị khuyết phần chỉnh sửa ở phía bên phải, trải nghiệm người dùng mượt mà và trực quan.

---

### 🔹 Phiên 03 (23:10 - 23:25) | Khởi tạo Hệ thống Quản lý Bối cảnh & Bảo mật Phiên
- **Mục tiêu:** Thiết lập bộ tệp lưu trữ và theo dõi diễn biến quá trình tác nghiệp, chống quên phiên khi khởi động lại, bảo đảm an toàn dữ liệu và bảo mật thông tin.
- **Các tệp được khởi tạo:**
  - [AGENTS.md](file:///d:/1.%20VPS%20Maydell/4.%20Antigravity/Lich%20Cong%20tac%20tuan/AGENTS.md): Quy tắc tác nghiệp tự động nạp mỗi khi mở phiên mới.
  - [SESSION_STATE.md](file:///d:/1.%20VPS%20Maydell/4.%20Antigravity/Lich%20Cong%20tac%20tuan/SESSION_STATE.md): Trạng thái phiên hiện hành, cổng mạng, công việc đang dở.
  - [WORK_LOG.md](file:///d:/1.%20VPS%20Maydell/4.%20Antigravity/Lich%20Cong%20tac%20tuan/WORK_LOG.md): Nhật ký chi tiết theo thời gian.
  - [docs/SYSTEM_ARCHITECTURE.md](file:///d:/1.%20VPS%20Maydell/4.%20Antigravity/Lich%20Cong%20tac%20tuan/docs/SYSTEM_ARCHITECTURE.md): Kiến trúc hệ thống, API và cấu trúc tệp.
  - [docs/SECURITY_GUIDELINES.md](file:///d:/1.%20VPS%20Maydell/4.%20Antigravity/Lich%20Cong%20tac%20tuan/docs/SECURITY_GUIDELINES.md): Quy chuẩn bảo mật tác nghiệp, chính sách mask dữ liệu nhạy cảm.
- **Kết quả:** Đảm bảo khi khởi động lại máy/IDE, AI và kỹ sư phục hồi ngay 100% ngữ cảnh mà không cần giải thích lại từ đầu.

---

### 🔹 Phiên 02 (Chi tiết từ Git Commit `816c44c` & `e46270d`) | Tinh chỉnh Giao diện & Sửa lỗi Mobile
- **Nội dung thay đổi:**
  - **Commit `816c44c`:**
    - Cập nhật hiển thị thứ trong tuần ngay sau buổi họp (ví dụ: `Sáng thứ hai: 07h30`, `Chiều thứ năm: 13h30`).
    - Định dạng màu đỏ nổi bật cho cột nội dung cuộc họp để tăng tính trực quan cho lãnh đạo khi theo dõi lịch tuần.
  - **Commit `e46270d`:**
    - Khắc phục lỗi cú pháp `async function` tại hàm `handleMobileLoginSubmit`.
    - Xử lý triệt để hiện tượng đơ giao diện khi bấm đăng nhập trên trình duyệt di động (`mobile.html`).
- **Tệp chỉnh sửa:** `index.html`, `guest.html`, `mobile.html`, `js/app.js`, `js/guest.js`.

---

### 🔹 Phiên 01 (Chi tiết từ Git Commit `3397ad5`, `e4ee463`, `5136de4`) | Cấu hình Hạ tầng VPS & Mạng Docker
- **Nội dung thay đổi:**
  - Khắc phục xung đột cổng 80 trên máy chủ VPS đang chạy hệ điều hành CasaOS và Nginx Proxy Manager.
  - Chuyển hướng cổng dịch vụ Nginx của dự án sang cổng `8090` (`8090:80`).
  - Gỡ bỏ và điều chỉnh service Dozzle khỏi docker-compose nhằm tối ưu tài nguyên RAM/CPU và tránh chiếm dụng cổng trên VPS.
- **Tệp chỉnh sửa:** `docker-compose.yml`, `nginx.conf`.

---

## 📝 NGUYÊN TẮC GHI CHÉP CHO CÁC PHIÊN TIẾP THEO
Mỗi khi bắt đầu hoặc hoàn thành một tác vụ mới, hãy bổ sung vào đầu file theo cấu trúc mẫu:

```markdown
### 🔹 Phiên [Số thứ tự] (Thời gian: YYYY-MM-DD HH:MM) | [Tên tác vụ / Tính năng]
- **Người thực hiện / Agent:** [Tên hoặc Model]
- **Mục tiêu:** [Tóm tắt mục đích]
- **Các tệp thay đổi:** [Danh sách tệp]
- **Nội dung kỹ thuật:** [Giải thích logic, nguyên nhân lỗi và cách xử lý]
- **Kết quả kiểm thử:** [Đạt / Cần theo dõi thêm]
- **Lưu ý bảo mật:** [Xác nhận không để lộ secret / credentials]
```
