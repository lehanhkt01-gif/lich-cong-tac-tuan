---
description: Quy tắc duy trì bối cảnh và bảo mật phiên tác nghiệp khi khởi động lại
globs: *
---

# QUY TẮC DUY TRÌ BỐI CẢNH VÀ BẢO MẬT PHIÊN LÀM VIỆC

Khi bắt đầu bất kỳ phiên làm việc mới nào hoặc khi nhận yêu cầu tiếp tục công việc:

1. **Khôi phục bối cảnh ngay lập tức:**
   - Đọc tệp `SESSION_STATE.md` tại thư mục gốc của dự án.
   - Nắm rõ: Mục tiêu hiện tại, các cổng dịch vụ đang cấu hình (Nginx: 8090, App: 5000), các việc vừa hoàn thành và các việc đang dở dang (Pending Backlog).
   - Đọc thêm `WORK_LOG.md` nếu cần tra cứu lịch sử chi tiết các phiên trước.

2. **Cập nhật sau mỗi phiên:**
   - Sau khi hoàn thành một tính năng, fix lỗi hoặc trước khi kết thúc ca làm việc, cập nhật lại trạng thái trong `SESSION_STATE.md` và bổ sung mốc thời gian vào `WORK_LOG.md`.

3. **Bảo mật tuyệt đối (Security First):**
   - Tuân thủ quy chuẩn tại `docs/SECURITY_GUIDELINES.md`.
   - Tuyệt đối không ghi mật khẩu thật, JWT Secret, Token xác thực hay connection string nhạy cảm vào bất kỳ file markdown nào.
   - Luôn mask dữ liệu bí mật bằng placeholder như `***` hoặc `[MASKED]`.
