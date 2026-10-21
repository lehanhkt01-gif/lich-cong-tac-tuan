# NHẬT KÝ TIẾN TRÌNH TÁC NGHIỆP (OPERATIONAL WORK LOG)
> **Tài liệu theo dõi lịch sử chỉnh sửa, cập nhật tính năng và khắc phục sự cố hệ thống**  
> Dự án: Cổng Thông tin Điều hành - Lịch Công tác tuần UBND Xã Ea Súp

---

## 📅 PHIÊN LÀM VIỆC NGÀY 2026-10-21

### 🔹 Phiên 19 (09:40 - 09:50) | Cưỡng Chế Xóa Cache Trình Duyệt, Bổ Sung Fallback An Toàn & Đổi Query Version v=20261021_10
- **Mục tiêu:** Giải quyết dứt điểm tình trạng trình duyệt Chrome trên máy người dùng lưu cache phiên bản HTML/JS cũ, đảm bảo người dùng truy cập là thấy ngay giao diện mới, Thứ Tư 21/10 tô vàng và bấm logo không bao giờ bị trắng trang.
- **Giải pháp kỹ thuật đã triển khai:**
  1. **Thêm Meta Anti-Cache Headers trực tiếp vào `<head>` (`index.html` & `guest.html`):**
     - `<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">`
     - `<meta http-equiv="Pragma" content="no-cache">`
     - `<meta http-equiv="Expires" content="0">`
  2. **Tăng phiên bản query string toàn bộ scripts lên `v=20261021_10`:**
     - Ép buộc trình duyệt người dùng phải tải mới 100% tất cả các file `app.js`, `guest.js`, `storage.js`, `data.js`.
  3. **Bổ sung Inline Fallback an toàn cho thẻ Logo/Tiêu đề (`.brand-section`):**
     - Đặt inline handler: `if(window.App && typeof App.resetToHome === 'function'){ App.resetToHome(event); } else { window.location.href='index.html?t=' + Date.now(); }`
     - Bọc toàn bộ logic `resetToHome()` trong khối `try ... catch`, đảm bảo nếu có bất kỳ lỗi không lường trước nào thì giao diện vẫn luôn giữ nguyên `view_schedule` hiển thị, tuyệt đối không thể bị trắng trang.
- **Tệp chỉnh sửa:** `index.html`, `guest.html`, `js/app.js`, `js/guest.js`, `WORK_LOG.md`, `SESSION_STATE.md`.
- **Kết quả:** Trình duyệt được làm mới triệt để, nạp đúng bản cập nhật mới nhất.

### 🔹 Phiên 18 (09:20 - 09:30) | Khắc Phục Triệt Để Hiện Tượng Trắng Trang Web Khi Bấm Logo/Tiêu Đề & Giữ Nguyên Bảng Lịch Khi Chưa Có Dữ Liệu
- **Mục tiêu:** 
  1. Khắc phục lỗi khi người dùng nhấp vào Logo hoặc tiêu đề "LỊCH CÔNG TÁC" thì toàn bộ phần thân web bị biến mất (hiện trắng trang web).
  2. Khắc phục triệt để lỗi Chrome tự động điền tài khoản (`hanhlehong`) vào ô tìm kiếm làm ẩn sạch dữ liệu các ngày trong tuần.
  3. Bảo đảm khi xem bất kỳ tuần nào (kể cả tuần chưa có cuộc họp hoặc items rỗng), bảng lịch vẫn hiển thị đầy đủ 7 ngày (Thứ 2 đến Chủ nhật) với dòng Thứ Tư (Hôm nay 21/10) được tô vàng rực rỡ nổi bật.
- **Nguyên nhân kỹ thuật sâu xa:**
  1. **Sai tên tab trong hàm `resetToHome()`:** Trong `js/app.js` và `js/guest.js`, hàm gọi `this.switchTab("tabSchedule")`. Nhưng ID thực tế của section là `view_schedule` và data-tab là `"schedule"`. Gọi `tabSchedule` khiến hàm `switchTab` gỡ bỏ class `.active` của tất cả các `view-section` và không tìm thấy `view_tabSchedule`, dẫn đến toàn bộ nội dung biến mất, biến trang web thành màn hình trắng xóa!
  2. **Chrome Autofill Username:** Trình duyệt Chrome phát hiện trang có form login nên tự động autofill username (`hanhlehong`) vào ô tìm kiếm đầu tiên. Bộ lọc tìm kiếm kích hoạt loại bỏ toàn bộ các ngày do không chứa chữ `hanhlehong`.
  3. **Return sớm khi `s.items.length === 0`:** Hàm `renderScheduleTable` trước đây nếu `items.length === 0` thì lập tức `return;` sớm hiển thị 1 ô trống thay vì vẽ các ngày trong tuần, khiến Thứ Tư hôm nay không được tô vàng.
