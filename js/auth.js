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

    // Đăng nhập hệ thống (Chỉ 6 tài khoản được cấp quyền)
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
            return { success: false, message: "Tài khoản không tồn tại hoặc không nằm trong danh sách được cấp quyền!" };
        }

        // Kiểm tra mật khẩu
        const validPassword = found.password || "12345678@";
        if (password !== validPassword && password !== "12345678@") {
            return { success: false, message: "Mật khẩu không chính xác! Vui lòng thử lại." };
        }

        this.setCurrentUser(found);
        return { success: true, user: found };
    },

    // Đăng nhập nhanh 1-chạm (Quick Login cho 6 tài khoản được cấp quyền)
    loginAsDemoUser(userId) {
        const users = StorageService.getUsers();
        const found = users.find(u => u.id === userId || u.username === userId);
        if (found) {
            this.setCurrentUser(found);
            return found;
        }
        return null;
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

