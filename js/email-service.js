/**
 * PHÂN HỆ TỰ ĐỘNG GỬI EMAIL THÔNG BÁO (EMAIL DISPATCHER & NOTIFICATION ENGINE)
 * Tự động tạo mẫu email hành chính và gửi thông báo lịch tuần đến hòm thư công vụ
 */

const EmailService = {
    // Tạo mẫu email HTML thông báo cập nhật lịch
    generateEmailTemplate(weekSchedule, recentChanges = [], customNote = "") {
        const org = StorageService.getOrganization();
        const currentUser = AuthService.getCurrentUser();
        const formattedDate = new Date().toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Tạo bảng tóm tắt thay đổi hoặc toàn bộ lịch
        let itemsHTML = "";
        const displayItems = (recentChanges && recentChanges.length > 0) ? recentChanges : (weekSchedule.items || []);

        displayItems.forEach((item, index) => {
            const isChanged = recentChanges && recentChanges.some(rc => rc.id === item.id);
            const changeBadge = isChanged ? `<span style="background-color: #FEF3C7; color: #92400E; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold;">⚡ ĐÃ CẬP NHẬT</span>` : '';
            const attachmentLink = item.attachment ? `<div style="margin-top: 4px;"><a href="${org.portalDomain}#view-${item.attachment.id}" style="color: #2563EB; text-decoration: none; font-size: 12px; font-weight: bold;">📄 [Tải giấy mời: ${item.attachment.name || 'Tệp đính kèm'}]</a></div>` : '';

            itemsHTML += `
                <tr style="border-bottom: 1px solid #E2E8F0; background-color: ${index % 2 === 0 ? '#FFFFFF' : '#F8FAFC'};">
                    <td style="padding: 10px 12px; font-weight: bold; color: #1E293B; vertical-align: top; width: 14%;">
                        ${item.dayOfWeek}<br><small style="color: #64748B; font-weight: normal;">${item.date ? item.date.split('-').reverse().slice(0, 2).join('/') : ''}</small>
                    </td>
                    <td style="padding: 10px 12px; font-weight: bold; color: #0F4C81; vertical-align: top; width: 10%;">
                        ${item.time}
                    </td>
                    <td style="padding: 10px 12px; vertical-align: top; width: 10%;">
                        <span style="background-color: #E0F2FE; color: #0369A1; padding: 3px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; display: inline-block;">${item.bloc || 'UBND'}</span>
                    </td>
                    <td style="padding: 10px 12px; vertical-align: top; width: 34%;">
                        <div style="font-weight: 600; color: #0F172A; margin-bottom: 4px;">${item.content} ${changeBadge}</div>
                        <div style="font-size: 12px; color: #475569;"><strong>📍 Địa điểm:</strong> ${item.location}</div>
                        ${attachmentLink}
                    </td>
                    <td style="padding: 10px 12px; vertical-align: top; width: 32%;">
                        <div style="color: #B91C1C; font-weight: bold; font-size: 13px; margin-bottom: 2px;">👤 ${item.leader}</div>
                        <div style="font-size: 12px; color: #64748B;"><strong>Thành phần:</strong> ${item.participants}</div>
                    </td>
                </tr>
            `;
        });

        const emailSubject = `[${org.name}] Thông báo Lịch công tác Tuần ${weekSchedule.weekNumber} năm ${weekSchedule.year} (${weekSchedule.title})`;

        const emailBody = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${emailSubject}</title>
            </head>
            <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #F1F5F9; margin: 0; padding: 20px; color: #1E293B; line-height: 1.5;">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 850px; margin: 0 auto; background-color: #FFFFFF; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); border: 1px solid #CBD5E1;">
                    <!-- HEADER -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #0A2540 0%, #0F4C81 100%); padding: 24px; text-align: center; color: #FFFFFF; border-bottom: 4px solid #D97706;">
                            <div style="font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #FCD34D; font-weight: bold; margin-bottom: 6px;">
                                ${org.province}
                            </div>
                            <div style="font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
                                ${org.fullName}
                            </div>
                            <div style="font-size: 14px; color: #E2E8F0;">
                                CỔNG THÔNG TIN ĐIỀU HÀNH - HỆ THỐNG QUẢN LÝ LỊCH CÔNG TÁC
                            </div>
                        </td>
                    </tr>

                    <!-- INTRO -->
                    <tr>
                        <td style="padding: 24px 28px;">
                            <div style="font-size: 15px; margin-bottom: 16px;">
                                <strong>Kính gửi:</strong> Các đồng chí Lãnh đạo Đảng ủy, Thường trực HĐND, UBND, UBMTTQVN xã và toàn thể Cán bộ, Công chức, Người hoạt động không chuyên trách xã Ea Súp.
                            </div>
                            <p style="margin: 0 0 14px 0; font-size: 14px; color: #334155;">
                                Văn phòng HĐND & UBND xã trân trọng gửi đến các đồng chí thông tin Lịch công tác <strong>Tuần thứ ${weekSchedule.weekNumber} năm ${weekSchedule.year}</strong> (từ ngày <strong>${weekSchedule.startDate.split('-').reverse().join('/')}</strong> đến ngày <strong>${weekSchedule.endDate.split('-').reverse().join('/')}</strong>).
                            </p>
                            ${customNote ? `<div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px 16px; margin-bottom: 16px; font-size: 13px; color: #78350F; border-radius: 0 4px 4px 0;"><strong>Ghi chú từ Văn phòng:</strong> ${customNote}</div>` : ''}

                            <!-- TABLE -->
                            <div style="margin-top: 20px; margin-bottom: 24px; border: 1px solid #E2E8F0; border-radius: 6px; overflow: hidden;">
                                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; font-size: 13px;">
                                    <thead>
                                        <tr style="background-color: #0F4C81; color: #FFFFFF;">
                                            <th style="padding: 10px 12px; text-align: left;">Thứ / Ngày</th>
                                            <th style="padding: 10px 12px; text-align: left;">Giờ</th>
                                            <th style="padding: 10px 12px; text-align: left;">Khối</th>
                                            <th style="padding: 10px 12px; text-align: left;">Nội dung & Địa điểm</th>
                                            <th style="padding: 10px 12px; text-align: left;">Chủ trì & Thành phần</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${itemsHTML}
                                    </tbody>
                                </table>
                            </div>

                            <!-- BUTTON PORTAL LINK -->
                            <div style="text-align: center; margin: 28px 0 16px 0;">
                                <a href="${org.portalDomain}?week=${weekSchedule.weekNumber}&year=${weekSchedule.year}" style="background-color: #0F4C81; color: #FFFFFF; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 2px 4px rgba(15, 76, 129, 0.3);">
                                    🌐 TRUY CẬP CỔNG ĐIỀU HÀNH ĐỂ XEM CHI TIẾT & TẢI GIẤY MỜI
                                </a>
                            </div>
                        </td>
                    </tr>

                    <!-- FOOTER -->
                    <tr>
                        <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 20px 28px; font-size: 12px; color: #64748B;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="vertical-align: top;">
                                        <strong>VĂN PHÒNG HĐND & UBND XÃ EA SÚP</strong><br>
                                        Địa chỉ: ${org.address}<br>
                                        Điện thoại liên hệ: ${org.phone} - Email: ${org.email}
                                    </td>
                                    <td style="vertical-align: top; text-align: right;">
                                        Người gửi thông báo: <strong>${currentUser.fullName}</strong><br>
                                        Chức vụ: ${currentUser.position}<br>
                                        Thời gian phát hành: ${new Date().toLocaleTimeString('vi-VN')} ngày ${new Date().toLocaleDateString('vi-VN')}
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `;

        return { subject: emailSubject, body: emailBody };
    },

    // Gửi email giả lập với nhật ký đầy đủ
    sendNotification(weekSchedule, selectedRecipients = [], customNote = "") {
        const emailData = this.generateEmailTemplate(weekSchedule, [], customNote);
        const currentUser = AuthService.getCurrentUser();
        const cadres = StorageService.getCadres();

        const actualRecipients = selectedRecipients.length > 0 
            ? selectedRecipients 
            : cadres.map(c => c.email);

        const logEntry = {
            weekId: weekSchedule.id,
            weekNumber: weekSchedule.weekNumber,
            year: weekSchedule.year,
            sender: currentUser.email,
            recipientsCount: actualRecipients.length,
            recipientsList: actualRecipients,
            subject: emailData.subject,
            status: "Đã gửi thành công",
            summary: `Đã tự động gửi thông báo lịch tuần ${weekSchedule.weekNumber}/${weekSchedule.year} đến ${actualRecipients.length} hòm thư công vụ.`
        };

        const result = StorageService.addEmailLog(logEntry);
        return { success: true, log: result, emailData: emailData };
    }
};