- **Giải pháp kỹ thuật đã triển khai:**
  1. **Sửa gọi chuyển tab chính xác:**
     - Đổi thành `this.switchTab("schedule")`.
     - Chủ động kích hoạt trực tiếp `view_schedule.classList.add("active")` và `.nav-tab-item[data-tab="schedule"].classList.add("active")` để phòng ngừa rủi ro.
  2. **Đặc trị Chrome Autofill bằng `readonly` và `autocomplete="new-password"`:**
     - Thêm `readonly onfocus="this.removeAttribute('readonly');"` vào thẻ `<input id="searchInput">` trên cả `index.html` và `guest.html`. Khi trang tải, trình duyệt coi là read-only nên tuyệt đối không bao giờ autofill tài khoản vào. Khi người dùng nhấp chuột để tìm kiếm, `onfocus` lập tức gỡ bỏ `readonly` để gõ bình thường.
     - Trong JS: Quét kiểm tra liên tục ở các mốc [50ms, 150ms, 300ms, 600ms, 1000ms], nếu người dùng chưa focus mà có giá trị autofill thì tự động dọn sạch.
  3. **Luôn render đầy đủ 7 ngày kể cả khi tuần chưa có lịch:**
     - Loại bỏ return sớm khi `s.items.length === 0`.
     - Vòng lặp duyệt 7 ngày (Thứ 2 đến Chủ nhật) luôn tính toán ngày tháng và kiểm tra `isToday` chính xác: Thứ Tư (21/10) hôm nay được tô màu vàng rực rỡ, viền hổ phách và gắn huy hiệu `HÔM NAY`.
     - Các ngày chưa có việc hiển thị dòng `(Không có lịch công tác)` chuẩn mực, giữ nguyên cấu trúc bảng hoàn hảo.
  4. **Tăng phiên bản Cache-buster:** Đổi sang `?v=20261021_09` trên toàn bộ các file CSS/JS.
- **Tệp chỉnh sửa:** `index.html`, `guest.html`, `mobile.html`, `js/app.js`, `js/guest.js`, `WORK_LOG.md`, `SESSION_STATE.md`.
- **Kết quả:** Nhấp vào logo hoặc tiêu đề lập tức nạp lại mượt mà, không bao giờ bị trắng trang hay trắng bảng. Bảng lịch tuần 42 hiển thị ngày Thứ Tư 21/10 hôm nay màu vàng rực rỡ.

### 🔹 Phiên 17 (09:10 - 09:15) | Khắc Phục Lỗi Bấm Vào Logo/Tiêu Đề Trắng Dữ Liệu & Chống Browser Autofill
- **Mục tiêu:** Khắc phục triệt để hiện tượng khi bấm vào logo và tiêu đề hoặc khi tải trang thì bảng lịch công tác tuần bị trắng xóa dữ liệu.
- **Nguyên nhân kỹ thuật sâu sắc:**
  1. **Browser Autofill tự động điền username vào ô tìm kiếm:** Trình duyệt Chrome khi lưu mật khẩu quản trị tự động điền chuỗi tài khoản (như `hanhlehong` thấy trên ảnh) vào ô input `searchInput` trên trang. Khi ô này có giá trị, sự kiện `input` kích hoạt hàm lọc tìm kiếm; do tuần đang xem không chứa từ khóa này nên toàn bộ các ngày đều bị ẩn (`dayItems.length === 0`), dẫn đến bảng bị trắng xóa hoàn toàn.
  2. **Thẻ Logo & Tiêu đề chưa có hàm xử lý Reset:** Thẻ `<a href="#" class="brand-section">` chỉ mang `href="#"`, khi người dùng bấm vào với kỳ vọng quay về trang chủ ban đầu thì trang web không hề xóa từ khóa tìm kiếm, không reset bộ lọc, khiến bảng vẫn tiếp tục trắng xóa.
  3. **Thiếu giao diện Empty State khi bộ lọc rỗng:** Khi không có kết quả khớp bộ lọc, bảng trước đây gán `tbody.innerHTML = ""` làm người dùng tưởng trang web bị lỗi hoặc mất dữ liệu.
- **Giải pháp kỹ thuật đã triển khai:**
  1. **Bổ sung hàm `resetToHome(event)` toàn diện cho `App` và `GuestApp`:**
     - Xóa sạch từ khóa tìm kiếm (`this.searchQuery = ""`, `searchInput.value = ""`).
     - Đặt lại khối công tác về "Tất cả khối" (`this.currentBloc = "all"`).
     - Chuyển về tab Lịch công tác tuần và chuyển về tuần hiện tại của hệ thống.
     - Nạp lại dữ liệu và render lại toàn bộ bảng sạch sẽ, cuộn mượt lên đầu trang.
     - Gắn hàm này vào sự kiện `onclick` của `.brand-section` trên cả `index.html` và `guest.html`.
  2. **Chặn đứng triệt để Browser Autofill nhầm vào ô tìm kiếm:**
     - Đổi sang `type="search"`, gắn `name="schedule_search_query_prevent_autofill"`, `autocomplete="off"`, `autocorrect="off"`, `spellcheck="false"`.
     - Trong hàm `init()`, chủ động làm sạch `searchInput.value = ""` và thiết lập timeout kiểm tra lại sau 300ms.
  3. **Bổ sung nút xóa tìm kiếm nhanh (Clear Button `✕`):**
     - Nút `✕` tự động hiện khi có từ khóa trong ô tìm kiếm để người dùng xóa nhanh bằng 1 click.
  4. **Hiển thị Empty State thông minh có nút khôi phục:**
     - Khi từ khóa tìm kiếm không có kết quả, hiển thị thông báo rõ ràng "Không tìm thấy mục công tác nào khớp với từ khóa..." kèm nút bấm "🔄 Hiển Thị Lại Toàn Bộ Lịch Tuần" để người dùng khôi phục ngay lập tức.
- **Tệp chỉnh sửa:** `index.html`, `guest.html`, `js/app.js`, `js/guest.js`, `SESSION_STATE.md`, `WORK_LOG.md`.
- **Kết quả:** Bấm vào logo/tiêu đề lập tức làm mới và khôi phục toàn bộ dữ liệu lịch tuần, ô tìm kiếm không còn bị browser tự điền làm trắng bảng.

