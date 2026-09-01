/**
 * TẦNG LƯU TRỮ DỮ LIỆU - STORAGE ENGINE
 * Quản lý LocalStorage và State cho Cổng thông tin điều hành
 */

const STORAGE_KEYS = {
    ORGANIZATION: "easup_portal_organization",
    USERS: "easup_portal_users",
    CURRENT_USER: "easup_portal_current_user",
    CADRES: "easup_portal_cadres",
    SCHEDULES: "easup_portal_schedules",
    AUDIT_LOGS: "easup_portal_audit_logs",
    EMAIL_LOGS: "easup_portal_email_logs",
    SETTINGS: "easup_portal_settings"
};

const StorageService = {
    // Chuyển đổi chuỗi thời gian (vd: "07h00", "08:30", "14h", "Chiều 14h30", "Sáng") thành số phút trong ngày để so sánh
    parseTimeToMinutes(timeStr) {
        if (!timeStr || typeof timeStr !== 'string') return 9999;
        const str = timeStr.trim().toLowerCase();
        if (!str) return 9999;

        // Chỉ lấy mốc bắt đầu nếu là khoảng thời gian (vd: "07h30 - 09h00")
        const firstPart = str.split('-')[0].trim();

        // Khớp định dạng giờ:phút hoặc giờ"h"phút (vd: "07h30", "7h", "14:00", "7g30", "8 giờ 15")
        const match = firstPart.match(/(\d{1,2})\s*(?:h|g|:|\bgio\b|\bgiờ\b)\s*(\d{1,2})?/);
        if (match) {
            let hours = parseInt(match[1], 10);
            let minutes = match[2] ? parseInt(match[2], 10) : 0;

            // Nếu người dùng ghi "chiều" / "tối" / "pm" mà giờ < 12 (vd: "chiều 2h30") -> cộng 12
            if ((firstPart.includes('chiều') || firstPart.includes('tối') || firstPart.includes('pm')) && hours < 12) {
                hours += 12;
            }
            return hours * 60 + minutes;
        }

        // Khớp định dạng số thập phân hoặc dấu chấm (vd: "07.30", "8.00")
        const matchAlt = firstPart.match(/^.*?(\d{1,2})[:\.](\d{1,2})/);
        if (matchAlt) {
            let hours = parseInt(matchAlt[1], 10);
            let minutes = parseInt(matchAlt[2], 10);
            if ((firstPart.includes('chiều') || firstPart.includes('tối') || firstPart.includes('pm')) && hours < 12) {
                hours += 12;
            }
            return hours * 60 + minutes;
        }

        // Khớp số đứng đầu (vd: "7", "14")
        const matchNum = firstPart.match(/(\d{1,2})/);
        if (matchNum) {
            let hours = parseInt(matchNum[1], 10);
            if ((firstPart.includes('chiều') || firstPart.includes('tối') || firstPart.includes('pm')) && hours < 12) {
                hours += 12;
            }
            return hours * 60;
        }

        // Các từ khóa buổi trong ngày
        if (str.includes('cả ngày')) return 6 * 60;       // 06:00
        if (str.includes('sáng')) return 7 * 60;           // 07:00
        if (str.includes('trưa')) return 11 * 60 + 30;     // 11:30
        if (str.includes('chiều')) return 13 * 60 + 30;    // 13:30
        if (str.includes('tối')) return 18 * 60;           // 18:00

        return 9999;
    },

    // So sánh thứ tự 2 mốc thời gian (sự kiện nào trước thì đứng trước)
    compareTime(timeA, timeB) {
        const tA = this.parseTimeToMinutes(timeA);
        const tB = this.parseTimeToMinutes(timeB);
        if (tA !== tB) return tA - tB;
        return (timeA || "").localeCompare(timeB || "");
    },

    // Lấy thứ tự ngày trong tuần (Thứ Hai: 1 -> Chủ Nhật: 7)
    getDayOrder(dayOfWeek) {
        if (!dayOfWeek) return 99;
        const d = dayOfWeek.trim().toLowerCase();
        if (d.includes('hai') || d.includes('2')) return 1;
        if (d.includes('ba') || d.includes('3')) return 2;
        if (d.includes('tư') || d.includes('tu') || d.includes('4')) return 3;
        if (d.includes('năm') || d.includes('nam') || d.includes('5')) return 4;
        if (d.includes('sáu') || d.includes('sau') || d.includes('6')) return 5;
        if (d.includes('bảy') || d.includes('bay') || d.includes('7')) return 6;
        if (d.includes('nhật') || d.includes('nhat') || d.includes('cn') || d.includes('8')) return 7;
        return 99;
    },

    // Sắp xếp danh sách mục công tác chuẩn trình tự: theo Ngày rồi theo Thời gian (sớm trước, muộn sau)
    sortScheduleItems(items) {
        if (!items || !Array.isArray(items)) return [];
        return [...items].sort((a, b) => {
            // 1. So sánh ngày cụ thể (YYYY-MM-DD) nếu cả 2 đều có
            if (a.date && b.date && a.date !== b.date) {
                return a.date.localeCompare(b.date);
            }
            // 2. So sánh thứ trong tuần
            const orderA = this.getDayOrder(a.dayOfWeek);
            const orderB = this.getDayOrder(b.dayOfWeek);
            if (orderA !== orderB) {
                return orderA - orderB;
            }
            // 3. So sánh thời gian trong ngày (sự kiện nào trước nằm trên)
            return this.compareTime(a.time, b.time);
        });
    },

    // Tính toán thông tin Tuần hiện tại theo thời gian thực tế (Chuẩn ISO-8601)
    getCurrentWeekInfo(date = new Date()) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        const year = d.getUTCFullYear();

        const monday = this.getMondayOfWeek(weekNo, year);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        const mStr = `${monday.getDate().toString().padStart(2, '0')}/${(monday.getMonth() + 1).toString().padStart(2, '0')}`;
        const sStr = `${sunday.getDate().toString().padStart(2, '0')}/${(sunday.getMonth() + 1).toString().padStart(2, '0')}/${sunday.getFullYear()}`;

        return {
            year,
            weekNumber: weekNo,
            startDate: monday.toISOString().split('T')[0],
            endDate: sunday.toISOString().split('T')[0],
            label: `Tuần ${weekNo} (${mStr} - ${sStr})`
        };
    },

    // Lấy ngày Thứ Hai đầu tuần cho bất kỳ tuần nào trong năm
    getMondayOfWeek(weekNo, year) {
        const simple = new Date(year, 0, 1 + (weekNo - 1) * 7);
        const dayOfWeek = simple.getDay() || 7;
        const monday = new Date(simple);
        monday.setDate(simple.getDate() - dayOfWeek + 1);
        return monday;
    },

    // Lấy chuỗi khoảng ngày định dạng DD/MM - DD/MM/YYYY cho tuần bất kỳ
    getWeekDateRangeString(weekNo, year) {
        const monday = this.getMondayOfWeek(weekNo, year);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        const mStr = `${monday.getDate().toString().padStart(2, '0')}/${(monday.getMonth() + 1).toString().padStart(2, '0')}`;
        const sStr = `${sunday.getDate().toString().padStart(2, '0')}/${(sunday.getMonth() + 1).toString().padStart(2, '0')}/${sunday.getFullYear()}`;
        return `${mStr} - ${sStr}`;
    },

    // Điền động danh sách tuần vào phần tử <select> và gắn nhãn "• Hiện tại" chính xác
    populateWeekSelect(weekSelectEl, selectedWeek, selectedYear) {
        if (!weekSelectEl) return;
        const currentInfo = this.getCurrentWeekInfo(new Date());
        const realCurrentWeek = currentInfo.weekNumber;
        const realCurrentYear = currentInfo.year;

        const selYear = parseInt(selectedYear || realCurrentYear, 10);
        const selWeek = parseInt(selectedWeek || realCurrentWeek, 10);

        let html = "";
        for (let w = 52; w >= 1; w--) {
            const rangeStr = this.getWeekDateRangeString(w, selYear);
            const isRealCurrent = (w === realCurrentWeek && selYear === realCurrentYear);
            const isSelected = (w === selWeek);
            const currentTag = isRealCurrent ? " • Hiện tại" : "";
            html += `<option value="${w}" ${isSelected ? "selected" : ""}>Tuần ${w} (${rangeStr})${currentTag}</option>`;
        }
        weekSelectEl.innerHTML = html;
        weekSelectEl.value = selWeek;
    },

    // Tính toán ngày dương lịch chính xác từ ngày bắt đầu tuần (Thứ 2) và thứ trong tuần
    calculateDateForDay(startDateStr, dayOfWeek) {
        if (!startDateStr) return "";
        const dayOrder = this.getDayOrder(dayOfWeek); // 1 = Thứ Hai, ..., 7 = Chủ Nhật
        const offsetDays = (dayOrder >= 1 && dayOrder <= 7) ? (dayOrder - 1) : 0;
        const parts = startDateStr.split('-');
        if (parts.length === 3) {
            const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
            d.setDate(d.getDate() + offsetDays);
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        }
        return startDateStr;
    },

    // Khởi tạo dữ liệu nếu chưa có trong LocalStorage
    init() {
        if (!localStorage.getItem(STORAGE_KEYS.SCHEDULES)) {
            this.resetToDefault();
        } else {
            // Đồng bộ thông tin tổ chức mới nhất
            const currentOrg = this.getOrganization();
            if (currentOrg.district || !currentOrg.logoUrl) {
                localStorage.setItem(STORAGE_KEYS.ORGANIZATION, JSON.stringify(INITIAL_DATA.organization));
            }

            // Đồng bộ danh bạ và tài khoản hệ thống nếu chưa đủ
            const users = this.getUsers();
            if (!users || users.length < 6 || !users.some(u => u.username === "vyhatuong")) {
                localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_DATA.users));
                localStorage.setItem(STORAGE_KEYS.CADRES, JSON.stringify(INITIAL_DATA.cadres));
            }

            // Đồng bộ dữ liệu lịch: XÓA TOÀN BỘ LỊCH CÔNG TÁC MẪU TỰ ĐỘNG TẠO, CHỈ ĐỂ LỊCH DO CÁN BỘ TẠO
            let schedules = this.getAllSchedules();
            let schedChanged = false;
            if (Array.isArray(schedules)) {
                schedules.forEach(s => {
                    if (s && s.items) {
                        const originalLen = s.items.length;
                        // Loại bỏ các mục mẫu ban đầu (item_35_xx, item_34_xx)
                        s.items = s.items.filter(item => {
                            if (!item || !item.id) return false;
                            const isSample = String(item.id).startsWith("item_35_") || String(item.id).startsWith("item_34_");
                            return !isSample;
                        });
                        if (s.items.length !== originalLen) {
                            schedChanged = true;
                        }
                        s.items.forEach(item => {
                            if (item.bloc === "Thường trực") { item.bloc = "MTTQ"; schedChanged = true; }
                            if (item.bloc === "Đoàn thể") { item.bloc = "Khác"; schedChanged = true; }
                            if (!item.date && s.startDate) {
                                item.date = this.calculateDateForDay(s.startDate, item.dayOfWeek);
                                schedChanged = true;
                            }
                        });
                        s.items = this.sortScheduleItems(s.items);
                    }
                });
                if (schedChanged) {
                    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));
                }
            }

            // Xóa log mẫu tự động tạo
            let auditLogs = this.getAuditLogs();
            if (Array.isArray(auditLogs) && auditLogs.some(l => l.id && String(l.id).startsWith("log_00"))) {
                auditLogs = auditLogs.filter(l => !l.id || !String(l.id).startsWith("log_00"));
                localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs));
            }
        }

        // Tự động kết nối và đồng bộ hai chiều với máy chủ backend
        this.syncWithServer();
    },

    // Khôi phục về dữ liệu mẫu mặc định
    resetToDefault() {
        localStorage.setItem(STORAGE_KEYS.ORGANIZATION, JSON.stringify(INITIAL_DATA.organization));
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_DATA.users));
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER); // Mặc định ở chế độ Khách
        localStorage.setItem(STORAGE_KEYS.CADRES, JSON.stringify(INITIAL_DATA.cadres));
        localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(INITIAL_DATA.schedules));
        localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_DATA.auditLogs));
        localStorage.setItem(STORAGE_KEYS.EMAIL_LOGS, JSON.stringify(INITIAL_DATA.emailLogs));
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({
            autoNotifyOnSave: true,
            defaultYear: 2026,
            defaultWeek: 35,
            smtpHost: "mail.daklak.gov.vn",
            smtpPort: "587",
            smtpSender: "ubnd.easup@daklak.gov.vn"
        }));
    },

    // Lấy thông tin đơn vị
    getOrganization() {
        const data = localStorage.getItem(STORAGE_KEYS.ORGANIZATION);
        return data ? JSON.parse(data) : INITIAL_DATA.organization;
    },

    setOrganization(org) {
        localStorage.setItem(STORAGE_KEYS.ORGANIZATION, JSON.stringify(org));
    },

    // Lấy danh sách tài khoản
    getUsers() {
        const data = localStorage.getItem(STORAGE_KEYS.USERS);
        return data ? JSON.parse(data) : INITIAL_DATA.users;
    },

    addUser(user) {
        const users = this.getUsers();
        const existingIdx = users.findIndex(u => u.username.toLowerCase() === user.username.toLowerCase() || (user.email && u.email.toLowerCase() === user.email.toLowerCase()));
        if (existingIdx >= 0) {
            users[existingIdx] = { ...users[existingIdx], ...user };
        } else {
            users.push(user);
        }
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        return user;
    },

    // Lấy người dùng đang đăng nhập (trả về null nếu chưa đăng nhập / chế độ khách)
    getCurrentUser() {
        const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        if (!data || data === "null" || data === "guest" || data === "undefined") return null;
        try {
            return JSON.parse(data);
        } catch (e) {
            return null;
        }
    },

    setCurrentUser(user) {
        if (user) {
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
        } else {
            localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        }
    },

    // Lấy danh bạ cán bộ
    getCadres() {
        const data = localStorage.getItem(STORAGE_KEYS.CADRES);
        return data ? JSON.parse(data) : INITIAL_DATA.cadres;
    },

    saveCadre(cadre) {
        const cadres = this.getCadres();
        const index = cadres.findIndex(c => c.id === cadre.id);
        if (index >= 0) {
            cadres[index] = cadre;
        } else {
            cadre.id = "c_" + Date.now();
            cadres.push(cadre);
        }
        localStorage.setItem(STORAGE_KEYS.CADRES, JSON.stringify(cadres));
        return cadre;
    },

    deleteCadre(id) {
        let cadres = this.getCadres();
        cadres = cadres.filter(c => c.id !== id);
        localStorage.setItem(STORAGE_KEYS.CADRES, JSON.stringify(cadres));
    },

    // =========================================================================
    // ĐỒNG BỘ MÁY CHỦ VÀ LƯU TRỮ VĨNH VIỄN (SERVER PERSISTENCE & CLOUD SYNC)
    // =========================================================================
    async syncWithServer() {
        try {
            const res = await fetch('/api/schedules', { cache: 'no-store' });
            if (res.ok) {
                const serverSchedules = await res.json();
                if (Array.isArray(serverSchedules) && serverSchedules.length > 0) {
                    serverSchedules.forEach(s => {
                        if (s && s.items) s.items = this.sortScheduleItems(s.items);
                    });
                    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(serverSchedules));

                    // Tự động kích hoạt cập nhật giao diện đang hiển thị
                    if (window.App && typeof window.App.loadCurrentSchedule === 'function') {
                        window.App.loadCurrentSchedule();
                        window.App.renderAll();
                    }
                    if (window.GuestApp && typeof window.GuestApp.loadCurrentSchedule === 'function') {
                        window.GuestApp.loadCurrentSchedule();
                        window.GuestApp.renderAll();
                    }
                    if (window.MobileApp && typeof window.MobileApp.loadCurrentWeekData === 'function') {
                        window.MobileApp.loadCurrentWeekData();
                    }
                }
            }
        } catch (e) {
            // Đang chạy ở chế độ offline hoặc file cục bộ -> sử dụng LocalStorage
        }
    },

    async persistScheduleToServer(schedule) {
        try {
            await fetch('/api/schedules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(schedule)
            });
        } catch (e) {
            // Offline fallback
        }
    },

    async persistItemToServer(weekId, item) {
        try {
            await fetch('/api/schedules/item', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ weekId, item })
            });
        } catch (e) {
            // Offline fallback
        }
    },

    async deleteItemFromServer(weekId, itemId) {
        try {
            await fetch('/api/schedules/delete-item', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ weekId, itemId })
            });
        } catch (e) {
            // Offline fallback
        }
    },

    // Lấy tất cả lịch tuần
    getAllSchedules() {
        const data = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
        const schedules = data ? JSON.parse(data) : INITIAL_DATA.schedules;
        if (Array.isArray(schedules)) {
            schedules.forEach(s => {
                if (s && s.items) s.items = this.sortScheduleItems(s.items);
            });
        }
        return schedules;
    },

    // Lấy lịch của tuần cụ thể (Tự động khởi tạo lịch rỗng nếu chưa tồn tại)
    getScheduleByWeek(year, weekNumber) {
        const y = parseInt(year, 10);
        const w = parseInt(weekNumber, 10);
        const schedules = this.getAllSchedules();
        let sched = schedules.find(s => s.year === y && s.weekNumber === w);

        if (!sched) {
            const monday = this.getMondayOfWeek(w, y);
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);

            sched = {
                id: `sched_${y}_w${w}`,
                year: y,
                weekNumber: w,
                title: `Lịch công tác tuần ${w} năm ${y}`,
                startDate: monday.toISOString().split('T')[0],
                endDate: sunday.toISOString().split('T')[0],
                status: "published",
                lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16),
                updatedBy: (this.getCurrentUser() ? this.getCurrentUser().fullName : "Hà Tường Vi"),
                approvedBy: "Nguyễn Bá Bân (Chủ tịch UBND xã)",
                note: "Lịch công tác tuần.",
                items: []
            };
            this.saveSchedule(sched);
        }

        if (sched && sched.items) sched.items = this.sortScheduleItems(sched.items);
        return sched;
    },

    getScheduleById(id) {
        const schedules = this.getAllSchedules();
        const sched = schedules.find(s => s.id === id);
        if (sched && sched.items) sched.items = this.sortScheduleItems(sched.items);
        return sched;
    },

    // Lưu hoặc cập nhật lịch tuần
    saveSchedule(schedule) {
        if (schedule.items) {
            schedule.items = this.sortScheduleItems(schedule.items);
        }
        const schedules = this.getAllSchedules();
        const index = schedules.findIndex(s => s.id === schedule.id);
        
        schedule.lastUpdated = new Date().toISOString().replace('T', ' ').substring(0, 16);
        const currentUser = this.getCurrentUser();
        if (currentUser) {
            schedule.updatedBy = `${currentUser.fullName} (${currentUser.roleName ? currentUser.roleName.split(' ')[0] : 'Admin'})`;
        } else if (!schedule.updatedBy) {
            schedule.updatedBy = "Hà Tường Vi";
        }

        if (index >= 0) {
            schedules[index] = schedule;
        } else {
            schedules.unshift(schedule);
        }

        localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));
        this.persistScheduleToServer(schedule);
        return schedule;
    },

    // Thêm hoặc cập nhật một mục công tác trong tuần
    saveScheduleItem(weekId, item) {
        let schedule = this.getScheduleById(weekId);
        if (!schedule) {
            const schedules = this.getAllSchedules();
            schedule = schedules && schedules.length > 0 ? schedules[0] : null;
        }
        if (!schedule) return null;

        if (!schedule.items) schedule.items = [];
        
        // Tự động gán ngày dương lịch chính xác nếu chưa có
        if (schedule.startDate && (!item.date || item.dayOfWeek)) {
            item.date = this.calculateDateForDay(schedule.startDate, item.dayOfWeek);
        }

        const itemIndex = schedule.items.findIndex(i => i.id === item.id);
        let oldItem = null;

        if (itemIndex >= 0 && item.id) {
            oldItem = JSON.parse(JSON.stringify(schedule.items[itemIndex]));
            schedule.items[itemIndex] = { ...oldItem, ...item };
        } else {
            item.id = item.id || ("item_" + Date.now() + "_" + Math.floor(Math.random() * 1000));
            schedule.items.push(item);
        }

        schedule.items = this.sortScheduleItems(schedule.items);
        this.saveSchedule(schedule);
        this.persistItemToServer(schedule.id, item);
        return { schedule, oldItem, newItem: item };
    },

    // Xóa một mục công tác
    deleteScheduleItem(weekId, itemId) {
        const schedule = this.getScheduleById(weekId);
        if (!schedule || !schedule.items) return null;

        const oldItem = schedule.items.find(i => i.id === itemId);
        schedule.items = schedule.items.filter(i => i.id !== itemId);
        this.saveSchedule(schedule);
        this.deleteItemFromServer(schedule.id, itemId);

        return { schedule, deletedItem: oldItem };
    },

    // Lấy toàn bộ nhật ký kiểm tra (Audit Logs)
    getAuditLogs() {
        const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
        return data ? JSON.parse(data) : INITIAL_DATA.auditLogs;
    },

    // Thêm nhật ký kiểm tra thay đổi mới
    addAuditLog(logEntry) {
        const logs = this.getAuditLogs();
        const currentUser = this.getCurrentUser();

        const newLog = {
            id: "log_" + Date.now(),
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
            editorId: currentUser ? currentUser.id : "system",
            editorName: currentUser ? `${currentUser.fullName} (${currentUser.position || 'Cán bộ'})` : "Cán bộ điều hành",
            ...logEntry
        };

        logs.unshift(newLog);
        localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
        return newLog;
    },

    // Quản lý nhật ký gửi email
    getEmailLogs() {
        const data = localStorage.getItem(STORAGE_KEYS.EMAIL_LOGS);
        return data ? JSON.parse(data) : INITIAL_DATA.emailLogs;
    },

    addEmailLog(emailEntry) {
        const logs = this.getEmailLogs();
        const newLog = {
            id: "mail_log_" + Date.now(),
            sentAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
            ...emailEntry
        };
        logs.unshift(newLog);
        localStorage.setItem(STORAGE_KEYS.EMAIL_LOGS, JSON.stringify(logs));
        return newLog;
    },

    // Cài đặt hệ thống
    getSettings() {
        const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        return data ? JSON.parse(data) : { autoNotifyOnSave: true };
    },

    saveSettings(settings) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    },

    // Xuất toàn bộ CSDL ra JSON
    exportAllDataJSON() {
        const fullBackup = {
            organization: this.getOrganization(),
            users: this.getUsers(),
            cadres: this.getCadres(),
            schedules: this.getAllSchedules(),
            auditLogs: this.getAuditLogs(),
            emailLogs: this.getEmailLogs(),
            settings: this.getSettings(),
            exportedAt: new Date().toISOString()
        };
        return JSON.stringify(fullBackup, null, 2);
    },

    // Nhập CSDL từ JSON
    importAllDataJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (data.schedules && data.cadres) {
                if (data.organization) localStorage.setItem(STORAGE_KEYS.ORGANIZATION, JSON.stringify(data.organization));
                if (data.users) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data.users));
                if (data.cadres) localStorage.setItem(STORAGE_KEYS.CADRES, JSON.stringify(data.cadres));
                if (data.schedules) localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(data.schedules));
                if (data.auditLogs) localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(data.auditLogs));
                if (data.emailLogs) localStorage.setItem(STORAGE_KEYS.EMAIL_LOGS, JSON.stringify(data.emailLogs));
                return { success: true };
            }
            return { success: false, error: "Định dạng tệp dữ liệu không hợp lệ." };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }
};

// Tự động kích hoạt khi nạp script
StorageService.init();
