/**
 * PHÂN HỆ KIỂM SOÁT THAY ĐỔI & TRUY VẾT LỊCH SỬ (AUDIT TRAIL & DIFF VIEWER)
 * Tự động ghi vết và so sánh dữ liệu cũ (gạch đỏ) vs dữ liệu mới (xanh lá)
 */

const AuditService = {
    // Tên hiển thị thân thiện cho các trường dữ liệu
    fieldLabels: {
        dayOfWeek: "Thứ trong tuần",
        date: "Ngày tháng",
        time: "Thời gian / Giờ",
        bloc: "Khối công tác",
        content: "Nội dung công tác",
        location: "Địa điểm",
        leader: "Lãnh đạo dự / Chủ trì",
        participants: "Thành phần tham dự",
        vehicle: "Phương tiện bố trí / Lái xe",
        attachment: "Giấy mời / Tệp đính kèm"
    },

    // So sánh sự khác biệt giữa 2 bản ghi
    computeItemDiff(oldItem, newItem) {
        if (!oldItem) return [{ field: "Toàn bộ mục", oldValue: "(Chưa có)", newValue: "Thêm mới mục công tác" }];

        const changes = [];
        const keys = ["dayOfWeek", "time", "bloc", "content", "location", "leader", "participants", "vehicle"];

        keys.forEach(key => {
            const oldVal = (oldItem && oldItem[key] != null ? String(oldItem[key]) : "").trim();
            const newVal = (newItem && newItem[key] != null ? String(newItem[key]) : "").trim();

            if (oldVal !== newVal) {
                changes.push({
                    field: this.fieldLabels[key] || key,
                    key: key,
                    oldValue: oldVal || "(Trống)",
                    newValue: newVal || "(Trống)"
                });
            }
        });

        // So sánh giấy mời / tệp đính kèm an toàn
        const getAttachmentLabel = (att) => {
            if (!att) return "";
            if (typeof att === 'string') return att;
            if (typeof att === 'object') return att.name || att.badge || att.fileName || "Có tệp đính kèm";
            return String(att);
        };

        const oldAtt = getAttachmentLabel(oldItem ? oldItem.attachment : null);
        const newAtt = getAttachmentLabel(newItem ? newItem.attachment : null);
        if (oldAtt !== newAtt) {
            changes.push({
                field: this.fieldLabels.attachment || "Giấy mời / Tệp đính kèm",
                key: "attachment",
                oldValue: oldAtt || "(Chưa có tệp)",
                newValue: newAtt || "(Đã gỡ tệp)"
            });
        }

        return changes;
    },

    // Ghi lại log chung cho hệ thống
    logChange(action, description, actor = "") {
        try {
            const logEntry = {
                action: action,
                actionTitle: description,
                timestamp: new Date().toLocaleString("vi-VN"),
                actor: actor || "Super Admin",
                changes: []
            };
            if (typeof StorageService !== "undefined" && StorageService.addAuditLog) {
                return StorageService.addAuditLog(logEntry);
            }
        } catch (e) {
            console.warn("Lỗi logChange:", e);
        }
        return null;
    },

    // Ghi lại log khi thêm/sửa/xóa một mục
    logItemChange(weekSchedule, action, oldItem, newItem, reason = "") {
        try {
            const changes = this.computeItemDiff(oldItem, newItem);
            if (action === "UPDATE" && (!changes || changes.length === 0)) return null; // Không có thay đổi gì thực sự

            let actionTitle = "Cập nhật mục công tác";
            if (action === "CREATE") actionTitle = "Thêm mới mục công tác";
            if (action === "DELETE") actionTitle = "Xóa mục công tác";

            const logEntry = {
                weekId: weekSchedule ? weekSchedule.id : "",
                weekNumber: weekSchedule ? weekSchedule.weekNumber : "",
                year: weekSchedule ? weekSchedule.year : "",
                itemId: newItem ? newItem.id : (oldItem ? oldItem.id : null),
                itemDay: newItem ? newItem.dayOfWeek : (oldItem ? oldItem.dayOfWeek : ""),
                itemTime: newItem ? newItem.time : (oldItem ? oldItem.time : ""),
                action: action,
                actionTitle: actionTitle,
                changes: action === "DELETE" ? [
                    {
                        field: "Mục bị xóa",
                        oldValue: `${oldItem ? oldItem.time : ''} - ${oldItem ? oldItem.content : ''} (${oldItem ? oldItem.leader : ''})`,
                        newValue: "[Đã xóa khỏi lịch tuần]"
                    }
                ] : (changes || []),
                reason: reason || "Cập nhật theo chỉ đạo công tác thường xuyên."
            };

            if (typeof StorageService !== "undefined" && StorageService.addAuditLog) {
                return StorageService.addAuditLog(logEntry);
            }
        } catch (e) {
            console.warn("Lỗi logItemChange:", e);
        }
        return null;
    },

    // Tạo HTML so sánh trực quan Diff (Gạch đỏ dữ liệu cũ, Tô xanh lá dữ liệu mới)
    renderDiffHTML(changes) {
        if (!changes || changes.length === 0) {
            return `<div class="diff-empty">Không có thay đổi nào được ghi nhận.</div>`;
        }

        let html = `<div class="diff-table-container">
            <table class="diff-table">
                <thead>
                    <tr>
                        <th style="width: 22%;">Nội dung / Trường thay đổi</th>
                        <th style="width: 39%;">Dữ liệu cũ (Bản trước)</th>
                        <th style="width: 39%;">Dữ liệu mới (Đã sửa)</th>
                    </tr>
                </thead>
                <tbody>`;

        changes.forEach(change => {
            html += `
                <tr>
                    <td class="diff-field-name">
                        <strong>${escapeHTML(change.field)}</strong>
                    </td>
                    <td class="diff-cell-old">
                        <div class="diff-box-old">
                            <span class="diff-tag diff-tag-old">Cũ</span>
                            <span class="diff-text-old">${escapeHTML(change.oldValue)}</span>
                        </div>
                    </td>
                    <td class="diff-cell-new">
                        <div class="diff-box-new">
                            <span class="diff-tag diff-tag-new">Mới</span>
                            <span class="diff-text-new">${escapeHTML(change.newValue)}</span>
                        </div>
                    </td>
                </tr>
            `;
        });

        html += `</tbody></table></div>`;
        return html;
    },

    // Lọc lịch sử theo tuần
    getLogsForWeek(weekId) {
        if (typeof StorageService === "undefined" || !StorageService.getAuditLogs) return [];
        const logs = StorageService.getAuditLogs();
        if (!weekId) return logs;
        return logs.filter(l => l.weekId === weekId);
    }
};

function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
