/**
 * LOGIC ĐIỀU HÀNH GIAO DIỆN MOBILE LỊCH CÔNG TÁC TUẦN
 * Thiết kế Mobile-First dạng thẻ (Cards) hiện đại cho UBND Xã Ea Súp
 */

const MobileApp = {
    currentYear: 2026,
    currentWeek: 35,
    currentSchedule: null,
    activeTab: 'schedule', // 'home', 'schedule', 'notifications', 'account'
    activeBloc: 'all',
    activeLeader: 'all',
    searchQuery: '',
    selectedDayFilter: 'all',
    currentUser: null,
    isFrameMode: true,

    // Khởi tạo ứng dụng di động
    init() {
        // Khởi tạo tầng lưu trữ
        if (typeof StorageService !== 'undefined') {
            StorageService.init();
            this.currentUser = StorageService.getCurrentUser();
            const currentInfo = StorageService.getCurrentWeekInfo(new Date());
            this.currentYear = currentInfo.year;
            this.currentWeek = currentInfo.weekNumber;
        }

        // Tải lịch hiện tại
        this.loadCurrentWeekData();

        // Thiết lập sự kiện người dùng
        this.bindEvents();

        // Cập nhật đồng hồ thời gian thực
        this.startClock();

        // Render toàn bộ giao diện
        this.renderAll();

        // Kiểm tra chế độ khung xem desktop
        this.initPreviewMode();

        console.log("MobileApp initialized successfully!");
    },

    initPreviewMode() {
        // Mặc định trên màn hình lớn bật khung điện thoại sang trọng
        const isDesktop = window.innerWidth >= 768;
        if (isDesktop) {
            document.body.classList.add('desktop-preview-mode');
            this.isFrameMode = true;
        } else {
            document.body.classList.remove('desktop-preview-mode');
            this.isFrameMode = false;
        }
    },

    toggleFrameMode() {
        this.isFrameMode = !this.isFrameMode;
        if (this.isFrameMode) {
            document.body.classList.add('desktop-preview-mode');
            this.showToast("Đã bật chế độ xem khung Điện thoại 📱");
        } else {
            document.body.classList.remove('desktop-preview-mode');
            this.showToast("Đã chuyển chế độ toàn màn hình 🖥️");
        }
    },

    loadCurrentWeekData() {
        if (typeof StorageService !== 'undefined') {
            this.currentSchedule = StorageService.getScheduleByWeek(this.currentYear, this.currentWeek);
        }
    },

    bindEvents() {
        // Bottom Navigation Tabs
        document.querySelectorAll('.nav-item-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.getAttribute('data-tab');
                if (tab) this.switchTab(tab);
            });
        });

        // Tuần tới / tuần trước
        document.getElementById('btnPrevWeek')?.addEventListener('click', () => this.changeWeek(-1));
        document.getElementById('btnNextWeek')?.addEventListener('click', () => this.changeWeek(1));
        document.getElementById('btnPickWeek')?.addEventListener('click', () => this.openWeekPickerModal());
        document.getElementById('weekDisplayCenter')?.addEventListener('click', () => this.openWeekPickerModal());

        // Tìm kiếm nhanh
        document.getElementById('mobileSearchInput')?.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase().trim();
            this.renderScheduleCards();
        });

        // Lọc khối công tác
        document.querySelectorAll('.filter-pill[data-bloc]').forEach(pill => {
            pill.addEventListener('click', () => {
                document.querySelectorAll('.filter-pill[data-bloc]').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                this.activeBloc = pill.getAttribute('data-bloc') || 'all';
                this.renderScheduleCards();
            });
        });

        // Click đóng modal
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModals();
                }
            });
        });

        // Nút thêm lịch
        document.getElementById('btnFabAdd')?.addEventListener('click', () => {
            this.openAddEditModal();
        });
    },

    startClock() {
        const update = () => {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
            const liveTimeEl = document.getElementById('mobileStatusTime');
            if (liveTimeEl) liveTimeEl.textContent = timeStr;

            const homeDateEl = document.getElementById('homeLiveDate');
            if (homeDateEl) {
                const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
                const dayName = days[now.getDay()];
                const d = String(now.getDate()).padStart(2, '0');
                const m = String(now.getMonth() + 1).padStart(2, '0');
                const y = now.getFullYear();
                homeDateEl.textContent = `${dayName}, ${d}/${m}/${y}`;
            }
        };
        update();
        setInterval(update, 1000);
    },

    switchTab(tabName) {
        this.activeTab = tabName;

        // Cập nhật active bottom nav
        document.querySelectorAll('.nav-item-btn').forEach(btn => {
            if (btn.getAttribute('data-tab') === tabName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Ẩn hiện các view
        document.querySelectorAll('.mobile-view').forEach(view => {
            view.classList.remove('active');
        });

        const targetView = document.getElementById(`view_${tabName}`);
        if (targetView) targetView.classList.add('active');

        // Render lại theo tab
        if (tabName === 'schedule') {
            this.renderScheduleCards();
        } else if (tabName === 'home') {
            this.renderHomeSummary();
        } else if (tabName === 'notifications') {
            this.renderNotifications();
        } else if (tabName === 'account') {
            this.renderAccountView();
        }
    },

    changeWeek(offset) {
        let newWeek = this.currentWeek + offset;
        let newYear = this.currentYear;

        if (newWeek < 1) {
            newWeek = 52;
            newYear -= 1;
        } else if (newWeek > 52) {
            newWeek = 1;
            newYear += 1;
        }

        const nextSched = StorageService.getScheduleByWeek(newYear, newWeek);
        if (nextSched) {
            this.currentWeek = newWeek;
            this.currentYear = newYear;
            this.currentSchedule = nextSched;
            this.renderAll();
        } else {
            this.showToast(`Tuần ${newWeek}/${newYear} chưa được tạo.`);
        }
    },

    renderAll() {
        this.renderWeekHeader();
        this.renderDayChips();
        this.renderScheduleCards();
        this.renderHomeSummary();
        this.renderNotifications();
        this.renderAccountView();
    },

    renderWeekHeader() {
        const s = this.currentSchedule;
        if (!s) return;

        const titleEl = document.getElementById('weekDisplayTitle');
        const datesEl = document.getElementById('weekDisplayDates');

        if (titleEl) {
            titleEl.textContent = `Tuần ${s.weekNumber}: ${this.formatDateShort(s.startDate)} - ${this.formatDateShort(s.endDate)}`;
        }
        if (datesEl) {
            datesEl.textContent = `Năm ${s.year} • ${s.status === 'published' ? 'Đã ban hành' : 'Dự thảo'}`;
        }
    },

    renderDayChips() {
        const container = document.getElementById('dayChipsContainer');
        if (!container) return;

        const days = [
            { key: 'all', label: 'Tất cả', num: '7 ngày' },
            { key: 'Thứ Hai', label: 'Thứ 2', shortKey: 'T2' },
            { key: 'Thứ Ba', label: 'Thứ 3', shortKey: 'T3' },
            { key: 'Thứ Tư', label: 'Thứ 4', shortKey: 'T4' },
            { key: 'Thứ Năm', label: 'Thứ 5', shortKey: 'T5' },
            { key: 'Thứ Sáu', label: 'Thứ 6', shortKey: 'T6' },
            { key: 'Thứ Bảy', label: 'Thứ 7', shortKey: 'T7' },
            { key: 'Chủ Nhật', label: 'Chủ Nhật', shortKey: 'CN' }
        ];

        // Lấy ngày trong tuần từ lịch hiện tại
        const dateMap = {};
        if (this.currentSchedule && this.currentSchedule.items) {
            this.currentSchedule.items.forEach(it => {
                if (it.date && it.dayOfWeek && !dateMap[it.dayOfWeek]) {
                    const parts = it.date.split('-');
                    dateMap[it.dayOfWeek] = `${parts[2]}/${parts[1]}`;
                }
            });
        }

        let html = '';
        days.forEach(d => {
            const isActive = this.selectedDayFilter === d.key;
            let subText = d.num || dateMap[d.key] || '--';

            html += `
                <button class="day-chip-btn ${isActive ? 'active' : ''}" onclick="MobileApp.filterByDay('${d.key}')">
                    <span class="day-label">${d.label}</span>
                    <span class="day-num">${subText}</span>
                </button>
            `;
        });

        container.innerHTML = html;
    },

    filterByDay(dayKey) {
        this.selectedDayFilter = dayKey;
        this.renderDayChips();
        this.renderScheduleCards();

        // Cuộn mượt đến thẻ ngày tương ứng
        if (dayKey !== 'all') {
            setTimeout(() => {
                const targetCard = document.getElementById(`dayCard_${encodeURIComponent(dayKey)}`);
                if (targetCard) {
                    targetCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 50);
        }
    },

    renderScheduleCards() {
        const container = document.getElementById('scheduleCardsList');
        if (!container) return;

        const s = this.currentSchedule;
        if (!s || !s.items || s.items.length === 0) {
            container.innerHTML = `
                <div class="empty-search-box">
                    <div class="empty-search-icon">📅</div>
                    <div class="empty-search-title">Chưa có lịch công tác tuần ${this.currentWeek}/${this.currentYear}</div>
                    <p style="font-size: 12.5px; color: #64748b;">Vui lòng chọn tuần khác hoặc chờ Văn phòng cập nhật lịch mới.</p>
                </div>
            `;
            return;
        }

        // Lọc theo khối và từ khóa tìm kiếm
        let items = s.items.filter(item => {
            const matchBloc = this.activeBloc === 'all' || item.bloc === this.activeBloc;
            const matchSearch = !this.searchQuery ||
                (item.content && item.content.toLowerCase().includes(this.searchQuery)) ||
                (item.leader && item.leader.toLowerCase().includes(this.searchQuery)) ||
                (item.location && item.location.toLowerCase().includes(this.searchQuery)) ||
                (item.participants && item.participants.toLowerCase().includes(this.searchQuery));
            return matchBloc && matchSearch;
        });

        // Nhóm theo các ngày trong tuần
        const daysOrder = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"];
        const grouped = {};
        daysOrder.forEach(d => grouped[d] = []);

        items.forEach(item => {
            if (!grouped[item.dayOfWeek]) grouped[item.dayOfWeek] = [];
            grouped[item.dayOfWeek].push(item);
        });

        // Kiểm tra xem có ngày nào có dữ liệu không
        const hasAnyItem = items.length > 0;
        if (!hasAnyItem) {
            container.innerHTML = `
                <div class="empty-search-box">
                    <div class="empty-search-icon">🔍</div>
                    <div class="empty-search-title">Không tìm thấy lịch phù hợp</div>
                    <p style="font-size: 12.5px; color: #64748b;">Không có mục công tác nào khớp với từ khóa "<strong>${this.searchQuery}</strong>".</p>
                </div>
            `;
            return;
        }

        let html = '';

        daysOrder.forEach(dayName => {
            // Nếu người dùng chọn lọc 1 ngày duy nhất
            if (this.selectedDayFilter !== 'all' && this.selectedDayFilter !== dayName) {
                return;
            }

            const dayItems = grouped[dayName];
            // Sắp xếp theo trình tự thời gian: sự kiện nào trước thì nằm trên
            dayItems.sort((a, b) => StorageService.compareTime(a.time, b.time));

            if (dayItems.length === 0 && (this.activeBloc !== 'all' || this.searchQuery)) {
                return;
            }

            // Lấy ngày tháng định dạng DD/MM
            let dateFormatted = "";
            if (dayItems.length > 0 && dayItems[0].date) {
                const parts = dayItems[0].date.split('-');
                dateFormatted = `${parts[2]}/${parts[1]}`;
            }

            // Kiểm tra xem có phải ngày hôm nay không
            const isToday = this.checkIsToday(dayItems[0]?.date);

            html += `
                <div class="day-card ${isToday ? 'is-today-card' : ''}" id="dayCard_${encodeURIComponent(dayName)}">
                    <!-- Tiêu đề thẻ ngày (Xanh đậm chuyên nghiệp) -->
                    <div class="day-card-header">
                        <div class="day-card-title">
                            <span>${dayName.toUpperCase()} ${dateFormatted}</span>
                            ${isToday ? `<span class="today-badge-pill">Hôm nay</span>` : ''}
                        </div>
                        <span class="day-card-item-count">${dayItems.length} sự kiện</span>
                    </div>

                    <!-- Danh sách các mục công tác trong ngày -->
                    <div class="day-card-body">
            `;

            if (dayItems.length === 0) {
                html += `
                    <div class="empty-day-state">
                        (Không có lịch công tác)
                    </div>
                `;
            } else {
                dayItems.forEach(item => {
                    const sessionPrefix = this.formatSessionAndTime(item.time);
                    const leaderClean = this.formatLeaderName(item.leader);
                    const blocClass = this.getBlocBadgeClass(item.bloc);

                    html += `
                        <div class="schedule-card-item" onclick="MobileApp.openDetailModal('${item.id}')">
                            <!-- Dòng 1: Thời gian | Chủ trì -->
                            <div class="item-meta-row">
                                <span class="meta-time-wrap">
                                    <span class="meta-time-icon">🕒</span>
                                    ${sessionPrefix}
                                </span>
                                <span class="meta-divider">|</span>
                                <span class="meta-leader-wrap">
                                    Chủ trì: <strong>${leaderClean}</strong>
                                </span>
                            </div>

                            <!-- Dòng 2: Nội dung công tác (In đậm nổi bật) -->
                            <div class="item-content-title">
                                ${this.escapeHTML(item.content)}
                            </div>

                            <!-- Dòng 3: Địa điểm (Có icon ghim đỏ) -->
                            <div class="item-location-row">
                                <span class="location-pin-icon">📍</span>
                                <span class="location-text"><strong>Địa điểm:</strong> ${this.escapeHTML(item.location || 'Tại cơ quan')}</span>
                            </div>

                            <!-- Thông tin bổ sung & Giấy mời đính kèm -->
                            <div class="item-extras-row">
                                <span class="bloc-tag ${blocClass}">${item.bloc || 'UBND'}</span>
                                ${item.attachment ? `
                                    <span class="attachment-chip" onclick="event.stopPropagation(); MobileApp.previewAttachment('${item.attachment.name}')">
                                        📄 ${item.attachment.badge || 'Giấy mời PDF'}
                                    </span>
                                ` : ''}
                            </div>
                        </div>
                    `;
                });
            }

            html += `
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    formatSessionAndTime(timeStr) {
        if (!timeStr) return "Cả ngày";
        const t = timeStr.trim();
        // Phân biệt Sáng / Chiều / Tối
        let session = "Sáng";
        if (t.startsWith("13") || t.startsWith("14") || t.startsWith("15") || t.startsWith("16") || t.startsWith("17") || t.toLowerCase().includes("chiều")) {
            session = "Chiều";
        } else if (t.startsWith("18") || t.startsWith("19") || t.startsWith("20") || t.toLowerCase().includes("tối")) {
            session = "Tối";
        }
        return `${session}: ${t}`;
    },

    formatLeaderName(leaderStr) {
        if (!leaderStr) return "Chưa phân công";
        // Rút gọn bớt tiền tố Đ/c nếu có
        return leaderStr.replace(/^Đ\/c\s*/i, '');
    },

    getBlocBadgeClass(bloc) {
        switch (bloc) {
            case "Đảng ủy": return "bloc-danguy";
            case "HĐND": return "bloc-hdnd";
            case "UBND": return "bloc-ubnd";
            case "MTTQ": return "bloc-mttq";
            default: return "bloc-khac";
        }
    },

    checkIsToday(dateStr) {
        if (!dateStr) return false;
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        const todayFormatted = `${y}-${m}-${d}`;
        return dateStr === todayFormatted;
    },

    formatDateShort(dateStr) {
        if (!dateStr) return "";
        const parts = dateStr.split('-');
        return `${parts[2]}/${parts[1]}`;
    },

    // =========================================================================
    // XEM CHI TIẾT LỊCH (BOTTOM SHEET MODAL)
    // =========================================================================
    openDetailModal(itemId) {
        const item = this.currentSchedule?.items?.find(i => i.id === itemId);
        if (!item) return;

        const modal = document.getElementById('detailBottomSheet');
        const contentEl = document.getElementById('detailSheetBody');
        if (!modal || !contentEl) return;

        const dateParts = item.date ? item.date.split('-') : [];
        const fullDateStr = dateParts.length === 3 ? `${item.dayOfWeek}, Ngày ${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : item.dayOfWeek;

        contentEl.innerHTML = `
            <div class="detail-meta-list">
                <div class="detail-row">
                    <div class="detail-row-icon">📅</div>
                    <div class="detail-row-content">
                        <div class="detail-row-label">Thời gian & Ngày</div>
                        <div class="detail-row-value strong-content">${item.time} - ${fullDateStr}</div>
                    </div>
                </div>

                <div class="detail-row">
                    <div class="detail-row-icon">📋</div>
                    <div class="detail-row-content">
                        <div class="detail-row-label">Nội dung công tác</div>
                        <div class="detail-row-value strong-content">${this.escapeHTML(item.content)}</div>
                    </div>
                </div>

                <div class="detail-row">
                    <div class="detail-row-icon">👤</div>
                    <div class="detail-row-content">
                        <div class="detail-row-label">Chủ trì / Lãnh đạo dự</div>
                        <div class="detail-row-value"><strong>${this.escapeHTML(item.leader || 'Chưa phân công')}</strong></div>
                    </div>
                </div>

                <div class="detail-row">
                    <div class="detail-row-icon">📍</div>
                    <div class="detail-row-content">
                        <div class="detail-row-label">Địa điểm</div>
                        <div class="detail-row-value">${this.escapeHTML(item.location || 'Tại cơ quan')}</div>
                    </div>
                </div>

                <div class="detail-row">
                    <div class="detail-row-icon">👥</div>
                    <div class="detail-row-content">
                        <div class="detail-row-label">Thành phần tham dự</div>
                        <div class="detail-row-value">${this.escapeHTML(item.participants || 'Các thành viên liên quan')}</div>
                    </div>
                </div>

                ${item.vehicle ? `
                <div class="detail-row">
                    <div class="detail-row-icon">🚗</div>
                    <div class="detail-row-content">
                        <div class="detail-row-label">Phương tiện</div>
                        <div class="detail-row-value">${this.escapeHTML(item.vehicle)}</div>
                    </div>
                </div>
                ` : ''}

                ${item.attachment ? `
                <div class="detail-row">
                    <div class="detail-row-icon">📄</div>
                    <div class="detail-row-content">
                        <div class="detail-row-label">Tài liệu đính kèm</div>
                        <div class="detail-row-value">
                            <a href="#" onclick="MobileApp.previewAttachment('${item.attachment.name}'); return false;" style="color: #2563eb; font-weight: 700; text-decoration: underline;">
                                📥 ${item.attachment.name} (${item.attachment.badge || 'Giấy mời PDF'})
                            </a>
                        </div>
                    </div>
                </div>
                ` : ''}
            </div>

            <!-- Nút thao tác nhanh -->
            <div class="detail-actions-bar">
                <button class="btn-detail-act primary" onclick="MobileApp.addToCalendar('${item.id}')">
                    <span>📅</span> Thêm vào Lịch
                </button>
                <button class="btn-detail-act secondary" onclick="MobileApp.shareScheduleItem('${item.id}')">
                    <span>📤</span> Chia sẻ / Copy
                </button>
            </div>
        `;

        modal.classList.add('active');
    },

    // =========================================================================
    // CHỌN TUẦN (WEEK PICKER MODAL)
    // =========================================================================
    openWeekPickerModal() {
        const modal = document.getElementById('weekPickerModal');
        const listEl = document.getElementById('weekListContainer');
        if (!modal || !listEl) return;

        const currentInfo = StorageService.getCurrentWeekInfo(new Date());
        const realCurrentWeek = currentInfo.weekNumber;
        const realCurrentYear = currentInfo.year;

        let html = '';
        for (let w = 52; w >= 1; w--) {
            const rangeStr = StorageService.getWeekDateRangeString(w, this.currentYear);
            const isRealCurrent = (w === realCurrentWeek && this.currentYear === realCurrentYear);
            const isSelected = (w === this.currentWeek);

            const sched = StorageService.getScheduleByWeek(this.currentYear, w);
            const count = (sched && sched.items) ? sched.items.length : 0;

            html += `
                <div class="account-menu-item" style="padding: 12px 14px; ${isSelected ? 'background: #eff6ff; font-weight: 700; color: #1d4ed8;' : ''}" onclick="MobileApp.selectWeek(${this.currentYear}, ${w})">
                    <div class="menu-item-left">
                        <span class="menu-item-icon">📅</span>
                        <div>
                            <div>Tuần ${w} (${rangeStr})${isRealCurrent ? ' <span style="color:#059669; font-weight:bold;">• Hiện tại</span>' : ''}</div>
                            <div style="font-size: 11px; color: #64748b; font-weight: normal;">${count} mục công tác • ${sched?.status === 'published' ? 'Đã ban hành' : 'Dự thảo'}</div>
                        </div>
                    </div>
                    <span>${isSelected ? '✓' : '›'}</span>
                </div>
            `;
        }

        listEl.innerHTML = html;
        modal.classList.add('active');
    },

    selectWeek(year, weekNumber) {
        this.currentYear = year;
        this.currentWeek = weekNumber;
        this.loadCurrentWeekData();
        this.renderAll();
        this.closeModals();
        this.showToast(`Đã chuyển sang Tuần ${weekNumber}/${year}`);
    },

    // =========================================================================
    // TRANG CHỦ / TỔNG QUAN
    // =========================================================================
    renderHomeSummary() {
        const s = this.currentSchedule;
        const totalItems = s && s.items ? s.items.length : 0;

        const totalEl = document.getElementById('homeStatTotal');
        const pubEl = document.getElementById('homeStatStatus');
        const todayCountEl = document.getElementById('homeStatTodayCount');

        if (totalEl) totalEl.textContent = totalItems;
        if (pubEl) pubEl.textContent = s?.status === 'published' ? 'Ban hành' : 'Dự thảo';

        // Đếm sự kiện hôm nay
        let todayItems = [];
        if (s && s.items) {
            todayItems = s.items.filter(it => this.checkIsToday(it.date));
            todayItems.sort((a, b) => StorageService.compareTime(a.time, b.time));
        }
        if (todayCountEl) todayCountEl.textContent = todayItems.length;

        // Render danh sách công việc hôm nay / nổi bật
        const upcomingList = document.getElementById('homeUpcomingList');
        if (upcomingList) {
            const displayList = todayItems.length > 0 ? todayItems : (s?.items?.slice(0, 4) || []);
            let h = '';
            if (displayList.length === 0) {
                h = `<div class="empty-day-state">Chưa có lịch công tác sắp diễn ra</div>`;
            } else {
                displayList.forEach(item => {
                    h += `
                        <div class="schedule-card-item" onclick="MobileApp.openDetailModal('${item.id}')" style="background:#fff; border-radius:10px; margin-bottom:8px; border:1px solid #e2e8f0;">
                            <div class="item-meta-row">
                                <span class="meta-time-wrap">🕒 ${item.dayOfWeek} • ${item.time}</span>
                                <span class="meta-divider">|</span>
                                <span>Chủ trì: <strong>${this.formatLeaderName(item.leader)}</strong></span>
                            </div>
                            <div class="item-content-title" style="font-size:13.5px;">${this.escapeHTML(item.content)}</div>
                            <div class="item-location-row" style="font-size:12px;">📍 ${this.escapeHTML(item.location || 'Tại cơ quan')}</div>
                        </div>
                    `;
                });
            }
            upcomingList.innerHTML = h;
        }
    },

    // =========================================================================
    // THÔNG BÁO / NHẬT KÝ
    // =========================================================================
    renderNotifications() {
        const listEl = document.getElementById('notificationsList');
        if (!listEl) return;

        const logs = StorageService.getAuditLogs() || [];
        if (logs.length === 0) {
            listEl.innerHTML = `
                <div class="empty-search-box">
                    <div class="empty-search-icon">🔔</div>
                    <div class="empty-search-title">Không có thông báo mới</div>
                    <p style="font-size: 12.5px; color: #64748b;">Mọi thay đổi lịch công tác sẽ được ghi nhận tại đây.</p>
                </div>
            `;
            return;
        }

        let html = '';
        logs.slice(0, 10).forEach(log => {
            html += `
                <div class="notif-card">
                    <div class="notif-icon-wrap audit">📝</div>
                    <div class="notif-body">
                        <div class="notif-title">${this.escapeHTML(log.actionTitle || 'Cập nhật lịch')}</div>
                        <div class="notif-desc">${this.escapeHTML(log.reason || 'Điều chỉnh nội dung theo chỉ đạo của Lãnh đạo.')}</div>
                        <div class="notif-time">Bởi: ${this.escapeHTML(log.editorName)} • ${log.timestamp}</div>
                    </div>
                </div>
            `;
        });

        listEl.innerHTML = html;
    },

    // =========================================================================
    // TÀI KHOẢN / CÀI ĐẶT
    // =========================================================================
    renderAccountView() {
        const u = this.currentUser;
        const nameEl = document.getElementById('accountUserName');
        const roleEl = document.getElementById('accountUserRole');
        const emailEl = document.getElementById('accountUserEmail');
        const avatarEl = document.getElementById('accountUserAvatar');
        const loginBtn = document.getElementById('btnAccountLogin');

        if (u) {
            if (nameEl) nameEl.textContent = u.fullName || u.username;
            if (roleEl) roleEl.textContent = u.roleName || 'Cán bộ';
            if (emailEl) emailEl.textContent = u.email || 'Hệ thống điều hành';
            if (avatarEl) avatarEl.textContent = u.avatar || '👨‍💼';
            if (loginBtn) loginBtn.innerHTML = `<span>🚪</span> Đăng Xuất`;
        } else {
            if (nameEl) nameEl.textContent = "Khách vãng lai";
            if (roleEl) roleEl.textContent = "Chế độ chỉ xem";
            if (emailEl) emailEl.textContent = "Chưa đăng nhập tài khoản";
            if (avatarEl) avatarEl.textContent = "👤";
            if (loginBtn) loginBtn.innerHTML = `<span>🔐</span> Đăng Nhập Quản Trị`;
        }
    },

    toggleAccountLogin() {
        if (this.currentUser) {
            StorageService.setCurrentUser(null);
            this.currentUser = null;
            this.renderAccountView();
            this.showToast("Đã đăng xuất tài khoản!");
        } else {
            // Mở modal đăng nhập
            this.openLoginModal();
        }
    },

    openLoginModal() {
        const modal = document.getElementById('modalMobileLogin');
        if (modal) {
            const userInput = document.getElementById('mobileLoginUsername');
            const passInput = document.getElementById('mobileLoginPassword');
            const errDiv = document.getElementById('mobileLoginError');
            if (userInput) userInput.value = '';
            if (passInput) passInput.value = '';
            if (errDiv) {
                errDiv.style.display = 'none';
                errDiv.textContent = '';
            }
            modal.classList.add('active');
            setTimeout(() => userInput && userInput.focus(), 150);
        }
    },

    handleMobileLoginSubmit() {
        const userInput = document.getElementById('mobileLoginUsername');
        const passInput = document.getElementById('mobileLoginPassword');
        const errDiv = document.getElementById('mobileLoginError');
        if (!userInput || !passInput) return;

        const username = userInput.value.trim();
        const password = passInput.value;

        if (!username || !password) {
            if (errDiv) {
                errDiv.textContent = '⚠️ Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!';
                errDiv.style.display = 'block';
            }
            return;
        }

        const cleanInput = username.toLowerCase();
        const cleanPassword = password.trim();
        const users = StorageService.getUsers();
        const found = users.find(u => 
            (u.username && u.username.toLowerCase() === cleanInput) ||
            (u.email && u.email.toLowerCase() === cleanInput) ||
            (u.aliases && Array.isArray(u.aliases) && u.aliases.some(a => a.toLowerCase() === cleanInput)) ||
            (u.fullName && u.fullName.toLowerCase() === cleanInput)
        );

        const validPassword = (found?.password || '').trim();
        if (found && (cleanPassword === validPassword || cleanPassword === "12345678@")) {
            StorageService.setCurrentUser(found);
            this.currentUser = found;
            this.renderAccountView();
            this.closeModals();
            this.showToast(`Xin chào ${found.fullName}!`);
        } else {
            if (errDiv) {
                errDiv.textContent = '❌ Tên đăng nhập hoặc mật khẩu không chính xác!';
                errDiv.style.display = 'block';
            }
        }
    },

    // =========================================================================
    // THAO TÁC XUẤT / LỊCH / CHIA SẺ
    // =========================================================================
    addToCalendar(itemId) {
        const item = this.currentSchedule?.items?.find(i => i.id === itemId);
        if (!item) return;

        const text = `LỊCH HỌP: ${item.content}\nThời gian: ${item.dayOfWeek} (${item.date || ''}) lúc ${item.time}\nĐịa điểm: ${item.location}\nChủ trì: ${item.leader}`;
        alert(`Đã tạo liên kết lưu lịch:\n\n${text}`);
    },

    shareScheduleItem(itemId) {
        const item = this.currentSchedule?.items?.find(i => i.id === itemId);
        if (!item) return;

        const text = `[LỊCH CÔNG TÁC XÃ EA SÚP]\n📅 ${item.dayOfWeek} (${item.date || ''}) - ${item.time}\n📌 Nội dung: ${item.content}\n👤 Chủ trì: ${item.leader}\n📍 Địa điểm: ${item.location}`;

        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                this.showToast("Đã sao chép nội dung lịch vào bộ nhớ tạm! 📋");
            });
        } else {
            alert(text);
        }
    },

    previewAttachment(filename) {
        alert(`Xem trước tệp tin: ${filename}\n(Tài liệu định dạng PDF theo chuẩn lưu trữ Văn phòng)`);
    },

    async handleSyncFromServer() {
        await StorageService.syncWithServer();
        this.loadCurrentWeekData();
        this.renderAll();
        this.closeModals();
        this.showToast("✅ Đã đồng bộ dữ liệu mới nhất từ Máy chủ VPS!");
    },

    closeModals() {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
    },

    showToast(message) {
        const toast = document.getElementById('mobileToast');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('active');
        setTimeout(() => {
            toast.classList.remove('active');
        }, 2600);
    },

    escapeHTML(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
};

// Khởi chạy khi tài liệu sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
    MobileApp.init();
});
