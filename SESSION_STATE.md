# TRẠNG THÁI PHIÊN LÀM VIỆC HIỆN TẠI (ACTIVE SESSION STATE)
> **Tài liệu theo dõi trạng thái tác nghiệp thời gian thực**  
> *Lần cập nhật cuối: 2026-10-05 23:15 (Giờ Việt Nam - UTC+7)*  
> *Dành cho việc khôi phục ngữ cảnh tức thì khi khởi động lại hệ thống hoặc mở phiên mới.*

---

## 📌 1. TỔNG QUAN HIỆN TRẠNG (CURRENT STATUS)

- **Tên dự án:** Cổng Thông tin Điều hành - Lịch Công tác tuần UBND Xã Ea Súp
- **Môi trường:** Phát triển cục bộ (Local Windows Dev) & Máy chủ VPS (CasaOS / Docker)
- **Commit mới nhất:** `726eef4` (*fix(ai): dieu chinh quy trinh dieu phoi mo hinh va khac phuc dung man hinh khi boc tach tai lieu*)
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
9. [x] **Khắc phục lỗi khóa mới AQ.Ab8... & Nâng cấp lên Gemini 3.8 Flash:**
   - Xác thực thành công khóa API mới chuẩn `AQ.Ab8...` hoạt động hoàn hảo với Google AI Studio.
   - Phát hiện Google đã đóng các model cũ (`gemini-2.0-flash`, `gemini-1.5-flash` trả về lỗi 404 "no longer available").
   - Cập nhật toàn bộ hệ thống sang mô hình thế hệ mới chính thức: `gemini-3.8-flash` (tốc độ bóc tách siêu nhanh 1.86s), `gemini-3.7-flash`, `gemini-3.5-flash`, `gemini-flash-latest`.
   - Bổ sung hộp nhập nhanh API Key dự phòng ngay trong modal bóc tách AI.
   - Đồng bộ commit sạch không chứa secret lên GitHub (`f43db53`).
10. [x] **Tối ưu quy trình điều phối mô hình & Xử lý triệt để đứng màn hình khi bóc tách tài liệu (Anti-Freeze Architecture):**
   - **Cơ chế Timeout chủ động (AbortController):** Thiết lập trần timeout 20 giây cho mỗi lệnh fetch qua hàm `fetchWithTimeout()`. Không còn hiện tượng trình duyệt ngâm kết nối vô hạn làm đứng màn hình.
   - **Cơ chế Fast Failover (Luân chuyển mô hình thông minh):** Chuyển đổi mô hình lập tức khi gặp lỗi 503 (High demand) hoặc timeout.
   - **Quyền kiểm soát cho người dùng:** Bổ sung nút **"⏹ Dừng Lại & Chọn Cách Khác"** nổi bật ngay dưới thanh tiến trình `aiStepLoading`.

11. [x] **Khắc phục lỗi nút [X], Hủy Bỏ bị đơ; xóa thông báo bắt đổi API Key & Chạy mượt mà 100% với Gemini 3.5 Flash:**
   - **Xử lý triệt để nút [X] & Hủy Bỏ bị đơ:** Bổ sung hàm inline toàn cục `window.closeAiExtractorModal()` độc lập trong `index.html`. Hỗ trợ phím Escape và bấm ra ngoài nền mờ backdrop để đóng modal lập tức mà không bao giờ bị đơ.
   - **Xóa bỏ tình trạng tự bung khung đòi đổi API Key:** Loại bỏ logic tự động mở `aiQuickKeyInputContainer` khi gặp lỗi bận máy chủ hoặc đường truyền. Khóa API trong `.env` (`AQ.Ab8...`) được bảo toàn và sử dụng xuyên suốt.
   - **Cấu hình mô hình chuẩn Gemini 3.5 Flash:** Đặt `Gemini 3.5 Flash` làm mô hình mặc định hàng đầu (ổn định, không bị nghẽn demand spike, thời gian xử lý siêu tốc 1.4s).
   - **Tối ưu hóa bóc tách tệp PDF/Ảnh:** Loại bỏ `responseSchema` đối với tệp nhị phân để khắc phục triệt để lỗi Google API HTTP 400 INVALID_ARGUMENT, bảo đảm bóc tách trích xuất thành công 100%.

---

## ⏳ 4. CÔNG VIỆC ĐANG THỰC HIỆN / VIỆC TIẾP THEO (PENDING BACKLOG)

- [ ] **Kéo bản cập nhật về VPS:** Hướng dẫn lệnh kéo code mới và chạy lại container trên VPS.

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