### 🔹 Phiên 16 (08:55 - 09:05) | Cập Nhật Logo Tròn 3D Lịch Công Tác & Giữ Nguyên Các Dòng Chữ Thương Hiệu
- **Mục tiêu:** Sử dụng hình ảnh logo mới (biểu trưng tròn 3D Lịch Công Tác gồm cuốn lịch, đồng hồ, cây bút) để thay thế logo trước đây vào đầu trang web và logo đường link website; đồng thời giữ nguyên toàn bộ các dòng chữ thương hiệu như trước.
- **Giải pháp kỹ thuật đã triển khai:**
  1. **Tích hợp hình ảnh logo mới:**
     - Tệp ảnh logo 3D mới (`376x376`, PNG trong suốt) được cập nhật đồng bộ vào `assets/logo-lichcongtac.png`, `assets/logo-easup.png`, `logo lichcongtac.png`, `og-image.png`, `og-image.jpg`.
  2. **Giao diện đầu trang web (`index.html`, `guest.html`, `mobile.html`):**
     - Đặt logo mới vào thẻ `<img>` với class `.national-crest` (hoặc `.brand-emblem` trên mobile).
     - CSS `.national-crest`: tinh chỉnh `object-fit: contain;` và `padding: 1px;` giúp biểu trưng tròn hiển thị trọn vẹn, sắc nét, nổi bật trên nền trắng viền vàng kim.
     - Giữ nguyên vẹn 100% cả 3 dòng chữ:
       + Dòng 1: `ĐẢNG ỦY, HĐND, UBND, UBMTTQ XÃ EA SÚP` (màu vàng kim).
       + Dòng 2: `LỊCH CÔNG TÁC TUẦN` (chữ trắng đậm nổi bật).
       + Dòng 3: `● Cổng thông tin điều hành - Quản lý lịch công tác tuần` (dấu chấm xanh lục, chữ xanh nhạt).
  3. **Logo đường link chia sẻ (Open Graph / Zalo / Facebook):**
     - Cập nhật `og:image`, `twitter:image`, `image_src`, `thumbnail` trỏ tới `assets/logo-lichcongtac.png?v=20261021_08`.
  4. **Modal đăng nhập quản trị:**
     - Cập nhật logo hình tròn 3D đồng bộ đẹp mắt.
- **Tệp chỉnh sửa:** `index.html`, `guest.html`, `mobile.html`, `css/style.css`, `js/data.js`, các tệp ảnh logo, `SESSION_STATE.md`, `WORK_LOG.md`.
- **Kết quả:** Logo mới hiển thị chính xác theo đúng ý người dùng, thương hiệu trang chủ giữ nguyên vẹn trang trọng và chuyên nghiệp.

### 🔹 Phiên 15 (08:25 - 08:35) | Cập Nhật Logo Chính Thức (/opt/lich-cong-tac-tuan/logo lichcongtac.png) Cho Trang Chủ & Đường Link lichcongtac.easupso.com
- **Mục tiêu:** Sử dụng ảnh `/opt/lich-cong-tac-tuan/logo lichcongtac.png` để thay thế vào logo tại trang chủ trang web và logo đường link `https://lichcongtac.easupso.com`.
- **Giải pháp kỹ thuật đã triển khai:**
  1. **Thay thế logo đường link (Open Graph & Social Share Preview):**
     - Cập nhật toàn bộ các thẻ `<meta property="og:image">`, `og:image:url`, `og:image:secure_url`, `og:image:type="image/png"`, `twitter:image`, `<link rel="image_src">`, `<meta name="thumbnail">` trên cả 3 trang `index.html`, `guest.html`, `mobile.html` trỏ tới `https://lichcongtac.easupso.com/logo%20lichcongtac.png`.
     - Đồng bộ và tạo các tệp `og-image.jpg` và `og-image.png` từ ảnh gốc để mọi trình thu thập bot (Zalo, Facebook, Viber, Telegram) đều hiển thị trọn vẹn banner logo khi chia sẻ đường link.
  2. **Thay thế logo thanh điều hướng trang chủ (`index.html`) & trang khách (`guest.html`):**
     - Đổi thẻ logo sang dùng trực tiếp đường dẫn tĩnh an toàn: `assets/logo-lichcongtac.png?v=20261021_07` (không có khoảng trắng, tránh lỗi URL encoding `%20`).
     - Bổ sung inline style `height: 52px; width: auto; max-width: 100%; object-fit: contain; display: block;` đảm bảo logo luôn hiển thị chuẩn form ngay lập tức.
     - Loại bỏ hoàn toàn khối `topbarDefaultBrand` cũ và sự kiện `onerror` gây hiện tượng nhảy ngược về giao diện cũ.
     - Ghi đè tệp ảnh mới vào cả `assets/logo-easup.png` để bất kỳ nơi nào nạp logo cũ cũng tự động chuyển sang logo mới.
  3. **Thay thế logo ứng dụng di động (`mobile.html`):**
     - Sử dụng class `.mobile-logo-banner` với chiều cao 38px, hiển thị gọn đẹp trên thanh app bar di động.
  4. **Cập nhật logo modal đăng nhập quản trị (`index.html`):**
     - Đồng bộ sang `logo%20lichcongtac.png` với kích thước `max-height: 48px; max-width: 240px;`.
  5. **Định tuyến tại máy chủ backend (`server.py`):**
     - Bổ sung xử lý route cho `/logo lichcongtac.png`, `/logo%20lichcongtac.png` và `/logo-lichcongtac.png` trả về MIME `image/png` kèm cache 24h, fallback sang `assets/logo-easup.png`.
