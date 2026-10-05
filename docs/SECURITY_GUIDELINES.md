# QUY CHUẨN AN TOÀN THÔNG TIN & BẢO MẬT TÁC NGHIỆP (SECURITY GUIDELINES)
> **Dành cho Trợ lý AI và Đội ngũ Kỹ sư vận hành hệ thống**  
> Dự án: Cổng Thông tin Điều hành - Lịch Công tác tuần UBND Xã Ea Súp

---

## 🛡️ 1. NGUYÊN TẮC CỐT LÕI: KHÔNG LỘ LỌT THÔNG TIN NHẠY CẢM (ZERO SECRETS IN LOGS)

Trong quá trình tác nghiệp, lưu trữ phiên hoặc cập nhật tài liệu (`SESSION_STATE.md`, `WORK_LOG.md`, code commits):

1. **Tuyệt đối KHÔNG ghi các thông tin sau vào file nhật ký / tài liệu Markdown:**
   - ❌ Mật khẩu người dùng (Admin password, DB password, Mail password).
   - ❌ Chuỗi bí mật ký số (JWT_SECRET, SECRET_KEY, Session Salt).
   - ❌ Chuỗi kết nối CSDL hoàn chỉnh có chứa mật khẩu (ví dụ: `postgresql://user:password@host/db`).
   - ❌ Token xác thực thật (Bearer tokens, API keys, Session cookies).
   - ❌ Thông tin cá nhân nhạy cảm (Số CCCD, số điện thoại cá nhân không công khai).

2. **Quy tắc Che mờ thông tin (Data Masking Rules):**
   - Khi cần nhắc đến cấu hình, luôn dùng placeholder hoặc mask:
     - Đúng: `DATABASE_URL=postgresql://easup_admin:***@db:5432/lich_congtac_easup`
     - Đúng: `JWT_SECRET=[MASKED_SECRET_KEY]`
     - Đúng: `Authorization: Bearer eyJhbG...[MASKED]`
     - Sai: `JWT_SECRET=super_secret_123456`

---

## 🔒 2. QUẢN LÝ TỆP BIẾN MÔI TRƯỜNG & DỮ LIỆU CỤC BỘ

1. **Tệp `.env`:**
   - Chỉ được lưu trữ trực tiếp trên máy chủ VPS hoặc máy trạm phát triển nội bộ.
   - Luôn đảm bảo `.env` nằm trong danh sách `.gitignore`.
   - Mọi thay đổi về cấu trúc biến phải được cập nhật tương ứng vào `.env.example` với giá trị mẫu an toàn.

2. **Thư mục Dữ liệu `data/`:**
   - Cơ sở dữ liệu SQLite (`*.db`, `*.sqlite3`) và các bản xuất sao lưu JSON (`data/backups/*.json`) chứa dữ liệu công tác nội bộ của cơ quan.
   - Thư mục này bắt buộc phải được loại trừ trong `.gitignore` để không bị đẩy lên kho mã nguồn công khai hoặc chia sẻ ngoài ý muốn.

---

## 🔍 3. DANH MỤC KIỂM TRA BẢO MẬT TRƯỚC KHI COMMIT (PRE-COMMIT SECURITY CHECKLIST)

Trước khi thực hiện `git commit` hoặc bàn giao phiên làm việc, luôn tự kiểm tra 4 điểm:

- [ ] **Kiểm tra `git status` và `git diff`:** Xác nhận không có file `.env`, file `.db` hoặc file backup nào bị vô tình thêm vào `git add`.
- [ ] **Kiểm tra chuỗi ký tự cứng (Hardcoded Secrets):** Đảm bảo không có chuỗi khóa bí mật, pass mã hóa cứng trực tiếp trong code Python (`server.py`) hay JS (`app.js`, `auth.js`).
- [ ] **Kiểm tra tệp log / state:** Đảm bảo `SESSION_STATE.md` và `WORK_LOG.md` chỉ ghi nhận tóm tắt kỹ thuật, không chứa chuỗi nhạy cảm.
- [ ] **Phân quyền truy cập tệp:** Đảm bảo quyền đọc/ghi trên server chỉ giới hạn cho user chạy dịch vụ (ví dụ `chmod 600 .env` trên VPS).

---

## 🚨 4. QUY TRÌNH XỬ LÝ SỰ CỐ AN TOÀN THÔNG TIN (INCIDENT RESPONSE)

Nếu phát hiện vô tình để lộ bí mật (như đẩy nhầm `.env` hoặc token lên Git):

1. **Thu hồi và đổi mới ngay lập tức (Immediate Rotation):**
   - Đổi `JWT_SECRET` trong `.env` trên máy chủ VPS (lệnh này sẽ tự động vô hiệu hóa toàn bộ phiên đăng nhập cũ).
   - Đổi mật khẩu tài khoản Quản trị viên (`ADMIN_PASSWORD`) và mật khẩu CSDL PostgreSQL.
2. **Làm sạch lịch sử Git (Git Purge):**
   - Xóa tệp nhạy cảm khỏi commit gần nhất hoặc dùng `git filter-repo` / `BFG Repo-Cleaner` nếu đã bị push.
   - Không chỉ xóa bằng một commit mới, phải ghi đè lịch sử nếu đã lộ ra repository chia sẻ.
3. **Ghi nhận sự cố:**
   - Ghi ngắn gọn vào `WORK_LOG.md` về thời điểm thu hồi và cấp mới key bảo mật.
