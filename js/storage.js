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
            // Đồng bộ thông tin tổ chức mới nhất (bỏ Huyện Ea Súp, cập nhật logo)
            const currentOrg = this.getOrganization();
            if (currentOrg.district || !currentOrg.logoUrl) {
                localStorage.setItem(STORAGE_KEYS.ORGANIZATION, JSON.stringify(INITIAL_DATA.organization));
            }

            // Đồng bộ khối công tác (Thường trực -> MTTQ, Đoàn thể -> Khác)
            let schedules = this.getAllSchedules();
            let changed = false;
            schedules.forEach(s => {
                (s.items || []).forEach(item => {
                    if (item.bloc === "Thường trực") { item.bloc = "MTTQ"; changed = true; }
                    if (item.bloc === "Đoàn thể") { item.bloc = "Khác"; changed = true; }
                });
            });
            if (changed) {
                localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));
            }

            // Đồng bộ danh bạ cán bộ chính thức mới nhất
            let cadres = this.getCadres();
            if (cadres.length < 50) {
                localStorage.setItem(STORAGE_KEYS.CADRES, JSON.stringify(INITIAL_DATA.cadres));
                localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_DATA.users));
                localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(INITIAL_DATA.users[0]));
            } else {
                let cadresChanged = false;
                cadres.forEach(c => {
                    if (c.bloc === "Thường trực" || c.bloc === "Đoàn thể") {
                        c.bloc = c.department && c.department.includes("MTTQ") ? "MTTQ" : "Khác";
                        cadresChanged = true;
                    }
                });
                if (cadresChanged) {
                    localStorage.setItem(STORAGE_KEYS.CADRES, JSON.stringify(cadres));
                }
            }
        }
    },

    // Khôi phục về dữ liệu mẫu mặc định
    resetToDefault() {
        localStorage.setItem(STORAGE_KEYS.ORGANIZATION, JSON.stringify(INITIAL_DATA.organization));
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_DATA.users));
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(INITIAL_DATA.users[0])); // Mặc định Admin
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

    // Lấy người dùng đang đăng nhập
    getCurrentUser() {
        const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        return data ? JSON.parse(data) : INITIAL_DATA.users[0];
    },

    setCurrentUser(user) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
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
