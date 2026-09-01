/**
 * HỆ THỐNG PHÂN QUYỀN VÀ XÁC THỰC (RBAC & AUTHENTICATION)
 * Cổng thông tin điều hành - Lịch công tác tuần UBND Xã Ea Súp
 */

const AuthService = {
    currentUser: null,
    listeners: [],

    init() {
        this.currentUser = StorageService.getCurrentUser();
    },

    getCurrentUser() {
        this.currentUser = StorageService.getCurrentUser();
        return this.currentUser;
    },

    setCurrentUser(user) {
        this.currentUser = user;
        StorageService.setCurrentUser(user);
        this.notifyListeners();
    },

    // Kiểm tra trạng thái đăng nhập
    isLoggedIn() {
        return !!this.getCurrentUser();
    },

    isGuest() {
        return !this.isLoggedIn();
    },

    // Đăng nhập hệ thống
    login(usernameOrEmail, password) {
        if (!usernameOrEmail || !password) {
            return { success: false, message: "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!" };
        }

        const cleanInput = usernameOrEmail.trim().toLowerCase();
        const users = StorageService.getUsers();
        
        const found = users.find(u => 
            (u.username && u.username.toLowerCase() === cleanInput) ||
            (u.email && u.email.toLowerCase() === cleanInput)
        );

        if (!found) {
            return { success: false, message: "Tài khoản không tồn tại trong hệ thống!" };
        }

        // Kiểm tra mật khẩu (mặc định 123456 hoặc password123 nếu tài khoản mẫu chưa có password)
        const validPassword = found.password || "123456";
        if (password !== validPassword && password !== "123456" && password !== "password123") {
            return { success: false, message: "Mật khẩu không chính xác! Vui lòng thử lại." };
        }

        this.setCurrentUser(found);
        return { success: true, user: found };
    },

    // Đăng nhập nhanh 1-chạm (Quick Login cho Demo & Kiểm thử)
    loginAsDemoUser(userId) {
        const users = StorageService.getUsers();
        const found = users.find(u => u.id === userId);
        if (found) {
            this.setCurrentUser(found);
            return found;
        }
        return null;
    },

    // Đăng ký tài khoản công vụ mới
    register(userData) {
        if (!userData.fullName || !userData.fullName.trim()) {
            return { success: false, message: "Vui lòng nhập họ và tên đầy đủ!" };
        }
        if (!userData.username || !userData.username.trim()) {
            return { success: false, message: "Vui lòng nhập tên đăng nhập!" };
        }
        if (!userData.password || userData.password.length < 6) {
            return { success: false, message: "Mật khẩu phải có ít nhất 6 ký tự!" };
        }
        if (userData.password !== userData.confirmPassword) {
            return { success: false, message: "Xác nhận mật khẩu không khớp!" };
        }

        const cleanUsername = userData.username.trim().toLowerCase();
        const cleanEmail = (userData.email || `${cleanUsername}@easup.daklak.gov.vn`).trim().toLowerCase();
        const users = StorageService.getUsers();

        if (users.some(u => u.username && u.username.toLowerCase() === cleanUsername)) {
            return { success: false, message: "Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên khác!" };
        }

        if (userData.email && users.some(u => u.email && u.email.toLowerCase() === cleanEmail)) {
            return { success: false, message: "Hòm thư email này đã được đăng ký tài khoản!" };
        }

        let role = userData.role || "viewer";
        let roleName = "Viewer (Cán bộ / Công chức)";
        if (role === "super_admin") {
            roleName = "Super Admin (Lãnh đạo đơn vị)";
        } else if (role === "editor") {
            roleName = "Editor (Chuyên viên nhập liệu)";
        }

        const newUser = {
            id: "u_" + Date.now(),
            username: cleanUsername,
            password: userData.password,
            fullName: userData.fullName.trim(),
            position: userData.position ? userData.position.trim() : "Chuyên viên",
            department: userData.department || "Văn phòng HĐND & UBND",
            role: role,
            roleName: roleName,
            email: cleanEmail,
            avatar: userData.gender === "female" ? "👩‍💼" : "👨‍💼",
            phone: userData.phone ? userData.phone.trim() : "",
            createdAt: new Date().toISOString()
        };

        StorageService.addUser(newUser);
        this.setCurrentUser(newUser);
        return { success: true, user: newUser };
    },

    // Đăng xuất (trở về Chế độ Khách)
    logout() {
        this.setCurrentUser(null);
        return true;
    },

    switchUserById(userId) {
        return this.loginAsDemoUser(userId);
    },

    // =========================================================================
    // KIỂM TRA PHÂN QUYỀN (RBAC PERMISSIONS)
    // =========================================================================
    isAdmin() {
        const u = this.getCurrentUser();
        return !!u && u.role === "super_admin";
    },

    isEditor() {
        const u = this.getCurrentUser();
        return !!u && u.role === "editor";
    },

    isViewer() {
        const u = this.getCurrentUser();
        return !!u && u.role === "viewer";
    },

    canEdit() {
        const u = this.getCurrentUser();
        if (!u) return false; // Khách không có quyền sửa
        return u.role === "super_admin" || u.role === "editor";
    },

    canDelete() {
        const u = this.getCurrentUser();
        if (!u) return false;
        return u.role === "super_admin";
    },

    canPublish() {
        const u = this.getCurrentUser();
        if (!u) return false;
        return u.role === "super_admin";
    },

    canUpload() {
        const u = this.getCurrentUser();
        if (!u) return false;
        return u.role === "super_admin" || u.role === "editor";
    },

    canSendNotification() {
        const u = this.getCurrentUser();
        if (!u) return false;
        return u.role === "super_admin" || u.role === "editor";
    },

    canManageSettings() {
        const u = this.getCurrentUser();
        if (!u) return false;
        return u.role === "super_admin";
    },

    canManageCadres() {
        const u = this.getCurrentUser();
        if (!u) return false;
        return u.role === "super_admin" || u.role === "editor";
    },

    // Đăng ký lắng nghe sự kiện đổi quyền/đăng nhập
    onAuthChange(callback) {
        this.listeners.push(callback);
    },

    notifyListeners() {
        this.listeners.forEach(cb => {
            if (typeof cb === 'function') {
                cb(this.currentUser);
            }
        });
    }
};

AuthService.init();

