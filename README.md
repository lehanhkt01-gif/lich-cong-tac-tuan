# CỔNG THÔNG TIN ĐIỀU HÀNH - QUẢN LÝ LỊCH CÔNG TÁC TUẦN
**Đơn vị:** ỦY BAN NHÂN DÂN XÃ EA SÚP, TỈNH ĐẮK LẮK

---

## 🌟 Giới Thiệu Chung

Ứng dụng web/portal nội bộ cao cấp phục vụ số hóa toàn diện quy trình lập, phê duyệt, ban hành, lưu trữ và tự động thông báo lịch công tác tuần của tất cả các khối trong hệ thống chính trị xã Ea Súp:
- **Đảng ủy xã**
- **Thường trực Đảng ủy - HĐND - UBND xã**
- **Hội đồng nhân dân (HĐND) xã**
- **Ủy ban nhân dân (UBND) xã**
- **Ủy ban MTTQ Việt Nam và các đoàn thể chính trị - xã hội**

Hệ thống hoạt động hoàn toàn độc lập, không yêu cầu cài đặt Node.js hay máy chủ phức tạp. Chỉ cần mở trực tiếp tệp `index.html` trên bất kỳ trình duyệt web hiện đại nào (Chrome, Edge, Firefox, Cốc Cốc, Safari).

---

## 🚀 Hướng Dẫn Sử Dụng Nhanh

Hệ thống cung cấp 02 chế độ truy cập:

1. 🌐 **Chế độ Khách (Chưa đăng nhập / Guest Mode):**
   - Chỉ cho phép xem lịch công tác tuần, tra cứu theo khối/từ khóa, xem chi tiết, xem và tải giấy mời họp, xuất file Word và in ấn.
   - Tự động ẩn toàn bộ các quyền điều hành: Lập lịch mới, Cài đặt hệ thống, Gửi email thông báo, Cập nhật & Xuất bản hay các nút sửa/xóa.

2. 🔐 **Chế độ Quản trị & Điều hành (Đã đăng nhập):**
   - Giới hạn bảo mật chỉ **06 tài khoản được ủy quyền** của Thường trực HĐND - UBND, Đảng ủy và MTTQ:
     1. **Hà Tường Vi** (Chánh VP HĐND & UBND) – Tên đăng nhập: `vyhatuong` | Mật khẩu: `12345678@` (Super Admin)
     2. **Trần Minh Hải** (Phó CVP HĐND & UBND) – Tên đăng nhập: `haitranminh` | Mật khẩu: `12345678@` (Super Admin)
     3. **Trần Văn Linh** (Chánh VP Đảng ủy) – Tên đăng nhập: `linhtranvan` | Mật khẩu: `12345678@` (Super Admin)
     4. **Nguyễn Thị Lan** (Phó VP Đảng ủy) – Tên đăng nhập: `lannguyenthi` | Mật khẩu: `12345678@` (Editor)
     5. **Lê Hồng Hạnh** (Chủ tịch UB MTTQ) – Tên đăng nhập: `hanhlehong` | Mật khẩu: `12345678@` (Super Admin)
     6. **Hà Văn Chiến** (Văn phòng MTTQ) – Tên đăng nhập: `chienhavan` | Mật khẩu: `12345678@` (Editor)
   - Đầy đủ tính năng: Lập lịch tuần mới, sửa/xóa mục công tác, tải lên giấy mời, duyệt xuất bản, gửi email thông báo, kiểm tra vết sửa Diff đỏ/xanh, quản lý danh bạ và sao lưu dữ liệu.
   - Tích hợp tính năng **Đăng nhập nhanh 1-chạm (Quick Login)** cho 6 tài khoản trên tại cửa sổ Đăng Nhập.

---

## 💎 Các Tính Năng Nổi Bật

### 1. Bảng Hiển Thị Lịch Tuần & Bộ Lọc Nhanh (Table View)
- Phân nhóm trực quan từ **Thứ Hai đến Chủ Nhật**, hiển thị ngày tháng dương lịch tương ứng.
- Phân màu huy hiệu đặc thù theo từng Khối (Đảng ủy - Đỏ thẫm, HĐND - Vàng cam, UBND - Xanh dương, MTTQ - Tím, Khác - Xanh lá).
- Lọc theo **Năm (2026, 2025...)**, **Tuần (Tuần 35, 34, 33...)**, điều hướng tuần trước/sau.
- Tìm kiếm từ khóa tức thì theo nội dung, lãnh đạo chủ trì, địa điểm phòng họp, thành phần tham dự.