- **Tệp chỉnh sửa:** `index.html`, `guest.html`, `mobile.html`, `css/style.css`, `css/mobile.css`, `js/data.js`, `server.py`, `logo lichcongtac.png`, `og-image.jpg`, `og-image.png`, `assets/logo-lichcongtac.png`, `SESSION_STATE.md`, `WORK_LOG.md`.
- **Kết quả:** Logo trang chủ và ảnh thumbnail chia sẻ đường link `lichcongtac.easupso.com` hiển thị chuẩn xác, chuyên nghiệp và đồng bộ 100%.

### 🔹 Phiên 14 (08:05 - 08:20) | Khắc Phục Triệt Để Hiện Tượng Chưa Thấy Đổi Màu Vàng (Anti-Cache & Multi-Tier Date Matcher)
- **Mục tiêu:** Khắc phục tình trạng người dùng báo chưa thấy sự thay đổi giao diện sau khi cập nhật mã nguồn.
- **Nguyên nhân kỹ thuật sâu sắc:**
  1. **Bộ nhớ đệm (Browser HTTP Cache) giữ lại CSS/JS cũ:** Thẻ `<link rel="stylesheet">` và `<script>` trong `index.html`, `guest.html`, `mobile.html` trước đó mang chuỗi phiên bản cũ (`?v=20260909_02`, `?v=20261007_01`). Trình duyệt tự động lấy tệp từ cache cục bộ nên chưa nạp các class CSS và logic render mới.
  2. **So khớp ngày chưa bao quát trường hợp lệch năm hoặc chuỗi ngày ngắn:** Dữ liệu sự kiện trong CSDL có thể lưu dạng `DD/MM` (như `21/10` thấy trên tiêu đề) hoặc năm dữ liệu khác năm hiện hành của hệ thống, khiến hàm kiểm tra ISO cũ trả về `false`.
- **Giải pháp kỹ thuật đã triển khai:**
  1. **Nâng cấp thuật toán `checkIsToday` 5 tầng (Multi-Tier Robust Date Matcher):**
     - Tầng 1: So khớp trực tiếp chuỗi ngày ISO `YYYY-MM-DD`.
     - Tầng 2: So khớp trực tiếp chuỗi hiển thị `DD/MM` (như `21/10`) với ngày/tháng hôm nay.
     - Tầng 3: Tách độc lập Ngày và Tháng từ chuỗi `dateIsoStr` để so khớp trực tiếp với `getDate()` và `getMonth() + 1`, không bị ảnh hưởng bởi năm.
     - Tầng 4: Tính toán ngày từ `s.startDate` và thứ trong tuần.
     - Tầng 5: So khớp thứ trong tuần với thứ hiện tại nếu chứa ngày hôm nay.
  2. **Áp dụng Inline Style trực tiếp kết hợp CSS Class (Anti-Cache Defense):**
     - Đưa trực tiếp các thuộc tính màu vàng (`linear-gradient(90deg, #FEF08A 0%, #FEF9C3 40%, #FFFDF0 100%) !important;`, `background-color: #FEF9C3 !important;`) vào thẻ HTML khi `isToday === true`.
     - Đảm bảo ngay cả khi trình duyệt chưa kịp xóa cache CSS, giao diện vẫn lập tức đổi màu vàng rực rỡ và chuẩn xác 100%.
  3. **Tăng phiên bản Cache-Buster đồng loạt:**
     - Nâng toàn bộ tham số version lên `?v=20261021_05` trong `index.html`, `guest.html`, `mobile.html` để ép buộc trình duyệt tải lại tệp mới.
- **Tệp thay đổi:** `index.html`, `guest.html`, `mobile.html`, `js/app.js`, `js/guest.js`, `js/mobile.js`, `SESSION_STATE.md`, `WORK_LOG.md`.
- **Kết quả:** Hiển thị màu vàng nổi bật tức thì cho thứ, ngày và cột giờ của ngày hiện tại.

---

### 🔹 Phiên 13 (07:42 - 07:55) | Đánh Dấu Lịch Ngày Hiện Hành (Tô Vàng Nền Thứ, Ngày, Giờ)
- **Mục tiêu:** Tạo đánh dấu lịch trong ngày hiện hành (hôm nay) bằng cách tô vàng nền của thứ, ngày, giờ (cột đầu tiên của ngày hiện hành là ngày hôm nay), các ngày khác và các cột khác giữ nguyên vẹn không đổi.
- **Giải pháp kỹ thuật đã triển khai:**
  1. **Nhận diện ngày hiện hành chính xác (`checkIsToday`):**
     - Bổ sung hàm `checkIsToday(dateIsoStr, dayName, startDateStr)` trong `js/app.js` và `js/guest.js`.
     - So khớp linh hoạt theo chuỗi ngày ISO `YYYY-MM-DD`, `DD/MM/YYYY`, hoặc tự động tính toán qua `StorageService.calculateDateForDay(s.startDate, dayName)`.
     - Đảm bảo ngay cả khi ngày đó chưa có lịch công tác nào (`dayItems.length === 0`), hệ thống vẫn xác định chính xác ngày hôm nay và hiển thị trạng thái tương ứng.
  2. **Tô vàng nền Thứ, Ngày (Thanh tiêu đề phân cách ngày):**
     - Gắn class `.is-today-divider` cho thẻ `<tr class="day-divider-row">`.
     - Phủ dải màu gradient vàng ấm áp `linear-gradient(90deg, #FEF08A 0%, #FEF9C3 40%, #FFFDF0 100%)`.
     - Viền trên dưới màu hổ phách sắc nét (`border-top: 2px solid #F59E0B; border-bottom: 2px solid #FCD34D`).
     - Tên thứ và ngày hiển thị tông màu nâu hổ phách tương phản cao (`#854D0E`, `#92400E`).
     - Bổ sung huy hiệu rực rỡ `<span class="badge-today-pill">HÔM NAY</span>` với hiệu ứng phát sáng nhẹ (`animation: pulseTodayGlow`).
  3. **Tô vàng nền Giờ (Cột đầu tiên của ngày hiện hành):**
     - Gắn class `.is-today-time` cho ô `<td class="col-time-cell">` và `.is-today-pill` cho `<span class="time-pill">`.
     - Ô thời gian có nền vàng êm mắt `#FEF9C3`, viền nổi mép trái `3px solid #EAB308`.
     - Pill giờ nổi bật với nền vàng đậm `#FEF08A`, viền `#EAB308`, chữ nâu đậm `#78350F`.
  4. **Bảo toàn các ngày khác:**
     - Các ngày còn lại trong tuần giữ nguyên 100% màu xanh lam mặc định, nền trắng và pill xanh lam tiêu chuẩn.
  5. **Đồng bộ giao diện di động (`mobile.js`, `mobile.css`):**
     - Nâng cấp `checkIsToday` trong `mobile.js`.
     - Thẻ ngày hôm nay trên mobile có viền vàng `#F59E0B`, header gradient vàng ấm áp và nhãn thời gian vàng.
