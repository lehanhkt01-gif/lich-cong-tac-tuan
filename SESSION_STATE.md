# TRẠNG THÁI PHIÊN LÀM VIỆC HIỆN TẠI (ACTIVE SESSION STATE)
> **Tài liệu theo dõi trạng thái tác nghiệp thời gian thực**  
> *Lần cập nhật cuối: 2026-10-05 23:15 (Giờ Việt Nam - UTC+7)*  
> *Dành cho việc khôi phục ngữ cảnh tức thì khi khởi động lại hệ thống hoặc mở phiên mới.*

---

## 📌 1. TỔNG QUAN HIỆN TRẠNG (CURRENT STATUS)

- **Tên dự án:** Cổng Thông tin Điều hành - Lịch Công tác tuần UBND Xã Ea Súp
- **Môi trường:** Phát triển cục bộ (Local Windows Dev) & Máy chủ VPS (CasaOS / Docker)
- **Commit mới nhất:** `04c75a5` (*fix: khac phuc loi giao dien khuyet cac nut thao tac chinh sua ben phai bang va thanh dieu huong*)
- **Trạng thái GitHub:** Đã push đồng bộ 100% lên `origin/main` (https://github.com/lehanhkt01-gif/lich-cong-tac-tuan)
- **Trạng thái hệ thống:** Hoạt động ổn định (Backend Python `server.py` + Frontend SPA + Docker Compose Nginx:8090)

---

## ⚙️ 2. THÔNG SỐ VẬN HÀNH & HẠ TẦNG (INFRASTRUCTURE & PORTS)

| Dịch vụ / Thành phần | Cổng / Cấu hình | Ghi chú vận hành quan trọng |
| :--- | :--- | :--- |
| **Nginx Web Server** | `8090:80` | Đã đổi sang cổng `8090` để tránh xung đột cổng 80 của CasaOS / NPM trên VPS |
| **Backend API (Python)** | `5000` | Chạy qua `server.py` (REST API + JWT Bearer Auth) |
| **Cơ sở dữ liệu** | PostgreSQL 16 (`5432`) / SQLite fallback | Chạy PostgreSQL qua Docker, fallback file cục bộ tại `data/` |
| **Uploads & Backups** | `data/uploads/`, `data/backups/` | Đã cấu hình `.gitignore` bảo vệ file tải lên và sao lưu nhạy cảm |

> ⚠️ **Lưu ý bảo mật:** Tuyệt đối không ghi mật khẩu DB hay JWT Secret vào tệp này. Đọc từ file `.env` cục bộ.

---

## 🚀 3. CÔNG VIỆC VỪA HOÀN THÀNH GẦN NHẤT (RECENTLY COMPLETED)

1. [x] **Hiển thị thứ trong tuần sau buổi & Tô màu đỏ nội dung:**
   - Cập nhật hiển thị thời gian: ví dụ `Sáng thứ hai: 07h30`, `Chiều thứ ba: 14h00`.
   - Tô màu đỏ nổi bật cho cột nội dung cuộc họp để lãnh đạo dễ nhận diện.
2. [x] **Sửa lỗi cú pháp async trên Mobile (`mobile.html` / `app.js`):**
   - Khắc phục lỗi `handleMobileLoginSubmit` khiến giao diện mobile bị đơ khi bấm đăng nhập.
3. [x] **Tối ưu hạ tầng mạng Docker Compose:**
   - Điều chỉnh cổng Nginx sang `8090`.
   - Gỡ bỏ Dozzle khỏi compose mặc định để tránh tranh chấp tài nguyên và cổng trên VPS CasaOS.
4. [x] **Thiết lập hệ thống lưu trữ & theo dõi phiên tác nghiệp:**
   - Tạo bộ quy tắc `AGENTS.md` nạp tự động mỗi khi khởi động lại phiên.
   - Tạo `SESSION_STATE.md`, `WORK_LOG.md`, `SYSTEM_ARCHITECTURE.md`, `SECURITY_GUIDELINES.md`.
5. [x] **Khắc phục giao diện cột Thao tác bên phải:**
   - Cột Thao tác bên phải bảng: Hiển thị đầy đủ 4 nút Xem (👁️), Sửa (✏️), Nhân bản (📋), Xóa (🗑️).
   - Mở rộng chiều rộng cột Thao tác lên `140px` chống co ép/gãy dòng.
6. [x] **Ẩn hoàn toàn 2 nút khi ở Chế độ Khách & Sửa lỗi nút Đăng nhập bị đơ:**
   - Ẩn hoàn toàn 2 nút "Lập Lịch Tuần Mới" và "+ THÊM MỤC CÔNG TÁC" khi chưa đăng nhập (`display: none`).
   - Sửa lỗi nút Đăng nhập bị đơ: Đóng đủ thẻ `</div>` cho `modalAIExtractor`, tách `modalLogin` ra ngoài và chuẩn hóa hàm gọi `openModal("modalLogin")`.
7. [x] **Ghim cố định cột Thao tác (Sticky Right), tối ưu độ rộng bảng & hỗ trợ sửa/xóa:**
   - Ghim cố định cột Thao tác mép phải (`position: sticky; right: 0;`), đảm bảo luôn hiển thị trước mắt người dùng trên mọi kích thước màn hình và mọi tuần công tác.
   - Tinh chỉnh độ rộng các cột thead vừa vặn 100% khung nhìn, chống tràn màn hình.
   - Thêm tính năng nhấp đúp chuột (`ondblclick`) vào dòng để sửa nhanh và bổ sung 3 nút `✏️ Sửa`, `📋 Nhân bản`, `🗑️ Xóa` trong modal chi tiết.
8. [x] **Bảo mật API AI Gemini vào .env & Ẩn các khu vực quản lý dữ liệu/AI trên UI:**
   - Ẩn hoàn toàn nút "Khôi phục dữ liệu" trên thanh navbar.
   - Ẩn toàn bộ khối "💾 Quản Lý Dữ Liệu & Sao Lưu (JSON Backup)" và "✨ Cấu Hình Trí Tuệ Nhân Tạo (Google Gemini API)" trong tab Cài đặt hệ thống.
   - Lưu trữ `GEMINI_API_KEY=[MASKED]` vào `.env` bảo mật trên cả môi trường Dev và VPS.
   - Tích hợp nạp key tự động qua `server.py` (endpoint `/api/system/ai-config` và response login) giúp tính năng bóc tách lịch AI vẫn hoạt động ổn định và liên tục mà không làm lộ key hoặc bắt người dùng nhập tay.
   - Cập nhật `.env.example` và `docker-compose.yml` để Docker tự động nạp biến môi trường AI khi khởi chạy.

---

## ⏳ 4. CÔNG VIỆC ĐANG THỰC HIỆN / VIỆC TIẾP THEO (PENDING BACKLOG)

- [ ] **Đẩy commit lên GitHub & Kéo về VPS:** Hướng dẫn cập nhật `.env` trên VPS và chạy lệnh kéo mã nguồn mới.
- [ ] **Kiểm thử toàn diện trên VPS thực tế:** Kiểm tra tính năng bóc tách lịch AI bằng key từ `.env` trên domain `lichcongtac.easupso.com`.
- [ ] **Tối ưu bộ lọc lịch tuần:** Kiểm tra đồng bộ dữ liệu giữa bản Desktop (`index.html`), Khách (`guest.html`) và Mobile (`mobile.html`).


---

## 🛠️ 5. LỆNH VẬN HÀNH NHANH (QUICK COMMANDS)

### Chạy kiểm thử Backend cục bộ:
```powershell
python server.py
# Truy cập giao diện tại: http://localhost:5000/
```

### Quản lý Docker trên VPS:
```bash
# Khởi động dịch vụ (chạy ngầm)
docker compose up -d

# Xem log các container
docker compose logs -f app nginx

# Khởi động lại sau khi pull mã nguồn mới
docker compose down && docker compose up -d --build
```

### Kiểm tra Git:
```powershell
git status
git log -n 3 --oneline
```
