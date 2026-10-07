/**
 * DỊCH VỤ BÓC TÁCH LỊCH CÔNG TÁC BẰNG GOOGLE GEMINI API
 * Phân hệ AI thông minh trích xuất tự động lịch công tác từ PDF, Word (.docx), Ảnh scan, Văn bản
 * Đơn vị: UBND Xã Ea Súp, Tỉnh Đắk Lắk
 */

const GEMINI_CONFIG_KEYS = {
    API_KEY: "easup_gemini_api_key",
    MODEL: "easup_gemini_model",
    DEFAULT_MODEL: "gemini-3.5-flash"
};

const AVAILABLE_GEMINI_MODELS = [
    { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash (Khuyên dùng - Ổn Định Cao & Phản Hồi Tức Thì)", default: true },
    { id: "gemini-3.8-flash", name: "Gemini 3.8 Flash (Thông Minh & Đa Năng - Có thể bận giờ cao điểm)" },
    { id: "gemini-3.7-flash", name: "Gemini 3.7 Flash (Bản Tiêu Chuẩn Quốc Tế)" },
    { id: "gemini-3.1-flash-lite", name: "Gemini 3.1 Flash-Lite (Siêu Tốc)" }
];

const GeminiExtractorService = {
    // Biến lưu trữ AbortController của tác vụ bóc tách hiện hành
    activeAbortController: null,

    // Hàm chủ động hủy bỏ tiến trình bóc tách đang chạy
    cancelExtraction() {
        if (this.activeAbortController) {
            try {
                this.activeAbortController.abort("USER_CANCEL");
            } catch (e) {}
            this.activeAbortController = null;
            return true;
        }
        return false;
    },

    // Gọi fetch kèm cơ chế Timeout chống treo vĩnh viễn và liên kết hủy bỏ người dùng
    async fetchWithTimeout(url, options = {}, timeoutMs = 22000) {
        const controller = new AbortController();
        const timeoutTimer = setTimeout(() => {
            controller.abort("TIMEOUT");
        }, timeoutMs);

        let abortListener = null;
        if (this.activeAbortController) {
            abortListener = () => {
                controller.abort("USER_CANCEL");
            };
            this.activeAbortController.signal.addEventListener("abort", abortListener, { once: true });
        }

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutTimer);
            return response;
        } catch (err) {
            clearTimeout(timeoutTimer);
            if (err.name === "AbortError" || controller.signal.aborted) {
                if (this.activeAbortController?.signal.aborted || controller.signal.reason === "USER_CANCEL") {
                    const abortErr = new Error("Quá trình bóc tách đã được dừng theo yêu cầu của bạn.");
                    abortErr.isAborted = true;
                    throw abortErr;
                }
                const toErr = new Error(`Thời gian chờ phản hồi từ Google AI quá ${Math.round(timeoutMs / 1000)}s (Request Timeout).`);
                toErr.isTimeout = true;
                throw toErr;
            }
            throw err;
        } finally {
            if (abortListener && this.activeAbortController) {
                this.activeAbortController.signal.removeEventListener("abort", abortListener);
            }
        }
    },

    // Lấy API Key đã lưu (ghi nhớ vĩnh viễn trên trình duyệt không cần máy chủ)
    getApiKey() {
        let key = localStorage.getItem(GEMINI_CONFIG_KEYS.API_KEY) || localStorage.getItem("gemini_api_key_permanent");
        if (!key) {
            try {
                const org = JSON.parse(localStorage.getItem("easup_org_settings") || "{}");
                if (org && org.geminiApiKey) key = org.geminiApiKey;
            } catch (e) {}
        }
        return key ? key.trim() : "";
    },


    // Lưu API Key (hỗ trợ cả chuẩn mới AQ.Ab8... và AIzaSy... lưu đa tầng vĩnh viễn)
    setApiKey(key) {
        if (!key) {
            localStorage.removeItem(GEMINI_CONFIG_KEYS.API_KEY);
            localStorage.removeItem("gemini_api_key_permanent");
        } else {
            const cleanKey = key.trim().replace(/^["']|["']$/g, "").trim();
            localStorage.setItem(GEMINI_CONFIG_KEYS.API_KEY, cleanKey);
            localStorage.setItem("gemini_api_key_permanent", cleanKey);
            try {
                const org = JSON.parse(localStorage.getItem("easup_org_settings") || "{}");
                org.geminiApiKey = cleanKey;
                localStorage.setItem("easup_org_settings", JSON.stringify(org));
            } catch (e) {}
        }
    },

    // Lấy Model AI đang chọn (tự động chuẩn hóa nếu là model cũ hoặc không tồn tại)
    getModel() {
        const stored = localStorage.getItem(GEMINI_CONFIG_KEYS.MODEL);
        return this.normalizeModelId(stored || GEMINI_CONFIG_KEYS.DEFAULT_MODEL);
    },

    // Lưu Model AI
    setModel(modelId) {
        const normalized = this.normalizeModelId(modelId || GEMINI_CONFIG_KEYS.DEFAULT_MODEL);
        localStorage.setItem(GEMINI_CONFIG_KEYS.MODEL, normalized);
    },

    saveApiKey(key) {
        this.setApiKey(key);
    },

    saveModel(modelId) {
        this.setModel(modelId);
    },

    // Chuẩn hóa Model ID sang các mô hình chính thức mới nhất của Google AI Studio (2026)
    normalizeModelId(modelId, availableModels = []) {
        if (!modelId) return "gemini-3.5-flash";
        let m = modelId.trim().toLowerCase();
        
        // Nếu có danh sách live models từ Google API
        if (Array.isArray(availableModels) && availableModels.length > 0) {
            // Lọc bỏ các model không phù hợp (tts, robotics, 2.0, 1.5, 404 models)
            const activeModels = availableModels.filter(x => !x.includes("2.0") && !x.includes("1.5") && x !== "gemini-2.5-flash" && x !== "gemini-2.5-pro" && !x.includes("tts") && !x.includes("robotics") && !x.includes("image"));
            if (activeModels.includes(m)) return m;
            for (const pref of ["gemini-3.5-flash", "gemini-3.8-flash", "gemini-3.7-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"]) {
                if (activeModels.includes(pref)) return pref;
            }
            const matchFlash = activeModels.find(x => x.includes("flash"));
            if (matchFlash) return matchFlash;
            return activeModels[0] || "gemini-3.5-flash";
        }

        // Mapping model ID mới
        if (m.includes("3.5")) return "gemini-3.5-flash";
        if (m.includes("3.8")) return "gemini-3.8-flash";
        if (m.includes("3.7")) return "gemini-3.7-flash";
        if (m.includes("3.1") || m.includes("lite")) return "gemini-3.1-flash-lite";
        if (m.includes("latest")) return "gemini-flash-latest";
        return "gemini-3.5-flash";
    },

    // Lấy danh sách các mô hình thực tế mà Google API Key này có quyền gọi (ModelService.ListModels)
    async getSupportedModels(apiKey) {
        const key = (apiKey || this.getApiKey()).trim().replace(/^["']|["']$/g, "").trim();
        if (!key) return [];
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`;
            const res = await this.fetchWithTimeout(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": key
                }
            }, 6000);
            if (res.ok) {
                const data = await res.json();
                if (data.models && Array.isArray(data.models)) {
                    // Lọc chỉ các model hỗ trợ generateContent
                    const validModels = data.models
                        .filter(m => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes("generateContent"))
                        .map(m => m.name.replace(/^models\//, ''));
                    if (validModels.length > 0) {
                        return validModels;
                    }
                }
            }
        } catch (e) {
            console.warn("Lỗi khi tự động truy vấn danh sách model từ Google AI Studio:", e.message);
        }
        return [];
    },

    // Hàm tạm dừng (sleep) phục vụ cơ chế Exponential Backoff
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    // Kiểm tra kết nối API Key và trả về kết quả có cấu trúc cho giao diện Settings
    async testConnection(apiKey, model = null) {
        try {
            await this.testApiKey(apiKey, model);
            const rawKey = (apiKey || this.getApiKey() || "").trim();
            const isAQKey = rawKey.startsWith("AQ.");
            const keyTypeStr = isAQKey ? "chuẩn mới AQ.Ab8..." : "chuẩn AIzaSy...";
            return {
                success: true,
                message: `Kết nối Google Gemini thành công! Đã xác thực khóa (${keyTypeStr}) hoạt động hoàn hảo.`
            };
        } catch (err) {
            return {
                success: false,
                message: err.message || "Không thể kết nối đến Google Gemini API"
            };
        }
    },

    // Kiểm tra API Key có hợp lệ không (hỗ trợ cả chuẩn mới AQ.Ab8... và AIzaSy...)
    async testApiKey(apiKey, model = null) {
        let key = (apiKey || this.getApiKey() || "").trim();
        key = key.replace(/^["']|["']$/g, "").trim();
        if (!key) {
            throw new Error("Vui lòng nhập Gemini API Key (hỗ trợ chuẩn mới AQ.Ab8... hoặc AIzaSy...)!");
        }

        // Tự động truy vấn danh sách model thực từ Google API (ModelService.ListModels)
        const liveModels = await this.getSupportedModels(key);
        const userModel = this.normalizeModelId(model || this.getModel(), liveModels);

        const priorityPipeline = [
            userModel,
            "gemini-3.5-flash",
            "gemini-3.8-flash",
            "gemini-3.7-flash",
            "gemini-3.1-flash-lite"
        ];
        let candidateModels = [];
        if (liveModels.length > 0) {
            candidateModels = priorityPipeline.filter(m => liveModels.includes(m));
        }
        if (candidateModels.length === 0) {
            candidateModels = priorityPipeline;
        }
        const uniqueModels = [...new Set(candidateModels.filter(Boolean))].slice(0, 3);
        let lastError = null;

        for (const m of uniqueModels) {
            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${encodeURIComponent(key)}`;
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

            try {
                const res = await this.fetchWithTimeout(endpoint, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-goog-api-key": key
                    },
                    body: JSON.stringify(payload)
                }, 7000);

                if (res.ok) {
                    return true;
                }

                const errData = await res.json().catch(() => ({}));
                const errMsg = errData.error?.message || `Lỗi HTTP ${res.status}: ${res.statusText}`;

                if (res.status === 403 || (res.status === 400 && errMsg.includes("API key")) || errMsg.includes("API key not valid") || errMsg.includes("API_KEY_INVALID")) {
                    throw new Error("Khóa Google Gemini API Key không chính xác hoặc chưa được cấp quyền. Vui lòng kiểm tra lại khóa (chuẩn mới AQ.Ab8... hoặc AIzaSy...)!");
                }

                lastError = new Error(errMsg);
                // Nếu 503 / 404 / 429, chuyển nhanh sang candidate kế tiếp
                continue;
            } catch (e) {
                if (e.message && (e.message.includes("không chính xác") || e.message.includes("chưa được cấp quyền"))) throw e;
                lastError = e;
                continue;
            }
        }

        if (lastError) {
            let msg = lastError.message;
            if (msg.includes("high demand") || msg.includes("overloaded")) {
                msg = "Máy chủ Google Gemini đang tạm thời quá tải lưu lượng. Hệ thống đã tự động thử lại 3 lần nhưng chưa kết nối được. Vui lòng thử lại sau giây lát.";
            }
            throw new Error(msg);
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

9. "vehicle": Phương tiện bố trí hoặc thông tin lái xe / tài xế. ĐẶC BIỆT CHÚ Ý: Nếu trong lịch/văn bản có ghi tên tài xế hoặc người lái xe (ví dụ: "Đ/c Nam - LX", "Đ/c Hùng lái xe", "Đ/c Thành (LX)", "Xe UBND Đ/c Thắng lái", "Xe cơ quan", v.v.) thì điền chính xác tên tài xế / phương tiện vào trường "vehicle". Nếu không có thông tin lái xe hoặc ghi tự túc thì ghi "Tự túc phương tiện".

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
    async extractSchedule({ file = null, rawText = "", targetWeek = null, targetYear = null, apiKey = null, model = null, onProgress = null }) {
        // Khởi tạo AbortController cho phiên bóc tách
        this.activeAbortController = new AbortController();

        try {
            let key = (apiKey || this.getApiKey() || "").trim();
        key = key.replace(/^["']|["']$/g, "").trim();
        if (!key) {
            throw new Error("Chưa cấu hình Gemini API Key! Vui lòng nhập API Key (chuẩn mới AQ.Ab8... hoặc AIzaSy...) để tiếp tục.");
        }
        this.saveApiKey(key);

        const rawModelId = model || this.getModel() || "gemini-3.8-flash";

        if (onProgress) onProgress("Đang chuẩn bị nội dung tài liệu...", 20);

        const contents = [];
        const systemPrompt = this.getSystemPrompt(targetWeek, targetYear);

        if (file) {
            const fileName = file.name.toLowerCase();

            // 1. Tệp Word (.docx)
            if (fileName.endsWith('.docx')) {
                if (onProgress) onProgress("Đang trích xuất văn bản từ tệp Word (.docx)...", 35);
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
                if (onProgress) onProgress("Đang mã hóa tệp PDF và gửi tới Gemini Vision...", 35);
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
                if (onProgress) onProgress("Đang quét ảnh văn bản bằng Gemini Multimodal Vision...", 35);
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
                if (onProgress) onProgress("Đang đọc tệp văn bản...", 35);
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
            if (onProgress) onProgress("Đang xử lý văn bản dán trực tiếp...", 35);
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

        if (onProgress) onProgress("Đang kiểm tra và chọn mô hình AI khả dụng nhất...", 50);

        // Tự động truy vấn danh sách model thực tế từ Google API (ModelService.ListModels)
        const liveModels = await this.getSupportedModels(key);
        const userModel = this.normalizeModelId(rawModelId, liveModels);

        // Phát hiện tệp nhị phân (PDF hoặc Ảnh) để tối ưu payload tương thích Google API
        const isBinaryFile = !!file && (
            file.name.toLowerCase().endsWith('.pdf') ||
            file.type === "application/pdf" ||
            file.type.startsWith("image/") ||
            /\.(jpg|jpeg|png|webp|bmp)$/i.test(file.name)
        );

        // Pipeline mô hình ưu tiên: Mô hình chọn -> gemini-3.5-flash (ổn định nhất) -> gemini-3.8-flash -> gemini-3.7-flash -> gemini-flash-latest
        const priorityPipeline = [
            userModel || "gemini-3.5-flash",
            "gemini-3.5-flash",
            "gemini-3.8-flash",
            "gemini-3.7-flash",
            "gemini-flash-latest"
        ];

        let candidateModels = [];
        if (liveModels.length > 0) {
            candidateModels = priorityPipeline.filter(m => liveModels.includes(m));
        }
        if (candidateModels.length === 0) {
            candidateModels = priorityPipeline;
        }
        const uniqueModels = [...new Set(candidateModels.filter(Boolean))].slice(0, 4);

        if (onProgress) onProgress(`Đang gửi tài liệu tới Gemini AI (${uniqueModels[0]})...`, 65);

        let rawJsonText = null;
        let successfulModel = null;
        let lastError = null;

        for (let i = 0; i < uniqueModels.length; i++) {
            if (this.activeAbortController?.signal.aborted) {
                const err = new Error("Quá trình bóc tách đã được dừng theo yêu cầu.");
                err.isAborted = true;
                throw err;
            }

            const currentModel = uniqueModels[i];
            const currentEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${encodeURIComponent(key)}`;

            if (i > 0 && onProgress) {
                onProgress(`Đang chuyển sang mô hình dự phòng: ${currentModel}...`, 72 + i * 4);
            }

            let modelSucceeded = false;
            // Mỗi mô hình tối đa 1 lần nếu 503, tối đa 2 lần nếu lỗi mạng nhẹ
            const maxAttempts = 2;

            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                if (this.activeAbortController?.signal.aborted) {
                    const err = new Error("Quá trình bóc tách đã được dừng theo yêu cầu.");
                    err.isAborted = true;
                    throw err;
                }

                try {
                    // Đối với PDF / Ảnh (nhị phân), Google API v1beta không dùng responseSchema để tránh lỗi 400 INVALID_ARGUMENT
                    let requestBody = {
                        contents: contents,
                        generationConfig: {
                            responseMimeType: "application/json",
                            temperature: 0.1,
                            maxOutputTokens: 8192
                        }
                    };

                    if (!isBinaryFile) {
                        requestBody.generationConfig.responseSchema = {
                            type: "OBJECT",
                            properties: {
                                detectedWeek: { type: "INTEGER" },
                                detectedYear: { type: "INTEGER" },
                                detectedTitle: { type: "STRING" },
                                items: {
                                    type: "ARRAY",
                                    items: {
                                        type: "OBJECT",
                                        properties: {
                                            dayOfWeek: { type: "STRING" },
                                            date: { type: "STRING" },
                                            time: { type: "STRING" },
                                            bloc: { type: "STRING" },
                                            content: { type: "STRING" },
                                            location: { type: "STRING" },
                                            leader: { type: "STRING" },
                                            participants: { type: "STRING" },
                                            vehicle: { type: "STRING" }
                                        },
                                        required: ["dayOfWeek", "time", "bloc", "content"]
                                    }
                                }
                            },
                            required: ["items"]
                        };
                    }

                    // Gọi fetch với Timeout 20 giây chống đứng màn hình
                    let res = await this.fetchWithTimeout(currentEndpoint, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "x-goog-api-key": key
                        },
                        body: JSON.stringify(requestBody)
                    }, 20000);

                    // Nếu 400 (model không hỗ trợ schema), gửi lại không kèm schema
                    if (!res.ok && res.status === 400 && requestBody.generationConfig.responseSchema) {
                        delete requestBody.generationConfig.responseSchema;
                        res = await this.fetchWithTimeout(currentEndpoint, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "x-goog-api-key": key
                            },
                            body: JSON.stringify(requestBody)
                        }, 20000);
                    }

                    if (res.ok) {
                        const responseData = await res.json();
                        const candidate = responseData.candidates?.[0];
                        const text = candidate?.content?.parts?.[0]?.text;
                        if (text && text.trim()) {
                            rawJsonText = text;
                            successfulModel = currentModel;
                            modelSucceeded = true;
                            break;
                        }
                    }

                    const errData = await res.json().catch(() => ({}));
                    const errMsg = errData.error?.message || `Lỗi HTTP ${res.status}: ${res.statusText}`;

                    // Lỗi API Key không hợp lệ -> dừng toàn bộ ngay lập tức
                    if (res.status === 403 || (res.status === 400 && (errMsg.includes("API_KEY_INVALID") || errMsg.includes("API key not valid")))) {
                        throw new Error(`Khóa Google Gemini API Key hiện tại không hợp lệ hoặc chưa được cấp quyền (Chi tiết: "${errMsg}"). Vui lòng kiểm tra lại khóa trong cấu hình.`);
                    }

                    // Lỗi 404 (mô hình không tồn tại) -> Bỏ qua ngay sang model kế tiếp
                    if (res.status === 404 || errMsg.includes("not found for API version") || errMsg.includes("not supported for generateContent")) {
                        console.warn(`Mô hình ${currentModel} không hỗ trợ (404), chuyển ngay sang mô hình kế tiếp...`);
                        lastError = new Error(errMsg);
                        break;
                    }

                    // Quá tải / bận máy chủ (503 / 429 / 500 / high demand)
                    const isOverloaded = res.status === 503 || res.status === 429 || res.status >= 500 ||
                        errMsg.includes("high demand") || errMsg.includes("overloaded") || errMsg.includes("spikes in demand") || errMsg.includes("temporarily");

                    if (isOverloaded) {
                        lastError = new Error(errMsg);
                        console.warn(`Mô hình ${currentModel} quá tải (503 / high demand). Chuyển ngay lập tức sang mô hình dự phòng tiếp theo...`);
                        if (i < uniqueModels.length - 1 && onProgress) {
                            onProgress(`Mô hình ${currentModel} đang bận cao điểm, chuyển ngay sang ${uniqueModels[i + 1]}...`, 74 + i * 4);
                        }
                        break;
                    }

                    lastError = new Error(errMsg);
                    break;
                } catch (err) {
                    if (err.isAborted) throw err;
                    if (err.message && (err.message.includes("không chính xác") || err.message.includes("chưa được cấp quyền"))) throw err;

                    console.warn(`Lỗi khi gọi mô hình ${currentModel} (Lần ${attempt}/${maxAttempts}):`, err.message);
                    lastError = err;

                    if (err.isTimeout) {
                        // Request timeout (>22s): không chờ thêm trên model này, chuyển ngay sang model kế tiếp
                        console.warn(`Mô hình ${currentModel} phản hồi quá lâu (>22s). Chuyển ngay sang mô hình kế tiếp...`);
                        if (i < uniqueModels.length - 1 && onProgress) {
                            onProgress(`Mô hình ${currentModel} phản hồi chậm, tự động chuyển sang ${uniqueModels[i + 1]}...`, 74 + i * 4);
                        }
                        break;
                    }

                    if (attempt < maxAttempts) {
                        await this.sleep(1000);
                        continue;
                    }
                    break;
                }
            }

            if (modelSucceeded) {
                break;
            }
        }

        if (!rawJsonText) {
            let msg = lastError ? lastError.message : "Gemini AI không trả về dữ liệu phù hợp.";
            if (msg.includes("high demand") || msg.includes("overloaded") || msg.includes("503")) {
                msg = "Hệ thống máy chủ Google AI đang trong thời điểm quá tải lưu lượng tạm thời. Bạn có thể chọn mô hình 'Gemini 3.5 Flash' (ổn định cao) trong danh sách hoặc chuyển sang tab 'Dán trực tiếp văn bản' để xử lý ngay.";
            } else if (msg.includes("Timeout") || msg.includes("timeout")) {
                msg = "Đường truyền kết nối tới Google AI bị chậm hoặc quá thời gian chờ (Timeout). Vui lòng thử lại với mô hình 'Gemini 3.5 Flash' hoặc dán văn bản trực tiếp.";
            } else if (msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED")) {
                msg = "Khóa API đã hết hạn mức sử dụng (Quota Exceeded). Vui lòng thử lại sau 1 phút hoặc lấy khóa mới tại Google AI Studio.";
            }
            throw new Error(msg);
        }

        if (onProgress) onProgress("Đang chuẩn hóa và đối soát cấu trúc dữ liệu...", 90);

        // Parse & sửa lỗi JSON đa tầng (Multi-layer repair & Regex Fallback)
        const parsedResult = this.parseAndRepairJson(rawJsonText, targetWeek, targetYear);

        // Chuẩn hóa và làm sạch mảng items
        const rawItems = Array.isArray(parsedResult) ? parsedResult : (parsedResult.items || []);
        const sanitizedItems = this.sanitizeExtractedItems(rawItems, targetWeek, targetYear);

        if (sanitizedItems.length === 0) {
            throw new Error("Không trích xuất được mục lịch công tác nào. Vui lòng kiểm tra lại nội dung tài liệu!");
        }

        if (onProgress) onProgress("Hoàn tất bóc tách thành công!", 100);

            return {
                detectedWeek: parsedResult.detectedWeek || targetWeek || null,
                detectedYear: parsedResult.detectedYear || targetYear || 2026,
                detectedTitle: parsedResult.detectedTitle || `Lịch công tác tuần ${targetWeek || ''} năm ${targetYear || 2026}`,
                items: sanitizedItems,
                rawCount: sanitizedItems.length,
                modelUsed: successfulModel || userModel
            };
        } finally {
            this.activeAbortController = null;
        }
    },

    // Bộ giải mã và sửa lỗi JSON đa tầng chống gãy cú pháp
    parseAndRepairJson(rawText, targetWeek, targetYear) {
        if (!rawText || !rawText.trim()) {
            throw new Error("Không nhận được dữ liệu từ Gemini AI!");
        }

        let text = rawText.trim();

        // 1. Gỡ bỏ markdown code block nếu có
        text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

        // 2. Thử parse trực tiếp
        try {
            return JSON.parse(text);
        } catch (e1) {
            console.warn("JSON.parse trực tiếp thất bại, đang tiến hành sửa lỗi cú pháp:", e1.message);
        }

        // 3. Cố gắng lấy chuỗi con từ { đến } hoặc [ đến ]
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        const firstBracket = text.indexOf('[');
        const lastBracket = text.lastIndexOf(']');

        let candidateText = text;
        if (firstBrace !== -1 && lastBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
            candidateText = text.substring(firstBrace, lastBrace + 1);
        } else if (firstBracket !== -1 && lastBracket !== -1) {
            candidateText = text.substring(firstBracket, lastBracket + 1);
        }

        // 4. Sửa các lỗi phổ biến: trailing commas, ký tự điều khiển lạ
        try {
            let cleaned = candidateText
                .replace(/,\s*([\]\}])/g, '$1') // Xóa trailing comma
                .replace(/[\x00-\x1F\x7F]/g, (match) => (match === '\n' || match === '\r' || match === '\t') ? match : ' ');
            return JSON.parse(cleaned);
        } catch (e2) {
            console.warn("Sửa trailing comma thất bại:", e2.message);
        }

        // 5. Xử lý trường hợp JSON bị cắt cụt (Truncated JSON do giới hạn token)
        try {
            let truncated = candidateText;
            const lastItemEnd = truncated.lastIndexOf('}');
            if (lastItemEnd !== -1) {
                let fixed = truncated.substring(0, lastItemEnd + 1);
                if (!fixed.endsWith(']}') && !fixed.endsWith(']')) {
                    if (fixed.includes('"items"')) {
                        fixed += ']}';
                    } else if (fixed.startsWith('[')) {
                        fixed += ']';
                    } else {
                        fixed += '}';
                    }
                }
                fixed = fixed.replace(/,\s*([\]\}])/g, '$1');
                return JSON.parse(fixed);
            }
        } catch (e3) {
            console.warn("Sửa JSON bị cắt ngắn thất bại:", e3.message);
        }

        // 6. PHƯƠNG PHÁP CỨU HỘ CUỐI CÙNG (FALLBACK CỰC MẠNH): Bóc tách từng mục qua Regex
        console.log("Kích hoạt chế độ Cứu hộ Regex cho từng mục công tác...");
        const items = this.extractItemsViaRegex(text, targetWeek, targetYear);
        if (items.length > 0) {
            return {
                detectedWeek: targetWeek || 36,
                detectedYear: targetYear || 2026,
                detectedTitle: `Lịch công tác tuần ${targetWeek || 36} năm ${targetYear || 2026}`,
                items: items
            };
        }

        throw new Error("Dữ liệu phản hồi từ AI không đúng cấu trúc JSON: " + (rawText.substring(0, 200) + "..."));
    },

    // Bóc tách từng mục công tác bằng biểu thức chính quy (Regex Fallback)
    extractItemsViaRegex(text, targetWeek, targetYear) {
        const items = [];
        const blockRegex = /\{([^{}]*(?:"dayOfWeek"|"content"|"thứ")[^{}]*)\}/gis;
        let match;

        const getProp = (block, propNames) => {
            for (const name of propNames) {
                const r = new RegExp(`"${name}"\\s*:\\s*"([^"\\\\]*(?:\\\\.[^"\\\\]*)*)"`, 'i');
                const m = block.match(r);
                if (m && m[1]) return m[1].replace(/\\"/g, '"').replace(/\\n/g, ' ').trim();
            }
            return "";
        };

        while ((match = blockRegex.exec(text)) !== null) {
            const block = match[1];
            const dayOfWeek = getProp(block, ["dayOfWeek", "day", "thu", "thứ"]);
            const content = getProp(block, ["content", "noiDung", "nội dung", "title", "task"]);
            
            if (dayOfWeek || content) {
                items.push({
                    dayOfWeek: dayOfWeek || "Thứ Hai",
                    date: getProp(block, ["date", "ngay", "ngày"]),
                    time: getProp(block, ["time", "gio", "giờ"]) || "08h00",
                    bloc: getProp(block, ["bloc", "khoi", "khối"]) || "UBND",
                    content: content || "(Chưa có nội dung)",
                    location: getProp(block, ["location", "diaDiem", "địa điểm"]) || "UBND xã",
                    leader: getProp(block, ["leader", "chuTri", "chủ trì", "lanhDao", "lãnh đạo"]) || "Lãnh đạo UBND",
                    participants: getProp(block, ["participants", "thanhPhan", "thành phần"]) || "",
                    vehicle: getProp(block, ["vehicle", "phuongTien", "phương tiện", "laiXe", "lái xe", "taiXe", "tài xế", "driver"]) || "Tự túc phương tiện"
                });
            }
        }

        return items;
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