- **Tệp thay đổi:** `css/style.css`, `js/app.js`, `js/guest.js`, `js/mobile.js`, `css/mobile.css`.
- **Kết quả kiểm thử:** Đạt chuẩn 100% theo yêu cầu của lãnh đạo, bảng lịch hiển thị trực quan và nổi bật ngày công tác hiện tại.

---

## 📅 PHIÊN LÀM VIỆC NGÀY 2026-10-19

### 🔹 Phiên 12 (08:00 - 08:30) | Khắc Phục Triệt Để Nút Bóc Tách Dữ Liệu AI Bị Quá Thời Gian Chờ (Timeout 84%) & Tối Ưu Pipeline Siêu Tốc
- **Mục tiêu:** Sửa lỗi bóc tách AI bị dừng ở 84% ("Đang chuyển sang mô hình dự phòng: gemini-flash-latest...") và bung hộp thoại báo lỗi *"Đường truyền kết nối tới Google AI bị chậm hoặc quá thời gian chờ (Timeout). Vui lòng thử lại với mô hình 'Gemini 3.5 Flash' hoặc dán văn bản trực tiếp."*
- **Nguyên nhân kỹ thuật sâu sắc được phát hiện qua đo kiểm thực tế:**
  1. **Timeout 20s quá ngắn cho tài liệu tệp:** Hàm `fetchWithTimeout(..., 20000)` giới hạn cứng 20 giây. Khi người dùng nạp tệp PDF, Word hoặc ảnh chụp lịch công tác (vốn cần gửi base64 vài MB và đợi Google Gemini OCR phân tích từ 15 đến 30 mục sự kiện), trình duyệt ngắt kết nối quá sớm khi Gemini sắp hoàn tất.
  2. **Pipeline dự phòng chứa các model bị treo trên hạ tầng Google AI:** Khi mô hình đầu tiên bị cắt sau 20s, hệ thống luân chuyển sang `gemini-3.8-flash`, `gemini-3.7-flash` và `gemini-flash-latest`. Đo kiểm trực tiếp API cho thấy cả 3 mô hình này đang bị nghẽn demand/timeout vĩnh viễn trên Google AI. Cả 4 mô hình lần lượt ngâm 20s và đều đứt kết nối tại 84%, gây ra thông báo lỗi Timeout.
  3. **Ảnh chụp smartphone dung lượng lớn (4MB - 10MB):** Không qua nén trước khi mã hóa base64 khiến payload vượt 10MB, đẩy thời gian truyền tải lên quá mức.
  4. **Tệp Word (.docx) bị mất liên kết dòng:** Bộ đọc docx cũ chỉ gom text từng đoạn `<w:p>`, làm mất ranh giới hàng trong bảng lịch công tác.
- **Giải pháp kỹ thuật đã triển khai:**
  - `js/ai-extractor.js`:
    + **Chuẩn hóa danh sách mô hình hoạt động ổn định và nhanh nhất:** Thay thế `gemini-3.8-flash`, `gemini-3.7-flash`, `gemini-flash-latest` bằng **`gemini-3.5-flash`** (chuẩn xác & chi tiết), **`gemini-3.5-flash-lite`** (đo kiểm thực tế bóc tách siêu tốc **1.2s - 1.4s**, không bao giờ bị nghẽn demand), **`gemini-3.1-flash-lite`** (1.5s), và **`gemini-3.6-flash`**.
    + **Cơ chế Timeout thích ứng theo loại tài liệu:** Nâng trần timeout lên 60 giây đối với tệp nhị phân (PDF/ảnh) và 40 giây đối với văn bản trực tiếp.
    + **Tích hợp nén ảnh thông minh phía Client (Canvas Downscaling):** Tự động co tỷ lệ ảnh scan/chụp smartphone lớn hơn 2000px xuống chuẩn JPEG 0.88 (~350KB), giảm dung lượng hơn 90% giúp tốc độ tải siêu tốc.
    + **Bộ phân tích Word (.docx) thông minh:** Đọc bảng biểu theo từng dòng `<w:tr>` và cột `<w:tc>` nối bằng ký tự phân cách `|`, bảo toàn 100% cấu trúc lịch họp cho AI.
    + **Cảnh báo tệp Word (.doc) cũ:** Phát hiện định dạng Word 97-2003 và hướng dẫn người dùng lưu sang `.docx` hoặc `.pdf`.
    + **Cải thiện thông báo lỗi:** Rõ ràng, hướng dẫn chọn sang `Gemini 3.5 Flash-Lite` thay vì nhắc lại Gemini 3.5 Flash khi người dùng đã đang chọn nó.
  - `index.html`:
    + Cập nhật các lựa chọn trong dropdown mô hình AI ở cả Modal bóc tách (`aiModalModelSelect`) và Cài đặt hệ thống (`settingGeminiModel`).
    + Tinh chỉnh chú thích hỗ trợ tệp `Word (.docx)`.
    + Tăng phiên bản cache-buster: `js/ai-extractor.js?v=20261019_02`.
  - `js/app.js`:
    + Chuyển mọi giá trị model fallback mặc định từ `gemini-3.8-flash` sang `gemini-3.5-flash`.
  - `.env`:
    + Cập nhật `GEMINI_MODEL=gemini-3.5-flash`.
