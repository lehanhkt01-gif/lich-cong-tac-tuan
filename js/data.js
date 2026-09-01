/**
 * DỮ LIỆU KHỞI TẠO MẪU - CỔNG THÔNG TIN ĐIỀU HÀNH LỊCH CÔNG TÁC TUẦN
 * Đơn vị: UBND XÃ EA SÚP, TỈNH ĐẮK LẮK
 */

const INITIAL_DATA = {
    organization: {
        province: "TỈNH ĐẮK LẮK",
        name: "UBND XÃ EA SÚP",
        fullName: "ỦY BAN NHÂN DÂN XÃ EA SÚP",
        partyOrgName: "ĐẢNG ỦY XÃ EA SÚP",
        councilOrgName: "HĐND XÃ EA SÚP",
        address: "Trung tâm Hành chính Xã Ea Súp, Tỉnh Đắk Lắk",
        phone: "(0262) 3688.123",
        email: "ubnd.easup@daklak.gov.vn",
        logoUrl: "assets/logo-easup.png",
        portalDomain: "https://easup.daklak.gov.vn/lich-cong-tac"
    },

    users: [
        {
            id: "u_admin",
            username: "admin.chanhvp",
            fullName: "Hà Tường Vi",
            position: "Chánh Văn phòng HĐND & UBND xã",
            role: "super_admin",
            roleName: "Super Admin (Chánh Văn phòng)",
            email: "viht.vp@easup.daklak.gov.vn",
            avatar: "👩‍💼",
            phone: "077 951 5547"
        },
        {
            id: "u_deputy",
            username: "deputy.phochanhvp",
            fullName: "Trần Minh Hải",
            position: "Phó Chánh Văn phòng HĐND & UBND xã",
            role: "super_admin",
            roleName: "Super Admin (Phó Chánh VP)",
            email: "haitm.vp@easup.daklak.gov.vn",
            avatar: "👨‍💼",
            phone: "091 610 5051"
        },
        {
            id: "u_editor",
            username: "editor.chuyenvien",
            fullName: "Nguyễn Thị Thoản",
            position: "Chuyên viên Văn phòng HĐND & UBND xã",
            role: "editor",
            roleName: "Editor (Chuyên viên nhập liệu)",
            email: "thoannt.vp@easup.daklak.gov.vn",
            avatar: "👩‍💼",
            phone: "077 951 5547"
        },
        {
            id: "u_viewer",
            username: "viewer.canbo",
            fullName: "Huỳnh Văn Dương",
            position: "Chuyên viên Phòng Kinh tế (Địa chính - Đất đai)",
            role: "viewer",
            roleName: "Viewer (Cán bộ / Công chức)",
            email: "duonghv.dc@easup.daklak.gov.vn",
            avatar: "👤",
            phone: "097 676 5456"
        }
    ],

    blocs: [
        { id: "all", name: "Tất cả khối", color: "#0F4C81", badgeClass: "badge-all" },
        { id: "Đảng ủy", name: "Đảng ủy", color: "#DC2626", badgeClass: "badge-danguy" },
        { id: "HĐND", name: "HĐND", color: "#D97706", badgeClass: "badge-hdnd" },
        { id: "UBND", name: "UBND", color: "#2563EB", badgeClass: "badge-ubnd" },
        { id: "MTTQ", name: "MTTQ", color: "#7C3AED", badgeClass: "badge-mttq" },
        { id: "Khác", name: "Khác", color: "#059669", badgeClass: "badge-khac" }
    ],

    cadres: [
        // ==========================================
        // I. LÃNH ĐẠO ĐẢNG ỦY - HĐND - UBND XÃ
        // ==========================================
        {
            id: "cadre_du_01",
            fullName: "Đỗ Xuân Dũng",
            position: "Bí thư Đảng ủy, Chủ tịch HĐND xã",
            department: "Đảng ủy - HĐND xã",
            email: "dungdx.bt@easup.daklak.gov.vn",
            phone: "0912.345.678",
            bloc: "Đảng ủy",
            note: "Phụ trách chung công tác Đảng và HĐND xã"
        },
        {
            id: "cadre_du_02",
            fullName: "Trương Văn Thịnh",
            position: "Phó Bí thư Thường trực Đảng ủy",
            department: "Thường trực Đảng ủy",
            email: "thinhtv.pbt@easup.daklak.gov.vn",
            phone: "0913.556.789",
            bloc: "Đảng ủy",
            note: "Phụ trách công tác Đảng thường trực"
        },
        {
            id: "cadre_ub_01",
            fullName: "Nguyễn Bá Bân",
            position: "Phó Bí thư Đảng ủy, Chủ tịch UBND xã",
            department: "Lãnh đạo UBND xã",
            email: "bannb.ct@easup.daklak.gov.vn",
            phone: "090 532 6338",
            bloc: "UBND",
            note: "Chỉ đạo toàn diện mọi hoạt động của UBND xã; trực tiếp chỉ đạo lĩnh vực Tài chính - Kế hoạch, Nội vụ, Công an, Quân sự; tiếp công dân, giải quyết khiếu nại, tố cáo. Phụ trách địa bàn TT Ea Súp cũ."
        },
        {
            id: "cadre_ub_02",
            fullName: "Đặng Thị Thanh Nhung",
            position: "Ủy viên BTV, Phó Chủ tịch thường trực UBND xã",
            department: "Lãnh đạo UBND xã",
            email: "nhungdtt.pct@easup.daklak.gov.vn",
            phone: "098 211 8417",
            bloc: "UBND",
            note: "Phụ trách lĩnh vực Tư pháp, Nông nghiệp và Môi trường, Y tế. Phụ trách địa bàn xã Cư Mlan cũ."
        },
        {
            id: "cadre_ub_03",
            fullName: "Trần Ngọc Hoàng",
            position: "Phó Chủ tịch UBND xã",
            department: "Lãnh đạo UBND xã",
            email: "hoangtn.pct@easup.daklak.gov.vn",
            phone: "098 952 8588",
            bloc: "UBND",
            note: "Phụ trách lĩnh vực Xây dựng và Công thương, GD&ĐT, Văn hóa, Khoa học và thông tin. Phụ trách địa bàn xã Ea Lê cũ."
        },
        {
            id: "cadre_hd_01",
            fullName: "H Djoan Siu",
            position: "Ủy viên BTV, Phó Chủ tịch HĐND xã",
            department: "Thường trực HĐND",
            email: "hdjoansiu.hdnd@easup.daklak.gov.vn",
            phone: "0917.889.900",
            bloc: "HĐND",
            note: "Phụ trách hoạt động Thường trực HĐND xã"
        },
        {
            id: "cadre_mttq_01",
            fullName: "Lê Hồng Hạnh",
            position: "Ủy viên BTV, Chủ tịch Ủy ban MTTQ Việt Nam xã",
            department: "Ủy ban MTTQ xã",
            email: "hanhlh.mttq@easup.daklak.gov.vn",
            phone: "0918.445.566",
            bloc: "MTTQ",
            note: "Chỉ đạo chung công tác Mặt trận và khối đoàn thể"
        },

        // ==========================================
        // II. VĂN PHÒNG HĐND VÀ UBND XÃ EA SÚP
        // ==========================================
        {
            id: "cadre_vp_01",
            fullName: "Hà Tường Vi",
            position: "Chánh Văn phòng HĐND và UBND xã",
            department: "Văn phòng HĐND & UBND",
            email: "viht.vp@easup.daklak.gov.vn",
            phone: "077 951 5547",
            bloc: "UBND",
            note: "Phụ trách chung công tác Văn phòng HĐND và UBND xã; tham mưu hoạt động chỉ đạo điều hành của Thường trực HĐND và UBND xã; kiểm tra thể thức văn bản trình ký."
        },
        {
            id: "cadre_vp_02",
            fullName: "Trần Minh Hải",
            position: "Phó Chánh Văn phòng HĐND và UBND xã",
            department: "Văn phòng HĐND & UBND",
            email: "haitm.vp@easup.daklak.gov.vn",
            phone: "091 610 5051",
            bloc: "UBND",
            note: "Phó Chánh Văn phòng; giúp Chánh Văn phòng quản lý, điều hành các hoạt động tổng hợp, chuyển đổi số và cải cách hành chính."
        },
        {
            id: "cadre_vp_03",
            fullName: "Nguyễn Thị Thoản",
            position: "Chuyên viên Văn phòng HĐND và UBND xã",
            department: "Văn phòng HĐND & UBND",
            email: "thoannt.vp@easup.daklak.gov.vn",
            phone: "077 951 5547",
            bloc: "UBND",
            note: "Chuyên viên phụ trách công tác Văn thư - Lưu trữ và tiếp nhận, xử lý văn bản của HĐND, UBND xã."
        },
        {
            id: "cadre_vp_04",
            fullName: "Nguyễn Thị Diệp",
            position: "Chuyên viên Văn phòng HĐND và UBND xã",
            department: "Văn phòng HĐND & UBND",
            email: "diepnt.vp@easup.daklak.gov.vn",
            phone: "096 811 3435",
            bloc: "UBND",
            note: "Chuyên viên tiếp công dân, xử lý đơn thư khiếu nại, tố cáo, kiến nghị, phản ánh; phụ trách AN - QP."
        },
        {
            id: "cadre_vp_05",
            fullName: "Trần Trung Kiên",
            position: "Chuyên viên Văn phòng HĐND và UBND xã",
            department: "Văn phòng HĐND & UBND",
            email: "kientt.vp@easup.daklak.gov.vn",
            phone: "098 909 5645",
            bloc: "UBND",
            note: "Chuyên viên phụ trách lĩnh vực Tư pháp hộ tịch, công chứng, chứng thực."
        },
        {
            id: "cadre_vp_06",
            fullName: "Đặng Thị Nhung",
            position: "Chuyên viên Văn phòng HĐND và UBND xã",
            department: "Văn phòng HĐND & UBND",
            email: "nhungdt.vp@easup.daklak.gov.vn",
            phone: "091 612 1029",
            bloc: "UBND",
            note: "Chuyên viên phụ trách công tác Kế toán Văn phòng HĐND & UBND xã, Phòng VH - XH."
        },

        // ==========================================
        // III. PHÒNG KINH TẾ
        // ==========================================
        {
            id: "cadre_kt_01",
            fullName: "Phạm Văn Trọng",
            position: "Trưởng Phòng Kinh tế",
            department: "Phòng Kinh tế",
            email: "trongpv.kt@easup.daklak.gov.vn",
            phone: "096 929 9090",
            bloc: "UBND",
            note: "Chỉ đạo chung hoạt động phòng Kinh tế; trực tiếp chỉ đạo Tài chính, Xây dựng, Công Thương."
        },
        {
            id: "cadre_kt_02",
            fullName: "Nguyễn Xuân Đức",
            position: "Phó Trưởng phòng Kinh tế",
            department: "Phòng Kinh tế",
            email: "ducnx.kt@easup.daklak.gov.vn",
            phone: "098 411 7007",
            bloc: "UBND",
            note: "Phụ trách lĩnh vực Nông nghiệp - Môi trường."
        },
        {
            id: "cadre_kt_03",
            fullName: "Hoàng Thị Hằng",
            position: "Chuyên viên Phòng Kinh tế",
            department: "Phòng Kinh tế",
            email: "hanght.kt@easup.daklak.gov.vn",
            phone: "096 826 9596",
            bloc: "UBND",
            note: "Phụ trách lĩnh vực Tài chính."
        },
        {
            id: "cadre_kt_04",
            fullName: "Đinh Thị Thu",
            position: "Chuyên viên Phòng Kinh tế",
            department: "Phòng Kinh tế",
            email: "thudt.kt@easup.daklak.gov.vn",
            phone: "084 608 5385",
            bloc: "UBND",
            note: "Phụ trách Lĩnh vực Nông nghiệp (trồng trọt, chăn nuôi - thú y,...)."
        },
        {
            id: "cadre_kt_05",
            fullName: "Huỳnh Văn Dương",
            position: "Chuyên viên Phòng Kinh tế",
            department: "Phòng Kinh tế",
            email: "duonghv.kt@easup.daklak.gov.vn",
            phone: "097 676 5456",
            bloc: "UBND",
            note: "Phụ trách Lĩnh vực Đất đai (Quy hoạch, Kế hoạch, thống kê, kiểm kê, giao đất, cho thuê đất, bồi thường GPMB…)."
        },
        {
            id: "cadre_kt_06",
            fullName: "Đinh Tiến Trung",
            position: "Chuyên viên Phòng Kinh tế",
            department: "Phòng Kinh tế",
            email: "trungdt.kt@easup.daklak.gov.vn",
            phone: "091 131 5868",
            bloc: "UBND",
            note: "Phụ trách Đất đai (quản lý bảo vệ rừng, kiểm kê rừng, tài nguyên nước, khoáng sản…)."
        },
        {
            id: "cadre_kt_07",
            fullName: "Nguyễn Chí Linh",
            position: "Chuyên viên Phòng Kinh tế",
            department: "Phòng Kinh tế",
            email: "linhnc.kt@easup.daklak.gov.vn",
            phone: "098 495 9284",
            bloc: "UBND",
            note: "Phụ trách Đất đai (kiểm tra hồ sơ đất đai: cấp GCN QSD đất, chuyển mục đích sử dụng…)."
        },
        {
            id: "cadre_kt_08",
            fullName: "Nguyễn Quang Tín",
            position: "Chuyên viên Phòng Kinh tế",
            department: "Phòng Kinh tế",
            email: "tinnq.kt@easup.daklak.gov.vn",
            phone: "096 860 3060",
            bloc: "UBND",
            note: "Phụ trách Lĩnh vực Xây dựng, Kế hoạch đầu tư, tài sản công."
        },
        {
            id: "cadre_kt_09",
            fullName: "Phạm Văn Tuyển",
            position: "Chuyên viên Phòng Kinh tế",
            department: "Phòng Kinh tế",
            email: "tuyenpv.kt@easup.daklak.gov.vn",
            phone: "097 772 6325",
            bloc: "UBND",
            note: "Phụ trách Công thương, môi trường, thủy lợi, phòng chống thiên tai…"
        },

        // ==========================================
        // IV. PHÒNG VĂN HÓA - XÃ HỘI
        // ==========================================
        {
            id: "cadre_vh_01",
            fullName: "Hoàng Thị Kiều Oanh",
            position: "Trưởng phòng Văn hóa - Xã hội",
            department: "Phòng Văn hóa - Xã hội",
            email: "oanhhtk.vh@easup.daklak.gov.vn",
            phone: "038 306 0709",
            bloc: "UBND",
            note: "Phụ trách chung lĩnh vực VH-XH (Nội vụ, Y tế, GD&ĐT, Văn hóa, Khoa học & TT)."
        },
        {
            id: "cadre_vh_02",
            fullName: "Y Bông Lào",
            position: "Phó Trưởng phòng Văn hóa - Xã hội",
            department: "Phòng Văn hóa - Xã hội",
            email: "ybonglao.vh@easup.daklak.gov.vn",
            phone: "032 702 9408",
            bloc: "UBND",
            note: "Phụ trách lĩnh vực Nội vụ, Y tế, Dân tộc và Tôn giáo."
        },
        {
            id: "cadre_vh_03",
            fullName: "Nguyễn Thị Bích Thảo",
            position: "Chuyên viên Phòng Văn hóa - Xã hội",
            department: "Phòng Văn hóa - Xã hội",
            email: "thaontb.vh@easup.daklak.gov.vn",
            phone: "093 588 2208",
            bloc: "UBND",
            note: "Phụ trách Lĩnh vực Giáo dục và đào tạo, thi đua – khen thưởng."
        },
        {
            id: "cadre_vh_04",
            fullName: "Trương Thị Hạnh",
            position: "Chuyên viên Phòng Văn hóa - Xã hội",
            department: "Phòng Văn hóa - Xã hội",
            email: "hanhtt.vh@easup.daklak.gov.vn",
            phone: "084 593 9494",
            bloc: "UBND",
            note: "Phụ trách Văn hóa, thể thao, du lịch, khoa học, công nghệ, chuyển đổi số."
        },
        {
            id: "cadre_vh_05",
            fullName: "Nguyễn Thị Yến",
            position: "Chuyên viên Phòng Văn hóa - Xã hội",
            department: "Phòng Văn hóa - Xã hội",
            email: "yennt.vh@easup.daklak.gov.vn",
            phone: "096 438 9787",
            bloc: "UBND",
            note: "Phụ trách y tế, thanh niên, cải cách hành chính."
        },
        {
            id: "cadre_vh_06",
            fullName: "Đinh Ngọc Huệ",
            position: "Chuyên viên Phòng Văn hóa - Xã hội",
            department: "Phòng Văn hóa - Xã hội",
            email: "huedn.vh@easup.daklak.gov.vn",
            phone: "083 499 4433",
            bloc: "UBND",
            note: "Phụ trách bảo trợ xã hội, người có công, Dân tộc - tôn giáo, TNXH, CTMTQG 1719."
        },
        {
            id: "cadre_vh_07",
            fullName: "Phan Văn Cừ",
            position: "Chuyên viên Phòng Văn hóa - Xã hội",
            department: "Phòng Văn hóa - Xã hội",
            email: "cupv.vh@easup.daklak.gov.vn",
            phone: "094 798 2350",
            bloc: "UBND",
            note: "Chuyên viên phụ trách công tác văn thư."
        },

        // ==========================================
        // V. TRUNG TÂM HÀNH CHÍNH CÔNG
        // ==========================================
        {
            id: "cadre_hcc_01",
            fullName: "Trần Thị Bích Nguyệt Nga",
            position: "Phó Giám đốc Trung tâm Hành chính công",
            department: "Trung tâm Hành chính công",
            email: "ngattbn.hcc@easup.daklak.gov.vn",
            phone: "091 550 4679",
            bloc: "UBND",
            note: "Lãnh đạo, chỉ đạo và điều hành hoạt động của Trung tâm theo phân công."
        },
        {
            id: "cadre_hcc_02",
            fullName: "Nguyễn Thị Tuyết",
            position: "Chuyên viên Trung tâm Hành chính công",
            department: "Trung tâm Hành chính công",
            email: "tuyetnt.hcc@easup.daklak.gov.vn",
            phone: "098 263 9687",
            bloc: "UBND",
            note: "Hướng dẫn, tiếp nhận đối với Lĩnh vực Tài nguyên và Môi trường, Tư pháp."
        },
        {
            id: "cadre_hcc_03",
            fullName: "Bùi Quốc Hà",
            position: "Chuyên viên Trung tâm Hành chính công",
            department: "Trung tâm Hành chính công",
            email: "habq.hcc@easup.daklak.gov.vn",
            phone: "097 238 8256",
            bloc: "UBND",
            note: "Hướng dẫn, tiếp nhận đối với Lĩnh vực Xây dựng, Đăng ký kinh doanh."
        },
        {
            id: "cadre_hcc_04",
            fullName: "H' Đem Siu",
            position: "Chuyên viên Trung tâm Hành chính công",
            department: "Trung tâm Hành chính công",
            email: "hdemsiu.hcc@easup.daklak.gov.vn",
            phone: "034 545 4197",
            bloc: "UBND",
            note: "Hướng dẫn, tiếp nhận đối với Lĩnh vực Bảo trợ xã hội, tư pháp."
        },
        {
            id: "cadre_hcc_06",
            fullName: "Phạm Thanh Tỉnh",
            position: "Chuyên viên Trung tâm Hành chính công",
            department: "Trung tâm Hành chính công",
            email: "tinhpt.hcc@easup.daklak.gov.vn",
            phone: "088 827 8279",
            bloc: "UBND",
            note: "Tiếp nhận TN&MT, Tư pháp; Trả kết quả TTHC."
        },
        {
            id: "cadre_hcc_07",
            fullName: "Phạm Thị Đào",
            position: "Chuyên viên Trung tâm Hành chính công",
            department: "Trung tâm Hành chính công",
            email: "daopt.hcc@easup.daklak.gov.vn",
            phone: "033 854 5556",
            bloc: "UBND",
            note: "Tiếp nhận đối với Lĩnh vực Tài nguyên và Môi trường, Tư pháp."
        },

        // ==========================================
        // VI. CÔNG AN XÃ
        // ==========================================
        {
            id: "cadre_ca_01",
            fullName: "Nguyễn Đức Hiếu",
            position: "Ủy viên BTV, Trưởng Công an xã",
            department: "Công an xã",
            email: "hieund.cax@easup.daklak.gov.vn",
            phone: "096 329 9456",
            bloc: "UBND",
            note: "Phụ trách chung công tác Công an xã"
        },
        {
            id: "cadre_ca_02",
            fullName: "Hoàng Anh Hùng",
            position: "Phó Trưởng Công an xã",
            department: "Công an xã",
            email: "hungha.cax@easup.daklak.gov.vn",
            phone: "098 979 3931",
            bloc: "UBND",
            note: "Phụ trách Tổng hợp"
        },
        {
            id: "cadre_ca_03",
            fullName: "Nguyễn Hoàng Trường",
            position: "Phó Trưởng Công an xã",
            department: "Công an xã",
            email: "truongnh.cax@easup.daklak.gov.vn",
            phone: "038 628 0266",
            bloc: "UBND",
            note: "Phụ trách Cảnh sát khu vực"
        },
        {
            id: "cadre_ca_04",
            fullName: "Y On Hra",
            position: "Phó Trưởng Công an xã",
            department: "Công an xã",
            email: "yonhra.cax@easup.daklak.gov.vn",
            phone: "036 330 5678",
            bloc: "UBND",
            note: "Phụ trách Phòng chống tội phạm"
        },
        {
            id: "cadre_ca_05",
            fullName: "Vi Văn Mạnh",
            position: "Phó Trưởng Công an xã",
            department: "Công an xã",
            email: "manhvv.cax@easup.daklak.gov.vn",
            phone: "097 676 2728",
            bloc: "UBND",
            note: "Phụ trách An ninh Trật tự"
        },
        {
            id: "cadre_ca_06",
            fullName: "Sỉ Sa Nguổn Knul",
            position: "Phó Trưởng Công an xã",
            department: "Công an xã",
            email: "sisanguon.cax@easup.daklak.gov.vn",
            phone: "036 977 9776",
            bloc: "UBND",
            note: "Phụ trách An ninh"
        },

        // ==========================================
        // VII. BAN CHỈ HUY QUÂN SỰ XÃ
        // ==========================================
        {
            id: "cadre_qs_01",
            fullName: "Lê Văn Vương",
            position: "Chỉ huy trưởng Ban CHQS xã",
            department: "Ban CHQS xã",
            email: "vuonglv.qs@easup.daklak.gov.vn",
            phone: "091 714 6279",
            bloc: "UBND",
            note: "Chỉ đạo chung công tác quân sự, quốc phòng địa phương"
        },
        {
            id: "cadre_qs_02",
            fullName: "Trần Ngọc Hưng",
            position: "Phó Chỉ huy trưởng Ban CHQS xã",
            department: "Ban CHQS xã",
            email: "hungtn.qs@easup.daklak.gov.vn",
            phone: "094 199 8080",
            bloc: "UBND",
            note: "Phụ trách tham mưu tác chiến, huấn luyện"
        },

        // ==========================================
        // VIII. KHỐI ĐẢNG ỦY - ĐOÀN THỂ XÃ
        // ==========================================
        {
            id: "cadre_du_03",
            fullName: "Nguyễn Phước Đức",
            position: "Ủy viên BTV, Chủ nhiệm Ủy ban Kiểm tra Đảng ủy",
            department: "Ủy ban Kiểm tra Đảng ủy",
            email: "ducnp.ubkt@easup.daklak.gov.vn",
            phone: "0915.223.344",
            bloc: "Đảng ủy"
        },
        {
            id: "cadre_du_04",
            fullName: "Trần Văn Hải",
            position: "Ủy viên BTV, Trưởng Ban Xây dựng Đảng",
            department: "Ban Xây dựng Đảng",
            email: "haitv.tcb@easup.daklak.gov.vn",
            phone: "0916.334.455",
            bloc: "Đảng ủy"
        },
        {
            id: "cadre_du_05",
            fullName: "Trần Văn Linh",
            position: "Ủy viên BTV, Chánh Văn phòng Đảng ủy",
            department: "Văn phòng Đảng ủy",
            email: "linhtv.vpdu@easup.daklak.gov.vn",
            phone: "0917.445.566",
            bloc: "Đảng ủy"
        },
        {
            id: "cadre_du_06",
            fullName: "Nguyễn Thị Lan",
            position: "Phó Chánh Văn phòng Đảng ủy",
            department: "Văn phòng Đảng ủy",
            email: "lannt.vpdu@easup.daklak.gov.vn",
            phone: "0918.556.677",
            bloc: "Đảng ủy"
        },
        {
            id: "cadre_du_07",
            fullName: "Nguyễn Văn Tuyến",
            position: "Phó Chủ nhiệm UBKT Đảng ủy",
            department: "Ủy ban Kiểm tra Đảng ủy",
            email: "tuyennv.ubkt@easup.daklak.gov.vn",
            phone: "0919.667.788",
            bloc: "Đảng ủy"
        },
        {
            id: "cadre_du_08",
            fullName: "Lê Thị Mỹ Lệ",
            position: "Phó Ban Xây dựng Đảng",
            department: "Ban Xây dựng Đảng",
            email: "leltm.tcb@easup.daklak.gov.vn",
            phone: "0903.778.899",
            bloc: "Đảng ủy"
        },
        {
            id: "cadre_dt_01",
            fullName: "Nguyễn Thị Miên",
            position: "Chủ tịch Hội Nông dân xã",
            department: "Hội Nông dân xã",
            email: "miennt.hnd@easup.daklak.gov.vn",
            phone: "0904.112.233",
            bloc: "Khác"
        },
        {
            id: "cadre_dt_02",
            fullName: "Đặng Trung Hiếu",
            position: "Chủ tịch Hội Cựu chiến binh xã",
            department: "Hội Cựu chiến binh",
            email: "hieudt.hccb@easup.daklak.gov.vn",
            phone: "0905.223.344",
            bloc: "Khác"
        },
        {
            id: "cadre_dt_03",
            fullName: "H Bun Mi Siu",
            position: "Chủ tịch Hội Liên hiệp Phụ nữ xã",
            department: "Hội Phụ nữ xã",
            email: "hbunmi.hpn@easup.daklak.gov.vn",
            phone: "0906.334.455",
            bloc: "Khác"
        },
        {
            id: "cadre_dt_04",
            fullName: "Đặng Văn Tình",
            position: "Bí thư Đoàn Thanh niên xã",
            department: "Đoàn Thanh niên",
            email: "tinhdv.dtn@easup.daklak.gov.vn",
            phone: "0907.445.566",
            bloc: "Khác"
        },
        {
            id: "cadre_dt_05",
            fullName: "Thái Hữu Hùng",
            position: "Giám đốc Trung tâm Chính trị",
            department: "Trung tâm Chính trị",
            email: "hungth.ttct@easup.daklak.gov.vn",
            phone: "0908.556.677",
            bloc: "Đảng ủy"
        },

        // ==========================================
        // IX. 15 TRƯỜNG HỌC TRÊN ĐỊA BÀN XÃ
        // ==========================================
        { id: "cadre_sch_01", fullName: "Võ Thị Lệ Hà", position: "Hiệu trưởng Trường MN Sơn Ca", department: "Trường MN Sơn Ca", email: "havtl.mnsc@easup.daklak.gov.vn", phone: "094 311 1670", bloc: "Khác" },
        { id: "cadre_sch_02", fullName: "Nguyễn Thị Hoá", position: "Hiệu trưởng Trường MN Hoa Hồng", department: "Trường MN Hoa Hồng", email: "hoant.mnhh@easup.daklak.gov.vn", phone: "097 455 9973", bloc: "Khác" },
        { id: "cadre_sch_03", fullName: "Nguyễn Thị Chóng", position: "Phó Hiệu trưởng Trường MN Hoa Mai", department: "Trường MN Hoa Mai", email: "chongnt.mnhm@easup.daklak.gov.vn", phone: "096 171 7176", bloc: "Khác" },
        { id: "cadre_sch_04", fullName: "Phạm Thị Huyền", position: "Hiệu trưởng Trường MN Ea Lê", department: "Trường MN Ea Lê", email: "huyenpt.mnel@easup.daklak.gov.vn", phone: "094 215 7595", bloc: "Khác" },
        { id: "cadre_sch_05", fullName: "Đinh Thị Diệu Linh", position: "Hiệu trưởng Trường MN Tuổi Thơ", department: "Trường MN Tuổi Thơ", email: "linhdtd.mntt@easup.daklak.gov.vn", phone: "034 679 1876", bloc: "Khác" },
        { id: "cadre_sch_06", fullName: "Trần Thị Thủy", position: "Hiệu trưởng Trường TH Cư M'Lan", department: "Trường TH Cư M'Lan", email: "thuytt.thcm@easup.daklak.gov.vn", phone: "094 404 7474", bloc: "Khác" },
        { id: "cadre_sch_07", fullName: "Nguyễn Hữu Thuỷ", position: "Hiệu trưởng Trường TH Ea Súp", department: "Trường TH Ea Súp", email: "thuynh.thes@easup.daklak.gov.vn", phone: "091 473 4715", bloc: "Khác" },
        { id: "cadre_sch_08", fullName: "Trần Quang Anh", position: "Hiệu trưởng Trường TH Nguyễn Bá Ngọc", department: "Trường TH Nguyễn Bá Ngọc", email: "anhtq.thnbn@easup.daklak.gov.vn", phone: "081 642 5168", bloc: "Khác" },
        { id: "cadre_sch_09", fullName: "Nguyễn Văn Tài", position: "Hiệu trưởng Trường TH Lê Lợi", department: "Trường TH Lê Lợi", email: "tainv.thll@easup.daklak.gov.vn", phone: "094 412 7474", bloc: "Khác" },
        { id: "cadre_sch_10", fullName: "Hoàng Thị Hằng", position: "Hiệu trưởng Trường TH Ea Lê", department: "Trường TH Ea Lê", email: "hanght.thel@easup.daklak.gov.vn", phone: "096 393 0448", bloc: "Khác" },
        { id: "cadre_sch_11", fullName: "Ngô Tuấn Hương", position: "Hiệu trưởng Trường TH Nguyễn Văn Trỗi", department: "Trường TH Nguyễn Văn Trỗi", email: "huongnt.thnvt@easup.daklak.gov.vn", phone: "097 499 7456", bloc: "Khác" },
        { id: "cadre_sch_12", fullName: "Lê Văn Ngân", position: "Hiệu trưởng Trường THCS Huỳnh Thúc Kháng", department: "Trường THCS Huỳnh Thúc Kháng", email: "nganlv.thcshtk@easup.daklak.gov.vn", phone: "097 888 9848", bloc: "Khác" },
        { id: "cadre_sch_13", fullName: "Nguyễn Minh Toại", position: "Hiệu trưởng Trường THCS Quang Trung", department: "Trường THCS Quang Trung", email: "toainm.thcsqt@easup.daklak.gov.vn", phone: "091 473 4498", bloc: "Khác" },
        { id: "cadre_sch_14", fullName: "Nguyễn Đình Đại", position: "Hiệu trưởng Trường THCS Ea Lê", department: "Trường THCS Ea Lê", email: "daind.thcsel@easup.daklak.gov.vn", phone: "0262 3700829", bloc: "Khác" },
        { id: "cadre_sch_15", fullName: "Lê Phi Hùng", position: "Hiệu trưởng Trường PT DTNT THCS Ea Súp", department: "Trường PT DTNT THCS Ea Súp", email: "hunglp.dtnt@easup.daklak.gov.vn", phone: "097 676 8668", bloc: "Khác" },

        // ==========================================
        // X. 46 THÔN TRƯỞNG, BUÔN TRƯỞNG, TỔ TRƯỞNG TDP
        // ==========================================
        { id: "cadre_tb_01", fullName: "Phạm Thanh Cây", position: "Thôn trưởng Thôn 1", department: "Thôn 1", email: "caypt.t1@easup.daklak.gov.vn", phone: "039 767 2618", bloc: "Khác" },
        { id: "cadre_tb_02", fullName: "Nguyễn Đăng Khoa", position: "Thôn trưởng Thôn 2", department: "Thôn 2", email: "khoand.t2@easup.daklak.gov.vn", phone: "098 926 5199", bloc: "Khác" },
        { id: "cadre_tb_03", fullName: "Lý Quang Dự", position: "Thôn trưởng Thôn 3", department: "Thôn 3", email: "dulq.t3@easup.daklak.gov.vn", phone: "094 281 7179", bloc: "Khác" },
        { id: "cadre_tb_04", fullName: "Bùi Công Trình", position: "Thôn trưởng Thôn 4", department: "Thôn 4", email: "trinhbc.t4@easup.daklak.gov.vn", phone: "098 765 9225", bloc: "Khác" },
        { id: "cadre_tb_05", fullName: "Lê Đình Thân", position: "Thôn trưởng Thôn 5", department: "Thôn 5", email: "thanld.t5@easup.daklak.gov.vn", phone: "035 879 5911", bloc: "Khác" },
        { id: "cadre_tb_06", fullName: "Nguyễn Văn Nghĩ", position: "Thôn trưởng Thôn 6", department: "Thôn 6", email: "nghinv.t6@easup.daklak.gov.vn", phone: "096 831 7768", bloc: "Khác" },
        { id: "cadre_tb_07", fullName: "Nguyễn Ngọc Ánh", position: "Thôn trưởng Thôn 7", department: "Thôn 7", email: "anhnn.t7@easup.daklak.gov.vn", phone: "098 664 0277", bloc: "Khác" },
        { id: "cadre_tb_08", fullName: "Trần Hữu Ước", position: "Thôn trưởng Thôn 8", department: "Thôn 8", email: "uocth.t8@easup.daklak.gov.vn", phone: "094 110 4179", bloc: "Khác" },
        { id: "cadre_tb_09", fullName: "Đào Văn Tỵ", position: "Thôn trưởng Thôn 9", department: "Thôn 9", email: "tydv.t9@easup.daklak.gov.vn", phone: "090 523 1331", bloc: "Khác" },
        { id: "cadre_tb_10", fullName: "Nguyễn Văn Thùy", position: "Thôn trưởng Thôn 10", department: "Thôn 10", email: "thuynv.t10@easup.daklak.gov.vn", phone: "098 540 2652", bloc: "Khác" },
        { id: "cadre_tb_11", fullName: "Nguyễn Văn Toản", position: "Tổ trưởng TDP Hòa Bình", department: "TDP Hòa Bình", email: "toannv.tdphb@easup.daklak.gov.vn", phone: "081 686 7788", bloc: "Khác" },
        { id: "cadre_tb_12", fullName: "Đào Quang Minh", position: "Tổ trưởng TDP Thắng Lợi", department: "TDP Thắng Lợi", email: "minhdq.tdptl@easup.daklak.gov.vn", phone: "034 305 8298", bloc: "Khác" },
        { id: "cadre_tb_13", fullName: "Nguyễn Hữu Long", position: "Tổ trưởng TDP Thành Công", department: "TDP Thành Công", email: "longnh.tdptc@easup.daklak.gov.vn", phone: "083 989 1166", bloc: "Khác" },
        { id: "cadre_tb_14", fullName: "Nguyễn Thị Thuận", position: "Tổ trưởng TDP Đoàn Kết", department: "TDP Đoàn Kết", email: "thuannt.tdpdk@easup.daklak.gov.vn", phone: "098 514 5518", bloc: "Khác" },
        { id: "cadre_tb_15", fullName: "Y Khăm Ta Niê", position: "Buôn trưởng Buôn A1", department: "Buôn A1", email: "ykhamta.ba1@easup.daklak.gov.vn", phone: "097 133 4447", bloc: "Khác" },
        { id: "cadre_tb_16", fullName: "Y Nét Nay", position: "Buôn trưởng Buôn A2", department: "Buôn A2", email: "ynetnay.ba2@easup.daklak.gov.vn", phone: "033 585 9114", bloc: "Khác" },
        { id: "cadre_tb_17", fullName: "Y Kui Siu", position: "Buôn trưởng Buôn B1", department: "Buôn B1", email: "ykuisiu.bb1@easup.daklak.gov.vn", phone: "036 502 7745", bloc: "Khác" },
        { id: "cadre_tb_18", fullName: "H Đũi Siu", position: "Buôn trưởng Buôn B2", department: "Buôn B2", email: "hduisiu.bb2@easup.daklak.gov.vn", phone: "039 702 1421", bloc: "Khác" },
        { id: "cadre_tb_19", fullName: "Y Phong Kpă", position: "Buôn trưởng Buôn C", department: "Buôn C", email: "yphong.bc@easup.daklak.gov.vn", phone: "097 513 3477", bloc: "Khác" },
        { id: "cadre_tb_20", fullName: "Nguyễn Tấn Lữ", position: "Thôn trưởng Thôn 1 Cư Mlan", department: "Thôn 1 Cư Mlan", email: "lunt.t1cm@easup.daklak.gov.vn", phone: "037 205 7127", bloc: "Khác" },
        { id: "cadre_tb_21", fullName: "Trần Thị Vân", position: "Thôn trưởng Thôn 2 Cư Mlan", department: "Thôn 2 Cư Mlan", email: "vantt.t2cm@easup.daklak.gov.vn", phone: "038 317 5939", bloc: "Khác" },
        { id: "cadre_tb_22", fullName: "Nguyễn Thành Trung", position: "Thôn trưởng Thôn 3 Cư Mlan", department: "Thôn 3 Cư Mlan", email: "trungnt.t3cm@easup.daklak.gov.vn", phone: "034 541 1991", bloc: "Khác" },
        { id: "cadre_tb_23", fullName: "Nguyễn Thành Nam", position: "Thôn trưởng Thôn 4 Cư Mlan", department: "Thôn 4 Cư Mlan", email: "namnt.t4cm@easup.daklak.gov.vn", phone: "098 378 8558", bloc: "Khác" },
        { id: "cadre_tb_24", fullName: "Nguyễn Thị Thùy Ngân", position: "Thôn trưởng Thôn 5 Cư Mlan", department: "Thôn 5 Cư Mlan", email: "nganntt.t5cm@easup.daklak.gov.vn", phone: "093 492 0747", bloc: "Khác" },
        { id: "cadre_tb_25", fullName: "Trần Bình Trọng", position: "Thôn trưởng Thôn 6 Cư Mlan", department: "Thôn 6 Cư Mlan", email: "trongtb.t6cm@easup.daklak.gov.vn", phone: "085 721 1944", bloc: "Khác" },
        { id: "cadre_tb_26", fullName: "Nguyễn Thị Sen", position: "Thôn trưởng Thôn 7 Cư Mlan", department: "Thôn 7 Cư Mlan", email: "sennt.t7cm@easup.daklak.gov.vn", phone: "098 526 1186", bloc: "Khác" },
        { id: "cadre_tb_27", fullName: "Lý Tòn Chuống", position: "Thôn trưởng Thôn Bình Lợi", department: "Thôn Bình Lợi", email: "chuonglt.tbl@easup.daklak.gov.vn", phone: "033 375 6509", bloc: "Khác" },
        { id: "cadre_tb_28", fullName: "Huỳnh Hóa", position: "Thôn trưởng Thôn 1 Ea Lê", department: "Thôn 1 Ea Lê", email: "hoahh.t1el@easup.daklak.gov.vn", phone: "086 849 3411", bloc: "Khác" },
        { id: "cadre_tb_29", fullName: "Hoàng Hải Yến", position: "Thôn trưởng Thôn 2 Ea Lê", department: "Thôn 2 Ea Lê", email: "yenhh.t2el@easup.daklak.gov.vn", phone: "037 767 0292", bloc: "Khác" },
        { id: "cadre_tb_30", fullName: "Lê Tấn Công", position: "Thôn trưởng Thôn 3 Ea Lê", department: "Thôn 3 Ea Lê", email: "conglt.t3el@easup.daklak.gov.vn", phone: "086 739 8290", bloc: "Khác" },
        { id: "cadre_tb_31", fullName: "Hồ Thị Hồng", position: "Thôn trưởng Thôn 4 Ea Lê", department: "Thôn 4 Ea Lê", email: "honght.t4el@easup.daklak.gov.vn", phone: "037 251 0539", bloc: "Khác" },
        { id: "cadre_tb_32", fullName: "Nguyễn Văn Hỷ", position: "Thôn trưởng Thôn 5 Ea Lê", department: "Thôn 5 Ea Lê", email: "hynv.t5el@easup.daklak.gov.vn", phone: "036 759 1027", bloc: "Khác" },
        { id: "cadre_tb_33", fullName: "Trần Đăng Tuyển", position: "Thôn trưởng Thôn 6 Ea Lê", department: "Thôn 6 Ea Lê", email: "tuyentd.t6el@easup.daklak.gov.vn", phone: "039 672 7467", bloc: "Khác" },
        { id: "cadre_tb_34", fullName: "Mai Thị Kiều", position: "Thôn trưởng Thôn 7 Ea Lê", department: "Thôn 7 Ea Lê", email: "kieumt.t7el@easup.daklak.gov.vn", phone: "096 949 2594", bloc: "Khác" },
        { id: "cadre_tb_35", fullName: "Phan Ngọc Hậu", position: "Thôn trưởng Thôn 8 Ea Lê", department: "Thôn 8 Ea Lê", email: "haupn.t8el@easup.daklak.gov.vn", phone: "097 414 7197", bloc: "Khác" },
        { id: "cadre_tb_36", fullName: "Trần Thị Thanh", position: "Thôn trưởng Thôn 9 Ea Lê", department: "Thôn 9 Ea Lê", email: "thanhtt.t9el@easup.daklak.gov.vn", phone: "034 993 1260", bloc: "Khác" },
        { id: "cadre_tb_37", fullName: "Cao Chí Thanh", position: "Thôn trưởng Thôn 10 Ea Lê", department: "Thôn 10 Ea Lê", email: "thanhcc.t10el@easup.daklak.gov.vn", phone: "039 795 6292", bloc: "Khác" },
        { id: "cadre_tb_38", fullName: "Cao Thành Trung", position: "Thôn trưởng Thôn 11 Ea Lê", department: "Thôn 11 Ea Lê", email: "trungct.t11el@easup.daklak.gov.vn", phone: "084 591 1118", bloc: "Khác" },
        { id: "cadre_tb_39", fullName: "Đinh Lục Hồng Quảng", position: "Thôn trưởng Thôn 12 Ea Lê", department: "Thôn 12 Ea Lê", email: "quangdlh.t12el@easup.daklak.gov.vn", phone: "097 456 3200", bloc: "Khác" },
        { id: "cadre_tb_40", fullName: "Hà Văn Thuận", position: "Thôn trưởng Thôn 13 Ea Lê", department: "Thôn 13 Ea Lê", email: "thuanhv.t13el@easup.daklak.gov.vn", phone: "038 444 5447", bloc: "Khác" },
        { id: "cadre_tb_41", fullName: "Bùi Thị Thiệp", position: "Thôn trưởng Thôn 14 Ea Lê", department: "Thôn 14 Ea Lê", email: "thiepbt.t14el@easup.daklak.gov.vn", phone: "097 502 4825", bloc: "Khác" },
        { id: "cadre_tb_42", fullName: "Hoàng Văn Thái", position: "Thôn trưởng Thôn 15 Ea Lê", department: "Thôn 15 Ea Lê", email: "thaihv.t15el@easup.daklak.gov.vn", phone: "038 827 6375", bloc: "Khác" },
        { id: "cadre_tb_43", fullName: "Trịnh Ngọc Tư", position: "Thôn trưởng Thôn 16 Ea Lê", department: "Thôn 16 Ea Lê", email: "tutn.t16el@easup.daklak.gov.vn", phone: "037 483 0359", bloc: "Khác" },
        { id: "cadre_tb_44", fullName: "Cao Quốc Tuấn", position: "Thôn trưởng Thôn 17 Ea Lê", department: "Thôn 17 Ea Lê", email: "tuancq.t17el@easup.daklak.gov.vn", phone: "037 285 4575", bloc: "Khác" },
        { id: "cadre_tb_45", fullName: "Hoàng Thị Mây", position: "Thôn trưởng Thôn 18 Ea Lê", department: "Thôn 18 Ea Lê", email: "mayht.t18el@easup.daklak.gov.vn", phone: "037 746 9261", bloc: "Khác" },
        { id: "cadre_tb_46", fullName: "Triệu Huy Hoàng", position: "Thôn trưởng Thôn 19 Ea Lê", department: "Thôn 19 Ea Lê", email: "hoangth.t19el@easup.daklak.gov.vn", phone: "096 397 4911", bloc: "Khác" }
    ],

    locations: [
        "Hội trường lớn UBND xã",
        "Phòng họp số 1 (Tầng 2 - UBND xã)",
        "Phòng họp số 2 (Tầng 1 - UBND xã)",
        "Phòng họp Ban Thường vụ Đảng ủy xã",
        "Trung tâm Hội nghị Xã Ea Súp",
        "Nhà sinh hoạt cộng đồng Buôn A1",
        "Nhà văn hóa Thôn 1 (Xã Ea Súp)",
        "Hiện trường Dự án Hồ chứa nước Ea Súp Thượng"
    ],

    vehicles: [
        "Xe 47A-002.35 (UBND)",
        "Xe 47A-001.89 (Đảng ủy)",
        "Xe bán tải 47C-123.45",
        "Tự túc phương tiện"
    ],

    sampleFiles: [
        {
            id: "doc_gm_01",
            name: "GM_T35_T2_GiaoBanThuongTruc.pdf",
            title: "Giấy mời họp Giao ban Thường trực Đảng ủy - HĐND - UBND tuần 35",
            size: "342 KB",
            type: "application/pdf",
            uploadDate: "2026-08-23 16:30",
            uploader: "Hà Tường Vi (Chánh Văn phòng)",
            url: "#",
            contentSummary: "Giấy mời số 89/GM-UBND ngày 23/8/2026 của UBND xã Ea Súp về việc họp Giao ban công tác tuần 35/2026."
        },
        {
            id: "doc_gm_02",
            name: "GM_T35_T3_KiemTraGiaiToa.pdf",
            title: "Giấy mời kiểm tra thực địa giải phóng mặt bằng đường liên xã",
            size: "520 KB",
            type: "application/pdf",
            uploadDate: "2026-08-24 09:15",
            uploader: "Hà Tường Vi (Chánh Văn phòng)",
            url: "#",
            contentSummary: "Giấy mời số 91/GM-UBND kiểm tra tiến độ giải ngân vốn đầu tư công và bồi thường GPMB."
        },
        {
            id: "doc_gm_03",
            name: "GM_T35_T5_TiepDanDinhKy.pdf",
            title: "Thông báo & Giấy mời Phiên tiếp công dân định kỳ của Chủ tịch UBND xã",
            size: "280 KB",
            type: "application/pdf",
            uploadDate: "2026-08-24 14:00",
            uploader: "Nguyễn Thị Thoản (Chuyên viên)",
            url: "#",
            contentSummary: "Thông báo số 45/TB-UBND về việc tiếp công dân định kỳ tháng 8/2026 của Chủ tịch UBND xã."
        }
    ],

    schedules: [
        {
            id: "sched_2026_w35",
            year: 2026,
            weekNumber: 35,
            title: "Lịch công tác tuần 35 năm 2026",
            startDate: "2026-08-24",
            endDate: "2026-08-30",
            status: "published",
            lastUpdated: "2026-08-31 08:30",
            updatedBy: "Hà Tường Vi (Chánh Văn phòng)",
            approvedBy: "Nguyễn Bá Bân (Chủ tịch UBND xã)",
            note: "Lịch đã được Thường trực Đảng ủy và Chủ tịch UBND xã phê duyệt ban hành.",
            items: [
                // THỨ HAI: 24/08/2026
                {
                    id: "item_35_01",
                    dayOfWeek: "Thứ Hai",
                    date: "2026-08-24",
                    time: "07h00",
                    bloc: "UBND",
                    content: "Chào cờ đầu tuần; Đánh giá kết quả công tác tuần 34 và phổ biến trọng tâm công tác tuần 35/2026.",
                    location: "Sân chào cờ Trụ sở UBND xã",
                    leader: "Đ/c Nguyễn Bá Bân - Chủ tịch UBND xã",
                    participants: "Toàn thể cán bộ, công chức, người hoạt động không chuyên trách xã; Trưởng các thôn, buôn.",
                    vehicle: "Tự túc phương tiện",
                    attachment: null
                },
                {
                    id: "item_35_02",
                    dayOfWeek: "Thứ Hai",
                    date: "2026-08-24",
                    time: "08h00",
                    bloc: "MTTQ",
                    content: "Họp Giao ban Thường trực Đảng ủy - HĐND - UBND - Ủy ban MTTQ xã định kỳ tuần 35/2026.",
                    location: "Phòng họp số 1 (Tầng 2 - UBND xã)",
                    leader: "Đ/c Đỗ Xuân Dũng - Bí thư Đảng ủy",
                    participants: "Thường trực Đảng ủy, TT HĐND, Lãnh đạo UBND xã, Ban Thường trực UBMTTQ xã, Lãnh đạo VP HĐND & UBND xã.",
                    vehicle: "Tự túc phương tiện",
                    attachment: {
                        id: "doc_gm_01",
                        name: "GM_T35_T2_GiaoBanThuongTruc.pdf",
                        badge: "📄 GM số 89/GM-UBND"
                    }
                },
                {
                    id: "item_35_03",
                    dayOfWeek: "Thứ Hai",
                    date: "2026-08-24",
                    time: "14h00",
                    bloc: "UBND",
                    content: "Họp rà soát công tác thu ngân sách nhà nước và giải ngân vốn các Chương trình MTQG 8 tháng đầu năm 2026.",
                    location: "Phòng họp số 2 (Tầng 1 - UBND xã)",
                    leader: "Đ/c Đặng Thị Thanh Nhung - Phó Chủ tịch thường trực UBND xã",
                    participants: "Phòng Kinh tế (Đ/c Trọng, Đ/c Hằng), Văn phòng, Đội thuế liên xã.",
                    vehicle: "Tự túc phương tiện",
                    attachment: null
                },

                // THỨ BA: 25/08/2026
                {
                    id: "item_35_04",
                    dayOfWeek: "Thứ Ba",
                    date: "2026-08-25",
                    time: "08h00",
                    bloc: "UBND",
                    content: "Đi kiểm tra thực địa tiến độ giải phóng mặt bằng Dự án nâng cấp tuyến đường giao thông liên xã và kênh mương nội đồng.",
                    location: "Hiện trường Dự án Hồ chứa nước Ea Súp Thượng",
                    leader: "Đ/c Nguyễn Bá Bân - Chủ tịch UBND xã",
                    participants: "Đ/c Trần Ngọc Hoàng - PCT UBND; Phòng Kinh tế (Đ/c Dương, Đ/c Trung); Trưởng Buôn A1 (Đ/c Y Khăm Ta Niê).",
                    vehicle: "Xe bán tải 47C-123.45",
                    attachment: {
                        id: "doc_gm_02",
                        name: "GM_T35_T3_KiemTraGiaiToa.pdf",
                        badge: "📄 GM số 91/GM-UBND"
                    }
                },
                {
                    id: "item_35_05",
                    dayOfWeek: "Thứ Ba",
                    date: "2026-08-25",
                    time: "14h00",
                    bloc: "Đảng ủy",
                    content: "Hội nghị Ban Chấp hành Đảng bộ xã (chuyên đề) về công tác phát triển đảng viên và nhân sự cơ sở năm 2026.",
                    location: "Phòng họp Ban Thường vụ Đảng ủy xã",
                    leader: "Đ/c Đỗ Xuân Dũng - Bí thư Đảng ủy",
                    participants: "Các đồng chí Ủy viên BCH Đảng bộ xã khóa XIV; Bí thư các Chi bộ trực thuộc.",
                    vehicle: "Tự túc phương tiện",
                    attachment: null
                },

                // THỨ TƯ: 26/08/2026
                {
                    id: "item_35_06",
                    dayOfWeek: "Thứ Tư",
                    date: "2026-08-26",
                    time: "08h00",
                    bloc: "HĐND",
                    content: "Đoàn Giám sát của Thường trực HĐND xã làm việc về tình hình quản lý, sử dụng đất công ích và xử lý rác thải sinh hoạt.",
                    location: "Hội trường lớn UBND xã",
                    leader: "Đ/c H Djoan Siu - Phó Chủ tịch HĐND xã",
                    participants: "Ban Kinh tế - Xã hội HĐND; Lãnh đạo UBND xã; Phòng Kinh tế (Đ/c Đức, Đ/c Tuyển).",
                    vehicle: "Tự túc phương tiện",
                    attachment: null
                },
                {
                    id: "item_35_07",
                    dayOfWeek: "Thứ Tư",
                    date: "2026-08-26",
                    time: "14h00",
                    bloc: "UBND",
                    content: "Họp Hội đồng Nghĩa vụ quân sự xã rà soát nguồn công dân nam trong độ tuổi sẵn sàng nhập ngũ năm 2027.",
                    location: "Phòng họp số 1 (Tầng 2 - UBND xã)",
                    leader: "Đ/c Nguyễn Bá Bân - Chủ tịch UBND xã (Chủ tịch HĐ NVQS)",
                    participants: "Thành viên Hội đồng NVQS xã; Ban CHQS xã (Đ/c Vương); Công an xã (Đ/c Hiếu); Thôn/Buôn trưởng.",
                    vehicle: "Tự túc phương tiện",
                    attachment: null
                },

                // THỨ NĂM: 27/08/2026
                {
                    id: "item_35_08",
                    dayOfWeek: "Thứ Năm",
                    date: "2026-08-27",
                    time: "07h30",
                    bloc: "UBND",
                    content: "Chủ tịch UBND xã Tiếp công dân định kỳ theo Luật Tiếp công dân.",
                    location: "Phòng Tiếp công dân (Trụ sở UBND xã)",
                    leader: "Đ/c Nguyễn Bá Bân - Chủ tịch UBND xã",
                    participants: "Văn phòng HĐND & UBND (Đ/c Diệp, Đ/c Kiên); Phòng Kinh tế; Công an xã.",
                    vehicle: "Tự túc phương tiện",
                    attachment: {
                        id: "doc_gm_03",
                        name: "GM_T35_T5_TiepDanDinhKy.pdf",
                        badge: "📄 TB số 45/TB-UBND"
                    }
                },
                {
                    id: "item_35_09",
                    dayOfWeek: "Thứ Năm",
                    date: "2026-08-27",
                    time: "14h00",
                    bloc: "UBND",
                    content: "Làm việc với Đoàn công tác Sở Nông nghiệp & PTNT tỉnh về thẩm tra tiêu chí nông thôn mới nâng cao.",
                    location: "Hội trường lớn UBND xã",
                    leader: "Đ/c Đặng Thị Thanh Nhung - Phó Chủ tịch thường trực UBND xã",
                    participants: "Ban Quản lý XD Nông thôn mới xã; Phòng Kinh tế (Đ/c Trọng, Đ/c Thu); Trưởng các đoàn thể xã.",
                    vehicle: "Xe 47A-002.35 (UBND)",
                    attachment: null
                },

                // THỨ SÁU: 28/08/2026
                {
                    id: "item_35_10",
                    dayOfWeek: "Thứ Sáu",
                    date: "2026-08-28",
                    time: "08h00",
                    bloc: "UBND",
                    content: "Dự Hội nghị trực tuyến toàn tỉnh sơ kết 02 năm triển khai Đề án 06/CP về phát triển ứng dụng dữ liệu dân cư và chuyển đổi số.",
                    location: "Phòng họp số 1 (Phòng họp trực tuyến)",
                    leader: "Đ/c Trần Ngọc Hoàng - Phó Chủ tịch UBND xã",
                    participants: "Công an xã (Đ/c Hiếu, Đ/c Hùng); Phòng VH-XH (Đ/c Oanh, Đ/c Hạnh); Trung tâm Hành chính công (Đ/c Nga).",
                    vehicle: "Tự túc phương tiện",
                    attachment: null
                },
                {
                    id: "item_35_11",
                    dayOfWeek: "Thứ Sáu",
                    date: "2026-08-28",
                    time: "15h00",
                    bloc: "MTTQ",
                    content: "Họp tổng kết tuần 35; rà soát và thông qua Dự thảo Lịch công tác tuần 36/2026.",
                    location: "Phòng họp số 1 (Tầng 2 - UBND xã)",
                    leader: "Đ/c Nguyễn Bá Bân - Chủ tịch UBND xã",
                    participants: "Lãnh đạo UBND xã, Thường trực HĐND xã, Lãnh đạo Văn phòng, Trưởng các Phòng ban chuyên môn.",
                    vehicle: "Tự túc phương tiện",
                    attachment: null
                },

                // THỨ BẢY: 29/08/2026
                {
                    id: "item_35_12",
                    dayOfWeek: "Thứ Bảy",
                    date: "2026-08-29",
                    time: "08h00",
                    bloc: "Khác",
                    content: "Phát động 'Ngày Thứ Bảy tình nguyện' ra quân dọn dẹp vệ sinh môi trường, nạo vét kênh mương Buôn A1.",
                    location: "Nhà sinh hoạt cộng đồng Buôn A1",
                    leader: "Đ/c Lê Hồng Hạnh - Chủ tịch MTTQ xã",
                    participants: "Đoàn Thanh niên (Đ/c Tình), Hội Phụ nữ (Đ/c H Bun Mi), Hội Nông dân (Đ/c Miên), Hội CCB (Đ/c Hiếu) và nhân dân Buôn A1.",
                    vehicle: "Tự túc phương tiện",
                    attachment: null
                },

                // CHỦ NHẬT: 30/08/2026
                {
                    id: "item_35_13",
                    dayOfWeek: "Chủ Nhật",
                    date: "2026-08-30",
                    time: "08h00",
                    bloc: "UBND",
                    content: "Trực chỉ huy đảm bảo an ninh trật tự, an toàn giao thông và phòng chống thiên tai mưa bão trên địa bàn xã.",
                    location: "Trụ sở UBND xã & Công an xã",
                    leader: "Lãnh đạo UBND xã (Trực ban theo lịch phân công)",
                    participants: "Cán bộ Trực ban cơ quan, Công an xã (Đ/c Trường), Ban CHQS xã (Đ/c Hưng), Đội dân phòng thôn buôn.",
                    vehicle: "Xe bán tải 47C-123.45",
                    attachment: null
                }
            ]
        },

        // LỊCH TUẦN 34 (LƯU TRỮ)
        {
            id: "sched_2026_w34",
            year: 2026,
            weekNumber: 34,
            title: "Lịch công tác tuần 34 năm 2026",
            startDate: "2026-08-17",
            endDate: "2026-08-23",
            status: "published",
            lastUpdated: "2026-08-23 17:00",
            updatedBy: "Hà Tường Vi (Chánh Văn phòng)",
            approvedBy: "Nguyễn Bá Bân (Chủ tịch UBND xã)",
            note: "Lịch tuần 34 đã hoàn thành và lưu trữ.",
            items: [
                {
                    id: "item_34_01",
                    dayOfWeek: "Thứ Hai",
                    date: "2026-08-17",
                    time: "07h00",
                    bloc: "UBND",
                    content: "Chào cờ đầu tuần; Triển khai công tác chuẩn bị năm học mới 2026 - 2027.",
                    location: "Sân chào cờ Trụ sở UBND xã",
                    leader: "Đ/c Nguyễn Bá Bân - Chủ tịch UBND xã",
                    participants: "Cán bộ công chức UBND xã, Ban Giám hiệu 15 trường học trên địa bàn xã.",
                    vehicle: "Tự túc phương tiện",
                    attachment: null
                },
                {
                    id: "item_34_02",
                    dayOfWeek: "Thứ Tư",
                    date: "2026-08-19",
                    time: "08h00",
                    bloc: "UBND",
                    content: "Lễ kỷ niệm 81 năm Ngày truyền thống Công an nhân dân Việt Nam (19/8/1945 - 19/8/2026).",
                    location: "Hội trường lớn UBND xã",
                    leader: "Đ/c Đỗ Xuân Dũng - Bí thư Đảng ủy",
                    participants: "BTV Đảng ủy, Thường trực HĐND, UBND, Ủy ban MTTQ xã, lực lượng Công an xã qua các thời kỳ.",
                    vehicle: "Tự túc phương tiện",
                    attachment: null
                }
            ]
        }
    ],

    auditLogs: [
        {
            id: "log_001",
            weekId: "sched_2026_w35",
            weekNumber: 35,
            year: 2026,
            itemId: "item_35_04",
            action: "UPDATE",
            actionTitle: "Chỉnh sửa mục công tác Thứ Ba",
            editorId: "u_admin",
            editorName: "Hà Tường Vi (Chánh Văn phòng)",
            timestamp: "2026-08-31 08:30:15",
            changes: [
                {
                    field: "Giờ họp",
                    oldValue: "07h30",
                    newValue: "08h00"
                },
                {
                    field: "Địa điểm",
                    oldValue: "Phòng họp số 1 (Tầng 2 - UBND xã)",
                    newValue: "Hiện trường Dự án Hồ chứa nước Ea Súp Thượng"
                },
                {
                    field: "Phương tiện",
                    oldValue: "Tự túc phương tiện",
                    newValue: "Xe bán tải 47C-123.45"
                }
            ],
            reason: "Điều chỉnh theo ý kiến chỉ đạo trực tiếp của Chủ tịch UBND xã sau kiểm tra sơ bộ."
        },
        {
            id: "log_002",
            weekId: "sched_2026_w35",
            weekNumber: 35,
            year: 2026,
            itemId: "item_35_02",
            action: "ATTACH_FILE",
            actionTitle: "Đính kèm giấy mời",
            editorId: "u_editor",
            editorName: "Nguyễn Thị Thoản (Chuyên viên)",
            timestamp: "2026-08-30 16:45:20",
            changes: [
                {
                    field: "Giấy mời đính kèm",
                    oldValue: "[Chưa có tệp]",
                    newValue: "GM_T35_T2_GiaoBanThuongTruc.pdf (GM số 89/GM-UBND)"
                }
            ],
            reason: "Cập nhật Giấy mời số 89/GM-UBND vừa ký duyệt chiều ngày 23/8."
        },
        {
            id: "log_003",
            weekId: "sched_2026_w35",
            weekNumber: 35,
            year: 2026,
            itemId: "item_35_10",
            action: "UPDATE",
            actionTitle: "Thay đổi người chủ trì Thứ Sáu",
            editorId: "u_admin",
            editorName: "Hà Tường Vi (Chánh Văn phòng)",
            timestamp: "2026-08-30 11:20:00",
            changes: [
                {
                    field: "Lãnh đạo dự / Chủ trì",
                    oldValue: "Đ/c Nguyễn Bá Bân - Chủ tịch UBND xã",
                    newValue: "Đ/c Trần Ngọc Hoàng - Phó Chủ tịch UBND xã"
                }
            ],
            reason: "Đ/c Chủ tịch bận họp đột xuất tại Tỉnh, ủy quyền Đ/c Phó Chủ tịch dự họp trực tuyến."
        }
    ],

    emailLogs: [
        {
            id: "mail_log_01",
            sentAt: "2026-08-31 08:35:00",
            sender: "viht.vp@easup.daklak.gov.vn",
            recipientsCount: 95,
            subject: "[UBND XÃ EA SÚP] Thông báo Cập nhật Lịch công tác Tuần 35/2026 (Có 02 thay đổi mới)",
            status: "Đã gửi thành công",
            summary: "Đã gửi bảng tóm tắt thay đổi và liên kết giấy mời đến toàn bộ hòm thư cán bộ, công chức, các trường học và thôn buôn."
        }
    ]
};
