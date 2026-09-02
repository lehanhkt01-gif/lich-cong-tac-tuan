/**
 * BỘ ĐIỀU KHIỂN CHÍNH - MAIN APPLICATION CONTROLLER
 * Cổng thông tin điều hành - Quản lý lịch công tác tuần UBND Xã Ea Súp
 */

const App = {
    currentYear: 2026,
    currentWeek: 35,
    currentBloc: "all",
    searchQuery: "",
    activeTab: "schedule",
    currentSchedule: null,
    editingItemId: null,

    init() {
        const currentInfo = StorageService.getCurrentWeekInfo(new Date());
        this.currentYear = currentInfo.year;
        this.currentWeek = currentInfo.weekNumber;

        this.populateWeekOptions();
        this.loadCurrentSchedule();
        this.setupLiveClock();
        this.setupEventListeners();
        this.setupAuthUI();
        this.renderAll();
    },

    populateWeekOptions() {
        const weekSelect = document.getElementById("weekSelect");
        if (weekSelect) {
            StorageService.populateWeekSelect(weekSelect, this.currentWeek, this.currentYear);
        }
        const yearSelect = document.getElementById("yearSelect");
        if (yearSelect) {
            yearSelect.value = this.currentYear;
        }
    },

    loadCurrentSchedule() {
        this.currentSchedule = StorageService.getScheduleByWeek(this.currentYear, this.currentWeek);
    },

    getMondayOfWeek(weekNo, year) {
        const simple = new Date(year, 0, 1 + (weekNo - 1) * 7);
        const dayOfWeek = simple.getDay();
        const ISOweekStart = simple;
        if (dayOfWeek <= 4) {
            ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
        } else {
            ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
        }
        return ISOweekStart;
    },

    // Đồng hồ thời gian thực
    setupLiveClock() {
        const updateClock = () => {
            const now = new Date();
            const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
            const dayName = days[now.getDay()];
            const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const dateStr = `${dayName}, ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
            
            const timeEl = document.getElementById("liveTime");
            const dateEl = document.getElementById("liveDate");
            if (timeEl) timeEl.textContent = timeStr;
            if (dateEl) dateEl.textContent = dateStr;
        };
        updateClock();
        setInterval(updateClock, 1000);
    },

    setupAuthUI() {
        this.updateUIPermissions();

        AuthService.onAuthChange((u) => {
            this.updateUIPermissions();
            this.renderAll();
        });
    },

    updateUIPermissions() {
        const user = AuthService.getCurrentUser();
        const isGuest = !user;
        const canEdit = AuthService.canEdit();
        const canDelete = AuthService.canDelete();
        const isViewer = AuthService.isViewer();
        const isAdmin = AuthService.isAdmin();

        const guestHeader = document.getElementById("guestHeaderGroup");
        const userProfile = document.getElementById("userProfileBadge");

        if (isGuest) {
            if (guestHeader) guestHeader.style.display = "flex";
            if (userProfile) userProfile.style.display = "none";
        } else {
            if (guestHeader) guestHeader.style.display = "none";
            if (userProfile) userProfile.style.display = "block";

            const avatarEl = document.getElementById("headerUserAvatar");
            const nameEl = document.getElementById("headerUserName");
            const roleEl = document.getElementById("headerUserRole");
            const dropName = document.getElementById("dropdownUserFullName");
            const dropEmail = document.getElementById("dropdownUserEmail");
            const dropRole = document.getElementById("dropdownUserRoleName");

            if (avatarEl) avatarEl.textContent = user.avatar || "👤";
            if (nameEl) nameEl.textContent = user.fullName;
            if (roleEl) roleEl.textContent = user.roleName;
            if (dropName) dropName.textContent = user.fullName;
            if (dropEmail) dropEmail.textContent = user.email || "";
            if (dropRole) dropRole.textContent = `● ${user.roleName}`;
        }

        // Ẩn/hiện các nút Thêm, Sửa, Xóa, Cài Đặt theo quyền
        document.querySelectorAll(".auth-require-edit").forEach(el => {
            el.style.display = canEdit ? "" : "none";
        });

        document.querySelectorAll(".auth-require-delete").forEach(el => {
            el.style.display = canDelete ? "" : "none";
        });

        document.querySelectorAll(".auth-require-admin").forEach(el => {
            el.style.display = isAdmin ? "" : "none";
        });

        document.querySelectorAll(".auth-require-login").forEach(el => {
            el.style.display = isGuest ? "none" : "inline-flex";
        });
    },

    setupEventListeners() {
        // Dropdown năm & tuần
        const yearSelect = document.getElementById("yearSelect");
        if (yearSelect) {
            yearSelect.addEventListener("change", (e) => {
                this.currentYear = parseInt(e.target.value, 10);
                this.populateWeekOptions();
                this.loadCurrentSchedule();
                this.renderAll();
            });
        }

        const weekSelect = document.getElementById("weekSelect");
        if (weekSelect) {
            weekSelect.addEventListener("change", (e) => {
                this.currentWeek = parseInt(e.target.value, 10);
                this.loadCurrentSchedule();
                this.renderAll();
            });
        }

        // Quick week nav
        document.getElementById("btnPrevWeek")?.addEventListener("click", () => {
            if (this.currentWeek > 1) {
                this.currentWeek--;
                this.populateWeekOptions();
                this.loadCurrentSchedule();
                this.renderAll();
            }
        });

        document.getElementById("btnNextWeek")?.addEventListener("click", () => {
            if (this.currentWeek < 52) {
                this.currentWeek++;
                this.populateWeekOptions();
                this.loadCurrentSchedule();
                this.renderAll();
            }
        });

        document.getElementById("btnCurrentWeek")?.addEventListener("click", () => {
            const currentInfo = StorageService.getCurrentWeekInfo(new Date());
            this.currentWeek = currentInfo.weekNumber;
            this.currentYear = currentInfo.year;
            this.populateWeekOptions();
            this.loadCurrentSchedule();
            this.renderAll();
        });

        // Search input
        document.getElementById("searchInput")?.addEventListener("input", (e) => {
            this.searchQuery = e.target.value.toLowerCase().trim();
            this.renderScheduleTable();
        });

        // Navigation Tabs
        document.querySelectorAll(".nav-tab-item").forEach(tab => {
            tab.addEventListener("click", (e) => {
                const targetTab = tab.getAttribute("data-tab");
                if (targetTab) this.switchTab(targetTab);
            });
        });

        // Role menu toggle
        const profileBadge = document.getElementById("userProfileBadge");
        const roleMenu = document.getElementById("roleDropdownMenu");
        if (profileBadge && roleMenu) {
            profileBadge.addEventListener("click", (e) => {
                e.stopPropagation();
                roleMenu.classList.toggle("show");
            });

            document.addEventListener("click", () => {
                roleMenu.classList.remove("show");
            });
        }

        // Chọn vai trò
        document.querySelectorAll(".role-item").forEach(item => {
            item.addEventListener("click", () => {
                const uid = item.getAttribute("data-user-id");
                if (uid) {
                    AuthService.switchUserById(uid);
                    document.querySelectorAll(".role-item").forEach(i => i.classList.remove("active"));
                    item.classList.add("active");
                }
            });
        });

        // Bottom Actions
        document.getElementById("btnHistoryAudit")?.addEventListener("click", () => this.openAuditHistoryModal());
        document.getElementById("btnExportWord")?.addEventListener("click", () => ExportService.exportToWord(this.currentSchedule));
        document.getElementById("btnExportPDF")?.addEventListener("click", () => ExportService.printSchedule());
        document.getElementById("btnNotifyEmail")?.addEventListener("click", () => this.openEmailModal());
        document.getElementById("btnSavePublish")?.addEventListener("click", () => this.handleSaveAndPublish());

        // Tạo mới lịch tuần modal
        document.getElementById("btnCreateNewWeek")?.addEventListener("click", () => {
            if (!AuthService.canEdit()) {
                this.openLoginModal("Vui lòng đăng nhập để lập lịch tuần mới!");
                return;
            }
            this.openCreateWeekModal();
        });

        // Lọc theo Khối công tác
        document.querySelectorAll(".bloc-pill-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                document.querySelectorAll(".bloc-pill-btn").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                this.currentBloc = btn.getAttribute("data-bloc") || "all";
                this.renderScheduleTable();
            });
        });

        // Tìm kiếm & lọc danh bạ cán bộ
        document.getElementById("cadreSearchInput")?.addEventListener("input", () => this.renderCadresView());
        document.getElementById("cadreDeptFilter")?.addEventListener("change", () => this.renderCadresView());
    },

    switchTab(tabName) {
        if (tabName === "settings" && !AuthService.canManageSettings()) {
            if (AuthService.isGuest()) {
                this.openLoginModal("Vui lòng đăng nhập với quyền Super Admin để truy cập Cài Đặt Hệ Thống!");
            } else {
                this.showToast("Chỉ Super Admin (Lãnh đạo đơn vị) mới có quyền truy cập Cài Đặt Hệ Thống!", "warning");
            }
            return;
        }

        this.activeTab = tabName;
        document.querySelectorAll(".nav-tab-item").forEach(t => t.classList.remove("active"));
        document.querySelector(`.nav-tab-item[data-tab="${tabName}"]`)?.classList.add("active");

        document.querySelectorAll(".view-section").forEach(s => s.classList.remove("active"));
        document.getElementById(`view_${tabName}`)?.classList.add("active");

        if (tabName === "dashboard") this.renderDashboard();
        if (tabName === "archive") this.renderArchiveView();
        if (tabName === "cadres") this.renderCadresView();
        if (tabName === "settings") this.renderSettingsView();
        if (tabName === "schedule") this.renderScheduleTable();
    },

    renderAll() {
        this.renderScheduleHeaderInfo();
        this.renderScheduleTable();
        if (this.activeTab === "dashboard") this.renderDashboard();
    },

    renderScheduleHeaderInfo() {
        const s = this.currentSchedule;
        if (!s) return;

        const titleEl = document.getElementById("scheduleBannerTitle");
        const datesEl = document.getElementById("scheduleBannerDates");
        const statusEl = document.getElementById("scheduleBannerStatus");

        if (titleEl) titleEl.textContent = s.title;
        if (datesEl) {
            const start = s.startDate.split('-').reverse().join('/');
            const end = s.endDate.split('-').reverse().join('/');
            datesEl.innerHTML = `<strong>Thời gian:</strong> Từ ngày ${start} đến ngày ${end} | <strong>Cập nhật lần cuối:</strong> ${s.lastUpdated || ''} bởi ${s.updatedBy || ''}`;
        }
        if (statusEl) {
            const isPub = s.status === "published";
            statusEl.className = `schedule-status-badge ${isPub ? 'status-published' : 'status-draft'}`;
            statusEl.innerHTML = isPub ? `✅ Đã Ban Hành Chính Thức` : `📝 Đang Dự Thảo`;
        }

        // Bottom bar
        const bottomInfo = document.querySelector(".bottom-info-left");
        if (bottomInfo) {
            const isPub = s.status === "published";
            bottomInfo.innerHTML = `
                <span style="font-weight: 700; color: var(--gov-primary);">XÃ EA SÚP</span>
                <span>• Lịch Tuần ${s.weekNumber}/${s.year}</span>
                <span class="schedule-status-badge ${isPub ? 'status-published' : 'status-draft'}">${isPub ? 'Chính Thức' : 'Dự Thảo'}</span>
            `;
        }

        // Print header & dates
        const printTitle = document.getElementById("printScheduleTitle");
        const printDates = document.getElementById("printScheduleDates");
        const printIssueDate = document.getElementById("printIssueDate");

        if (printTitle) {
            printTitle.textContent = `LỊCH CÔNG TÁC TUẦN THỨ ${s.weekNumber} NĂM ${s.year}`;
        }
        if (printDates) {
            const start = s.startDate.split('-').reverse().join('/');
            const end = s.endDate.split('-').reverse().join('/');
            printDates.textContent = `(Từ ngày ${start} đến ngày ${end})`;
        }
        if (printIssueDate) {
            const now = new Date();
            const day = String(now.getDate()).padStart(2, '0');
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const year = now.getFullYear();
            printIssueDate.textContent = `Ea Súp, ngày ${day} tháng ${month} năm ${year}`;
        }
    },

    renderScheduleTable() {
        const tbody = document.getElementById("scheduleTableBody");
        if (!tbody) return;

        const s = this.currentSchedule;
        if (!s || !s.items || s.items.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" style="text-align: center; padding: 40px; color: #64748B;">
                        <div style="font-size: 36px; margin-bottom: 8px;">📅</div>
                        <div style="font-size: 15px; font-weight: 700;">Chưa có mục công tác nào trong Tuần ${this.currentWeek}/${this.currentYear}</div>
                        <p style="font-size: 13px; margin-top: 4px;">Nhấn nút <strong>"+ Thêm Công Tác Mới"</strong> hoặc <strong>"Sao chép từ tuần trước"</strong> để bắt đầu lập lịch.</p>
                        ${AuthService.canEdit() ? `<button onclick="App.openEditItemModal()" class="btn-primary-create" style="margin-top: 14px;">+ Thêm Mục Đầu Tiên</button>` : ''}
                    </td>
                </tr>
            `;
            return;
        }

        // Lọc theo Khối & Tìm kiếm
        let filteredItems = s.items.filter(item => {
            const matchBloc = this.currentBloc === "all" || item.bloc === this.currentBloc;
            const matchSearch = !this.searchQuery || 
                (item.content && item.content.toLowerCase().includes(this.searchQuery)) ||
                (item.leader && item.leader.toLowerCase().includes(this.searchQuery)) ||
                (item.location && item.location.toLowerCase().includes(this.searchQuery)) ||
                (item.participants && item.participants.toLowerCase().includes(this.searchQuery));
            return matchBloc && matchSearch;
        });

        // Nhóm theo ngày (Thứ 2 đến Chủ nhật)
        const daysOrder = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"];
        const grouped = {};
        daysOrder.forEach(d => grouped[d] = []);

        filteredItems.forEach(item => {
            if (!grouped[item.dayOfWeek]) grouped[item.dayOfWeek] = [];
            grouped[item.dayOfWeek].push(item);
        });

        let html = "";
        const canEdit = AuthService.canEdit();
        const canDelete = AuthService.canDelete();

        daysOrder.forEach(dayName => {
            const dayItems = grouped[dayName];
            // Sắp xếp theo trình tự thời gian: sự kiện nào trước thì nằm trên
            dayItems.sort((a, b) => StorageService.compareTime(a.time, b.time));

            if (dayItems.length === 0 && (this.currentBloc !== "all" || this.searchQuery)) {
                return; // Khi đang lọc thì ẩn ngày không có kết quả
            }

            // Lấy ngày tháng từ item đầu tiên hoặc tính toán
            let dateStr = "";
            if (dayItems.length > 0 && dayItems[0].date) {
                dateStr = dayItems[0].date.split('-').reverse().slice(0, 2).join('/');
            }

            // Header phân cách từng ngày
            html += `
                <tr class="day-divider-row">
                    <td colspan="8" class="day-divider-content">
                        <span class="day-name">${dayName}</span>
                        ${dateStr ? `<span class="day-date">(${dateStr})</span>` : ''}
                        <span class="day-item-count">${dayItems.length} cuộc họp/công việc</span>
                        ${canEdit ? `<button onclick="App.openEditItemModal(null, '${dayName}')" class="btn-action-icon" style="margin-left: 10px; width: auto; padding: 2px 8px; font-size: 11.5px; font-weight: bold;" title="Thêm việc cho ngày này">+ Thêm việc</button>` : ''}
                    </td>
                </tr>
            `;

            if (dayItems.length === 0) {
                html += `
                    <tr class="item-row">
                        <td colspan="8" style="text-align: center; color: #94A3B8; font-style: italic; padding: 10px;">
                            (Không có lịch công tác)
                        </td>
                    </tr>
                `;
            } else {
                dayItems.forEach((item, idx) => {
                    const blocBadgeClass = this.getBlocBadgeClass(item.bloc);
                    const attachmentHTML = item.attachment ? `
                        <button class="btn-attachment-badge" onclick="App.previewAttachment('${item.attachment.id || ''}', '${escapeHTML(item.attachment.name || '')}', '${escapeHTML(item.content)}')">
                            📄 ${escapeHTML(item.attachment.badge || item.attachment.name || 'Giấy mời')}
                        </button>
                    ` : `<span class="no-attachment-tag">—</span>`;

                    html += `
                        <tr class="item-row" data-item-id="${item.id}">
                            <td class="col-time-cell">
                                <span class="time-pill">${item.time}</span>
                            </td>
                            <td>
                                <span class="badge-bloc ${blocBadgeClass}">${item.bloc || 'UBND'}</span>
                            </td>
                            <td>
                                <div class="content-title">${escapeHTML(item.content)}</div>
                                <div class="content-location">📍 <strong>Địa điểm:</strong> ${escapeHTML(item.location)}</div>
                            </td>
                            <td class="col-leader-cell">
                                <div class="leader-name">👤 ${escapeHTML(item.leader)}</div>
                            </td>
                            <td class="col-participants-cell">
                                ${escapeHTML(item.participants)}
                            </td>
                            <td class="col-vehicle-cell">
                                🚗 ${escapeHTML(item.vehicle || 'Tự túc')}
                            </td>
                            <td class="col-attachment-cell">
                                ${attachmentHTML}
                            </td>
                            <td class="col-actions-cell">
                                <div class="action-buttons-group">
                                    <button class="btn-action-icon" title="Xem chi tiết" onclick="App.viewItemDetail('${item.id}')">👁️</button>
                                    ${canEdit ? `<button class="btn-action-icon btn-edit" title="Sửa công tác" onclick="App.openEditItemModal('${item.id}')">✏️</button>` : ''}
                                    ${canEdit ? `<button class="btn-action-icon" title="Nhân bản việc này" onclick="App.duplicateItem('${item.id}')">📋</button>` : ''}
                                    ${canDelete ? `<button class="btn-action-icon btn-delete" title="Xóa" onclick="App.deleteItem('${item.id}')">🗑️</button>` : ''}
                                </div>
                            </td>
                        </tr>
                    `;
                });
            }
        });

        tbody.innerHTML = html;
    },

    getBlocBadgeClass(bloc) {
        if (!bloc) return "badge-ubnd";
        if (bloc.includes("Đảng")) return "badge-danguy";
        if (bloc.includes("HĐND")) return "badge-hdnd";
        if (bloc.includes("MTTQ") || bloc.includes("Thường trực")) return "badge-mttq";
        if (bloc.includes("Khác") || bloc.includes("Đoàn thể")) return "badge-khac";
        return "badge-ubnd";
    },

    // =========================================================================
    // MODAL THÊM / SỬA MỤC CÔNG TÁC
    // =========================================================================
    openEditItemModal(itemId = null, prefillDay = null) {
        if (!AuthService.canEdit()) {
            this.openLoginModal("Vui lòng đăng nhập tài khoản để thêm hoặc chỉnh sửa lịch công tác!");
            return;
        }

        this.editingItemId = itemId;
        const modal = document.getElementById("modalEditItem");
        const modalTitle = document.getElementById("modalEditItemTitle");
        
        let item = {
            id: null,
            dayOfWeek: prefillDay || "Thứ Hai",
            date: "",
            time: "08h00",
            bloc: "UBND",
            content: "",
            location: "Hội trường lớn UBND xã",
            leader: "Đ/c Nguyễn Bá Bân - Chủ tịch UBND xã",
            participants: "Lãnh đạo UBND xã và các công chức chuyên môn liên quan.",
            vehicle: "Tự túc phương tiện",
            attachment: null
        };

        if (itemId) {
            const found = (this.currentSchedule.items || []).find(i => i.id === itemId);
            if (found) item = JSON.parse(JSON.stringify(found));
            if (modalTitle) modalTitle.textContent = "✏️ Chỉnh sửa mục công tác";
        } else {
            if (modalTitle) modalTitle.textContent = "➕ Thêm mới mục công tác tuần";
        }

        // Điền form
        document.getElementById("formItemDay").value = item.dayOfWeek;
        document.getElementById("formItemTime").value = item.time;
        document.getElementById("formItemBloc").value = item.bloc || "UBND";
        document.getElementById("formItemContent").value = item.content;
        document.getElementById("formItemLocation").value = item.location;
        document.getElementById("formItemLeader").value = item.leader;
        document.getElementById("formItemParticipants").value = item.participants;
        document.getElementById("formItemVehicle").value = item.vehicle || "Tự túc phương tiện";
        document.getElementById("formEditReason").value = itemId ? "Điều chỉnh thời gian/nội dung họp" : "Thêm mới cuộc họp";

        // Attachment box
        this.renderAttachmentUploadBox(item.attachment);

        modal.classList.add("show");
    },

    renderAttachmentUploadBox(attachment) {
        const previewBox = document.getElementById("attachmentPreviewArea");
        if (!previewBox) return;

        if (attachment) {
            previewBox.innerHTML = `
                <div class="file-attached-preview">
                    <div>
                        <strong>📄 ${escapeHTML(attachment.name || attachment.badge || 'Tệp đã đính kèm')}</strong>
                        <div style="font-size: 11px; color: #64748B;">Giấy mời / Tài liệu phục vụ cuộc họp</div>
                    </div>
                    <button type="button" class="btn-action-icon btn-delete" onclick="App.removeCurrentAttachment()" title="Gỡ tệp">❌</button>
                </div>
            `;
            previewBox.setAttribute("data-attached", JSON.stringify(attachment));
        } else {
            previewBox.innerHTML = `
                <div class="file-upload-box" onclick="document.getElementById('fileUploadInput').click()">
                    <div style="font-size: 24px;">📁</div>
                    <div style="font-size: 13px; font-weight: 700; color: #0F4C81; margin-top: 4px;">Tải lên Giấy mời (PDF hoặc Ảnh)</div>
                    <div style="font-size: 11px; color: #64748B;">Hệ thống tự động chuẩn hóa tên tệp theo mã cuộc họp</div>
                </div>
            `;
            previewBox.removeAttribute("data-attached");
        }
    },

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const u = AuthService.getCurrentUser();
        const uploaderName = u ? `${u.fullName} (${u.roleName})` : "Cán bộ nhập liệu";

        const attachmentObj = {
            id: "doc_gm_" + Date.now(),
            name: file.name,
            badge: `📄 GM (${file.name.substring(0, 18)}...)`,
            size: `${Math.round(file.size / 1024)} KB`,
            type: file.type,
            uploadDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
            uploader: uploaderName
        };

        this.renderAttachmentUploadBox(attachmentObj);
        this.showToast(`Đã đính kèm tệp: ${file.name}`, "success");
    },

    removeCurrentAttachment() {
        this.renderAttachmentUploadBox(null);
    },

    saveItemFromModal() {
        if (!AuthService.canEdit()) {
            this.openLoginModal("Vui lòng đăng nhập tài khoản có quyền để lưu mục công tác!");
            return;
        }

        const dayOfWeek = document.getElementById("formItemDay").value;
        const time = document.getElementById("formItemTime").value.trim();
        const bloc = document.getElementById("formItemBloc").value;
        const content = document.getElementById("formItemContent").value.trim();
        const location = document.getElementById("formItemLocation").value.trim();
        const leader = document.getElementById("formItemLeader").value.trim();
        const participants = document.getElementById("formItemParticipants").value.trim();
        const vehicle = document.getElementById("formItemVehicle").value.trim();
        const reason = document.getElementById("formEditReason").value.trim();

        if (!time || !content || !leader) {
            alert("Vui lòng nhập đầy đủ Thời gian, Nội dung công tác và Người chủ trì!");
            return;
        }

        const previewBox = document.getElementById("attachmentPreviewArea");
        const attachedDataStr = previewBox?.getAttribute("data-attached");
        const attachment = attachedDataStr ? JSON.parse(attachedDataStr) : null;

        const itemDate = this.currentSchedule?.startDate ? 
            StorageService.calculateDateForDay(this.currentSchedule.startDate, dayOfWeek) : "";

        const itemData = {
            id: this.editingItemId,
            dayOfWeek,
            date: itemDate,
            time,
            bloc,
            content,
            location,
            leader,
            participants,
            vehicle,
            attachment
        };

        const result = StorageService.saveScheduleItem(this.currentSchedule.id, itemData);
        if (result) {
            // Ghi nhận Audit Log
            const action = this.editingItemId ? "UPDATE" : "CREATE";
            AuditService.logItemChange(result.schedule, action, result.oldItem, result.newItem, reason);

            this.currentSchedule = result.schedule;
            this.renderAll();
            this.closeModal('modalEditItem');
            this.showToast(this.editingItemId ? "Đã cập nhật mục công tác và ghi nhận vết sửa!" : "Đã thêm mục công tác mới vào lịch tuần!", "success");
        }
    },

    duplicateItem(itemId) {
        if (!AuthService.canEdit()) {
            this.openLoginModal("Vui lòng đăng nhập tài khoản để nhân bản mục công tác!");
            return;
        }

        const item = this.currentSchedule.items.find(i => i.id === itemId);
        if (!item) return;

        const copy = JSON.parse(JSON.stringify(item));
        copy.id = null;
        copy.content = "[Nhân bản] " + copy.content;

        const result = StorageService.saveScheduleItem(this.currentSchedule.id, copy);
        if (result) {
            AuditService.logItemChange(result.schedule, "CREATE", null, result.newItem, "Nhân bản từ mục trước");
            this.currentSchedule = result.schedule;
            this.renderAll();
            this.showToast("Đã nhân bản mục công tác!", "success");
        }
    },

    deleteItem(itemId) {
        if (!AuthService.canDelete()) {
            this.openLoginModal("Chỉ Super Admin (Lãnh đạo đơn vị) mới có quyền xóa mục công tác!");
            return;
        }

        if (!confirm("Bạn có chắc chắn muốn xóa mục công tác này khỏi lịch tuần?")) return;

        const result = StorageService.deleteScheduleItem(this.currentSchedule.id, itemId);
        if (result) {
            AuditService.logItemChange(result.schedule, "DELETE", result.deletedItem, null, "Xóa theo yêu cầu điều chỉnh lịch");
            this.currentSchedule = result.schedule;
            this.renderAll();
            this.showToast("Đã xóa mục công tác và ghi nhận vào lịch sử!", "success");
        }
    },

    viewItemDetail(itemId) {
        const item = this.currentSchedule.items.find(i => i.id === itemId);
        if (!item) return;

        const contentEl = document.getElementById("viewDetailContent");
        if (!contentEl) return;

        contentEl.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 14px;">
                <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #E2E8F0; padding-bottom: 10px;">
                    <div>
                        <span class="badge-bloc ${this.getBlocBadgeClass(item.bloc)}">${item.bloc}</span>
                        <strong style="margin-left: 8px; font-size: 15px; color: #0F4C81;">${item.dayOfWeek} (${item.time})</strong>
                    </div>
                    <div>📍 ${escapeHTML(item.location)}</div>
                </div>

                <div>
                    <div style="font-size: 12px; color: #64748B; font-weight: bold; text-transform: uppercase;">Nội dung công tác:</div>
                    <div style="font-size: 15px; font-weight: 700; color: #0F172A; margin-top: 4px; line-height: 1.5;">${escapeHTML(item.content)}</div>
                </div>

                <div style="background: #F8FAFC; padding: 12px 16px; border-radius: 8px; border: 1px solid #E2E8F0;">
                    <div style="margin-bottom: 6px;">
                        <strong style="color: #991B1B;">👤 Lãnh đạo dự / Chủ trì:</strong> ${escapeHTML(item.leader)}
                    </div>
                    <div style="margin-bottom: 6px;">
                        <strong>👥 Thành phần tham dự:</strong> ${escapeHTML(item.participants)}
                    </div>
                    <div>
                        <strong>🚗 Phương tiện bố trí:</strong> ${escapeHTML(item.vehicle || 'Tự túc')}
                    </div>
                </div>

                ${item.attachment ? `
                    <div style="background: #F0FDF4; border: 1px solid #86EFAC; border-radius: 8px; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between;">
                        <div>
                            <div style="font-weight: bold; color: #166534;">📄 ${escapeHTML(item.attachment.name || 'Giấy mời họp')}</div>
                            <div style="font-size: 11px; color: #475569;">Dung lượng: ${item.attachment.size || '340 KB'} | Người tải: ${item.attachment.uploader || 'Văn phòng'}</div>
                        </div>
                        <button class="btn-primary-create" style="padding: 6px 14px; font-size: 12px;" onclick="App.previewAttachment('${item.attachment.id}', '${escapeHTML(item.attachment.name)}', '${escapeHTML(item.content)}')">👁️ Xem Giấy Mời</button>
                    </div>
                ` : ''}
            </div>
        `;

        this.openModal("modalViewItemDetail");
    },

    // =========================================================================
    // MODAL AUDIT TRAIL (LỊCH SỬ SỬA & SO SÁNH DIFF ĐỎ/XANH)
    // =========================================================================
    openAuditHistoryModal() {
        const modal = document.getElementById("modalAuditHistory");
        const listEl = document.getElementById("auditLogListArea");
        const logs = AuditService.getLogsForWeek(this.currentSchedule.id);

        if (logs.length === 0) {
            listEl.innerHTML = `<div style="text-align: center; padding: 30px; color: #64748B;">Chưa có lịch sử sửa đổi nào cho Tuần ${this.currentWeek}/${this.currentYear}.</div>`;
        } else {
            let html = "";
            logs.forEach(log => {
                const diffTableHTML = AuditService.renderDiffHTML(log.changes);
                html += `
                    <div class="audit-log-item">
                        <div class="audit-log-header">
                            <div>
                                <span class="audit-editor-info">👤 ${escapeHTML(log.editorName)}</span>
                                <span style="margin-left: 8px; font-size: 12px; font-weight: 700; color: #0F4C81;">[${log.actionTitle}]</span>
                            </div>
                            <div class="audit-timestamp">🕒 ${log.timestamp}</div>
                        </div>
                        <div style="padding: 8px 16px; font-size: 12px; color: #64748B; background: #FAF5FF; border-bottom: 1px solid #E2E8F0;">
                            <strong>Lý do điều chỉnh:</strong> ${escapeHTML(log.reason || 'Cập nhật định kỳ')}
                        </div>
                        ${diffTableHTML}
                    </div>
                `;
            });
            listEl.innerHTML = html;
        }

        this.openModal("modalAuditHistory");
    },

    // =========================================================================
    // PREVIEW GIẤY MỜI / PDF MODAL
    // =========================================================================
    previewAttachment(docId, docName, meetingTitle) {
        const titleEl = document.getElementById("docPreviewTitle");
        const bodyEl = document.getElementById("docPreviewBody");
        const org = StorageService.getOrganization();

        if (titleEl) titleEl.textContent = `📄 ${docName || 'Giấy mời số 89/GM-UBND'}`;

        if (bodyEl) {
            bodyEl.innerHTML = `
                <div style="background: #FFFFFF; border: 1px solid #CBD5E1; box-shadow: 0 4px 6px rgba(0,0,0,0.05); padding: 30px; max-width: 700px; margin: 0 auto; font-family: 'Times New Roman', serif;">
                    <!-- HEADER GIẤY MỜI -->
                    <table width="100%" style="border-collapse: collapse; margin-bottom: 20px;">
                        <tr>
                            <td width="45%" style="text-align: center; vertical-align: top; font-size: 12pt;">
                                <div>${org.province}</div>
                                <div style="font-weight: bold;">${org.fullName}</div>
                                <div style="border-bottom: 1px solid black; width: 40%; margin: 2px auto 4px auto;"></div>
                                <div>Số: 89/GM-UBND</div>
                            </td>
                            <td width="55%" style="text-align: center; vertical-align: top; font-size: 12pt;">
                                <div style="font-weight: bold;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                                <div style="font-weight: bold;">Độc lập - Tự do - Hạnh phúc</div>
                                <div style="border-bottom: 1px solid black; width: 50%; margin: 2px auto 4px auto;"></div>
                                <div style="font-style: italic;">Ea Súp, ngày 24 tháng 08 năm 2026</div>
                            </td>
                        </tr>
                    </table>

                    <!-- TIÊU ĐỀ GIẤY MỜI -->
                    <div style="text-align: center; margin: 24px 0;">
                        <div style="font-size: 16pt; font-weight: bold; text-transform: uppercase;">GIẤY MỜI</div>
                        <div style="font-size: 13pt; font-weight: bold; margin-top: 6px;">V/v ${escapeHTML(meetingTitle)}</div>
                    </div>

                    <!-- NỘI DUNG GIẤY MỜI -->
                    <div style="font-size: 13pt; line-height: 1.6; text-align: justify;">
                        <p style="text-indent: 20px; margin-bottom: 10px;">
                            Ủy ban nhân dân xã Ea Súp trân trọng kính mời các đồng chí tham dự phiên họp với các nội dung sau:
                        </p>
                        <p style="margin-left: 20px; margin-bottom: 8px;">
                            <strong>1. Nội dung:</strong> ${escapeHTML(meetingTitle)}
                        </p>
                        <p style="margin-left: 20px; margin-bottom: 8px;">
                            <strong>2. Thời gian:</strong> Theo lịch công tác tuần đã công bố trên Cổng điều hành.
                        </p>
                        <p style="margin-left: 20px; margin-bottom: 8px;">
                            <strong>3. Địa điểm:</strong> Trụ sở UBND xã Ea Súp.
                        </p>
                        <p style="margin-left: 20px; margin-bottom: 8px;">
                            <strong>4. Chủ trì:</strong> Thường trực UBND xã.
                        </p>
                        <p style="text-indent: 20px; margin-top: 14px;">
                            Đề nghị các đại biểu tham dự đúng giờ, chuẩn bị đầy đủ báo cáo, tài liệu để cuộc họp đạt kết quả tốt./.
                        </p>
                    </div>

                    <!-- CHỮ KÝ -->
                    <table width="100%" style="margin-top: 30px;">
                        <tr>
                            <td width="50%" style="font-size: 11pt; font-style: italic;">
                                <strong>Nơi nhận:</strong><br>
                                - Như thành phần mời;<br>
                                - Lưu: VT, VP.
                            </td>
                            <td width="50%" style="text-align: center; font-size: 13pt;">
                                <strong>TL. CHỦ TỊCH</strong><br>
                                <strong>CHÁNH VĂN PHÒNG</strong><br>
                                <div style="height: 50px;"></div>
                                <strong>Hà Tường Vi</strong>
                            </td>
                        </tr>
                    </table>
                </div>
            `;
        }

        this.openModal("modalDocPreview");
    },

    // =========================================================================
    // MODAL GỬI EMAIL THÔNG BÁO TỰ ĐỘNG
    // =========================================================================
    openEmailModal() {
        const cadres = StorageService.getCadres();
        const listEl = document.getElementById("emailCadresListArea");
        const previewIframe = document.getElementById("emailPreviewFrame");

        // Render checklist cán bộ nhận mail
        let checklistHTML = "";
        cadres.forEach(cadre => {
            checklistHTML += `
                <label style="display: flex; align-items: center; gap: 8px; padding: 6px 10px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; font-size: 12.5px; cursor: pointer;">
                    <input type="checkbox" name="cadreEmail" value="${cadre.email}" checked style="cursor: pointer;">
                    <div>
                        <strong style="color: #0F172A;">${escapeHTML(cadre.fullName)}</strong> 
                        <span style="color: #64748B;">(${cadre.position})</span>
                        <div style="font-size: 11px; color: #2563EB;">${cadre.email}</div>
                    </div>
                </label>
            `;
        });
        if (listEl) listEl.innerHTML = checklistHTML;

        // Render xem trước nội dung email
        const emailData = EmailService.generateEmailTemplate(this.currentSchedule);
        if (previewIframe) {
            previewIframe.srcdoc = emailData.body;
        }

        this.openModal("modalEmailNotification");
    },

    sendEmailNotificationNow() {
        const checkedBoxes = document.querySelectorAll("input[name='cadreEmail']:checked");
        const selectedEmails = Array.from(checkedBoxes).map(cb => cb.value);

        if (selectedEmails.length === 0) {
            alert("Vui lòng chọn ít nhất 01 cán bộ nhận email thông báo!");
            return;
        }

        const note = document.getElementById("emailCustomNote")?.value || "";
        const result = EmailService.sendNotification(this.currentSchedule, selectedEmails, note);

        if (result.success) {
            this.closeModal("modalEmailNotification");
            this.showToast(`Đã tự động gửi email thông báo lịch tuần đến ${selectedEmails.length} hòm thư công vụ!`, "success");
        }
    },

    // =========================================================================
    // MODAL TẠO MỚI LỊCH TUẦN & SAO CHÉP TỪ TUẦN TRƯỚC
    // =========================================================================
    openCreateWeekModal() {
        const nextWeek = this.currentWeek + 1;
        document.getElementById("createWeekNumber").value = nextWeek;
        document.getElementById("createWeekYear").value = this.currentYear;
        this.openModal("modalCreateWeek");
    },

    executeCreateWeek() {
        const weekNo = parseInt(document.getElementById("createWeekNumber").value);
        const year = parseInt(document.getElementById("createWeekYear").value);
        const copyFromPrev = document.getElementById("checkCopyFromPrev").checked;

        const startMonday = this.getMondayOfWeek(weekNo, year);
        const endSunday = new Date(startMonday);
        endSunday.setDate(startMonday.getDate() + 6);

        let initialItems = [];

        if (copyFromPrev) {
            // Lấy từ tuần hiện tại
            const prevSchedule = this.currentSchedule;
            if (prevSchedule && prevSchedule.items) {
                initialItems = prevSchedule.items.map(item => {
                    const cloned = JSON.parse(JSON.stringify(item));
                    cloned.id = "item_" + Math.random().toString(36).substr(2, 9);
                    cloned.attachment = null; // Gỡ giấy mời cũ
                    return cloned;
                });
            }
        }

        const newSched = {
            id: `sched_${year}_w${weekNo}`,
            year: year,
            weekNumber: weekNo,
            title: `Lịch công tác tuần ${weekNo} năm ${year}`,
            startDate: startMonday.toISOString().split('T')[0],
            endDate: endSunday.toISOString().split('T')[0],
            status: "draft",
            lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16),
            updatedBy: (AuthService.getCurrentUser() ? AuthService.getCurrentUser().fullName : "Hà Tường Vi"),
            approvedBy: "Nguyễn Bá Bân (Chủ tịch UBND xã)",
            note: copyFromPrev ? `Đã sao chép ${initialItems.length} mục công tác từ Tuần ${this.currentWeek}.` : "Tạo mới tuần công tác.",
            items: initialItems
        };

        StorageService.saveSchedule(newSched);
        this.currentYear = year;
        this.currentWeek = weekNo;
        
        const yearSelect = document.getElementById("yearSelect");
        const weekSelect = document.getElementById("weekSelect");
        if (yearSelect) yearSelect.value = year;
        if (weekSelect) weekSelect.value = weekNo;

        this.loadCurrentSchedule();
        this.renderAll();
        this.closeModal("modalCreateWeek");
        this.showToast(`Đã tạo thành công Lịch công tác Tuần ${weekNo}/${year}!`, "success");
    },

    // =========================================================================
    // LƯU & XUẤT BẢN LỊCH TUẦN
    // =========================================================================
    handleSaveAndPublish() {
        if (!AuthService.canPublish()) {
            alert("Chỉ Lãnh đạo hoặc Chánh/Phó Văn phòng (Super Admin) mới có quyền duyệt xuất bản lịch!");
            return;
        }

        this.currentSchedule.status = "published";
        this.currentSchedule.lastUpdated = new Date().toISOString().replace('T', ' ').substring(0, 16);
        this.currentSchedule.updatedBy = (AuthService.getCurrentUser() ? AuthService.getCurrentUser().fullName : "Hà Tường Vi");
        
        StorageService.saveSchedule(this.currentSchedule);
        this.renderScheduleHeaderInfo();
        this.showToast("Đã duyệt và XUẤT BẢN chính thức Lịch công tác Tuần!", "success");

        // Gợi ý gửi email
        setTimeout(() => {
            if (confirm("Lịch tuần đã được xuất bản chính thức. Bạn có muốn kích hoạt gửi EMAIL THÔNG BÁO ngay đến toàn thể cán bộ không?")) {
                this.openEmailModal();
            }
        }, 300);
    },

    // =========================================================================
    // VIEW DASHBOARD & STATS
    // =========================================================================
    renderDashboard() {
        const s = this.currentSchedule;
        if (!s) return;

        const totalItems = (s.items || []).length;
        const totalWithDocs = (s.items || []).filter(i => !!i.attachment).length;
        const totalCadres = StorageService.getCadres().length;
        const totalAudits = StorageService.getAuditLogs().length;

        document.getElementById("statTotalMeetings").textContent = totalItems;
        document.getElementById("statTotalDocs").textContent = totalWithDocs;
        document.getElementById("statTotalCadres").textContent = totalCadres;
        document.getElementById("statTotalAudits").textContent = totalAudits;

        // Today meetings preview
        const todayMeetingsList = document.getElementById("dashboardTodayMeetings");
        if (todayMeetingsList) {
            const todayItems = (s.items || []).slice(0, 4);
            if (todayItems.length === 0) {
                todayMeetingsList.innerHTML = `<div style="color: #64748B; font-size: 13px;">Không có cuộc họp nào hôm nay.</div>`;
            } else {
                let html = "";
                todayItems.forEach(item => {
                    html += `
                        <div style="padding: 10px 14px; background: #F8FAFC; border-radius: 6px; border: 1px solid #E2E8F0; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
                            <div>
                                <span class="time-pill">${item.time}</span>
                                <strong style="margin-left: 8px; color: #0F172A;">${escapeHTML(item.content)}</strong>
                                <div style="font-size: 12px; color: #64748B; margin-top: 2px;">📍 ${escapeHTML(item.location)} | 👤 ${escapeHTML(item.leader)}</div>
                            </div>
                            <span class="badge-bloc ${this.getBlocBadgeClass(item.bloc)}">${item.bloc}</span>
                        </div>
                    `;
                });
                todayMeetingsList.innerHTML = html;
            }
        }
    },

    // =========================================================================
    // VIEW ARCHIVE (LƯU TRỮ)
    // =========================================================================
    renderArchiveView() {
        const listEl = document.getElementById("archiveWeeksList");
        const schedules = StorageService.getAllSchedules();

        if (!listEl) return;

        let html = "";
        schedules.forEach(sched => {
            html += `
                <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <strong style="font-size: 15px; color: #0F4C81;">${sched.title}</strong>
                            <span class="schedule-status-badge ${sched.status === 'published' ? 'status-published' : 'status-draft'}">${sched.status === 'published' ? 'Đã Xuất Bản' : 'Dự Thảo'}</span>
                        </div>
                        <div style="font-size: 12.5px; color: #64748B; margin-top: 4px;">
                            Thời gian: ${sched.startDate} đến ${sched.endDate} | Số cuộc họp: <strong>${(sched.items || []).length}</strong> | Cập nhật: ${sched.lastUpdated}
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn-action-icon" style="width: auto; padding: 6px 12px; font-weight: bold;" onclick="App.loadArchivedWeek(${sched.year}, ${sched.weekNumber})">📂 Mở Lịch Tuần</button>
                        <button class="btn-action-icon btn-export-word" style="width: auto; padding: 6px 12px;" onclick="ExportService.exportToWord(StorageService.getScheduleById('${sched.id}'))">📥 Tải Word</button>
                    </div>
                </div>
            `;
        });

        listEl.innerHTML = html;
    },

    loadArchivedWeek(year, weekNumber) {
        this.currentYear = year;
        this.currentWeek = weekNumber;
        document.getElementById("yearSelect").value = year;
        document.getElementById("weekSelect").value = weekNumber;
        this.loadCurrentSchedule();
        this.switchTab("schedule");
        this.renderAll();
        this.showToast(`Đã tải dữ liệu Lịch công tác Tuần ${weekNumber}/${year}`, "success");
    },

    // =========================================================================
    // VIEW CADRES & EMAILS (DANH BẠ CÁN BỘ)
    // =========================================================================
    renderCadresView() {
        const tbody = document.getElementById("cadresTableBody");
        const countBadge = document.getElementById("cadresCountBadge");
        const cadres = StorageService.getCadres();
        if (!tbody) return;

        const searchKw = (document.getElementById("cadreSearchInput")?.value || "").toLowerCase().trim();
        const deptFilter = document.getElementById("cadreDeptFilter")?.value || "all";

        let filtered = cadres.filter(cadre => {
            // Lọc theo phòng ban
            let matchDept = true;
            if (deptFilter !== "all") {
                const dept = (cadre.department || "") + " " + (cadre.position || "") + " " + (cadre.bloc || "");
                if (deptFilter === "Lãnh đạo") matchDept = dept.includes("Chủ tịch") || dept.includes("Lãnh đạo");
                else if (deptFilter === "Văn phòng") matchDept = dept.includes("Văn phòng HĐND");
                else if (deptFilter === "Kinh tế") matchDept = dept.includes("Kinh tế");
                else if (deptFilter === "Văn hóa") matchDept = dept.includes("Văn hóa");
                else if (deptFilter === "Hành chính công") matchDept = dept.includes("Hành chính công");
                else if (deptFilter === "Công an") matchDept = dept.includes("Công an") || dept.includes("Quân sự") || dept.includes("CHQS");
                else if (deptFilter === "Đảng") matchDept = dept.includes("Đảng") || dept.includes("MTTQ") || dept.includes("Hội") || dept.includes("Đoàn");
                else if (deptFilter === "Trường") matchDept = dept.includes("Trường") || dept.includes("MN") || dept.includes("TH") || dept.includes("THCS");
                else if (deptFilter === "Thôn") matchDept = dept.includes("Thôn") || dept.includes("Buôn") || dept.includes("TDP") || dept.includes("Tổ trưởng");
            }

            // Lọc theo từ khóa
            let matchSearch = true;
            if (searchKw) {
                const fullText = `${cadre.fullName} ${cadre.position} ${cadre.department} ${cadre.phone} ${cadre.email} ${cadre.note || ''}`.toLowerCase();
                matchSearch = fullText.includes(searchKw);
            }

            return matchDept && matchSearch;
        });

        if (countBadge) {
            countBadge.textContent = filtered.length;
        }

        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 30px; color: #64748B;">
                        Không tìm thấy cán bộ nào phù hợp với điều kiện tìm kiếm.
                    </td>
                </tr>
            `;
            return;
        }

        let html = "";
        filtered.forEach((cadre, idx) => {
            const phoneHTML = cadre.phone ? `
                <a href="tel:${cadre.phone.replace(/\s+/g, '')}" style="color: #0F4C81; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
                    📞 ${escapeHTML(cadre.phone)}
                </a>
            ` : `<span style="color: #94A3B8;">—</span>`;

            const noteHTML = cadre.note ? `
                <div style="font-size: 11px; color: #64748B; margin-top: 2px; line-height: 1.35;">${escapeHTML(cadre.note)}</div>
            ` : '';

            html += `
                <tr>
                    <td style="text-align: center; font-weight: bold; color: #64748B;">${idx + 1}</td>
                    <td>
                        <strong style="font-size: 13.5px; color: #0F172A;">${escapeHTML(cadre.fullName)}</strong>
                    </td>
                    <td>
                        <div style="font-weight: 600; color: #1E293B;">${escapeHTML(cadre.position)}</div>
                        ${noteHTML}
                    </td>
                    <td>
                        <span style="font-size: 12.5px; color: #475569;">${escapeHTML(cadre.department || 'UBND Xã')}</span>
                    </td>
                    <td style="text-align: center;">
                        <span class="badge-bloc ${this.getBlocBadgeClass(cadre.bloc)}">${cadre.bloc || 'UBND'}</span>
                    </td>
                    <td>
                        ${phoneHTML}
                    </td>
                    <td style="color: #2563EB; font-size: 12.5px;">
                        <a href="mailto:${cadre.email}" style="color: #2563EB; text-decoration: none;">${escapeHTML(cadre.email)}</a>
                    </td>
                    <td style="text-align: center;">
                        ${AuthService.isAdmin() ? `<button class="btn-action-icon btn-delete" title="Xóa cán bộ" onclick="App.deleteCadre('${cadre.id}')">🗑️</button>` : '—'}
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    },

    openAddCadreModal() {
        this.openModal("modalAddCadre");
    },

    saveNewCadre() {
        const fullName = document.getElementById("cadreFullName").value.trim();
        const position = document.getElementById("cadrePosition").value.trim();
        const bloc = document.getElementById("cadreBloc").value;
        const email = document.getElementById("cadreEmail").value.trim();
        const phone = document.getElementById("cadrePhone").value.trim();

        if (!fullName || !email) {
            alert("Vui lòng nhập họ tên và email công vụ!");
            return;
        }

        StorageService.saveCadre({ fullName, position, bloc, email, phone });
        this.renderCadresView();
        this.closeModal("modalAddCadre");
        this.showToast("Đã thêm cán bộ vào danh bạ nhận thông báo!", "success");
    },

    deleteCadre(id) {
        if (!confirm("Bạn có chắc chắn muốn xóa cán bộ này khỏi danh bạ nhận thông báo?")) return;
        StorageService.deleteCadre(id);
        this.renderCadresView();
        this.showToast("Đã xóa cán bộ khỏi danh bạ.", "success");
    },

    // =========================================================================
    // VIEW SETTINGS & BACKUP
    // =========================================================================
    renderSettingsView() {
        const org = StorageService.getOrganization();
        document.getElementById("setOrgName").value = org.fullName || "";
        document.getElementById("setOrgProvince").value = org.province || "";
        document.getElementById("setOrgEmail").value = org.email || "";
        document.getElementById("setOrgPhone").value = org.phone || "";
    },

    saveOrgSettings() {
        const org = StorageService.getOrganization();
        org.fullName = document.getElementById("setOrgName").value.trim();
        org.province = document.getElementById("setOrgProvince").value.trim();
        org.email = document.getElementById("setOrgEmail").value.trim();
        org.phone = document.getElementById("setOrgPhone").value.trim();

        StorageService.setOrganization(org);
        this.showToast("Đã lưu thông tin cấu hình hệ thống!", "success");
    },

    exportBackupJSON() {
        try {
            const json = StorageService.exportAllDataJSON();
            const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
            const now = new Date();
            const filename = `Backup_Lich_Cong_Tac_EaSup_${now.toISOString().slice(0, 10)}.json`;
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 1000);
            this.showToast("Đã tải tệp sao lưu dữ liệu (.JSON) về máy thành công!", "success");
        } catch (e) {
            alert("Lỗi tải tệp sao lưu: " + e.message);
        }
    },

    importBackupJSON(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const res = StorageService.importAllDataJSON(e.target.result);
            if (res.success) {
                alert("Đã khôi phục dữ liệu sao lưu thành công!");
                window.location.reload();
            } else {
                alert("Lỗi khi nhập dữ liệu: " + res.error);
            }
        };
        reader.readAsText(file);
    },

    resetAllData() {
        if (confirm("CẢNH BÁO: Hành động này sẽ đặt lại toàn bộ dữ liệu mẫu ban đầu của UBND Xã Ea Súp. Bạn có chắc chắn không?")) {
            StorageService.resetToDefault();
            window.location.reload();
        }
    },

    // =========================================================================
    // XÁC THỰC & ĐĂNG NHẬP (AUTH HANDLERS)
    // =========================================================================
    openLoginModal(noticeMessage = null) {
        const modal = document.getElementById("modalLogin");
        const errAlert = document.getElementById("loginErrorAlert");
        if (errAlert) errAlert.style.display = "none";

        if (modal) {
            modal.classList.add("show");
            const inputUser = document.getElementById("loginUsername");
            if (inputUser) {
                setTimeout(() => inputUser.focus(), 100);
            }
        }
        if (noticeMessage) {
            this.showToast(noticeMessage, "warning");
        }
    },

    togglePasswordVisibility(inputId, btn) {
        const input = document.getElementById(inputId);
        if (!input) return;
        if (input.type === "password") {
            input.type = "text";
            if (btn) btn.textContent = "🙈";
        } else {
            input.type = "password";
            if (btn) btn.textContent = "👁️";
        }
    },

    handleLoginSubmit() {
        const usernameInput = document.getElementById("loginUsername");
        const passwordInput = document.getElementById("loginPassword");
        const errAlert = document.getElementById("loginErrorAlert");
        if (errAlert) errAlert.style.display = "none";

        if (!usernameInput || !passwordInput) return;

        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        if (!username || !password) {
            if (errAlert) {
                errAlert.textContent = "⚠️ Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu!";
                errAlert.style.display = "block";
            }
            return;
        }

        const res = AuthService.login(username, password);
        if (res.success) {
            if (errAlert) errAlert.style.display = "none";
            this.closeModal("modalLogin");
            passwordInput.value = "";
            this.showToast(`Đăng nhập thành công! Chào mừng đồng chí ${res.user.fullName}.`, "success");
        } else {
            if (errAlert) {
                errAlert.innerHTML = `⚠️ ${res.message}`;
                errAlert.style.display = "block";
            }
            this.showToast(res.message, "error");
        }
    },

    quickLogin(userKey) {
        const user = AuthService.loginAsDemoUser(userKey);
        if (user) {
            this.closeModal("modalLogin");
            this.showToast(`Đăng nhập thành công với tài khoản: ${user.fullName} (${user.roleName})`, "success");
        }
    },

    handleLogout() {
        const roleDropdown = document.getElementById("roleDropdownMenu");
        if (roleDropdown) roleDropdown.classList.remove("show");
        AuthService.logout();
        this.showToast("Đã đăng xuất tài khoản. Hiện bạn đang ở Chế độ Khách (Chỉ xem).", "info");
    },

    // =========================================================================
    // TRUNG TÂM SAO LƯU & KHÔI PHỤC DỮ LIỆU (BACKUP & RESTORE CONTROLLER)
    // =========================================================================
    async openBackupModal() {
        this.openModal("modalBackupRestore");
        await this.renderBackupList();
    },

    async renderBackupList() {
        const container = document.getElementById("backupListContainer");
        if (!container) return;
        container.innerHTML = `<div style="text-align: center; color: #64748B; padding: 15px; font-size: 13px;">⏳ Đang tải danh sách điểm sao lưu...</div>`;

        const backups = await StorageService.getBackupsList();
        if (!backups || backups.length === 0) {
            container.innerHTML = `<div style="text-align: center; color: #64748B; padding: 15px; font-size: 13px;">Chưa có bản sao lưu nào được ghi nhận.</div>`;
            return;
        }

        let html = '<div style="display: flex; flex-direction: column; gap: 8px;">';
        backups.forEach(b => {
            html += `
                <div style="display: flex; justify-content: space-between; align-items: center; background: #fff; border: 1px solid #E2E8F0; padding: 8px 12px; border-radius: 6px;">
                    <div>
                        <div style="font-weight: 700; font-size: 13px; color: #0F172A;">🕒 ${escapeHTML(b.time)}</div>
                        <div style="font-size: 11.5px; color: #64748B;">Tệp: <code>${escapeHTML(b.filename)}</code> • ${b.size} • <b>${b.itemCount} mục công tác</b> (${b.weekCount} tuần)</div>
                    </div>
                    <button type="button" class="btn-sm" onclick="App.handleRestoreBackup('${escapeHTML(b.filename)}')" style="background: #10B981; color: #fff; border: none; padding: 5px 10px; border-radius: 4px; font-weight: 700; cursor: pointer; font-size: 12px;">
                        🔄 Khôi Phục
                    </button>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
    },

    async handleRestoreAllData() {
        if (!confirm("Bạn có chắc chắn muốn khôi phục toàn bộ dữ liệu lịch công tác từ máy chủ VPS?")) {
            return;
        }

        const btn = document.activeElement;
        if (btn && btn.tagName === "BUTTON") btn.disabled = true;

        this.showBackupAlert("⏳ Đang khôi phục toàn bộ dữ liệu từ máy chủ VPS...", "info");

        const res = await StorageService.restoreAllDataFromServer();
        if (btn && btn.tagName === "BUTTON") btn.disabled = false;

        if (res.success) {
            this.loadCurrentSchedule();
            this.populateWeekOptions();
            this.renderAll();
            this.showBackupAlert("✅ " + res.message, "success");
            this.showToast("Khôi phục toàn bộ dữ liệu thành công!", "success");
            await this.renderBackupList();
        } else {
            this.showBackupAlert("❌ " + res.message, "error");
            this.showToast(res.message, "error");
        }
    },

    async handleRestoreBackup(filename) {
        if (!confirm(`Bạn có chắc chắn muốn khôi phục dữ liệu từ bản sao lưu:\n${filename}?\nDữ liệu hiện tại sẽ được thay thế bằng bản sao lưu này.`)) {
            return;
        }

        const res = await StorageService.restoreFromBackupFile(filename);
        if (res.success) {
            this.loadCurrentSchedule();
            this.populateWeekOptions();
            this.renderAll();
            this.showBackupAlert("✅ " + res.message, "success");
            this.showToast("Khôi phục dữ liệu thành công!", "success");
            await this.renderBackupList();
        } else {
            this.showBackupAlert("❌ " + res.message, "error");
        }
    },

    async handleCreateManualBackup() {
        const res = await StorageService.createManualBackup("manual");
        if (res.success) {
            this.showBackupAlert(`✅ Đã tạo điểm sao lưu mới: ${res.filename}`, "success");
            this.showToast("Đã tạo điểm sao lưu an toàn!", "success");
            await this.renderBackupList();
        } else {
            this.showBackupAlert("❌ Lỗi tạo bản sao lưu", "error");
        }
    },

    handleImportBackupFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const parsed = JSON.parse(e.target.result);
                if (!Array.isArray(parsed)) {
                    alert("Tệp JSON không đúng định dạng danh sách lịch tuần.");
                    return;
                }
                const res = await StorageService.importBackupSchedules(parsed);
                if (res.success) {
                    this.loadCurrentSchedule();
                    this.populateWeekOptions();
                    this.renderAll();
                    this.showBackupAlert("✅ Đã nhập và khôi phục dữ liệu từ tệp thành công!", "success");
                    this.showToast("Đã nhập dữ liệu thành công!", "success");
                    await this.renderBackupList();
                } else {
                    this.showBackupAlert("❌ " + res.message, "error");
                }
            } catch (err) {
                alert("Lỗi đọc tệp JSON: " + err.message);
            }
        };
        reader.readAsText(file);
    },

    showBackupAlert(msg, type = "success") {
        const alertEl = document.getElementById("backupAlertMsg");
        if (!alertEl) return;
        alertEl.style.display = "block";
        alertEl.style.background = type === "success" ? "#ECFDF5" : "#FEF2F2";
        alertEl.style.border = type === "success" ? "1px solid #A7F3D0" : "1px solid #FECACA";
        alertEl.style.color = type === "success" ? "#065F46" : "#DC2626";
        alertEl.innerHTML = msg;
        setTimeout(() => {
            if (alertEl) alertEl.style.display = "none";
        }, 6000);
    },

    // =========================================================================
    // UTILS & TOAST
    // =========================================================================
    openModal(modalId) {
        document.getElementById(modalId)?.classList.add("show");
    },

    closeModal(modalId) {
        document.getElementById(modalId)?.classList.remove("show");
    },

    showToast(message, type = "info") {
        let container = document.getElementById("toastContainer");
        if (!container) {
            container = document.createElement("div");
            container.id = "toastContainer";
            container.className = "toast-container";
            document.body.appendChild(container);
        }

        const toast = document.createElement("div");
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span>${type === 'success' ? '✅' : 'ℹ️'}</span>
            <span>${escapeHTML(message)}</span>
        `;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }
};

// Khởi chạy khi DOM sẵn sàng
document.addEventListener("DOMContentLoaded", () => {
    App.init();
});
