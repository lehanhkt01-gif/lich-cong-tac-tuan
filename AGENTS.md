# QUY TẮC TÁC NGHIỆP & DUY TRÌ BỐI CẢNH PHIÊN LÀM VIỆC (SESSION PERSISTENCE RULE)

> **Dành cho Trợ lý AI (Antigravity) & Các Kỹ sư tham gia phát triển dự án.**
> Hệ thống: Cổng Thông tin Điều hành - Lịch Công tác tuần UBND Xã Ea Súp

---

## 1. NGUYÊN TẮC KHỞI ĐỘNG PHIÊN MỚI (COLD START PROTOCOL)
Mỗi khi khởi động lại IDE, mở phiên chat mới hoặc chuyển giao ca làm việc:
1. **BẮT BUỘC ĐỌC ĐẦU TIÊN**: Mở và đọc nội dung tệp [SESSION_STATE.md](file:///d:/1.%20VPS%20Maydell/4.%20Antigravity/Lich%20Cong%20tac%20tuan/SESSION_STATE.md).
2. **NẮM BẮT NGAY**:
   - Trạng thái hiện tại của hệ thống (dịch vụ, cổng kết nối, môi trường đang chạy).
   - Công việc đang làm dở (In-Progress) và việc cần làm tiếp theo (Pending Tasks).
   - Các cảnh báo kỹ thuật hoặc lỗi đặc thù đã ghi nhận.
3. **KHÔNG CẦN HỎI LẠI NGƯỜI DÙNG**: Nếu người dùng yêu cầu tiếp tục công việc, kiểm tra ngay mục **"Công việc tiếp theo"** trong `SESSION_STATE.md` để triển khai tiếp liền mạch.

---

## 2. NGUYÊN TẮC KẾT THÚC / BÀN GIAO PHIÊN (SESSION HANDOFF PROTOCOL)
Trước khi kết thúc phiên hoặc sau khi hoàn thành một mốc công việc quan trọng:
1. **Cập nhật [SESSION_STATE.md](file:///d:/1.%20VPS%20Maydell/4.%20Antigravity/Lich%20Cong%20tac%20tuan/SESSION_STATE.md)**:
   - Đánh dấu công việc đã xong.
   - Cập nhật mục tiêu và các bước tiếp theo rõ ràng.
   - Ghi lại các thay đổi về file, cấu hình cổng hoặc kiến trúc.
2. **Ghi nhật ký vào [WORK_LOG.md](file:///d:/1.%20VPS%20Maydell/4.%20Antigravity/Lich%20Cong%20tac%20tuan/WORK_LOG.md)**:
   - Ghi lại mốc thời gian, người thực hiện / phiên làm việc.
   - Mô tả ngắn gọn thay đổi, lý do thực hiện và kết quả kiểm thử.

---

## 3. NGUYÊN TẮC BẢO MẬT BẮT BUỘC (SECURITY FIRST)
Tuân thủ nghiêm ngặt [SECURITY_GUIDELINES.md](file:///d:/1.%20VPS%20Maydell/4.%20Antigravity/Lich%20Cong%20tac%20tuan/docs/SECURITY_GUIDELINES.md):
- ❌ **TUYỆT ĐỐI KHÔNG** ghi mật khẩu thật, chuỗi kết nối chứa mật khẩu, JWT Secret, Token xác thực vào bất kỳ tệp tài liệu hay file log nào (`SESSION_STATE.md`, `WORK_LOG.md`, v.v.).
- 🛡️ **LUÔN MASK DỮ LIỆU NHẠY CẢM**: Sử dụng placeholder như `***`, `your_secret_here`, hoặc `Bearer [MASKED]`.
- 📁 **QUẢN LÝ TỆP BÍ MẬT**: Mọi thông số nhạy cảm chỉ được lưu trong `.env` (đã nằm trong `.gitignore`). Không bao giờ commit file `.env` hoặc file database `*.db` lên Git.