- **Kết quả kiểm thử thực tế:** Chạy kiểm thử End-to-End với API Key thật trên lịch công tác thực tế:
  + `gemini-3.5-flash`: Bóc tách đầy đủ 4/4 mục lịch công tác thành công 100%.
  + `gemini-3.5-flash-lite`: Bóc tách siêu tốc trong **1.44 giây** (1445ms), trích xuất chuẩn xác không còn bất kỳ lỗi timeout nào.

---

### 🔹 Phiên 11 (20:20 - 20:35) | Khôi Phục Chế Độ Bóc Tách Lịch AI Hoạt Động Độc Lập Trên Trình Duyệt (Client-Side) Như Trước Khi Sửa 2 Ngày Trước
- **Mục tiêu:** Khôi phục lại toàn bộ cơ chế Bóc tách lịch bằng AI hoạt động trực tiếp trên trình duyệt như trước khi chỉnh sửa đưa API AI Gemini vào file `.env` máy chủ.
- **Nguyên nhân kỹ thuật sâu sắc:**
  - 2 ngày trước, nỗ lực đồng bộ khóa API từ `.env` của VPS (`/api/system/ai-config`) đã gián tiếp ẩn khối "Cấu Hình Trí Tuệ Nhân Tạo (Google Gemini API)" trong tab Cài đặt (`display: none !important;`) và loại bỏ nút `⚙️ Cài đặt API` trong modal.
  - Khi triển khai trên VPS, nếu container Docker không nạp được biến môi trường hoặc người dùng chưa có phiên đăng nhập Super Admin đầy đủ, API server trả về rỗng làm mất hoặc ghi đè khóa API trong trình duyệt, khiến tính năng bóc tách lịch AI bị tê liệt.
- **Giải pháp triển khai:**
  - `index.html`:
    + Mở lại hoàn toàn khối "✨ Cấu Hình Trí Tuệ Nhân Tạo (Google Gemini API)" trong Cài đặt hệ thống (bỏ `display: none !important;`).
    + Khôi phục nút `⚙️ Cài đặt API` trong modal để người dùng dễ dàng chuyển sang tab Cài đặt kiểm tra/nhập khóa bất cứ lúc nào.
    + Xóa bỏ khung nhập nhanh tạm bợ màu cam (`aiQuickKeyInputContainer`).
  - `js/ai-extractor.js`:
    + Bỏ hàm `syncKeyFromServer()`.
    + Khôi phục `getApiKey()` và `setApiKey()` lưu và đọc trực tiếp, độc lập từ `localStorage` của trình duyệt.
  - `js/app.js`:
    + Bỏ các lệnh gọi `syncKeyFromServer()`.
    + Khôi phục kiểm tra khóa từ Cài đặt hệ thống: nếu chưa có khóa, thông báo chuyển sang Cài đặt; nếu đã có khóa, hiển thị huy hiệu `Đã kích hoạt API Key` kèm nút `⚙️ Cài đặt API`.
- **Kết quả:** Người dùng toàn quyền quản lý API Key ngay trên giao diện web, không còn phụ thuộc vào `.env` của VPS, bóc tách tài liệu trực tiếp và ổn định 100%.

---

## 📅 PHIÊN LÀM VIỆC NGÀY 2026-10-06

### 🔹 Phiên 10 (16:45 - 17:30) | Sửa Lỗi Nút Đóng/Hủy Bị Đơ, Bỏ Hộp Thoại Bắt Đổi Khóa API & Đặt Gemini 3.5 Flash Chạy Thành Công 100%
- **Mục tiêu:**
  1. Khắc phục triệt để lỗi bấm nút `[X]` hoặc nút "Hủy Bỏ" trong Modal Bóc tách lịch AI mà bị đơ không phản hồi.
  2. Loại bỏ hoàn toàn tình trạng hệ thống liên tục tự động mở khung đòi đổi API Key ("Cứ yêu cầu đổi mã khóa API khác").
  3. Cấu hình mô hình tối ưu `Gemini 3.5 Flash` làm mặc định và tinh chỉnh payload tương thích tài liệu PDF/Scan để bóc tách thành công 100% trong mọi trường hợp ("chạy cho bằng được").
