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
        document.getElementById("searchInput")?.addEventListener("input", (e) => {
            this.searchQuery = e.target.value.toLowerCase().trim();
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
            if (this.currentSchedule) ExportService.exportToWord(this.currentSchedule);
        });
        document.getElementById("btnExportPDF")?.addEventListener("click", () => ExportService.printSchedule());
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

            let dateStr = "";
            if (dayItems.length > 0 && dayItems[0].date) {
                dateStr = dayItems[0].date.split('-').reverse().slice(0, 2).join('/');
            }

            html += `
                <tr class="day-divider-row">
                    <td colspan="8" class="day-divider-content">
                        <span class="day-name">${dayName}</span>
                        ${dateStr ? `<span class="day-date">(${dateStr})</span>` : ''}
                        <span class="day-item-count">${dayItems.length} cuộc họp/công việc</span>
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
                dayItems.forEach(item => {
                    const blocBadgeClass = this.getBlocBadgeClass(item.bloc);
                    const attachmentHTML = item.attachment ? `
                        <button class="btn-attachment-badge" onclick="GuestApp.previewAttachment('${item.id}', '${escapeHTML(item.attachment.name || '')}', '${escapeHTML(item.content)}')">
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
                                    <button class="btn-action-icon" title="Xem chi tiết cuộc họp" onclick="GuestApp.viewItemDetail('${item.id}')">👁️</button>
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
