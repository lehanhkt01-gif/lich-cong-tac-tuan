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
        vehicle: "Phương tiện bố trí",
        attachment: "Giấy mời / Tệp đính kèm"
    },

    // So sánh sự khác biệt giữa 2 bản ghi
    computeItemDiff(oldItem, newItem) {
        if (!oldItem) return [{ field: "Toàn bộ mục", oldValue: "(Chưa có)", newValue: "Thêm mới mục công tác" }];

        const changes = [];
        const keys = ["time", "bloc", "content", "location", "leader", "participants", "vehicle"];

        keys.forEach(key => {
            const oldVal = (oldItem[key] || "").trim();
            const newVal = (newItem[key] || "").trim();

            if (oldVal !== newVal) {
                changes.push({
                    field: this.fieldLabels[key] || key,
                    key: key,
                    oldValue: oldVal || "(Trống)",
                    newValue: newVal || "(Trống)"
                });
            }
        });

        // So sánh giấy mời / tệp đính kèm
        const oldAtt = oldItem.attachment ? (oldItem.attachment.name || oldItem.attachment.badge || "Có tệp") : "";
        const newAtt = newItem.attachment ? (newItem.attachment.name || newItem.attachment.badge || "Có tệp") : "";
        if (oldAtt !== newAtt) {
            changes.push({
                field: this.fieldLabels.attachment,
                key: "attachment",
                oldValue: oldAtt || "(Chưa có tệp)",
                newValue: newAtt || "(Đã gỡ tệp)"
            });
        }

        return changes;
    },

    // Ghi lại log khi thêm/sửa/xóa một mục
    logItemChange(weekSchedule, action, oldItem, newItem, reason = "") {
        const changes = this.computeItemDiff(oldItem, newItem);
        if (action === "UPDATE" && changes.length === 0) return null; // Không có thay đổi gì thực sự

        let actionTitle = "Cập nhật mục công tác";
        if (action === "CREATE") actionTitle = "Thêm mới mục công tác";
        if (action === "DELETE") actionTitle = "Xóa mục công tác";

        const logEntry = {
            weekId: weekSchedule.id,
            weekNumber: weekSchedule.weekNumber,
            year: weekSchedule.year,
            itemId: newItem ? newItem.id : (oldItem ? oldItem.id : null),
            itemDay: newItem ? newItem.dayOfWeek : (oldItem ? oldItem.dayOfWeek : ""),
            itemTime: newItem ? newItem.time : (oldItem ? oldItem.time : ""),
            action: action,
            actionTitle: actionTitle,
            changes: action === "DELETE" ? [
                {
                    field: "Mục bị xóa",
                    oldValue: `${oldItem.time} - ${oldItem.content} (${oldItem.leader})`,
                    newValue: "[Đã xóa khỏi lịch tuần]"
                }
            ] : changes,
            reason: reason || "Cập nhật theo chỉ đạo công tác thường xuyên."
        };

        return StorageService.addAuditLog(logEntry);
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