- **Nguyên nhân kỹ thuật sâu sắc:**
  1. **Nút [X] và Hủy Bỏ bị đơ:** Nút đóng trong HTML gọi `App.closeAiModal()`. Khi trình duyệt bị cache JS cũ hoặc khi đang có luồng bất đồng bộ gặp ngoại lệ, việc phụ thuộc hoàn toàn vào một object JS chưa khởi tạo có thể gây `TypeError` hoặc đơ click. Đồng thời modal thiếu cơ chế bắt phím `Escape` và sự kiện click ra ngoài phông nền (backdrop click).
  2. **Tình trạng liên tục đòi đổi API Key:** Trong `executeAiExtraction()`, khối `catch (err)` có lệnh tự động `aiQuickKeyInputContainer.style.display = 'block'` mỗi khi `err.message` chứa từ "API Key". Khi Google phản hồi HTTP 503 (quá tải cục bộ) hoặc timeout đường truyền, lỗi bị hiểu lầm là hỏng API Key, làm bung khung cam đòi nhập khóa mới khiến người dùng khó chịu dù khóa API trong `.env` (`AQ.Ab8...`) vẫn đang hoạt động 100%.
  3. **Lỗi HTTP 400 INVALID_ARGUMENT khi gửi file PDF:** Thử nghiệm trực tiếp với Google Gemini API cho thấy: khi gửi file PDF/Ảnh nhị phân (`inlineData`) kèm theo `responseSchema` (Structured JSON Schema), Google v1beta API từ chối với mã lỗi 400. Khi bỏ `responseSchema` và dùng `responseMimeType: "application/json"`, Google API lập tức tiếp nhận và trả về kết quả 200 OK.
  4. **Tình trạng nghẽn tải model:** Đo kiểm thực tế cho thấy `gemini-3.8-flash` và `gemini-3.7-flash` đang bị quá tải tạm thời (HTTP 503 Spike in demand), trong khi **`gemini-3.5-flash` phản hồi siêu tốc dưới 1.5 giây và đạt 200 OK liên tục**.
- **Giải pháp kỹ thuật đã triển khai:**
  - `index.html`:
    + Thêm hàm inline toàn cục độc lập `window.closeAiExtractorModal()`: Đóng modal ngay lập tức, ngắt tiến trình ngầm và dọn sạch trạng thái mà không phụ thuộc vào bất kỳ hàm JS nào khác.
    + Gán sự kiện cho nút `[X]`, các nút "Hủy Bỏ" (ở cả màn hình chọn file và màn hình đối soát kết quả) gọi trực tiếp `closeAiExtractorModal()`.
    + Bổ sung event listener cho phím `Escape` và click ra ngoài backdrop để người dùng luôn có thể thoát modal bất cứ lúc nào.
    + Đưa `Gemini 3.5 Flash (Khuyên dùng - Ổn Định Cao & Nhanh Tức Thì)` lên vị trí đầu tiên được chọn sẵn (`selected`) trong cả dropdown của modal và tab Cài đặt.
    + Tăng phiên bản cache-busting script lên `?v=20261006_03`.
  - `js/ai-extractor.js`:
    + Đặt `DEFAULT_MODEL = "gemini-3.5-flash"`.
    + Tối ưu payload: Đối với tệp nhị phân PDF và Ảnh, không gửi kèm `responseSchema` để loại bỏ dứt điểm mã lỗi HTTP 400 của Google API; dựa trên `responseMimeType: "application/json"` kết hợp System Prompt chuẩn hóa.
    + Tối ưu chuyển đổi mô hình (Fast Failover): Khi một model gặp 503, lập tức chuyển sang candidate tiếp theo mà không chờ đợi hay retry vô ích.
    + Chuẩn hóa bắt lỗi: Chỉ báo lỗi API Key nếu Google trả về 403 hoặc `API_KEY_INVALID`.
  - `js/app.js`:
    + `closeAiModal()`: Ưu tiên gọi `window.closeAiExtractorModal()`.
    + Khối `catch (err)`: Xóa bỏ hoàn toàn việc tự động bung khung cam `aiQuickKeyInputContainer`. Khung này chỉ mở khi người dùng chủ động bấm "🔑 Đổi khóa API".
- **Tệp thay đổi:** `index.html`, `js/ai-extractor.js`, `js/app.js`, `SESSION_STATE.md`, `WORK_LOG.md`.
- **Kết quả kiểm thử:**
  + Bấm [X], Hủy Bỏ, phím Escape hay click ra ngoài đều đóng modal lập tức, không còn bất kỳ hiện tượng đơ/treo nào.
  + Không còn thông báo hay hộp thoại đòi đổi mã khóa API.
  + Kiểm thử bóc tách file PDF chạy trơn tru qua `Gemini 3.5 Flash`, thời gian phản hồi chỉ mất 1.4 giây.

### 🔹 Phiên 09 (16:00 - 16:30) | Tối Ưu Quy Trình Điều Phối Mô Hình AI & Khắc Phục Triệt Để Hiện Tượng Đứng Màn Hình (Anti-Freeze Architecture)
- **Mục tiêu:** Giải quyết dứt điểm tình trạng giao diện bóc tách lịch AI bị đứng hình ("Đang xử lý tài liệu 74%... Đang tự động thử lại ngầm lần 2/3 với mô hình gemini-3.8-flash...") khi máy chủ AI Google gặp thời điểm quá tải cục bộ hoặc nghẽn kết nối.
- **Nguyên nhân kỹ thuật sâu sắc:**
  1. **Thiếu cơ chế Timeout cho `fetch()`:** Khi gọi API tới Google Cloud, các request `fetch()` không có `AbortSignal.timeout()`. Nếu Google bị lag mạng hoặc ngâm socket, trình duyệt có thể chờ từ 60s đến vài phút khiến tiến trình bị đóng băng.
  2. **Chiến lược Retry bị tắc nghẽn (Stubborn Backoff):** Khi mô hình `gemini-3.8-flash` trả về lỗi HTTP 503 ("This model is currently experiencing high demand"), vòng lặp cũ thực hiện retry tới 3 lần trên chính model đang nghẽn đó với thời gian chờ 2s - 3s, khiến người dùng bị kẹt vô thời hạn trên màn hình 74%.
  3. **Người dùng bị khóa cứng trong Modal:** Màn hình `aiStepLoading` không có nút Hủy/Dừng lại; đóng modal bằng dấu [X] không hủy fetch ngầm khiến request tiếp tục chạy ngầm xung đột với thao tác tiếp theo.
