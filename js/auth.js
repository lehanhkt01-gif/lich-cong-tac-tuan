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
        if (!this.currentUser) {
            this.currentUser = StorageService.getCurrentUser();
        }
        return this.currentUser;
    },

    setCurrentUser(user) {
        this.currentUser = user;
        StorageService.setCurrentUser(user);
        this.notifyListeners();
    },

    switchUserById(userId) {
        const users = StorageService.getUsers();
        const found = users.find(u => u.id === userId);
        if (found) {
            this.setCurrentUser(found);
            return found;
        }
        return null;
    },

    // Kiểm tra quyền hạn
    isAdmin() {
        return this.getCurrentUser().role === "super_admin";
    },

    isEditor() {
        return this.getCurrentUser().role === "editor";
    },

    isViewer() {
        return this.getCurrentUser().role === "viewer";
    },

    canEdit() {
        const role = this.getCurrentUser().role;
        return role === "super_admin" || role === "editor";
    },

    canDelete() {
        return this.getCurrentUser().role === "super_admin";
    },

    canPublish() {
        return this.getCurrentUser().role === "super_admin";
    },

    canUpload() {
        const role = this.getCurrentUser().role;
        return role === "super_admin" || role === "editor";
    },

    canSendNotification() {
        const role = this.getCurrentUser().role;
        return role === "super_admin" || role === "editor";
    },

    canManageSettings() {
        return this.getCurrentUser().role === "super_admin";
    },

    // Đăng ký lắng nghe sự kiện đổi quyền
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
