/**
 * BỘ ĐIỀU KHIỂN DÀNH CHO GIAO DIỆN KHÁCH - GUEST PORTAL CONTROLLER
 * Cổng thông tin điều hành - Tra cứu lịch công tác tuần UBND Xã Ea Súp
 * (Chỉ cho phép tra cứu, xem chi tiết, tải giấy mời, xuất Word và in ấn - Không có tính năng quản trị)
 */

const GuestApp = {
    currentYear: 2026,
    currentWeek: 35,
    currentBloc: "all",
    searchQuery: "",
    activeTab: "schedule",
    currentSchedule: null,

    init() {
        const currentInfo = StorageService.getCurrentWeekInfo(new Date());
        this.currentYear = currentInfo.year;
        this.currentWeek = currentInfo.weekNumber;

        this.populateWeekOptions();
        this.loadCurrentSchedule();
        this.setupLiveClock();
        this.setupEventListeners();
        this.renderAll();

        // Chống browser tự động điền (autofill) tài khoản vào ô tìm kiếm làm trắng dữ liệu
        const searchInput = document.getElementById("searchInput");
        if (searchInput) {
            searchInput.value = "";
            this.searchQuery = "";
            setTimeout(() => {
                if (searchInput.value && !this.searchQuery) {
                    searchInput.value = "";
                    this.renderScheduleTable();
                }
            }, 300);
        }
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

    async loadCurrentSchedule() {
        this.currentSchedule = StorageService.getScheduleByWeek(this.currentYear, this.currentWeek);
        try {
            const res = await fetch('/api/schedule/current', { cache: 'no-store' });
            if (res.ok) {
                const liveData = await res.json();
                if (liveData && liveData.items && liveData.items.length > 0) {
                    if (liveData.year === this.currentYear && liveData.weekNumber === this.currentWeek) {
                        this.currentSchedule = liveData;
                        this.renderAll();
                    }
                }
            }
        } catch (e) {}
    },

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

        // Điều hướng tuần
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

        // Tìm kiếm tức thì
        const searchInputEl = document.getElementById("searchInput");
        searchInputEl?.addEventListener("input", (e) => {
            this.searchQuery = e.target.value.toLowerCase().trim();
            const btnClear = document.getElementById("btnClearSearch");
            if (btnClear) btnClear.style.display = this.searchQuery ? "block" : "none";
            this.renderScheduleTable();
        });

        // Tabs
        document.querySelectorAll(".nav-tab-item").forEach(tab => {
            tab.addEventListener("click", () => {
                const targetTab = tab.getAttribute("data-tab");
                if (targetTab) this.switchTab(targetTab);
            });
        });

        // Khối công tác Pills
        document.querySelectorAll(".bloc-pill-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                document.querySelectorAll(".bloc-pill-btn").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                this.currentBloc = btn.getAttribute("data-bloc") || "all";
                this.renderScheduleTable();
            });
        });

        // Bottom actions (Chỉ các chức năng xem/xuất bản của khách)
        document.getElementById("btnHistoryAudit")?.addEventListener("click", () => this.openAuditHistoryModal());
        document.getElementById("btnExportWord")?.addEventListener("click", () => {
            if (this.currentSchedule) {
                const weekId = this.currentSchedule.id || `sched_${this.currentSchedule.year}_w${this.currentSchedule.weekNumber}`;
                try {
                    window.location.href = `/api/schedule/export-word/${encodeURIComponent(weekId)}`;
                } catch (e) {
                    ExportService.exportToWord(this.currentSchedule);
                }
            }
        });
        document.getElementById("btnExportPDF")?.addEventListener("click", () => ExportService.printSchedule());

        // Lắng nghe sự kiện đồng bộ dữ liệu từ máy chủ
        window.addEventListener("schedules-synced", () => {
            this.populateWeekOptions();
            this.loadCurrentSchedule();
            this.renderAll();
        });
    },

    switchTab(tabName) {
        this.activeTab = tabName;
        document.querySelectorAll(".nav-tab-item").forEach(t => t.classList.remove("active"));
        document.querySelector(`.nav-tab-item[data-tab="${tabName}"]`)?.classList.add("active");

        document.querySelectorAll(".view-section").forEach(s => s.classList.remove("active"));
        document.getElementById(`view_${tabName}`)?.classList.add("active");

        if (tabName === "dashboard") this.renderDashboard();
        if (tabName === "archive") this.renderArchiveView();
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
            datesEl.innerHTML = `<strong>Thời gian:</strong> Từ ngày ${start} đến ngày ${end} | <strong>Cập nhật lần cuối:</strong> ${s.lastUpdated || ''}`;
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
                    <td colspan="9" style="text-align: center; padding: 40px; color: #64748B;">
                        <div style="font-size: 36px; margin-bottom: 8px;">📅</div>
                        <div style="font-size: 15px; font-weight: 700;">Chưa có mục công tác nào trong Tuần ${this.currentWeek}/${this.currentYear}</div>
                        <p style="font-size: 13px; margin-top: 4px;">Vui lòng chọn tuần khác hoặc quay lại sau khi Văn phòng UBND xã cập nhật lịch.</p>
                    </td>
                </tr>
            `;
            return;
        }

        let filteredItems = s.items.filter(item => {
            const matchBloc = this.currentBloc === "all" || item.bloc === this.currentBloc;
            const matchSearch = !this.searchQuery || 
                (item.content && item.content.toLowerCase().includes(this.searchQuery)) ||
                (item.leader && item.leader.toLowerCase().includes(this.searchQuery)) ||
                (item.location && item.location.toLowerCase().includes(this.searchQuery)) ||
                (item.participants && item.participants.toLowerCase().includes(this.searchQuery));
            return matchBloc && matchSearch;
        });

        const daysOrder = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"];
        const grouped = {};
        daysOrder.forEach(d => grouped[d] = []);

        filteredItems.forEach(item => {
            if (!grouped[item.dayOfWeek]) grouped[item.dayOfWeek] = [];
            grouped[item.dayOfWeek].push(item);
        });

        let html = "";

        daysOrder.forEach(dayName => {
            const dayItems = grouped[dayName];
            // Sắp xếp theo trình tự thời gian: sự kiện nào trước thì nằm trên
            dayItems.sort((a, b) => StorageService.compareTime(a.time, b.time));

            if (dayItems.length === 0 && (this.currentBloc !== "all" || this.searchQuery)) {
                return;
            }

            // Lấy ngày tháng từ item đầu tiên hoặc tính toán chính xác
            let fullDateIso = "";
            if (dayItems.length > 0 && dayItems[0].date) {
                fullDateIso = dayItems[0].date;
            } else if (s && s.startDate) {
                fullDateIso = StorageService.calculateDateForDay(s.startDate, dayName);
            }

            let dateStr = "";
            if (fullDateIso) {
                if (fullDateIso.includes('-')) {
                    const parts = fullDateIso.split('-');
                    if (parts.length === 3) {
                        dateStr = `${parts[2]}/${parts[1]}`;
                    }
                } else if (fullDateIso.includes('/')) {
                    const parts = fullDateIso.split('/');
                    dateStr = `${parts[0]}/${parts[1]}`;
                }
            }

            let isToday = this.checkIsToday(fullDateIso, dayName, s ? s.startDate : null, dateStr);

            // Thuộc tính style cho ngày hôm nay (Bảo đảm áp dụng 100% kể cả khi CSS bị cache trình duyệt)
            const todayRowStyle = isToday ? `style="background: linear-gradient(90deg, #FEF08A 0%, #FEF9C3 40%, #FFFDF0 100%) !important; border-top: 2px solid #F59E0B !important; border-bottom: 2px solid #FCD34D !important;"` : '';
            const todayContentStyle = isToday ? `style="background: transparent !important; color: #78350F !important;"` : '';
            const todayNameStyle = isToday ? `style="color: #854D0E !important; font-weight: 900 !important;"` : '';
            const todayDateStyle = isToday ? `style="color: #92400E !important; font-weight: 800 !important;"` : '';
            const todayCountStyle = isToday ? `style="background-color: #D97706 !important; color: #FFFFFF !important;"` : '';

            html += `
                <tr class="day-divider-row ${isToday ? 'is-today-divider' : ''}" ${todayRowStyle}>
                    <td colspan="8" class="day-divider-content" ${todayContentStyle}>
                        <span class="day-name" ${todayNameStyle}>${dayName}</span>
                        ${dateStr ? `<span class="day-date" ${todayDateStyle}>(${dateStr})</span>` : ''}
                        ${isToday ? `<span class="badge-today-pill" style="background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); color: #FFFFFF !important; font-size: 11px; font-weight: 800; padding: 2.5px 8.5px; border-radius: 999px; margin-left: 8px; display: inline-flex; align-items: center; letter-spacing: 0.5px; vertical-align: middle; box-shadow: 0 1px 3px rgba(220, 38, 38, 0.3);">HÔM NAY</span>` : ''}
                        <span class="day-item-count" ${todayCountStyle}>${dayItems.length} cuộc họp/công việc</span>
                    </td>
                </tr>
            `;

            if (dayItems.length === 0) {
                html += `
                    <tr class="item-row ${isToday ? 'is-today-item' : ''}">
                        <td colspan="8" style="text-align: center; color: ${isToday ? '#854D0E' : '#94A3B8'}; font-style: italic; padding: 10px; ${isToday ? 'background-color: #FEFCE8;' : ''}">
                            (Không có lịch công tác)
                        </td>
                    </tr>
                `;
            } else {
                dayItems.forEach(item => {
                    const blocBadgeClass = this.getBlocBadgeClass(item.bloc);
                    const attachmentHTML = item.attachment ? `
                        <button class="btn-attachment-badge" onclick="GuestApp.previewAttachment('${item.id}', '${escapeHTML(item.attachment.name || '')}', '${escapeHTML(item.content)}')">
                            📄 ${escapeHTML(item.attachment.badge || item.attachment.name || 'Giấy mời')}
                        </button>
                    ` : `<span class="no-attachment-tag">—</span>`;

                    const todayColStyle = isToday ? `style="background-color: #FEF9C3 !important; border-right: 1px solid #FDE047 !important; border-left: 3px solid #EAB308 !important;"` : '';
                    const todayPillStyle = isToday ? `style="background-color: #FEF08A !important; color: #78350F !important; border: 1.5px solid #EAB308 !important; font-weight: 900 !important;"` : '';

                    html += `
                        <tr class="item-row ${isToday ? 'is-today-item' : ''}" data-item-id="${item.id}">
                            <td class="col-time-cell ${isToday ? 'is-today-time' : ''}" ${todayColStyle}>
                                <span class="time-pill ${isToday ? 'is-today-pill' : ''}" ${todayPillStyle}>${item.time}</span>
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
                                    <button class="btn-action-icon btn-view" title="Xem chi tiết cuộc họp" onclick="GuestApp.viewItemDetail('${item.id}')">👁️</button>
                                    <button class="btn-action-icon btn-edit" title="Chỉnh sửa công tác (Chuyển sang Quản trị)" onclick="window.location.href='index.html?editItem=${item.id}'">✏️</button>
                                </div>
                            </td>
                        </tr>
                    `;
                });
            }
        });

        // Nếu không có bất kỳ mục công tác nào khớp với bộ lọc, hiển thị thông báo rỗng thân thiện
        if (!html || html.trim() === "") {
            html = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 45px 16px; background: #FAFDFB;">
                        <div style="font-size: 36px; margin-bottom: 8px;">🔍</div>
                        <div style="font-size: 15.5px; font-weight: 700; color: #1E293B; margin-bottom: 6px;">
                            ${this.searchQuery ? `Không tìm thấy mục công tác nào khớp với từ khóa "${escapeHTML(this.searchQuery)}"` : 'Tuần này hiện chưa có lịch công tác hoặc khối được chọn không có dữ liệu'}
                        </div>
                        <div style="font-size: 13px; color: #64748B; margin-bottom: 16px;">
                            ${this.searchQuery ? 'Vui lòng kiểm tra lại từ khóa hoặc bấm nút bên dưới để khôi phục toàn bộ lịch tuần.' : 'Vui lòng chọn tuần khác để tra cứu.'}
                        </div>
                        <button type="button" onclick="GuestApp.resetToHome(event)" style="background: #1E3A8A; color: #FFFFFF; border: none; padding: 9px 20px; border-radius: 6px; font-size: 13.5px; font-weight: 700; cursor: pointer; box-shadow: 0 2px 6px rgba(30,58,138,0.25); display: inline-flex; align-items: center; gap: 6px;">
                            <span>🔄</span> Hiển Thị Lại Toàn Bộ Lịch Tuần
                        </button>
                    </td>
                </tr>
            `;
        }

        tbody.innerHTML = html;
    },

    clearSearch() {
        const input = document.getElementById("searchInput");
        if (input) input.value = "";
        this.searchQuery = "";
        const btnClear = document.getElementById("btnClearSearch");
        if (btnClear) btnClear.style.display = "none";
        this.renderScheduleTable();
    },

    resetToHome(e) {
        if (e && typeof e.preventDefault === "function") {
            e.preventDefault();
        }
        // 1. Xóa tìm kiếm
        this.clearSearch();

        // 2. Reset khối về "all"
        this.currentBloc = "all";
        document.querySelectorAll(".bloc-pill-btn").forEach(btn => {
            btn.classList.toggle("active", btn.getAttribute("data-bloc") === "all");
        });

        // 3. Chuyển về tab Lịch Công Tác Tuần
        if (typeof this.switchTab === "function") {
            this.switchTab("tabSchedule");
        }

        // 4. Reset về tuần hiện tại
        const currentInfo = StorageService.getCurrentWeekInfo(new Date());
        this.currentWeek = currentInfo.weekNumber;
        this.currentYear = currentInfo.year;

        // 5. Nạp lại và vẽ lại giao diện
        this.populateWeekOptions();
        this.loadCurrentSchedule();
        this.renderAll();

        // 6. Cuộn mượt lên đầu trang
        window.scrollTo({ top: 0, behavior: "smooth" });
    },

    getBlocBadgeClass(bloc) {
        if (!bloc) return "badge-ubnd";
        if (bloc.includes("Đảng")) return "badge-danguy";
        if (bloc.includes("HĐND")) return "badge-hdnd";
        if (bloc.includes("MTTQ") || bloc.includes("Thường trực")) return "badge-mttq";
        if (bloc.includes("Khác") || bloc.includes("Đoàn thể")) return "badge-khac";
        return "badge-ubnd";
    },

    checkIsToday(dateIsoStr, dayName, startDateStr, dateStrDisplay) {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1;
        const currentDay = today.getDate();
        const todayIso = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`;
        const todayDayMonth = `${String(currentDay).padStart(2, '0')}/${String(currentMonth).padStart(2, '0')}`;

        // 1. So khớp trực tiếp YYYY-MM-DD
        if (dateIsoStr && dateIsoStr.trim() === todayIso) {
            return true;
        }

        // 2. So khớp trực tiếp chuỗi hiển thị DD/MM (ví dụ "21/10" hoặc "(21/10)")
        if (dateStrDisplay) {
            const cleanDisplay = dateStrDisplay.replace(/[()]/g, '').trim();
            if (cleanDisplay === todayDayMonth || cleanDisplay === `${currentDay}/${currentMonth}`) {
                return true;
            }
        }

        // 3. Trích xuất Ngày và Tháng từ chuỗi dateIsoStr (hỗ trợ YYYY-MM-DD, DD/MM/YYYY, DD/MM)
        if (dateIsoStr) {
            const trimmed = dateIsoStr.trim();
            if (trimmed.includes('-')) {
                const parts = trimmed.split('-');
                if (parts.length === 3) {
                    const itemM = parseInt(parts[1], 10);
                    const itemD = parseInt(parts[2], 10);
                    if (itemD === currentDay && itemM === currentMonth) {
                        return true;
                    }
                }
            } else if (trimmed.includes('/')) {
                const parts = trimmed.split('/');
                if (parts.length >= 2) {
                    const itemD = parseInt(parts[0], 10);
                    const itemM = parseInt(parts[1], 10);
                    if (itemD === currentDay && itemM === currentMonth) {
                        return true;
                    }
                }
            }
        }

        // 4. Tính toán từ ngày bắt đầu tuần (startDateStr) và thứ (dayName)
        if (startDateStr && dayName && typeof StorageService !== 'undefined' && StorageService.calculateDateForDay) {
            const calcIso = StorageService.calculateDateForDay(startDateStr, dayName);
            if (calcIso) {
                if (calcIso === todayIso) return true;
                const cp = calcIso.split('-');
                if (cp.length === 3) {
                    if (parseInt(cp[2], 10) === currentDay && parseInt(cp[1], 10) === currentMonth) {
                        return true;
                    }
                }
            }
        }

        // 5. So khớp Thứ trong tuần nếu hôm nay trùng với thứ đó (ví dụ "Thứ Tư")
        const vnDayNames = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
        const todayVnDay = vnDayNames[today.getDay()];
        if (dayName && dayName.trim().toLowerCase() === todayVnDay.toLowerCase()) {
            if (dateStrDisplay && dateStrDisplay.includes(String(currentDay))) {
                return true;
            }
        }

        return false;
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
                        <strong>🚗 Phương tiện:</strong> ${escapeHTML(item.vehicle || 'Tự túc')}
                    </div>
                </div>

                ${item.attachment ? `
                    <div style="background: #F0FDF4; border: 1px solid #86EFAC; border-radius: 8px; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between;">
                        <div>
                            <div style="font-weight: bold; color: #166534;">📄 ${escapeHTML(item.attachment.name || 'Giấy mời họp')}</div>
                            <div style="font-size: 11px; color: #475569;">Dung lượng: ${item.attachment.size || '340 KB'} | Văn bản chính thức</div>
                        </div>
                        <button class="btn-primary-create" style="padding: 6px 14px; font-size: 12px;" onclick="GuestApp.previewAttachment('${item.id}', '${escapeHTML(item.attachment.name)}', '${escapeHTML(item.content)}')">👁️ Xem Giấy Mời</button>
                    </div>
                ` : ''}
            </div>
        `;

        this.openModal("modalViewItemDetail");
    },

    previewAttachment(docId, docName, meetingTitle) {
        const titleEl = document.getElementById("docPreviewTitle");
        const bodyEl = document.getElementById("docPreviewBody");
        const btnDownload = document.getElementById("btnDocDownload");
        const btnOpenTab = document.getElementById("btnDocOpenTab");
        const org = StorageService.getOrganization();

        let targetAttachment = null;
        let foundContent = meetingTitle || "";
        if (this.currentSchedule && this.currentSchedule.items) {
            const foundItem = this.currentSchedule.items.find(i => 
                (i.attachment && (i.attachment.id === docId || i.attachment.name === docName)) || i.id === docId
            );
            if (foundItem) {
                targetAttachment = foundItem.attachment;
                foundContent = foundItem.content;
            }
        }

        const realDocName = (targetAttachment && targetAttachment.name) || docName || 'Giay_Moi_Hop.pdf';
        const fileUrl = (targetAttachment && (targetAttachment.url || targetAttachment.dataUrl)) || '';
        const fileSize = (targetAttachment && targetAttachment.size) || 'Đính kèm';
        const uploader = (targetAttachment && targetAttachment.uploader) || 'Văn phòng HĐND & UBND xã';
        const isImage = /\.(png|jpe?g|gif|webp)$/i.test(realDocName) || (targetAttachment && targetAttachment.type && targetAttachment.type.startsWith('image/'));
        const isPdf = /\.pdf$/i.test(realDocName) || (targetAttachment && targetAttachment.type === 'application/pdf');

        if (titleEl) titleEl.innerHTML = `<span>📄</span> ${escapeHTML(realDocName)}`;

        if (btnDownload) {
            btnDownload.href = fileUrl || '#';
            btnDownload.setAttribute('download', realDocName);
            btnDownload.onclick = (e) => {
                if (!fileUrl) {
                    e.preventDefault();
                    this.showToast("Tệp được lưu trữ trực tuyến theo giấy mời hành chính.", "info");
                }
            };
        }

        if (btnOpenTab) {
            if (fileUrl) {
                btnOpenTab.style.display = 'inline-flex';
                btnOpenTab.href = fileUrl;
            } else {
                btnOpenTab.style.display = 'none';
            }
        }

        if (bodyEl) {
            if (fileUrl && isImage) {
                bodyEl.innerHTML = `
                    <div style="text-align: center; padding: 10px;">
                        <div style="margin-bottom: 12px; font-size: 13px; color: #475569;">
                            <strong>📄 Tệp gốc:</strong> ${escapeHTML(realDocName)} (${fileSize}) • <strong>Đưa lên bởi:</strong> ${escapeHTML(uploader)}
                        </div>
                        <img src="${fileUrl}" alt="${escapeHTML(realDocName)}" style="max-width: 100%; max-height: 600px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: 1px solid #CBD5E1;">
                    </div>
                `;
            } else if (fileUrl && isPdf) {
                bodyEl.innerHTML = `
                    <div style="text-align: center;">
                        <div style="margin-bottom: 10px; font-size: 13px; color: #475569;">
                            <strong>📄 Tệp PDF:</strong> ${escapeHTML(realDocName)} (${fileSize}) • <strong>Đưa lên bởi:</strong> ${escapeHTML(uploader)}
                        </div>
                        <iframe src="${fileUrl}" style="width: 100%; height: 560px; border: 1px solid #CBD5E1; border-radius: 6px; background: #fff;"></iframe>
                    </div>
                `;
            } else if (fileUrl) {
                bodyEl.innerHTML = `
                    <div style="background: #FFFFFF; border: 1px solid #CBD5E1; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); padding: 40px 20px; text-align: center; max-width: 550px; margin: 20px auto;">
                        <div style="font-size: 52px; margin-bottom: 12px;">📁</div>
                        <div style="font-size: 17px; font-weight: 700; color: #0F4C81;">${escapeHTML(realDocName)}</div>
                        <div style="font-size: 13px; color: #64748B; margin: 8px 0 24px 0;">
                            Dung lượng: ${fileSize} • Đưa lên bởi: ${escapeHTML(uploader)}
                        </div>
                        <a href="${fileUrl}" download="${escapeHTML(realDocName)}" class="btn-bottom btn-save-publish" style="text-decoration: none; padding: 12px 28px; font-size: 14px; font-weight: 700; background: #16A34A; display: inline-flex; align-items: center; gap: 8px;">
                            📥 TẢI VỀ MÁY ĐỂ XEM VĂN BẢN
                        </a>
                    </div>
                `;
            } else {
                bodyEl.innerHTML = `
                    <div style="background: #FFFFFF; border: 1px solid #CBD5E1; box-shadow: 0 4px 6px rgba(0,0,0,0.05); padding: 30px; max-width: 700px; margin: 0 auto; font-family: 'Times New Roman', serif;">
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
                                    <div style="font-style: italic;">Ea Súp, ngày 31 tháng 08 năm 2026</div>
                                </td>
                            </tr>
                        </table>
                        <div style="text-align: center; margin: 24px 0;">
                            <div style="font-size: 16pt; font-weight: bold; text-transform: uppercase;">GIẤY MỜI</div>
                            <div style="font-size: 13pt; font-weight: bold; margin-top: 6px;">V/v ${escapeHTML(foundContent)}</div>
                        </div>
                        <div style="font-size: 13pt; line-height: 1.6; text-align: justify;">
                            <p style="text-indent: 20px; margin-bottom: 10px;">
                                Ủy ban nhân dân xã Ea Súp trân trọng kính mời các đồng chí tham dự phiên họp với các nội dung sau:
                            </p>
                            <p style="margin-left: 20px; margin-bottom: 8px;">
                                <strong>1. Nội dung:</strong> ${escapeHTML(foundContent)}
                            </p>
                            <p style="margin-left: 20px; margin-bottom: 8px;">
                                <strong>2. Thời gian & Địa điểm:</strong> Theo lịch công tác tuần đã công bố trên Cổng điều hành.
                            </p>
                            <p style="text-indent: 20px; margin-top: 14px;">
                                Đề nghị các đại biểu tham dự đúng giờ, chuẩn bị đầy đủ báo cáo, tài liệu để cuộc họp đạt kết quả tốt./.
                            </p>
                        </div>
                    </div>
                `;
            }
        }

        this.openModal("modalDocPreview");
    },

    openAuditHistoryModal() {
        const listEl = document.getElementById("auditLogListArea");
        const logs = AuditService.getLogsForWeek(this.currentSchedule.id);

        if (!logs || logs.length === 0) {
            listEl.innerHTML = `<div style="text-align: center; padding: 30px; color: #64748B;">Chưa có thay đổi nào trong Tuần ${this.currentWeek}/${this.currentYear}.</div>`;
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

    renderDashboard() {
        const s = this.currentSchedule;
        if (!s) return;

        const totalItems = (s.items || []).length;
        const totalWithDocs = (s.items || []).filter(i => !!i.attachment).length;

        document.getElementById("statTotalMeetings").textContent = totalItems;
        document.getElementById("statTotalDocs").textContent = totalWithDocs;

        const todayMeetingsList = document.getElementById("dashboardTodayMeetings");
        if (todayMeetingsList) {
            const items = (s.items || []).slice(0, 5);
            if (items.length === 0) {
                todayMeetingsList.innerHTML = `<div style="color: #64748B; font-size: 13px;">Không có cuộc họp nào trong tuần này.</div>`;
            } else {
                let html = "";
                items.forEach(item => {
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
                            <span class="schedule-status-badge ${sched.status === 'published' ? 'status-published' : 'status-draft'}">${sched.status === 'published' ? 'Đã Ban Hành' : 'Dự Thảo'}</span>
                        </div>
                        <div style="font-size: 12.5px; color: #64748B; margin-top: 4px;">
                            Thời gian: ${sched.startDate} đến ${sched.endDate} | Số cuộc họp: <strong>${(sched.items || []).length}</strong> | Cập nhật: ${sched.lastUpdated}
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn-action-icon" style="width: auto; padding: 6px 12px; font-weight: bold;" onclick="GuestApp.loadArchivedWeek(${sched.year}, ${sched.weekNumber})">📂 Mở Lịch Tuần</button>
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
    },

    openModal(modalId) {
        document.getElementById(modalId)?.classList.add("show");
    },

    closeModal(modalId) {
        document.getElementById(modalId)?.classList.remove("show");
    }
};

document.addEventListener("DOMContentLoaded", () => {
    GuestApp.init();
});
