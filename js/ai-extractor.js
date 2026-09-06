/**
 * DỊCH VỤ BÓC TÁCH LỊCH CÔNG TÁC BẰNG GOOGLE GEMINI API
 * Phân hệ AI thông minh trích xuất tự động lịch công tác từ PDF, Word (.docx), Ảnh scan, Văn bản
 * Đơn vị: UBND Xã Ea Súp, Tỉnh Đắk Lắk
 */

const GEMINI_CONFIG_KEYS = {
    API_KEY: "easup_gemini_api_key",
    MODEL: "easup_gemini_model",
    DEFAULT_MODEL: "gemini-2.5-flash"
};

const AVAILABLE_GEMINI_MODELS = [
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash (Khuyên dùng - Nhanh & Chính xác nhất)", default: true },
    { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash (Tốc độ cao, đa phương thức)" },
    { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash (Bản tiêu chuẩn ổn định)" },
    { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro (Phân tích chuyên sâu văn bản phức tạp)" }
];

const GeminiExtractorService = {
    // Lấy API Key đã lưu
    getApiKey() {
        return localStorage.getItem(GEMINI_CONFIG_KEYS.API_KEY) || "";
    },

    // Lưu API Key
    setApiKey(key) {
        if (!key) {
            localStorage.removeItem(GEMINI_CONFIG_KEYS.API_KEY);
        } else {
            localStorage.setItem(GEMINI_CONFIG_KEYS.API_KEY, key.trim());
        }
    },

    // Lấy Model AI đang chọn
    getModel() {
        return localStorage.getItem(GEMINI_CONFIG_KEYS.MODEL) || GEMINI_CONFIG_KEYS.DEFAULT_MODEL;
    },

    // Lưu Model AI
    setModel(modelId) {
        localStorage.setItem(GEMINI_CONFIG_KEYS.MODEL, modelId || GEMINI_CONFIG_KEYS.DEFAULT_MODEL);
    },

    saveApiKey(key) {
        this.setApiKey(key);
    },

    saveModel(modelId) {
        this.setModel(modelId);
    },

    // Kiểm tra kết nối dạng helper trả về object success
    async testConnection(apiKey, model = null) {
        try {
            await this.testApiKey(apiKey, model);
            return { success: true };
        } catch (err) {
            return { success: false, message: err.message };
        }
    },

    // Kiểm tra API Key có hợp lệ không
    async testApiKey(apiKey, model = null) {
        const key = (apiKey || this.getApiKey()).trim();
        if (!key) {
            throw new Error("Vui lòng nhập Gemini API Key!");
        }

        const modelId = model || this.getModel();
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${key}`;

        const payload = {
            contents: [
                {
                    role: "user",
                    parts: [{ text: "Xin chào! Trả về đúng 1 từ: OK" }]
                }
            ],
            generationConfig: {
                maxOutputTokens: 10,
                temperature: 0.1
            }
        };

        const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            const errMsg = errData.error?.message || `Lỗi HTTP ${res.status}: ${res.statusText}`;
            throw new Error(errMsg);
        }

        return true;
    },

    // Chuyển File sang Base64
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64String = reader.result.split(',')[1];
                resolve({
                    base64: base64String,
                    mimeType: file.type || "application/octet-stream"
                });
            };
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
        });
    },

    // Đọc văn bản từ tệp Word (.docx) sử dụng JSZip
    async extractTextFromDocx(file) {
        if (typeof JSZip === "undefined") {
            throw new Error("Thư viện JSZip chưa được tải. Vui lòng tải lại trang.");
        }

        try {
            const zip = await JSZip.loadAsync(file);
            const docXml = await zip.file("word/document.xml").async("text");

            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(docXml, "text/xml");
            
            // Lấy tất cả các đoạn văn bản (p) và bảng biểu (table rows)
            const paragraphs = xmlDoc.getElementsByTagName("w:p");
            let fullText = "";

            for (let i = 0; i < paragraphs.length; i++) {
                const texts = paragraphs[i].getElementsByTagName("w:t");
                let pText = "";
                for (let j = 0; j < texts.length; j++) {
                    pText += texts[j].textContent;
                }
                if (pText.trim()) {
                    fullText += pText + "\n";
                }
            }

            return fullText;
        } catch (err) {
            console.error("Lỗi đọc file docx:", err);
            throw new Error("Không thể đọc tệp Word (.docx). Vui lòng chuyển sang PDF hoặc dán văn bản trực tiếp.");
        }
    },

    // Tạo System Prompt chuyên biệt cho bóc tách lịch công tác tuần hành chính
    getSystemPrompt(targetWeekNo, targetYear) {
        return `Bạn là Trợ lý AI chuyên gia bóc tách dữ liệu lịch công tác tuần của cơ quan nhà nước Việt Nam (UBND, HĐND, Đảng ủy, Ủy ban MTTQ xã/huyện).
Nhiệm vụ của bạn là đọc kỹ tài liệu lịch công tác tuần (có thể là bảng biểu, văn bản thông báo, ảnh chụp hoặc PDF) và trích xuất thành danh sách các mục sự kiện công tác có cấu trúc JSON chính xác.

THÔNG TIN TUẦN MỤC TIÊU:
- Năm: ${targetYear || 2026}
- Số thứ tự tuần dự kiến: ${targetWeekNo || "Tự nhận diện theo tiêu đề văn bản"}

QUY TẮC BÓC TÁCH BẮT BUỘC:
1. Phân loại "bloc" (Khối công tác) chính xác vào 1 trong 5 khối:
   - "Đảng ủy": Các cuộc họp Đảng ủy, Ban Thường vụ Đảng ủy, Bí thư, Phó Bí thư Đảng ủy, công tác Chi bộ.
   - "HĐND": Họp Thường trực HĐND, các Ban HĐND, Chủ tịch/Phó Chủ tịch HĐND.
   - "UBND": Họp UBND, Chủ tịch/Phó Chủ tịch UBND, tiếp công dân, chuyên môn UBND, họp giao ban UBND, công tác chỉ đạo điều hành.
   - "MTTQ": Mặt trận Tổ quốc và các đoàn thể (Đoàn thanh niên, Hội phụ nữ, Hội nông dân, Hội Cựu chiến binh).
   - "Khác": Các hoạt động phối hợp, sự kiện xã hội, hội thảo khác.

2. "dayOfWeek": Chuẩn hóa thành đúng 1 trong các giá trị:
   "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật".

3. "date": Ngày diễn ra định dạng "YYYY-MM-DD" (nếu văn bản ghi ngày/tháng, kết hợp với năm ${targetYear || 2026}). Nếu không ghi rõ ngày, hãy để chuỗi rỗng "" hoặc tự tính toán theo thứ trong tuần.

4. "time": Giờ họp chuẩn hóa dạng "07h30", "08h00", "14h00", "09h30" (hoặc "Sáng", "Chiều" nếu không ghi giờ cụ thể).

5. "content": Tóm tắt nội dung công tác ngắn gọn, rõ ràng và đầy đủ ý nghĩa (loại bỏ phần địa điểm nếu tách được sang location).

6. "location": Địa điểm tổ chức (ví dụ: "Phòng họp 01 UBND", "Hội trường lớn", "Phòng họp Đảng ủy", "UBND huyện", "Tại thực địa").

7. "leader": Lãnh đạo chủ trì hoặc tham dự (ví dụ: "Đ/c Nguyễn Bá Bân - Chủ tịch UBND xã", "Đ/c Bí thư Đảng ủy", "Đ/c Phó Chủ tịch UBND").

8. "participants": Thành phần tham dự hoặc đơn vị tham mưu/chuẩn bị (ví dụ: "Lãnh đạo UBND, Công chức Địa chính", "BCH Đảng bộ", "Toàn thể cán bộ, công chức").

9. "vehicle": Phương tiện ("Tự túc phương tiện" hoặc "Xe cơ quan").

CẤU TRÚC JSON ĐẦU RA BẮT BUỘC:
Trả về duy nhất 1 JSON object có định dạng:
{
  "detectedWeek": 36,
  "detectedYear": 2026,
  "detectedTitle": "LỊCH CÔNG TÁC TUẦN 36 NĂM 2026",
  "items": [
    {
      "dayOfWeek": "Thứ Hai",
      "date": "2026-09-07",
      "time": "07h30",
      "bloc": "UBND",
      "content": "Chào cờ đầu tuần và Giao ban Thường trực UBND xã",
      "location": "Hội trường UBND xã",
      "leader": "Đ/c Nguyễn Bá Bân - Chủ tịch UBND xã",
      "participants": "Thường trực UBND và toàn thể cán bộ, công chức",
      "vehicle": "Tự túc phương tiện"
    }
  ]
}`;
    },

    // Hàm chính: Bóc tách tệp hoặc văn bản bằng Gemini API
    async extractSchedule({ file = null, rawText = "", targetWeek = null, targetYear = null, onProgress = null }) {
        const apiKey = this.getApiKey();
        if (!apiKey) {
            throw new Error("Chưa cấu hình Gemini API Key! Vui lòng nhập API Key để tiếp tục.");
        }

        const modelId = this.getModel();
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

        if (onProgress) onProgress("Đang chuẩn bị nội dung tài liệu...", 20);

        const contents = [];
        const systemPrompt = this.getSystemPrompt(targetWeek, targetYear);

        if (file) {
            const fileName = file.name.toLowerCase();

            // 1. Tệp Word (.docx)
            if (fileName.endsWith('.docx')) {
                if (onProgress) onProgress("Đang trích xuất văn bản từ tệp Word (.docx)...", 40);
                const docText = await this.extractTextFromDocx(file);
                contents.push({
                    role: "user",
                    parts: [
                        { text: systemPrompt },
                        { text: `DƯỚI ĐÂY LÀ VĂN BẢN TRÍCH XUẤT TỪ FILE WORD LỊCH CÔNG TÁC TUẦN:\n\n${docText}` }
                    ]
                });
            }
            // 2. Tệp PDF
            else if (fileName.endsWith('.pdf') || file.type === "application/pdf") {
                if (onProgress) onProgress("Đang mã hóa tệp PDF và gửi tới Gemini Vision...", 40);
                const base64Data = await this.fileToBase64(file);
                contents.push({
                    role: "user",
                    parts: [
                        { text: systemPrompt },
                        {
                            inlineData: {
                                mimeType: "application/pdf",
                                data: base64Data.base64
                            }
                        },
                        { text: "Hãy đọc kỹ tài liệu PDF trên và trích xuất tất cả các mục lịch công tác tuần theo đúng cấu trúc JSON." }
                    ]
                });
            }
            // 3. Tệp Hình ảnh (Scan / Ảnh chụp lịch họp)
            else if (file.type.startsWith("image/") || /\.(jpg|jpeg|png|webp|bmp)$/i.test(fileName)) {
                if (onProgress) onProgress("Đang quét ảnh văn bản bằng Gemini Multimodal Vision...", 40);
                const base64Data = await this.fileToBase64(file);
                contents.push({
                    role: "user",
                    parts: [
                        { text: systemPrompt },
                        {
                            inlineData: {
                                mimeType: base64Data.mimeType || "image/jpeg",
                                data: base64Data.base64
                            }
                        },
                        { text: "Hãy phân tích ảnh chụp/bản scan lịch công tác trên và trích xuất thành danh sách mục công tác tuần dạng JSON." }
                    ]
                });
            }
            // 4. Tệp Text (.txt, .csv)
            else {
                if (onProgress) onProgress("Đang đọc tệp văn bản...", 40);
                const textContent = await file.text();
                contents.push({
                    role: "user",
                    parts: [
                        { text: systemPrompt },
                        { text: `NỘI DUNG TÀI LIỆU LỊCH CÔNG TÁC:\n\n${textContent}` }
                    ]
                });
            }
        } else if (rawText && rawText.trim()) {
            if (onProgress) onProgress("Đang xử lý văn bản dán trực tiếp...", 40);
            contents.push({
                role: "user",
                parts: [
                    { text: systemPrompt },
                    { text: `DƯỚI ĐÂY LÀ VĂN BẢN LỊCH CÔNG TÁC DO NGƯỜI DÙNG DÁN TRỰC TIẾP:\n\n${rawText.trim()}` }
                ]
            });
        } else {
            throw new Error("Vui lòng tải lên một tệp (PDF, Word, Ảnh scan) hoặc dán văn bản lịch công tác!");
        }

        if (onProgress) onProgress("Gemini AI đang nhận diện và bóc tách bảng lịch biểu...", 65);

        const requestBody = {
            contents: contents,
            generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.1,
                maxOutputTokens: 8192
            }
        };

        const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            const errMsg = errData.error?.message || `Lỗi máy chủ Gemini (${res.status}): ${res.statusText}`;
            throw new Error(errMsg);
        }

        if (onProgress) onProgress("Đang chuẩn hóa và đối soát cấu trúc dữ liệu...", 90);

        const responseData = await res.json();
        const candidate = responseData.candidates?.[0];
        const rawJsonText = candidate?.content?.parts?.[0]?.text;

        if (!rawJsonText) {
            throw new Error("Gemini AI không trả về dữ liệu phù hợp. Vui lòng kiểm tra lại chất lượng tệp hoặc hình ảnh!");
        }

        let parsedResult;
        try {
            parsedResult = JSON.parse(rawJsonText);
        } catch (e) {
            // Trường hợp có markdown ```json ... ``` bao quanh
            const cleanJson = rawJsonText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
            parsedResult = JSON.parse(cleanJson);
        }

        // Chuẩn hóa và làm sạch mảng items
        const rawItems = Array.isArray(parsedResult) ? parsedResult : (parsedResult.items || []);
        const sanitizedItems = this.sanitizeExtractedItems(rawItems, targetWeek, targetYear);

        if (onProgress) onProgress("Hoàn tất bóc tách thành công!", 100);

        return {
            detectedWeek: parsedResult.detectedWeek || targetWeek || null,
            detectedYear: parsedResult.detectedYear || targetYear || 2026,
            detectedTitle: parsedResult.detectedTitle || `Lịch công tác tuần ${targetWeek || ''} năm ${targetYear || 2026}`,
            items: sanitizedItems,
            rawCount: sanitizedItems.length
        };
    },

    // Làm sạch và chuẩn hóa danh sách các mục công tác
    sanitizeExtractedItems(items, targetWeek, targetYear) {
        if (!Array.isArray(items)) return [];

        const validBlocs = ["Đảng ủy", "HĐND", "UBND", "MTTQ", "Khác"];
        const dayMap = {
            "thứ hai": "Thứ Hai", "thứ 2": "Thứ Hai", "t2": "Thứ Hai", "monday": "Thứ Hai",
            "thứ ba": "Thứ Ba", "thứ 3": "Thứ Ba", "t3": "Thứ Ba", "tuesday": "Thứ Ba",
            "thứ tư": "Thứ Tư", "thứ 4": "Thứ Tư", "t4": "Thứ Tư", "wednesday": "Thứ Tư",
            "thứ năm": "Thứ Năm", "thứ 5": "Thứ Năm", "t5": "Thứ Năm", "thursday": "Thứ Năm",
            "thứ sáu": "Thứ Sáu", "thứ 6": "Thứ Sáu", "t6": "Thứ Sáu", "friday": "Thứ Sáu",
            "thứ bảy": "Thứ Bảy", "thứ 7": "Thứ Bảy", "t7": "Thứ Bảy", "saturday": "Thứ Bảy",
            "chủ nhật": "Chủ Nhật", "cn": "Chủ Nhật", "sunday": "Chủ Nhật"
        };

        const year = targetYear || 2026;
        const weekNo = targetWeek || null;
        let startMondayIso = "";
        if (weekNo && typeof StorageService !== "undefined") {
            const mon = StorageService.getMondayOfWeek(weekNo, year);
            const pad = (n) => String(n).padStart(2, '0');
            startMondayIso = `${mon.getFullYear()}-${pad(mon.getMonth() + 1)}-${pad(mon.getDate())}`;
        }

        return items.map((item, index) => {
            // Chuẩn hóa thứ
            let dayOfWeek = (item.dayOfWeek || "").trim();
            const lowerDay = dayOfWeek.toLowerCase();
            if (dayMap[lowerDay]) {
                dayOfWeek = dayMap[lowerDay];
            } else if (!dayOfWeek) {
                dayOfWeek = "Thứ Hai";
            }

            // Chuẩn hóa khối
            let bloc = (item.bloc || "").trim();
            if (!validBlocs.includes(bloc)) {
                if (bloc.includes("Đảng") || bloc.includes("ĐU")) bloc = "Đảng ủy";
                else if (bloc.includes("HĐND") || bloc.includes("Hội đồng")) bloc = "HĐND";
                else if (bloc.includes("MTTQ") || bloc.includes("Mặt trận") || bloc.includes("Đoàn thể")) bloc = "MTTQ";
                else if (bloc.includes("UBND") || bloc.includes("Ủy ban")) bloc = "UBND";
                else bloc = "Khác";
            }

            // Chuẩn hóa ngày tháng
            let dateStr = (item.date || "").trim();
            if ((!dateStr || dateStr.length < 8) && startMondayIso && typeof StorageService !== "undefined") {
                dateStr = StorageService.calculateDateForDay(startMondayIso, dayOfWeek);
            }

            return {
                id: `ai_item_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 5)}`,
                dayOfWeek: dayOfWeek,
                date: dateStr || "",
                time: (item.time || "08h00").trim(),
                bloc: bloc,
                content: (item.content || "Chưa có nội dung").trim(),
                location: (item.location || "Phòng họp UBND xã").trim(),
                leader: (item.leader || "Lãnh đạo UBND xã").trim(),
                participants: (item.participants || "Cán bộ, công chức liên quan").trim(),
                vehicle: (item.vehicle || "Tự túc phương tiện").trim(),
                selected: true // Mặc định được chọn trong bảng đối soát
            };
        });
    }
};

// Đăng ký toàn cục
if (typeof window !== "undefined") {
    window.GeminiExtractorService = GeminiExtractorService;
}
