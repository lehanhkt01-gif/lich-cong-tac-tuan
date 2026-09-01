/**
 * PHÂN HỆ XUẤT BẢN VĂN BẢN CHUẨN THỂ THỨC HÀNH CHÍNH (NGHỊ ĐỊNH 30/2020/NĐ-CP)
 * Tự động tạo file Microsoft Word (.doc) và Bản in / PDF chuẩn thể thức Nhà nước
 */

const ExportService = {
    // Xuất file Word (.doc) chuẩn thể thức văn bản hành chính Việt Nam
    exportToWord(weekSchedule) {
        const org = StorageService.getOrganization();
        const now = new Date();
        const day = now.getDate();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        const startDateParts = weekSchedule.startDate.split('-');
        const formattedStart = `${startDateParts[2]}/${startDateParts[1]}/${startDateParts[0]}`;
        const endDateParts = weekSchedule.endDate.split('-');
        const formattedEnd = `${endDateParts[2]}/${endDateParts[1]}/${endDateParts[0]}`;

        let rowsHTML = "";
        (weekSchedule.items || []).forEach((item, index) => {
            rowsHTML += `
                <tr style="mso-yfti-irow:${index + 1};">
                    <td style="border:1.0pt solid windowtext; padding:5pt; text-align:center; font-weight:bold; width:12%;">
                        ${item.dayOfWeek}<br>
                        <span style="font-weight:normal; font-size:11pt;">(${item.date ? item.date.split('-').reverse().slice(0, 2).join('/') : ''})</span>
                    </td>
                    <td style="border:1.0pt solid windowtext; padding:5pt; text-align:center; font-weight:bold; width:8%;">
                        ${item.time}
                    </td>
                    <td style="border:1.0pt solid windowtext; padding:5pt; text-align:center; width:9%;">
                        ${item.bloc || 'UBND'}
                    </td>
                    <td style="border:1.0pt solid windowtext; padding:5pt; text-align:justify; width:33%;">
                        <p style="margin:0 0 3pt 0; font-weight:bold;">${escapeHTML(item.content)}</p>
                        <p style="margin:0; font-style:italic; font-size:11pt;">Địa điểm: ${escapeHTML(item.location)}</p>
                    </td>
                    <td style="border:1.0pt solid windowtext; padding:5pt; width:15%;">
                        <p style="margin:0; font-weight:bold;">${escapeHTML(item.leader)}</p>
                    </td>
                    <td style="border:1.0pt solid windowtext; padding:5pt; text-align:justify; width:15%;">
                        <p style="margin:0; font-size:11pt;">${escapeHTML(item.participants)}</p>
                    </td>
                    <td style="border:1.0pt solid windowtext; padding:5pt; text-align:center; width:8%; font-size:11pt;">
                        ${escapeHTML(item.vehicle || 'Tự túc')}
                    </td>
                </tr>
            `;
        });

        const wordTemplate = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' 
                  xmlns:w='urn:schemas-microsoft-com:office:word' 
                  xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset="utf-8">
                <title>Lich_Cong_Tac_Tuan_${weekSchedule.weekNumber}_${weekSchedule.year}</title>
                <!--[if gte mso 9]>
                <xml>
                    <w:WordDocument>
                        <w:View>Print</w:View>
                        <w:Zoom>100</w:Zoom>
                        <w:DoNotOptimizeForBrowser/>
                    </w:WordDocument>
                </xml>
                <![endif]-->
                <style>
                    @page Section1 {
                        size: 841.9pt 595.3pt; /* A4 Landscape */
                        mso-page-orientation: landscape;
                        margin: 2.0cm 1.5cm 2.0cm 2.0cm;
                    }
                    div.Section1 { page:Section1; }
                    body {
                        font-family: 'Times New Roman', serif;
                        font-size: 13.0pt;
                        line-height: 1.25;
                        color: black;
                    }
                    table.MsoTableGrid {
                        border-collapse: collapse;
                        width: 100%;
                        border: 1.0pt solid windowtext;
                    }
                    p { margin: 0; padding: 0; }
                </style>
            </head>
            <body>
                <div class="Section1">
                    <!-- TIÊU ĐỀ ĐẦU VĂN BẢN (CHUẨN NĐ 30/2020/NĐ-CP) -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="border:none; margin-bottom:15pt;">
                        <tr>
                            <td width="42%" align="center" style="vertical-align:top;">
                                <p style="font-size:12pt; text-transform:uppercase;">${org.province}</p>
                                <p style="font-size:13pt; font-weight:bold; text-transform:uppercase;">${org.fullName}</p>
                                <div style="border-bottom: 1.5pt solid black; width: 45%; margin: 2pt auto 4pt auto;"></div>
                                <p style="font-size:12pt;">Số: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; /TB-UBND</p>
                            </td>
                            <td width="58%" align="center" style="vertical-align:top;">
                                <p style="font-size:12pt; font-weight:bold; text-transform:uppercase;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                                <p style="font-size:13pt; font-weight:bold;">Độc lập - Tự do - Hạnh phúc</p>
                                <div style="border-bottom: 1.5pt solid black; width: 55%; margin: 2pt auto 4pt auto;"></div>
                                <p style="font-size:13pt; font-style:italic;">Ea Súp, ngày ${day} tháng ${month < 10 ? '0' + month : month} năm ${year}</p>
                            </td>
                        </tr>
                    </table>

                    <!-- TÊN LOẠI VĂN BẢN VÀ TRÍCH YẾU NỘI DUNG -->
                    <div style="text-align:center; margin-bottom:18pt;">
                        <p style="font-size:15pt; font-weight:bold; text-transform:uppercase;">THÔNG BÁO</p>
                        <p style="font-size:14pt; font-weight:bold;">Lịch công tác tuần thứ ${weekSchedule.weekNumber} năm ${weekSchedule.year}</p>
                        <p style="font-size:13pt; font-style:italic;">(Từ ngày ${formattedStart} đến ngày ${formattedEnd})</p>
                        <p style="font-size:13pt; font-weight:bold;">CỦA THƯỜNG TRỰC ĐẢNG ỦY - HĐND - UBND XÃ EA SÚP</p>
                    </div>

                    <!-- BẢNG LỊCH CÔNG TÁC -->
                    <table class="MsoTableGrid" cellpadding="0" cellspacing="0">
                        <thead>
                            <tr style="background-color:#EDEDED; mso-yfti-irow:0; mso-yfti-firstrow:yes;">
                                <th style="border:1.0pt solid windowtext; padding:6pt 4pt; font-size:12pt; font-weight:bold; text-align:center; width:12%;">Thứ / Ngày</th>
                                <th style="border:1.0pt solid windowtext; padding:6pt 4pt; font-size:12pt; font-weight:bold; text-align:center; width:8%;">Thời gian</th>
                                <th style="border:1.0pt solid windowtext; padding:6pt 4pt; font-size:12pt; font-weight:bold; text-align:center; width:9%;">Khối</th>
                                <th style="border:1.0pt solid windowtext; padding:6pt 4pt; font-size:12pt; font-weight:bold; text-align:center; width:33%;">Nội dung công tác & Địa điểm</th>
                                <th style="border:1.0pt solid windowtext; padding:6pt 4pt; font-size:12pt; font-weight:bold; text-align:center; width:15%;">Chủ trì / Tham gia</th>
                                <th style="border:1.0pt solid windowtext; padding:6pt 4pt; font-size:12pt; font-weight:bold; text-align:center; width:15%;">Thành phần tham dự / Chuẩn bị</th>
                                <th style="border:1.0pt solid windowtext; padding:6pt 4pt; font-size:12pt; font-weight:bold; text-align:center; width:8%;">Phương tiện</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHTML}
                        </tbody>
                    </table>

                    <p style="margin-top:10pt; font-style:italic; font-size:12pt;">
                        * Ghi chú: Các đơn vị được phân công chuẩn bị nội dung chủ động phối hợp Văn phòng gửi tài liệu họp trước 01 ngày. Lịch này thay cho giấy mời đối với các cuộc họp nội bộ.
                    </p>

                    <!-- PHẦN KÝ DUYỆT VÀ NƠI NHẬN -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="border:none; margin-top:20pt;">
                        <tr>
                            <td width="50%" style="vertical-align:top; font-size:11pt;">
                                <p style="font-weight:bold; font-style:italic; text-decoration:underline;">Nơi nhận:</p>
                                <p>- TT Huyện ủy, HĐND, UBND huyện (để b/c);</p>
                                <p>- TT Đảng ủy, TT HĐND, Lãnh đạo UBND xã;</p>
                                <p>- UBMTTQ và các đoàn thể xã;</p>
                                <p>- Các ban ngành, Công an, BCH QS xã;</p>
                                <p>- Trưởng các thôn, buôn;</p>
                                <p>- Lưu: VT, VP.</p>
                            </td>
                            <td width="50%" align="center" style="vertical-align:top;">
                                <p style="font-weight:bold; font-size:12pt; text-transform:uppercase;">TL. CHỦ TỊCH</p>
                                <p style="font-weight:bold; font-size:13pt; text-transform:uppercase;">CHÁNH VĂN PHÒNG</p>
                                <div style="height:60pt;"></div>
                                <p style="font-weight:bold; font-size:13pt;">Hà Tường Vi</p>
                            </td>
                        </tr>
                    </table>
                </div>
            </body>
            </html>
        `;

        const blob = new Blob(['\ufeff' + wordTemplate], {
            type: 'application/msword'
        });

        const fileName = `Lich_Tuan_${weekSchedule.weekNumber}_${weekSchedule.year}_UBND_Xa_EaSup.doc`;
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    // Kích hoạt chế độ in trực tiếp hoặc xuất PDF
    printSchedule() {
        window.print();
    }
};