### 2. Kiểm Soát Thay Đổi & So Sánh Diff (Audit Trail)
- Nút **"📜 XEM LỊCH SỬ SỬA"** mở bảng truy vết chi tiết từng phiên chỉnh sửa.
- Tự động so sánh dữ liệu:
  - 🔴 **Dữ liệu cũ:** Gạch ngang và tô màu đỏ nhạt (`line-through`).
  - 🟢 **Dữ liệu mới:** In đậm và tô màu xanh lá (`bold, green`).
- Ghi nhận đầy đủ thông tin: Người sửa, Dấu thời gian (Timestamp), Lý do điều chỉnh.

### 3. Quản Lý Giấy Mời & Trình Xem Tài Liệu (Document Viewer)
- Tích hợp tính năng tải lên tệp PDF hoặc hình ảnh giấy mời trực tiếp tại từng mục lịch.
- Nhấp vào biểu tượng **`📄 GM...`** để mở ngay cửa sổ xem trước Giấy mời định dạng chuẩn thể thức Nhà nước mà không cần rời portal.

### 4. Tự Động Hóa Thông Báo Email (Email Dispatcher)
- Nút **"✉️ GỬI EMAIL THÔNG BÁO"** tự động phát hiện các nội dung mới/thay đổi.
- Sinh mẫu email hành chính chuyên nghiệp gửi đến danh sách hòm thư công vụ (`@easup.daklak.gov.vn`) của cán bộ.
- Cho phép chọn/bỏ chọn người nhận, thêm ghi chú chỉ đạo và xem trước toàn bộ giao diện thư trước khi gửi.

### 5. Lập Lịch Mới & Sao Chép Tuần Cũ
- Nút **"+ TẠO MỚI LỊCH TUẦN"** hỗ trợ tùy chọn **"Sao chép từ tuần trước"** giúp tự động sao chép các cuộc họp cố định (Chào cờ đầu tuần, Giao ban Thường trực, Tiếp công dân...).

### 6. Xuất Bản Chuẩn Thể Thức Hành Chính (Nghị Định 30/2020/NĐ-CP)
- **"📥 XUẤT WORD (.DOC)":** Tải ngay tệp Microsoft Word chuẩn thể thức văn bản hành chính Việt Nam (Quốc hiệu, Tiêu ngữ, Tên cơ quan, Lịch biểu, Nơi nhận, Chữ ký Chánh Văn phòng).
- **"🖨️ IN LỊCH TUẦN / PDF":** Định dạng in ấn khổ A4 ngang sắc nét, tự động ẩn các nút thao tác khi in hoặc lưu PDF.

### 7. Sao Lưu Dữ Liệu An Toàn
- Hỗ trợ xuất và nhập toàn bộ CSDL ra tệp **JSON Backup** trong tab **Cài Đặt Hệ Thống**.
- Hỗ trợ đặt lại dữ liệu mẫu ban đầu bất kỳ lúc nào.

---

## 📁 Cấu Trúc Mã Nguồn

```text
Lich Cong tac tuan/
│
├── index.html            # Giao diện Quản trị & Điều hành nội bộ
├── guest.html            # Giao diện dành riêng cho Khách & Cán bộ tra cứu
├── README.md             # Tài liệu hướng dẫn sử dụng
│
├── assets/
│   └── logo-easup.png    # Logo chính thức của Xã Ea Súp
│
├── css/
│   └── style.css         # Hệ thống CSS Design System chuyên nghiệp (Chính phủ điện tử)
│
└── js/
    ├── data.js           # Bộ dữ liệu khởi tạo mẫu năm 2026 của UBND Xã Ea Súp
    ├── storage.js        # Tầng lưu trữ dữ liệu (LocalStorage & State Engine)
    ├── auth.js           # Phân hệ phân quyền RBAC (Super Admin, Editor, Viewer)
    ├── audit.js          # Động cơ Audit Trail và so sánh Diff trực quan đỏ/xanh
    ├── email-service.js  # Phân hệ tạo mẫu email và gửi thông báo tự động
    ├── export-service.js # Động cơ xuất Word (.doc) và in ấn chuẩn NĐ 30/2020/NĐ-CP
    ├── guest.js          # Bộ điều khiển dành cho giao diện Khách tra cứu
    └── app.js            # Bộ điều khiển chính cho giao diện Quản trị
```

---
*Bản quyền © 2026 - Ủy ban nhân dân Xã Ea Súp, Tỉnh Đắk Lắk.*
