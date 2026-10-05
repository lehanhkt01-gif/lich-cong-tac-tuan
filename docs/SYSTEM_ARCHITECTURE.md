# KIẾN TRÚC HỆ THỐNG & SƠ ĐỒ VẬN HÀNH (SYSTEM ARCHITECTURE)
> **Hệ thống Quản lý & Điều hành Lịch Công tác tuần - UBND Xã Ea Súp**  
> *Tài liệu tra cứu nhanh kiến trúc mã nguồn và luồng tương tác*

---

## 🏗️ 1. MÔ HÌNH KIẾN TRÚC TỔNG THỂ

```text
               +-------------------------------------------+
               | Trình duyệt người dùng (Web Browser)      |
               | - Desktop Admin (index.html)              |
               | - Tra cứu Khách (guest.html)              |
               | - Bản Di động (mobile.html)               |
               +---------------------+---------------------+
                                     |
                                     | HTTP / WebSocket
                                     v
               +-------------------------------------------+
               |  Nginx Reverse Proxy (Cổng 8090:80)       |
               |  - Định tuyến static files & proxy API    |
               |  - Bảo vệ rate-limit & SSL termination     |
               +---------------------+---------------------+
                                     |
                                     | Proxy pass -> Cổng 5000
                                     v
               +-------------------------------------------+
               |  Backend Server (Python - server.py)      |
               |  - Xử lý RESTful API                      |
               |  - Xác thực JWT Bearer & Phân quyền RBAC  |
               |  - Xuất văn bản Word theo NĐ 30/2020/NĐ-CP|
               +---------------------+---------------------+
                                     |
                                     | SQLAlchemy ORM
                                     v
               +-------------------------------------------+
               |  Cơ sở dữ liệu                            |
               |  - PostgreSQL 16 (Môi trường Production)  |
               |  - SQLite 3 (Môi trường Dev: data/app.db) |
               +-------------------------------------------+
```

---

## 📂 2. CẤU TRÚC THƯ MỤC DỰ ÁN

```text
Lich Cong tac tuan/
├── AGENTS.md                  # Quy tắc duy trì bối cảnh phiên làm việc tự động cho AI
├── SESSION_STATE.md           # Trạng thái tác nghiệp hiện hành (Active Context)
├── WORK_LOG.md                # Nhật ký tiến trình tác nghiệp theo thời gian
│
├── docs/                      # Tài liệu kỹ thuật dự án
│   ├── SYSTEM_ARCHITECTURE.md # Kiến trúc hệ thống và luồng dữ liệu
│   └── SECURITY_GUIDELINES.md # Quy chuẩn an toàn thông tin & bảo mật tác nghiệp
│
├── index.html                 # Giao diện Quản trị & Điều hành chính (Desktop)
├── guest.html                 # Giao diện dành cho người dân / cán bộ tra cứu
├── mobile.html                # Giao diện tối ưu hóa cho màn hình điện thoại
├── server.py                  # Máy chủ Backend Python (API + Quản trị dữ liệu)
│
├── css/                       # Hệ thống StyleSheet
│   └── style.css              # Design System chuẩn Chính phủ điện tử
│
├── js/                        # Các module xử lý logic phía Client
│   ├── app.js                 # Điều khiển chính giao diện Quản trị
│   ├── guest.js               # Điều khiển giao diện Tra cứu
│   ├── auth.js                # Phân hệ phân quyền người dùng (RBAC)
│   ├── storage.js             # Quản lý lưu trữ & Cache dữ liệu
│   ├── audit.js               # Động cơ Audit Trail & So sánh Diff đỏ/xanh
│   ├── email-service.js       # Phân hệ tự động gửi email thông báo
│   └── export-service.js      # Phân hệ xuất Word (.doc) & In lịch A4
│
├── data/                      # Thư mục dữ liệu (Được bảo vệ trong .gitignore)
│   ├── uploads/               # Tệp đính kèm giấy mời họp (PDF/Ảnh)
│   └── backups/               # Tệp sao lưu định kỳ (.json, .db)
│
├── Dockerfile                 # Khởi tạo container backend
├── docker-compose.yml         # Điều phối đa container (App + DB + Nginx)
├── nginx.conf                 # Cấu hình máy chủ web Nginx cổng 8090
├── requirements.txt           # Thư viện phụ thuộc Python
└── .env.example               # Mẫu cấu hình biến môi trường an toàn
```

---

## 🔐 3. CƠ CHẾ PHÂN QUYỀN & BẢO MẬT (RBAC)

1. **Viewer (Khách / Cán bộ tra cứu):**
   - Chỉ được xem lịch công tác tuần đã được xuất bản chính thức.
   - Tra cứu theo khối, theo ngày, xem và tải giấy mời đính kèm.
   - Không thể chỉnh sửa, không thấy các nút hành động điều hành.
2. **Editor (Chuyên viên văn phòng / Cán bộ phụ trách lịch):**
   - Đăng nhập xác thực bằng tài khoản chuyên trách.
   - Tạo mới, cập nhật, điều chỉnh lịch họp các khối.
   - Tải lên giấy mời PDF/Ảnh.
3. **Super Admin (Lãnh đạo Văn phòng / Quản trị viên tối cao):**
   - Phê duyệt xuất bản lịch tuần.
   - Quản trị danh bạ cán bộ, sao lưu và khôi phục CSDL.
   - Giám sát nhật ký Audit Trail (truy vết lịch sử ai sửa gì, lúc nào).