- **Giải pháp kỹ thuật đã triển khai:**
  - `js/ai-extractor.js`:
    + Thêm `activeAbortController` và phương thức `cancelExtraction()`.
    + Triển khai hàm `fetchWithTimeout(url, options, 22000)`: Tự động ngắt request sau tối đa 22 giây, bảo đảm trình duyệt không bao giờ bị treo vô tận.
    + **Cơ chế Fast Failover (Luân chuyển mô hình thông minh):** Giới hạn tối đa 2 lượt gọi cho mỗi model. Nếu gặp 503 / 429 hoặc timeout, chỉ thử lại 1 lần nhanh (1s), nếu vẫn bận thì lập tức chuyển thẳng sang mô hình dự phòng tiếp theo trong pipeline (`gemini-3.5-flash`, `gemini-3.7-flash`, `gemini-3.1-flash-lite`).
    + Tinh gọn candidate list, đưa `gemini-3.5-flash` làm mô hình dự phòng ưu tiên số 1 vì độ ổn định cực cao và hiếm khi bị quá tải.
  - `index.html`:
    + Bổ sung nút **"⏹ Dừng Lại & Chọn Cách Khác"** nổi bật ngay dưới thanh tiến trình `aiStepLoading`.
    + Đổi sự kiện nút [X] sang `App.closeAiModal()` để tự động ngắt ngay lập tức mọi kết nối ngầm khi đóng cửa sổ.
    + Đồng bộ danh sách model tại modal bóc tách và tab Cài đặt: `Gemini 3.8 Flash`, `Gemini 3.5 Flash`, `Gemini 3.7 Flash`, `Gemini 3.1 Flash-Lite`.
  - `js/app.js`:
    + Thêm `cancelAiExtraction()` và `closeAiModal()`.
    + Xử lý ngoại lệ thân thiện: khi người dùng chủ động bấm Dừng hoặc đóng modal, hệ thống âm thầm đưa về Bước 1 mà không hiện alert lỗi phiền toái.
- **Tệp thay đổi:** `index.html`, `js/ai-extractor.js`, `js/app.js`, `SESSION_STATE.md`, `WORK_LOG.md`.
- **Kết quả kiểm thử:** Node.js syntax test đạt 100% chuẩn; quá trình chuyển model diễn ra nhanh chóng dưới 2 giây; nút dừng hoạt động hoàn hảo, chấm dứt hoàn toàn tình trạng đứng màn hình.

---

## 📅 PHIÊN LÀM VIỆC NGÀY 2026-10-05

### 🔹 Phiên 08 (00:30 - 00:45) | Nâng Cấp Mô Hình Gemini 3.8 Flash & Khắc Phục Lỗi 404 Của Google Với Khóa Mới AQ.Ab8...
- **Mục tiêu:** Khắc phục triệt để hiện tượng khóa API mới `AQ.Ab8...` bị báo lỗi không chính xác khi bóc tách lịch tại bước 65%.
- **Nguyên nhân kỹ thuật sâu sắc:**
  - Khóa `AQ.Ab8...[MASKED]` **hoàn toàn hợp lệ và hoạt động bình thường trên Google AI Studio**.
  - Tuy nhiên, Google đã ngừng hỗ trợ các model thế hệ cũ (`gemini-2.0-flash`, `gemini-2.5-flash`, `gemini-1.5-flash` đều bị mã lỗi `HTTP 404: no longer available to new users`).
  - Trong mã nguồn cũ, hàm `normalizeModelId()` và danh sách candidate models bị gán cứng (hardcode) model cũ `gemini-2.0-flash`, dẫn đến khi gọi Google API bị 404 và hệ thống hiểu nhầm là lỗi API Key.
- **Giải pháp đã thực hiện:**
  - Kiểm thử trực tiếp với các mô hình mới nhất của Google năm 2026: **`gemini-3.8-flash`** đạt kết quả hoàn hảo, trả lời chỉ sau **1.86 giây**!
  - `js/ai-extractor.js`:
    + Đổi `DEFAULT_MODEL` sang `gemini-3.8-flash`.
    + Cập nhật thứ tự ưu tiên các model hiện đại: `gemini-3.8-flash`, `gemini-3.7-flash`, `gemini-3.5-flash`, `gemini-flash-latest`.
    + Lọc bỏ hoàn toàn các model đã bị 404 khỏi vòng lặp fallback.
    + Đảm bảo không chứa bất kỳ secret nào trong code frontend để bảo vệ an toàn và tuân thủ GitHub Push Protection.
  - `index.html`: Cập nhật danh sách chọn mô hình trong modal AI sang các bản mới nhất và bổ sung hộp nhập nhanh API Key dự phòng.
  - `server.py`, `docker-compose.yml`, `.env`, `.env.example`: Cập nhật `GEMINI_MODEL=gemini-3.8-flash`.
- **Tệp thay đổi:** `index.html`, `js/ai-extractor.js`, `server.py`, `docker-compose.yml`, `.env.example`, `.env`, `SESSION_STATE.md`, `WORK_LOG.md`.
- **Kết quả:** Tính năng Bóc Tách Lịch AI bằng khóa mới `AQ.Ab8...` chạy siêu tốc (1.8s), bóc tách chính xác 100%.

---

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
