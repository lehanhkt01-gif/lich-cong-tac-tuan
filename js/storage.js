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

            // Đồng bộ danh bạ cán bộ và tài khoản mới nhất (Chánh VP Hà Tường Vi, Phó Chánh VP Trần Minh Hải, CV Nguyễn Thị Thoản, bỏ Hoàng Nhật Lệ)
            let cadres = this.getCadres();
            const hasOldLeaderInCadres = cadres.some(c => 
                c.fullName === "Hoàng Nhật Lệ" || 
                (c.fullName === "Hà Tường Vi" && c.position && c.position.includes("Phó Chánh")) ||
                (c.fullName === "Trần Minh Hải" && c.position && !c.position.includes("Phó Chánh"))
            );
            const users = this.getUsers();
            const hasOldUser = users.some(u => u.fullName === "Hoàng Nhật Lệ" || (u.fullName === "Hà Tường Vi" && u.position && u.position.includes("Phó Chánh")));

            // Đồng bộ Lãnh đạo dự/chủ trì trong Lịch tuần để khớp 100% với danh bạ cán bộ Ea Súp
            let schedules = this.getAllSchedules();
            const hasOldLeaderInSchedule = schedules.some(s => 
                (s.items || []).some(item => 
                    item.leader && (
                        item.leader.includes("Hoàng Minh Đức") ||
                        item.leader.includes("Y Krông") ||
                        item.leader.includes("Nguyễn Văn Cường") ||
                        item.leader.includes("Hoàng Nhật Lệ")
                    )
                ) || (s.approvedBy && s.approvedBy.includes("Hoàng Minh Đức"))
            );

            const SYNC_VERSION_KEY = "easup_portal_auth_6_users_v8";
            const users = this.getUsers();
            const hasCorrect6Users = users.length === 6 && users.some(u => u.username === "vyhatuong" && u.aliases) && users.some(u => u.username === "linhtranvan");

            if (hasOldLeaderInCadres || hasOldUser || hasOldLeaderInSchedule || !hasCorrect6Users || !localStorage.getItem(SYNC_VERSION_KEY)) {
                localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(INITIAL_DATA.schedules));
                localStorage.setItem(STORAGE_KEYS.CADRES, JSON.stringify(INITIAL_DATA.cadres));
                localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_DATA.users));
                localStorage.setItem(STORAGE_KEYS.ORGANIZATION, JSON.stringify(INITIAL_DATA.organization));
                localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_DATA.auditLogs));
                // Nếu người dùng hiện tại không nằm trong 6 tài khoản này, đăng xuất về khách
                const curr = this.getCurrentUser();
                if (curr && !INITIAL_DATA.users.some(u => u.username === curr.username)) {
                    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
                }
                localStorage.setItem(SYNC_VERSION_KEY, "true");
            } else {
                let schedChanged = false;
                schedules.forEach(s => {
                    (s.items || []).forEach(item => {
                        if (item.bloc === "Thường trực") { item.bloc = "MTTQ"; schedChanged = true; }
                        if (item.bloc === "Đoàn thể") { item.bloc = "Khác"; schedChanged = true; }
                    });
                });
                if (schedChanged) {
                    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));
                }
            }
        }
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

    // Lấy tất cả lịch tuần
    getAllSchedules() {
        const data = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
        return data ? JSON.parse(data) : INITIAL_DATA.schedules;
    },

    // Lấy lịch của tuần cụ thể
    getScheduleByWeek(year, weekNumber) {
        const schedules = this.getAllSchedules();
        return schedules.find(s => s.year === parseInt(year) && s.weekNumber === parseInt(weekNumber));
    },

    getScheduleById(id) {
        const schedules = this.getAllSchedules();
        return schedules.find(s => s.id === id);
    },

    // Lưu hoặc cập nhật lịch tuần
    saveSchedule(schedule) {
        const schedules = this.getAllSchedules();
        const index = schedules.findIndex(s => s.id === schedule.id);
        
        schedule.lastUpdated = new Date().toISOString().replace('T', ' ').substring(0, 16);
        const currentUser = this.getCurrentUser();
        schedule.updatedBy = `${currentUser.fullName} (${currentUser.roleName.split(' ')[0]})`;

        if (index >= 0) {
            schedules[index] = schedule;
        } else {
            schedules.unshift(schedule);
        }

        localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));
        return schedule;
    },

    // Thêm hoặc cập nhật một mục công tác trong tuần
    saveScheduleItem(weekId, item) {
        const schedule = this.getScheduleById(weekId);
        if (!schedule) return null;

        if (!schedule.items) schedule.items = [];
        
        const itemIndex = schedule.items.findIndex(i => i.id === item.id);
        let oldItem = null;

        if (itemIndex >= 0) {
            oldItem = JSON.parse(JSON.stringify(schedule.items[itemIndex]));
            schedule.items[itemIndex] = item;
        } else {
            item.id = "item_" + Date.now();
            schedule.items.push(item);
        }

        this.saveSchedule(schedule);
        return { schedule, oldItem, newItem: item };
    },

    // Xóa một mục công tác
    deleteScheduleItem(weekId, itemId) {
        const schedule = this.getScheduleById(weekId);
        if (!schedule || !schedule.items) return null;

        const oldItem = schedule.items.find(i => i.id === itemId);
        schedule.items = schedule.items.filter(i => i.id !== itemId);
        this.saveSchedule(schedule);

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
            editorId: currentUser.id,
            editorName: `${currentUser.fullName} (${currentUser.position})`,
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
