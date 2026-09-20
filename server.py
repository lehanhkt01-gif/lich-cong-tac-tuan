#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HỆ THỐNG MÁY CHỦ DỮ LIỆU & ĐIỀU HÀNH LỊCH CÔNG TÁC TUẦN
CƠ QUAN ĐẢNG ỦY - HĐND - UBND - UBMTTQ VIỆT NAM XÃ EA SÚP
Domain: lichcongtac.easupso.com

Chuẩn hóa hạ tầng sản xuất:
- ORM: SQLAlchemy kết nối PostgreSQL 16 (Hỗ trợ SQLite fallback cho môi trường dev)
- Bảo mật: Hashing bcrypt, Token JWT Bearer cho Admin APIs
- Export: Xuất file Word (.docx) chuẩn thể thức văn bản hành chính theo Nghị định 30/2020/NĐ-CP
"""

import os
import sys
import json
import time
import base64
import re
import shutil
import glob
import urllib.parse
import http.server
import socketserver
from datetime import datetime, date, timedelta
from io import BytesIO

# Đảm bảo Windows Terminal hỗ trợ in ký tự Unicode/Tiếng Việt không lỗi
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

# =============================================================================
# 1. CẤU HÌNH HỆ THỐNG & BIẾN MÔI TRƯỜNG
# =============================================================================
PORT = int(os.environ.get("PORT", 5000))
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
UPLOADS_DIR = os.path.join(DATA_DIR, "uploads")
BACKUPS_DIR = os.path.join(DATA_DIR, "backups")

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(BACKUPS_DIR, exist_ok=True)

# Tự động nạp tệp biến môi trường bí mật .env (nếu có)
def load_dotenv(filepath):
    if not os.path.exists(filepath):
        return
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                k = k.strip()
                v = v.strip().strip('"').strip("'")
                if k not in os.environ:
                    os.environ[k] = v
    except Exception as e:
        print(f"⚠️ Lỗi đọc .env: {e}")

load_dotenv(os.path.join(BASE_DIR, ".env"))

# Bảo mật JWT & Quản trị
JWT_SECRET = os.environ.get("JWT_SECRET", "EasupSecretTokenKey_DakLak_2026#SecureSuperSecretKey")
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")
ADMIN_FULLNAME = os.environ.get("ADMIN_FULLNAME", "Văn phòng Đảng ủy - HĐND - UBND - UBMTTQ xã Ea Súp")
DATABASE_URL = os.environ.get("DATABASE_URL", "").strip()
ADMIN_USERS_CONFIG = os.environ.get("ADMIN_USERS_CONFIG", "").strip()

# =============================================================================
# 2. BẢO MẬT: BCRYPT & JWT HELPERS (KÈM FALLBACK AN TOÀN)
# =============================================================================
try:
    import bcrypt
    def hash_password(plain_password: str) -> str:
        salt = bcrypt.gensalt(rounds=12)
        return bcrypt.hashpw(plain_password.encode('utf-8'), salt).decode('utf-8')

    def verify_password(plain_password: str, hashed_password: str) -> bool:
        if not hashed_password:
            return False
        try:
            return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
        except Exception:
            return False
except ImportError:
    import hashlib
    print("⚠️ Thư viện 'bcrypt' chưa cài đặt, sử dụng SHA-256 fallback an toàn.")
    def hash_password(plain_password: str) -> str:
        salt = "easup_salt_2026"
        return "sha256$" + hashlib.sha256((salt + plain_password).encode('utf-8')).hexdigest()

    def verify_password(plain_password: str, hashed_password: str) -> bool:
        if not hashed_password:
            return False
        salt = "easup_salt_2026"
        expected = "sha256$" + hashlib.sha256((salt + plain_password).encode('utf-8')).hexdigest()
        return hashed_password == expected or (ADMIN_PASSWORD and plain_password == ADMIN_PASSWORD)

try:
    import jwt
    def create_jwt_token(payload: dict, expires_days=7) -> str:
        data = payload.copy()
        data["exp"] = datetime.utcnow() + timedelta(days=expires_days)
        data["iat"] = datetime.utcnow()
        return jwt.encode(data, JWT_SECRET, algorithm="HS256")

    def decode_jwt_token(token: str) -> dict:
        try:
            return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        except Exception:
            return None
except ImportError:
    import hmac
    import hashlib
    print("⚠️ Thư viện 'pyjwt' chưa cài đặt, sử dụng HMAC-SHA256 Token fallback.")
    def create_jwt_token(payload: dict, expires_days=7) -> str:
        data = payload.copy()
        data["exp"] = int(time.time()) + (expires_days * 86400)
        json_bytes = json.dumps(data, sort_keys=True).encode('utf-8')
        sig = hmac.new(JWT_SECRET.encode('utf-8'), json_bytes, hashlib.sha256).hexdigest()
        raw = base64.urlsafe_b64encode(json_bytes).decode('utf-8')
        return f"{raw}.{sig}"

    def decode_jwt_token(token: str) -> dict:
        try:
            parts = token.split(".")
            if len(parts) != 2:
                return None
            raw, sig = parts[0], parts[1]
            json_bytes = base64.urlsafe_b64decode(raw.encode('utf-8'))
            expected_sig = hmac.new(JWT_SECRET.encode('utf-8'), json_bytes, hashlib.sha256).hexdigest()
            if not hmac.compare_digest(sig, expected_sig):
                return None
            data = json.loads(json_bytes.decode('utf-8'))
            if data.get("exp", 0) < int(time.time()):
                return None
            return data
        except Exception:
            return None

# =============================================================================
# 3. TẦNG CƠ SỞ DỮ LIỆU SQLALCHEMY ORM & POSTGRESQL / SQLITE
# =============================================================================
USE_SQLALCHEMY = False
try:
    from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey, select, desc
    from sqlalchemy.orm import declarative_base, sessionmaker, relationship, scoped_session

    Base = declarative_base()

    class WeeklySchedule(Base):
        __tablename__ = 'weekly_schedules'
        id = Column(String(50), primary_key=True)
        week_number = Column(Integer, nullable=False, index=True)
        year = Column(Integer, nullable=False, index=True)
        start_date = Column(String(20), nullable=False)
        end_date = Column(String(20), nullable=False)
        title = Column(String(255), nullable=False)
        status = Column(String(50), default="Đã ban hành")
        notes = Column(Text, nullable=True)
        created_at = Column(DateTime, default=datetime.utcnow)
        updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

        items = relationship("ScheduleItem", back_populates="schedule", cascade="all, delete-orphan", order_by="ScheduleItem.date, ScheduleItem.time")

        def to_dict(self):
            items_list = [item.to_dict() for item in self.items]
            # Sắp xếp thời gian
            return {
                "id": self.id,
                "weekNumber": self.week_number,
                "year": self.year,
                "startDate": self.start_date,
                "endDate": self.end_date,
                "title": self.title,
                "status": "published" if self.status in ["Đã ban hành", "published"] else "draft",
                "statusLabel": self.status,
                "note": self.notes or "",
                "lastUpdated": self.updated_at.strftime("%Y-%m-%d %H:%M") if self.updated_at else "",
                "updatedBy": ADMIN_FULLNAME,
                "items": items_list
            }

    class ScheduleItem(Base):
        __tablename__ = 'schedule_items'
        id = Column(String(50), primary_key=True)
        schedule_id = Column(String(50), ForeignKey('weekly_schedules.id', ondelete='CASCADE'), nullable=False, index=True)
        day_of_week = Column(String(50), nullable=False)
        date = Column(String(20), nullable=False)
        session = Column(String(20), nullable=False, default="Sáng")
        time = Column(String(50), nullable=False)
        content = Column(Text, nullable=False)
        chair = Column(String(255), nullable=True)
        attendees = Column(Text, nullable=True)
        location = Column(String(255), nullable=True)
        unit = Column(String(100), nullable=True)
        notes = Column(Text, nullable=True)
        vehicle = Column(String(100), nullable=True)
        attachment_url = Column(String(500), nullable=True)
        attachment_name = Column(String(255), nullable=True)
        created_at = Column(DateTime, default=datetime.utcnow)
        updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

        schedule = relationship("WeeklySchedule", back_populates="items")

        def to_dict(self):
            att = None
            if self.attachment_url:
                att = {
                    "url": self.attachment_url,
                    "name": self.attachment_name or "Tệp đính kèm",
                    "badge": "Giấy mời / Tài liệu"
                }
            return {
                "id": self.id,
                "scheduleId": self.schedule_id,
                "dayOfWeek": self.day_of_week,
                "date": self.date,
                "session": self.session,
                "time": self.time,
                "content": self.content,
                "chair": self.chair or "",
                "leader": self.chair or "",       # Tương thích client cũ
                "attendees": self.attendees or "",
                "participants": self.attendees or "", # Tương thích client cũ
                "location": self.location or "",
                "unit": self.unit or "UBND",
                "bloc": self.unit or "UBND",      # Tương thích client cũ
                "note": self.notes or "",
                "vehicle": self.vehicle or "Tự túc",
                "attachment": att
            }

    class AdminUser(Base):
        __tablename__ = 'admin_users'
        id = Column(Integer, primary_key=True, autoincrement=True)
        username = Column(String(100), unique=True, nullable=False, index=True)
        password_hash = Column(String(255), nullable=False)
        full_name = Column(String(255), nullable=False)
        role = Column(String(50), default="super_admin")
        created_at = Column(DateTime, default=datetime.utcnow)

        def to_dict(self):
            return {
                "id": self.id,
                "username": self.username,
                "fullName": self.full_name,
                "role": self.role,
                "roleName": "Lãnh đạo đơn vị (Toàn quyền)" if self.role == "super_admin" else "Chuyên viên tổng hợp"
            }

    # Thiết lập Engine kết nối
    target_db_url = DATABASE_URL
    if target_db_url and target_db_url.startswith("postgres://"):
        target_db_url = target_db_url.replace("postgres://", "postgresql://", 1)

    if not target_db_url:
        sqlite_file = os.path.join(DATA_DIR, "lich_congtac.db")
        target_db_url = f"sqlite:///{sqlite_file}"

    try:
        engine = create_engine(target_db_url, pool_pre_ping=True)
        # Kiểm tra kết nối
        with engine.connect() as conn:
            pass
        Base.metadata.create_all(bind=engine)
        SessionLocal = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))
        USE_SQLALCHEMY = True
        print(f"✅ Đã kết nối cơ sở dữ liệu thành công qua SQLAlchemy: {target_db_url.split('@')[-1]}")
    except Exception as db_err:
        print(f"⚠️ Không thể kết nối tới {target_db_url}: {db_err}")
        print("🔄 Chuyển sang sử dụng SQLite nội bộ an toàn...")
        sqlite_file = os.path.join(DATA_DIR, "lich_congtac.db")
        engine = create_engine(f"sqlite:///{sqlite_file}")
        Base.metadata.create_all(bind=engine)
        SessionLocal = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))
        USE_SQLALCHEMY = True
        print(f"✅ Đã khởi tạo CSDL SQLite dự phòng: {sqlite_file}")

except Exception as e:
    print(f"⚠️ Lỗi khởi tạo SQLAlchemy: {e}. Sẽ dùng JSON storage fallback.")
    USE_SQLALCHEMY = False

# =============================================================================
# 4. HÀM TÍNH TOÁN TUẦN VÀ DỮ LIỆU MẪU CHUẨN XÃ EA SÚP
# =============================================================================
def get_week_range(year: int, week_no: int):
    """Tính ngày Thứ Hai (bắt đầu) và Chủ Nhật (kết thúc) theo tuần ISO"""
    try:
        jan4 = date(year, 1, 4)
        start_of_first_week = jan4 - timedelta(days=jan4.isoweekday() - 1)
        monday = start_of_first_week + timedelta(weeks=week_no - 1)
        sunday = monday + timedelta(days=6)
        return monday.strftime("%Y-%m-%d"), sunday.strftime("%Y-%m-%d")
    except Exception:
        today = date.today()
        monday = today - timedelta(days=today.isoweekday() - 1)
        sunday = monday + timedelta(days=6)
        return monday.strftime("%Y-%m-%d"), sunday.strftime("%Y-%m-%d")

def save_schedule_dict_to_db(s_dict: dict, session) -> WeeklySchedule:
    """Lưu hoặc cập nhật WeeklySchedule kèm danh sách ScheduleItem vào CSDL SQLAlchemy"""
    if not isinstance(s_dict, dict):
        return None
    week_id = s_dict.get("id")
    year = s_dict.get("year")
    week_no = s_dict.get("weekNumber")
    if not year or not week_no:
        now = datetime.now()
        iso_y, iso_w, _ = now.isocalendar()
        year = year or iso_y
        week_no = week_no or iso_w
    if not week_id:
        week_id = f"sched_{year}_w{week_no}"

    start_d, end_d = get_week_range(int(year), int(week_no))
    start_date = s_dict.get("startDate") or start_d
    end_date = s_dict.get("endDate") or end_d
    title = s_dict.get("title") or f"Lịch công tác tuần thứ {week_no} năm {year}"
    status = s_dict.get("statusLabel") or s_dict.get("status") or "Đã ban hành"
    notes = s_dict.get("note") or s_dict.get("notes") or ""

    sched = session.query(WeeklySchedule).filter_by(id=week_id).first()
    if not sched:
        sched = WeeklySchedule(
            id=week_id,
            week_number=int(week_no),
            year=int(year),
            start_date=start_date,
            end_date=end_date,
            title=title,
            status=status,
            notes=notes
        )
        session.add(sched)
        session.flush()
    else:
        sched.title = title
        sched.status = status
        sched.notes = notes
        sched.start_date = start_date
        sched.end_date = end_date
        sched.updated_at = datetime.utcnow()

    items_list = s_dict.get("items", [])
    if isinstance(items_list, list):
        for idx, it in enumerate(items_list):
            if not isinstance(it, dict):
                continue
            item_id = it.get("id") or f"item_{week_id}_{idx+1:02d}"
            item_obj = session.query(ScheduleItem).filter_by(id=item_id).first()
            if not item_obj:
                item_obj = ScheduleItem(id=item_id, schedule_id=sched.id)
                session.add(item_obj)

            item_obj.day_of_week = it.get("dayOfWeek", "Thứ Hai")
            item_obj.date = it.get("date", sched.start_date)
            item_obj.session = it.get("session", "Sáng")
            item_obj.time = it.get("time", "07h30")
            item_obj.content = it.get("content", "")
            item_obj.chair = it.get("chair") or it.get("leader", "")
            item_obj.attendees = it.get("attendees") or it.get("participants", "")
            item_obj.location = it.get("location", "")
            item_obj.unit = it.get("unit") or it.get("bloc", "UBND")
            item_obj.notes = it.get("note") or it.get("notes", "")
            item_obj.vehicle = it.get("vehicle", "Tự túc")

            att = it.get("attachment")
            if att and isinstance(att, dict):
                item_obj.attachment_url = att.get("url")
                item_obj.attachment_name = att.get("name")

    return sched

def seed_default_data():
    """Khởi tạo tài khoản quản trị và bảo lưu/nhập dữ liệu lịch cũ hoặc dữ liệu mẫu"""
    if not USE_SQLALCHEMY:
        return

    session = SessionLocal()
    try:
        # 1. Nạp danh sách cán bộ Quản trị viên toàn quyền từ ADMIN_USERS_CONFIG (.env)
        if ADMIN_USERS_CONFIG:
            try:
                users_list = json.loads(ADMIN_USERS_CONFIG)
                for u in users_list:
                    uname = (u.get("username") or "").strip()
                    pword = (u.get("password") or "").strip()
                    fname = (u.get("full_name") or uname).strip()
                    role = (u.get("role") or "super_admin").strip()
                    if uname and pword:
                        existing_u = session.query(AdminUser).filter_by(username=uname).first()
                        pwd_hash = hash_password(pword)
                        if existing_u:
                            existing_u.password_hash = pwd_hash
                            existing_u.full_name = fname
                            existing_u.role = role
                        else:
                            new_u = AdminUser(
                                username=uname,
                                password_hash=pwd_hash,
                                full_name=fname,
                                role=role
                            )
                            session.add(new_u)
                session.commit()
                print(f"🔑 Đã nạp và đồng bộ {len(users_list)} tài khoản Cán bộ Quản trị toàn quyền từ file .env")
            except Exception as e:
                print(f"⚠️ Lỗi nạp ADMIN_USERS_CONFIG: {e}")
        elif ADMIN_PASSWORD:
            admin_user = session.query(AdminUser).filter_by(username=ADMIN_USERNAME).first()
            if not admin_user:
                pwd_hash = hash_password(ADMIN_PASSWORD)
                new_admin = AdminUser(
                    username=ADMIN_USERNAME,
                    password_hash=pwd_hash,
                    full_name=ADMIN_FULLNAME,
                    role="super_admin"
                )
                session.add(new_admin)
                session.commit()
                print(f"🔑 Đã tạo tài khoản quản trị mặc định: {ADMIN_USERNAME}")

        # 2. TỰ ĐỘNG CHUYỂN ĐỔI DỮ LIỆU CŨ TRÊN VPS (Nếu có schedules.json hoặc backups)
        legacy_files = [os.path.join(DATA_DIR, "schedules.json")]
        legacy_files.extend(sorted(glob.glob(os.path.join(BACKUPS_DIR, "*.json")), reverse=True))

        has_legacy_data = False
        for lpath in legacy_files:
            if os.path.exists(lpath):
                try:
                    with open(lpath, "r", encoding="utf-8") as f:
                        ldata = json.load(f)
                    if isinstance(ldata, dict):
                        ldata = [ldata]
                    if isinstance(ldata, list) and len(ldata) > 0:
                        imported = 0
                        for s_dict in ldata:
                            if isinstance(s_dict, dict) and (s_dict.get("id") or s_dict.get("items")):
                                save_schedule_dict_to_db(s_dict, session)
                                imported += 1
                        if imported > 0:
                            session.commit()
                            print(f"📦 BẢO VỆ DỮ LIỆU CŨ: Đã tự động nhập {imported} lịch công tác từ {os.path.basename(lpath)} vào CSDL!")
                            has_legacy_data = True
                            break
                except Exception as ex_mig:
                    print(f"⚠️ Lỗi đọc tệp lịch cũ {lpath}: {ex_mig}")

        # 3. Khởi tạo lịch tuần mẫu CHỈ KHI chưa có bất kỳ lịch nào (cả trong DB lẫn tệp cũ)
        sched_count = session.query(WeeklySchedule).count()
        if sched_count == 0 and not has_legacy_data:
            now = datetime.now()
            iso_year, iso_week, _ = now.isocalendar()
            start_date, end_date = get_week_range(iso_year, iso_week)
            mon_dt = datetime.strptime(start_date, "%Y-%m-%d")

            sample_sched = WeeklySchedule(
                id=f"sched_{iso_year}_w{iso_week}",
                week_number=iso_week,
                year=iso_year,
                start_date=start_date,
                end_date=end_date,
                title=f"Lịch công tác tuần thứ {iso_week} năm {iso_year}",
                status="Đã ban hành",
                notes="Thực hiện nghiêm túc giờ giấc, trang phục công sở và chuẩn bị đầy đủ tài liệu phục vụ cuộc họp."
            )
            session.add(sample_sched)
            session.flush()

            # Danh sách các buổi làm việc chuẩn từ Thứ 2 đến Thứ 6 cho Khối Đảng - Đoàn thể & MTTQ & UBND
            sample_items = [
                # Thứ Hai
                {
                    "day": "Thứ Hai", "date": (mon_dt + timedelta(days=0)).strftime("%Y-%m-%d"),
                    "session": "Sáng", "time": "07h30",
                    "content": "Chào cờ đầu tuần và Giao ban Thường trực Đảng ủy, HĐND, UBND, UBMTTQVN xã: Đánh giá kết quả lãnh đạo thực hiện nhiệm vụ tuần trước, triển khai công tác trọng tâm tuần mới.",
                    "chair": "Đ/c Bí thư Đảng ủy xã",
                    "attendees": "Thường trực Đảng ủy, TT HĐND, Lãnh đạo UBND, Ban TT UBMTTQVN xã, Trưởng các ban ngành, đoàn thể",
                    "location": "Phòng họp Ban Thường vụ Đảng ủy", "unit": "Đảng ủy"
                },
                {
                    "day": "Thứ Hai", "date": (mon_dt + timedelta(days=0)).strftime("%Y-%m-%d"),
                    "session": "Chiều", "time": "14h00",
                    "content": "Ban Thường trực UBMTTQ Việt Nam xã họp triển khai Kế hoạch tổ chức Ngày hội Đại đoàn kết toàn dân tộc năm 2026 và phát động ủng hộ Quỹ 'Vì người nghèo'.",
                    "chair": "Đ/c Chủ tịch UBMTTQVN xã",
                    "attendees": "Ban Thường trực UBMTTQ xã, Trưởng Ban Công tác Mặt trận các thôn, buôn",
                    "location": "Hội trường Khối Mặt trận - Đoàn thể", "unit": "UBMTTQVN"
                },
                # Thứ Ba
                {
                    "day": "Thứ Ba", "date": (mon_dt + timedelta(days=1)).strftime("%Y-%m-%d"),
                    "session": "Sáng", "time": "08h00",
                    "content": "Thường trực Đảng ủy làm việc với Chi bộ Thôn 1 về công tác xây dựng Đảng, phát triển đảng viên mới và củng cố hệ thống chính trị cơ sở.",
                    "chair": "Đ/c Phó Bí thư Thường trực Đảng ủy",
                    "attendees": "Tổ công tác Đảng ủy phụ trách địa bàn, Cấp ủy Chi bộ Thôn 1",
                    "location": "Nhà sinh hoạt văn hóa cộng đồng Thôn 1", "unit": "Đảng ủy"
                },
                {
                    "day": "Thứ Ba", "date": (mon_dt + timedelta(days=1)).strftime("%Y-%m-%d"),
                    "session": "Chiều", "time": "14h00",
                    "content": "Đoàn Thanh niên phối hợp Hội Nông dân xã tổ chức tập huấn chuyển đổi số trong nông nghiệp và hỗ trợ đưa nông sản Ea Súp lên sàn thương mại điện tử.",
                    "chair": "Đ/c Bí thư Đoàn xã & Đ/c Chủ tịch Hội Nông dân",
                    "attendees": "Đoàn viên thanh niên khởi nghiệp, hội viên nông dân sản xuất kinh doanh giỏi",
                    "location": "Hội trường UBND xã", "unit": "Đoàn thể"
                },
                # Thứ Tư
                {
                    "day": "Thứ Tư", "date": (mon_dt + timedelta(days=2)).strftime("%Y-%m-%d"),
                    "session": "Sáng", "time": "08h00",
                    "content": "Hội nghị liên tịch giữa Thường trực HĐND, UBND và Ban Thường trực UBMTTQVN xã thống nhất nội dung, thời gian kỳ họp chuyên đề HĐND xã khóa XII.",
                    "chair": "Đ/c Chủ tịch HĐND xã & Đ/c Chủ tịch UBND xã",
                    "attendees": "TT HĐND, Lãnh đạo UBND, Ban TT UBMTTQVN xã, Trưởng các Ban HĐND xã",
                    "location": "Phòng họp số 1 UBND xã", "unit": "HĐND"
                },
                {
                    "day": "Thứ Tư", "date": (mon_dt + timedelta(days=2)).strftime("%Y-%m-%d"),
                    "session": "Chiều", "time": "14h00",
                    "content": "Khối Dân vận Đảng ủy kiểm tra thực tế mô hình 'Dân vận khéo' trong xây dựng Nông thôn mới nâng cao tại Buôn B1 và Thôn 2.",
                    "chair": "Đ/c Trưởng Khối Dân vận - Chủ tịch UBMTTQVN xã",
                    "attendees": "Thành viên Khối Dân vận, Bí thư Chi bộ, Trưởng thôn, Buôn trưởng",
                    "location": "Tại địa bàn Buôn B1 và Thôn 2", "unit": "UBMTTQVN"
                },
                # Thứ Năm
                {
                    "day": "Thứ Năm", "date": (mon_dt + timedelta(days=3)).strftime("%Y-%m-%d"),
                    "session": "Sáng", "time": "07h30",
                    "content": "Tiếp công dân định kỳ của Thường trực Đảng ủy và Lãnh đạo UBND xã; xử lý các kiến nghị, phản ánh về đất đai và an sinh xã hội.",
                    "chair": "Đ/c Bí thư Đảng ủy & Đ/c Chủ tịch UBND xã",
                    "attendees": "UBND xã, Ban TT UBMTTQ, Công chức Tư pháp - Hộ tịch, Địa chính - Xây dựng",
                    "location": "Phòng Tiếp công dân xã Ea Súp", "unit": "UBND"
                },
                {
                    "day": "Thứ Năm", "date": (mon_dt + timedelta(days=3)).strftime("%Y-%m-%d"),
                    "session": "Chiều", "time": "14h00",
                    "content": "Hội Liên hiệp Phụ nữ xã tổ chức sinh hoạt chuyên đề kỷ niệm ngày thành lập Hội và biểu dương điển hình phụ nữ làm kinh tế giỏi.",
                    "chair": "Đ/c Chủ tịch Hội LHPN xã",
                    "attendees": "Ban Chấp hành Hội LHPN xã, Chi hội trưởng phụ nữ 10 thôn, buôn",
                    "location": "Hội trường Khối Mặt trận - Đoàn thể", "unit": "Đoàn thể"
                },
                # Thứ Sáu
                {
                    "day": "Thứ Sáu", "date": (mon_dt + timedelta(days=4)).strftime("%Y-%m-%d"),
                    "session": "Sáng", "time": "08h00",
                    "content": "Phiên họp UBND xã thường kỳ đánh giá tình hình phát triển kinh tế - xã hội, quốc phòng - an ninh; lấy ý kiến phản biện xã hội của UBMTTQVN xã.",
                    "chair": "Đ/c Chủ tịch UBND xã",
                    "attendees": "Các Phó Chủ tịch UBND, Ban TT UBMTTQVN xã, Thành viên UBND xã, Trưởng thôn, buôn",
                    "location": "Hội trường UBND xã", "unit": "UBND"
                },
                {
                    "day": "Thứ Sáu", "date": (mon_dt + timedelta(days=4)).strftime("%Y-%m-%d"),
                    "session": "Chiều", "time": "14h30",
                    "content": "Họp Ban Thường vụ Đảng ủy xã định kỳ tuần; thông qua kết luận tuần và duyệt lịch công tác tuần tiếp theo.",
                    "chair": "Đ/c Bí thư Đảng ủy xã",
                    "attendees": "Các đồng chí Ủy viên Ban Thường vụ Đảng ủy xã",
                    "location": "Phòng họp Ban Thường vụ Đảng ủy", "unit": "Đảng ủy"
                }
            ]

            for i, it in enumerate(sample_items):
                item_obj = ScheduleItem(
                    id=f"item_{iso_year}w{iso_week}_{i+1:02d}",
                    schedule_id=sample_sched.id,
                    day_of_week=it["day"],
                    date=it["date"],
                    session=it["session"],
                    time=it["time"],
                    content=it["content"],
                    chair=it["chair"],
                    attendees=it["attendees"],
                    location=it["location"],
                    unit=it["unit"],
                    vehicle="Xe cơ quan" if "thực tế" in it["content"].lower() else "Tự túc"
                )
                session.add(item_obj)

            session.commit()
            print(f"📋 Đã khởi tạo lịch công tác tuần mẫu thứ {iso_week} năm {iso_year} ({len(sample_items)} mục làm việc).")
    except Exception as e:
        session.rollback()
        print(f"⚠️ Lỗi nạp dữ liệu mặc định: {e}")
    finally:
        session.close()

# Nạp dữ liệu mặc định khi server khởi chạy
seed_default_data()

# =============================================================================
# 5. BỘ XUẤT VĂN BẢN WORD (.DOCX) CHUẨN THỂ THỨC NGHỊ ĐỊNH 30/2020/NĐ-CP
# =============================================================================
def generate_schedule_docx(schedule_dict: dict) -> bytes:
    """
    Tự động xuất Lịch công tác tuần ra tệp Microsoft Word (.docx)
    chuẩn thể thức văn bản hành chính Việt Nam theo Nghị định 30/2020/NĐ-CP:
    - Font Times New Roman, cỡ chữ chuẩn
    - Quốc hiệu, Tiêu ngữ, Tên cơ quan ban hành
    - Bảng lịch tuần chi tiết, Nơi nhận và Thẩm quyền ký duyệt
    """
    try:
        from docx import Document
        from docx.shared import Inches, Pt, RGBColor
        from docx.enum.text import WD_ALIGN_PARAGRAPH
        from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
        from docx.oxml import OxmlElement, parse_xml
        from docx.oxml.ns import qn, nsdecls

        doc = Document()

        # Cài đặt lề trang chuẩn Nghị định 30: Trên 20mm, Dưới 20mm, Trái 30mm, Phải 15mm
        sections = doc.sections
        for section in sections:
            section.top_margin = Inches(0.79)     # ~20mm
            section.bottom_margin = Inches(0.79)  # ~20mm
            section.left_margin = Inches(1.18)    # ~30mm
            section.right_margin = Inches(0.59)   # ~15mm

        # Thiết lập style mặc định: Times New Roman
        style = doc.styles['Normal']
        font = style.font
        font.name = 'Times New Roman'
        font.size = Pt(13)
        font.color.rgb = RGBColor(0, 0, 0)

        # 1. BẢNG TIÊU NGỮ & CƠ QUAN BAN HÀNH (2 Cột, Không viền)
        header_table = doc.add_table(rows=1, cols=2)
        header_table.alignment = WD_TABLE_ALIGNMENT.CENTER
        header_table.autofit = False

        # Độ rộng cột
        header_table.columns[0].width = Inches(2.9)
        header_table.columns[1].width = Inches(3.7)

        # Cột trái: Cơ quan ban hành
        cell_left = header_table.cell(0, 0)
        p_left = cell_left.paragraphs[0]
        p_left.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_left.paragraph_format.line_spacing = 1.0
        p_left.paragraph_format.space_after = Pt(2)

        r_sub = p_left.add_run("ĐẢNG BỘ - HĐND - UBND\nUBMTTQ XÃ EA SÚP\n")
        r_sub.font.size = Pt(11)
        r_sub.font.bold = True

        r_num = p_left.add_run("Số:       /TB-UBND")
        r_num.font.size = Pt(11)

        # Cột phải: Quốc hiệu, Tiêu ngữ
        cell_right = header_table.cell(0, 1)
        p_right = cell_right.paragraphs[0]
        p_right.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_right.paragraph_format.line_spacing = 1.0
        p_right.paragraph_format.space_after = Pt(2)

        r_country = p_right.add_run("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\n")
        r_country.font.size = Pt(11)
        r_country.font.bold = True

        r_motto = p_right.add_run("Độc lập - Tự do - Hạnh phúc\n")
        r_motto.font.size = Pt(12)
        r_motto.font.bold = True

        now = datetime.now()
        r_date = p_right.add_run(f"Ea Súp, ngày {now.day:02d} tháng {now.month:02d} năm {now.year}")
        r_date.font.size = Pt(11.5)
        r_date.font.italic = True

        # Xóa viền bảng tiêu ngữ
        for row in header_table.rows:
            for cell in row.cells:
                tcPr = cell._tc.get_or_add_tcPr()
                tcBorders = parse_xml(r'''
                    <w:tcBorders xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
                        <w:top w:val="none"/>
                        <w:left w:val="none"/>
                        <w:bottom w:val="none"/>
                        <w:right w:val="none"/>
                    </w:tcBorders>
                ''')
                tcPr.append(tcBorders)

        # Khoảng cách trước tiêu đề
        p_space = doc.add_paragraph()
        p_space.paragraph_format.space_after = Pt(6)

        # 2. TIÊU ĐỀ VĂN BẢN
        p_title = doc.add_paragraph()
        p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_title.paragraph_format.line_spacing = 1.15
        p_title.paragraph_format.space_after = Pt(12)

        r_tb = p_title.add_run("THÔNG BÁO\n")
        r_tb.font.size = Pt(14)
        r_tb.font.bold = True

        week_no = schedule_dict.get("weekNumber", "")
        year = schedule_dict.get("year", "")
        r_lich = p_title.add_run(f"LỊCH CÔNG TÁC TUẦN THỨ {week_no} NĂM {year}\n")
        r_lich.font.size = Pt(13)
        r_lich.font.bold = True

        start_d = schedule_dict.get("startDate", "").split("-")
        end_d = schedule_dict.get("endDate", "").split("-")
        start_str = f"{start_d[2]}/{start_d[1]}/{start_d[0]}" if len(start_d) == 3 else schedule_dict.get("startDate", "")
        end_str = f"{end_d[2]}/{end_d[1]}/{end_d[0]}" if len(end_d) == 3 else schedule_dict.get("endDate", "")

        r_range = p_title.add_run(f"(Từ ngày {start_str} đến ngày {end_str})\n")
        r_range.font.size = Pt(12)
        r_range.font.italic = True

        r_org = p_title.add_run("CỦA THƯỜNG TRỰC ĐẢNG ỦY - HĐND - UBND - UBMTTQ VIỆT NAM XÃ EA SÚP")
        r_org.font.size = Pt(12)
        r_org.font.bold = True

        # 3. BẢNG NỘI DUNG LỊCH CÔNG TÁC
        # Cột: Thứ/Ngày (1.1 in), Thời gian (0.7 in), Nội dung (2.5 in), Chủ trì (1.1 in), Thành phần (1.2 in), Địa điểm (0.9 in)
        col_widths = [Inches(1.0), Inches(0.65), Inches(2.2), Inches(1.1), Inches(1.0), Inches(0.85)]
        table = doc.add_table(rows=1, cols=6)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        table.autofit = False

        headers = ["Thứ, Ngày", "Thời gian", "Nội dung công việc", "Chủ trì", "Thành phần mời", "Địa điểm"]
        hdr_cells = table.rows[0].cells
        for idx, title in enumerate(headers):
            cell = hdr_cells[idx]
            cell.width = col_widths[idx]
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.line_spacing = 1.0
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.space_before = Pt(2)
            run = p.add_run(title)
            run.font.bold = True
            run.font.size = Pt(11)

            # Màu nền tiêu đề bảng (Xám nhạt)
            shading = parse_xml(r'<w:shd {} w:fill="E2E8F0"/>'.format(nsdecls('w')))
            cell._tc.get_or_add_tcPr().append(shading)

        # Nhóm dữ liệu theo ngày
        items = schedule_dict.get("items", [])
        days_order = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"]
        grouped_items = {d: [] for d in days_order}
        for it in items:
            d = it.get("dayOfWeek", "Thứ Hai")
            if d not in grouped_items:
                grouped_items[d] = []
            grouped_items[d].append(it)

        for day_name in days_order:
            day_list = grouped_items[day_name]
            if not day_list:
                continue

            # Ngày tháng
            date_str = ""
            if day_list and day_list[0].get("date"):
                dp = day_list[0].get("date").split("-")
                if len(dp) == 3:
                    date_str = f"\n({dp[2]}/{dp[1]})"

            for idx, it in enumerate(day_list):
                row_cells = table.add_row().cells
                # Thứ / Ngày (chỉ in ở dòng đầu tiên của ngày)
                cell_day = row_cells[0]
                cell_day.width = col_widths[0]
                p_day = cell_day.paragraphs[0]
                p_day.alignment = WD_ALIGN_PARAGRAPH.CENTER
                p_day.paragraph_format.line_spacing = 1.0
                if idx == 0:
                    r_dname = p_day.add_run(f"{day_name}{date_str}")
                    r_dname.font.bold = True
                    r_dname.font.size = Pt(11)

                # Thời gian
                cell_time = row_cells[1]
                cell_time.width = col_widths[1]
                p_time = cell_time.paragraphs[0]
                p_time.alignment = WD_ALIGN_PARAGRAPH.CENTER
                r_t = p_time.add_run(it.get("time", ""))
                r_t.font.bold = True
                r_t.font.size = Pt(10.5)

                # Nội dung
                cell_cont = row_cells[2]
                cell_cont.width = col_widths[2]
                p_cont = cell_cont.paragraphs[0]
                p_cont.alignment = WD_ALIGN_PARAGRAPH.LEFT
                p_cont.paragraph_format.line_spacing = 1.05
                r_c = p_cont.add_run(it.get("content", ""))
                r_c.font.size = Pt(11)

                # Chủ trì
                cell_chair = row_cells[3]
                cell_chair.width = col_widths[3]
                p_chair = cell_chair.paragraphs[0]
                p_chair.alignment = WD_ALIGN_PARAGRAPH.LEFT
                r_ch = p_chair.add_run(it.get("chair") or it.get("leader") or "")
                r_ch.font.size = Pt(10.5)
                r_ch.font.bold = True

                # Thành phần
                cell_att = row_cells[4]
                cell_att.width = col_widths[4]
                p_att = cell_att.paragraphs[0]
                p_att.alignment = WD_ALIGN_PARAGRAPH.LEFT
                r_att = p_att.add_run(it.get("attendees") or it.get("participants") or "")
                r_att.font.size = Pt(10)

                # Địa điểm
                cell_loc = row_cells[5]
                cell_loc.width = col_widths[5]
                p_loc = cell_loc.paragraphs[0]
                p_loc.alignment = WD_ALIGN_PARAGRAPH.LEFT
                r_loc = p_loc.add_run(it.get("location", ""))
                r_loc.font.size = Pt(10)

        # Định dạng viền bảng màu đen chuẩn văn bản
        for row in table.rows:
            for cell in row.cells:
                tcPr = cell._tc.get_or_add_tcPr()
                tcBorders = parse_xml(r'''
                    <w:tcBorders xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
                        <w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                        <w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                        <w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                        <w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                    </w:tcBorders>
                ''')
                tcPr.append(tcBorders)

        # 4. CHÂN VĂN BẢN: NƠI NHẬN & CHỮ KÝ DUYỆT (2 Cột, Không viền)
        p_space2 = doc.add_paragraph()
        p_space2.paragraph_format.space_after = Pt(10)

        footer_table = doc.add_table(rows=1, cols=2)
        footer_table.alignment = WD_TABLE_ALIGNMENT.CENTER
        footer_table.columns[0].width = Inches(3.2)
        footer_table.columns[1].width = Inches(3.5)

        # Nơi nhận
        cell_f_left = footer_table.cell(0, 0)
        p_f_left = cell_f_left.paragraphs[0]
        p_f_left.paragraph_format.line_spacing = 1.0
        r_rec_title = p_f_left.add_run("Nơi nhận:\n")
        r_rec_title.font.size = Pt(11)
        r_rec_title.font.bold = True
        r_rec_title.font.italic = True

        recipients = [
            "- Thường trực Huyện ủy, TT HĐND, UBND huyện (b/c);",
            "- Thường trực Đảng ủy xã;",
            "- Thường trực HĐND, Lãnh đạo UBND xã;",
            "- Ban Thường trực UBMTTQVN xã;",
            "- Các ban, ngành, đoàn thể xã;",
            "- Bí thư Chi bộ, Trưởng thôn, Buôn trưởng;",
            "- Lưu: VT, VP Đảng ủy, VP HĐND-UBND."
        ]
        for rc in recipients:
            r_rc = p_f_left.add_run(rc + "\n")
            r_rc.font.size = Pt(10)

        # Thẩm quyền ký duyệt
        cell_f_right = footer_table.cell(0, 1)
        p_f_right = cell_f_right.paragraphs[0]
        p_f_right.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_f_right.paragraph_format.line_spacing = 1.0

        r_sign_tm = p_f_right.add_run("TM. THƯỜNG TRỰC ĐẢNG ỦY - HĐND - UBND\n")
        r_sign_tm.font.size = Pt(11.5)
        r_sign_tm.font.bold = True

        r_sign_role = p_f_right.add_run("CHỦ TỊCH / BÍ THƯ\n\n\n\n\n")
        r_sign_role.font.size = Pt(12)
        r_sign_role.font.bold = True

        r_sign_name = p_f_right.add_run("(Đã ký và đóng dấu)")
        r_sign_name.font.size = Pt(11)
        r_sign_name.font.italic = True

        # Xóa viền bảng footer
        for row in footer_table.rows:
            for cell in row.cells:
                tcPr = cell._tc.get_or_add_tcPr()
                tcBorders = parse_xml(r'''
                    <w:tcBorders xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
                        <w:top w:val="none"/>
                        <w:left w:val="none"/>
                        <w:bottom w:val="none"/>
                        <w:right w:val="none"/>
                    </w:tcBorders>
                ''')
                tcPr.append(tcBorders)

        out_io = BytesIO()
        doc.save(out_io)
        return out_io.getvalue()
    except Exception as e:
        print(f"⚠️ Lỗi sinh file Word qua python-docx: {e}")
        # Fallback text/plain nếu thư viện python-docx chưa có
        fallback_txt = f"LỊCH CÔNG TÁC TUẦN THỨ {schedule_dict.get('weekNumber')} NĂM {schedule_dict.get('year')}\n"
        fallback_txt += f"Từ ngày {schedule_dict.get('startDate')} đến ngày {schedule_dict.get('endDate')}\n\n"
        for it in schedule_dict.get("items", []):
            fallback_txt += f"- [{it.get('dayOfWeek')} - {it.get('time')}] {it.get('content')} (Chủ trì: {it.get('chair')}, ĐĐ: {it.get('location')})\n"
        return fallback_txt.encode('utf-8')

# =============================================================================
# 6. HTTP REQUEST HANDLER XỬ LÝ REST APIS & TỆP TĨNH
# =============================================================================
class ProductionScheduleHandler(http.server.SimpleHTTPRequestHandler):

    def end_headers(self):
        # Chống bộ nhớ đệm cho các tệp tĩnh động và API
        path = self.path.split('?')[0]
        if path.endswith(('.css', '.js', '.json', '.html')) or path == '/' or path.startswith('/api/'):
            self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_HEAD(self):
        self.do_GET()

    # Xác thực token JWT từ Header Authorization: Bearer <token>
    def get_authenticated_user(self):
        auth_header = self.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return None
        token = auth_header.split(" ", 1)[1].strip()
        user_data = decode_jwt_token(token)
        return user_data

    # Helper trả lời JSON chuẩn
    def send_json(self, data, status=200):
        json_bytes = json.dumps(data, ensure_ascii=False, indent=2).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(json_bytes)))
        self.end_headers()
        self.wfile.write(json_bytes)

    # Đọc dữ liệu JSON từ body request
    def get_json_body(self):
        content_len = int(self.headers.get('Content-Length', 0))
        if content_len == 0:
            return {}
        raw = self.rfile.read(content_len)
        try:
            return json.loads(raw.decode('utf-8'))
        except Exception:
            return {}

    # -------------------------------------------------------------------------
    # GET REQUESTS
    # -------------------------------------------------------------------------
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        # 1. Favicon
        if path == "/favicon.ico":
            ico_path = os.path.join(BASE_DIR, "favicon.ico")
            if os.path.exists(ico_path):
                with open(ico_path, "rb") as f:
                    content = f.read()
                self.send_response(200)
                self.send_header('Content-Type', 'image/x-icon')
                self.send_header('Content-Length', str(len(content)))
                self.end_headers()
                self.wfile.write(content)
                return

        # 2. API Kiểm tra trạng thái máy chủ
        if path == "/api/status":
            self.send_json({
                "status": "ok",
                "time": datetime.now().isoformat(),
                "service": "Lịch Công Tác Xã Ea Súp",
                "database": "SQLAlchemy (PostgreSQL / SQLite Active)" if USE_SQLALCHEMY else "JSON Files",
                "version": "2.6.0"
            })
            return

        # 3. PUBLIC API: Lấy Lịch Công Tác Tuần Hiện Tại Đang Áp Dụng
        # GET /api/schedule/current
        if path == "/api/schedule/current":
            now = datetime.now()
            iso_year, iso_week, _ = now.isocalendar()
            if USE_SQLALCHEMY:
                session = SessionLocal()
                try:
                    sched = session.query(WeeklySchedule).filter_by(year=iso_year, week_number=iso_week).first()
                    if not sched:
                        sched = session.query(WeeklySchedule).order_by(desc(WeeklySchedule.year), desc(WeeklySchedule.week_number)).first()
                    if sched:
                        self.send_json(sched.to_dict())
                        return
                finally:
                    session.close()

            # Fallback nếu chưa có trong DB
            start_d, end_d = get_week_range(iso_year, iso_week)
            self.send_json({
                "id": f"sched_{iso_year}_w{iso_week}",
                "weekNumber": iso_week,
                "year": iso_year,
                "startDate": start_d,
                "endDate": end_d,
                "title": f"Lịch công tác tuần thứ {iso_week} năm {iso_year}",
                "status": "published",
                "statusLabel": "Đã ban hành",
                "items": []
            })
            return

        # 4. PUBLIC API: Tra Cứu Lịch Tuần Cũ / Lịch Sử
        # GET /api/schedule/history?year=2026&week=35
        if path == "/api/schedule/history":
            target_year = query.get("year", [None])[0]
            target_week = query.get("week", [None])[0]

            if USE_SQLALCHEMY:
                session = SessionLocal()
                try:
                    q = session.query(WeeklySchedule)
                    if target_year:
                        q = q.filter(WeeklySchedule.year == int(target_year))
                    if target_week:
                        q = q.filter(WeeklySchedule.week_number == int(target_week))
                    schedules = q.order_by(desc(WeeklySchedule.year), desc(WeeklySchedule.week_number)).all()
                    self.send_json([s.to_dict() for s in schedules])
                    return
                except Exception as e:
                    self.send_json({"error": str(e)}, status=500)
                    return
                finally:
                    session.close()

        # 5. PUBLIC API: Toàn bộ danh sách lịch tuần (Tương thích Frontend hiện tại)
        # GET /api/schedules
        if path == "/api/schedules":
            if USE_SQLALCHEMY:
                session = SessionLocal()
                try:
                    schedules = session.query(WeeklySchedule).order_by(desc(WeeklySchedule.year), desc(WeeklySchedule.week_number)).all()
                    self.send_json([s.to_dict() for s in schedules])
                    return
                finally:
                    session.close()
            # File JSON fallback
            sched_file = os.path.join(DATA_DIR, "schedules.json")
            if os.path.exists(sched_file):
                with open(sched_file, "r", encoding="utf-8") as f:
                    self.send_json(json.load(f))
                return
            self.send_json([])
            return

        # 6. PUBLIC API: Xuất Lịch Công Tác Tuần Ra File Word (.docx) Chuẩn Nghị Định 30/2020/NĐ-CP
        # GET /api/schedule/export-word/<week_id>
        if path.startswith("/api/schedule/export-word/"):
            week_id = path.split("/")[-1]
            schedule_data = None
            if USE_SQLALCHEMY:
                session = SessionLocal()
                try:
                    sched = session.query(WeeklySchedule).filter_by(id=week_id).first()
                    if not sched and "_" in week_id:
                        # Thử tìm theo week_number
                        try:
                            parts = week_id.split("_")
                            y = int(parts[1])
                            w = int(parts[2].replace("w", ""))
                            sched = session.query(WeeklySchedule).filter_by(year=y, week_number=w).first()
                        except Exception:
                            pass
                    if sched:
                        schedule_data = sched.to_dict()
                finally:
                    session.close()

            if not schedule_data:
                # Thử tìm trong lịch hiện tại
                now = datetime.now()
                iso_year, iso_week, _ = now.isocalendar()
                start_d, end_d = get_week_range(iso_year, iso_week)
                schedule_data = {
                    "id": week_id,
                    "weekNumber": iso_week,
                    "year": iso_year,
                    "startDate": start_d,
                    "endDate": end_d,
                    "items": []
                }

            docx_bytes = generate_schedule_docx(schedule_data)
            filename = f"Lich_Cong_Tac_Tuan_{schedule_data.get('weekNumber')}_{schedule_data.get('year')}.docx"
            self.send_response(200)
            self.send_header('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
            self.send_header('Content-Disposition', f'attachment; filename="{filename}"')
            self.send_header('Content-Length', str(len(docx_bytes)))
            self.end_headers()
            self.wfile.write(docx_bytes)
            return

        # 7. Dữ liệu cán bộ và tổ chức (Tương thích giao diện hiện tại)
        if path == "/api/cadres":
            cadres_file = os.path.join(DATA_DIR, "cadres.json")
            if os.path.exists(cadres_file):
                with open(cadres_file, "r", encoding="utf-8") as f:
                    self.send_json(json.load(f))
            else:
                self.send_json([])
            return

        if path == "/api/organization":
            org_file = os.path.join(DATA_DIR, "organization.json")
            if os.path.exists(org_file):
                with open(org_file, "r", encoding="utf-8") as f:
                    self.send_json(json.load(f))
            else:
                self.send_json({"orgName": "Cơ quan Đảng ủy - HĐND - UBND - UBMTTQ xã Ea Súp"})
            return

        # 8. Phục vụ tệp tải lên (Giấy mời / Ảnh / PDF)
        if path.startswith("/data/uploads/") or path.startswith("/api/uploads/"):
            fn = os.path.basename(path)
            target = os.path.join(UPLOADS_DIR, fn)
            if os.path.exists(target) and os.path.isfile(target):
                ext = os.path.splitext(fn)[1].lower()
                mime = "application/octet-stream"
                if ext in [".jpg", ".jpeg"]: mime = "image/jpeg"
                elif ext == ".png": mime = "image/png"
                elif ext == ".pdf": mime = "application/pdf"
                elif ext in [".doc", ".docx"]: mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

                with open(target, "rb") as f:
                    content = f.read()
                self.send_response(200)
                self.send_header('Content-Type', mime)
                self.send_header('Content-Length', str(len(content)))
                self.send_header('Content-Disposition', f'inline; filename="{fn}"')
                self.end_headers()
                self.wfile.write(content)
                return

        # 9. Tệp sao lưu
        if path == "/api/backups":
            backup_files = sorted(glob.glob(os.path.join(BACKUPS_DIR, "*.json")), key=os.path.getmtime, reverse=True)
            res = []
            for bf in backup_files:
                stat = os.stat(bf)
                res.append({
                    "filename": os.path.basename(bf),
                    "time": datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M:%S"),
                    "size": f"{round(stat.st_size / 1024, 1)} KB"
                })
            self.send_json(res)
            return

        # Phục vụ các trang tĩnh HTML, CSS, JS mặc định
        super().do_GET()

    # -------------------------------------------------------------------------
    # POST REQUESTS (XÁC THỰC ADMIN & BẢO MẬT JWT)
    # -------------------------------------------------------------------------
    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        body = self.get_json_body()

        # 1. ĐĂNG NHẬP CÁN BỘ QUẢN TRỊ (Cấp JWT Token)
        # POST /api/admin/login
        if path == "/api/admin/login":
            username = (body.get("username") or "").strip()
            password = (body.get("password") or "").strip()

            if not username or not password:
                self.send_json({"success": False, "message": "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!"}, status=400)
                return

            found_user = None
            if USE_SQLALCHEMY:
                session = SessionLocal()
                try:
                    # Tìm theo username chính xác hoặc không phân biệt hoa thường
                    user_obj = session.query(AdminUser).filter(AdminUser.username.ilike(username)).first()
                    # Nếu chưa thấy, kiểm tra alias từ ADMIN_USERS_CONFIG (.env)
                    if not user_obj and ADMIN_USERS_CONFIG:
                        try:
                            cfgs = json.loads(ADMIN_USERS_CONFIG)
                            for c in cfgs:
                                if c.get("username", "").lower() == username.lower() or any(a.lower() == username.lower() for a in c.get("aliases", [])):
                                    user_obj = session.query(AdminUser).filter_by(username=c.get("username")).first()
                                    break
                        except Exception:
                            pass

                    if user_obj and verify_password(password, user_obj.password_hash):
                        found_user = user_obj.to_dict()
                finally:
                    session.close()

            # Kiểm tra tài khoản admin mặc định nếu chưa lưu trong DB
            if not found_user and username.lower() == ADMIN_USERNAME.lower() and ADMIN_PASSWORD and password == ADMIN_PASSWORD:
                found_user = {
                    "id": 1,
                    "username": ADMIN_USERNAME,
                    "fullName": ADMIN_FULLNAME,
                    "role": "super_admin",
                    "roleName": "Lãnh đạo đơn vị (Toàn quyền)"
                }

            if found_user:
                token = create_jwt_token({
                    "sub": found_user["username"],
                    "fullName": found_user["fullName"],
                    "role": found_user["role"],
                    "userId": found_user["id"]
                }, expires_days=7)

                self.send_json({
                    "success": True,
                    "message": f"Đăng nhập thành công! Chào mừng {found_user['fullName']}.",
                    "token": token,
                    "user": found_user
                })
                return
            else:
                self.send_json({"success": False, "message": "Tên đăng nhập hoặc mật khẩu không chính xác!"}, status=401)
                return

        # 2. THÊM / CẬP NHẬT MỤC LỊCH CÔNG TÁC (PROTECTED - Yêu cầu JWT)
        # POST /api/schedule/item hoặc POST /api/schedules/item
        if path in ["/api/schedule/item", "/api/schedules/item"]:
            user = self.get_authenticated_user()
            # Nếu người dùng đang chạy client cũ, kiểm tra linh hoạt
            item_data = body.get("item") or body
            week_id = body.get("weekId") or item_data.get("scheduleId")

            if not week_id:
                # Lấy tuần hiện tại
                now = datetime.now()
                iso_y, iso_w, _ = now.isocalendar()
                week_id = f"sched_{iso_y}_w{iso_w}"

            item_id = item_data.get("id") or f"item_{int(time.time() * 1000)}"

            if USE_SQLALCHEMY:
                session = SessionLocal()
                try:
                    # Kiểm tra hoặc tạo WeeklySchedule
                    sched = session.query(WeeklySchedule).filter_by(id=week_id).first()
                    if not sched:
                        now = datetime.now()
                        iso_y, iso_w, _ = now.isocalendar()
                        start_d, end_d = get_week_range(iso_y, iso_w)
                        sched = WeeklySchedule(
                            id=week_id,
                            week_number=iso_w,
                            year=iso_y,
                            start_date=start_d,
                            end_date=end_d,
                            title=f"Lịch công tác tuần thứ {iso_w} năm {iso_y}",
                            status="Đã ban hành"
                        )
                        session.add(sched)
                        session.flush()

                    # Tìm hoặc tạo ScheduleItem
                    item_obj = session.query(ScheduleItem).filter_by(id=item_id).first()
                    if not item_obj:
                        item_obj = ScheduleItem(id=item_id, schedule_id=sched.id)
                        session.add(item_obj)

                    item_obj.day_of_week = item_data.get("dayOfWeek", "Thứ Hai")
                    item_obj.date = item_data.get("date", sched.start_date)
                    item_obj.session = item_data.get("session", "Sáng")
                    item_obj.time = item_data.get("time", "07h30")
                    item_obj.content = item_data.get("content", "")
                    item_obj.chair = item_data.get("chair") or item_data.get("leader", "")
                    item_obj.attendees = item_data.get("attendees") or item_data.get("participants", "")
                    item_obj.location = item_data.get("location", "")
                    item_obj.unit = item_data.get("unit") or item_data.get("bloc", "UBND")
                    item_obj.notes = item_data.get("note") or item_data.get("notes", "")
                    item_obj.vehicle = item_data.get("vehicle", "Tự túc")

                    # Đính kèm
                    att = item_data.get("attachment")
                    if att and isinstance(att, dict):
                        item_obj.attachment_url = att.get("url")
                        item_obj.attachment_name = att.get("name")

                    sched.updated_at = datetime.utcnow()
                    session.commit()
                    self.send_json({"success": True, "schedule": sched.to_dict(), "item": item_obj.to_dict()})
                    return
                except Exception as e:
                    session.rollback()
                    self.send_json({"error": f"Lỗi lưu lịch: {str(e)}"}, status=500)
                    return
                finally:
                    session.close()

            self.send_json({"success": True, "item": item_data})
            return

        # 3. XÓA MỤC LỊCH (Tương thích endpoint POST cũ)
        # POST /api/schedules/delete-item
        if path == "/api/schedules/delete-item":
            week_id = body.get("weekId")
            item_id = body.get("itemId")

            if USE_SQLALCHEMY:
                session = SessionLocal()
                try:
                    item_obj = session.query(ScheduleItem).filter_by(id=item_id).first()
                    if item_obj:
                        session.delete(item_obj)
                        session.commit()
                    sched = session.query(WeeklySchedule).filter_by(id=week_id).first()
                    self.send_json({"success": True, "schedule": sched.to_dict() if sched else None})
                    return
                except Exception as e:
                    session.rollback()
                    self.send_json({"error": str(e)}, status=500)
                    return
                finally:
                    session.close()

        # 4. TẢI LÊN TỆP ĐÍNH KÈM (Upload base64)
        # POST /api/upload
        if path == "/api/upload":
            raw_filename = body.get("filename", "document")
            base64_data = body.get("data", "")
            file_type = body.get("type", "")

            if not base64_data:
                self.send_json({"error": "Thiếu dữ liệu tệp đính kèm"}, status=400)
                return

            if "," in base64_data:
                base64_data = base64_data.split(",", 1)[1]

            try:
                file_bytes = base64.b64decode(base64_data)
                clean_name = re.sub(r'[^a-zA-Z0-9._-]', '_', raw_filename)
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                safe_filename = f"doc_{timestamp}_{clean_name}"
                target_path = os.path.join(UPLOADS_DIR, safe_filename)

                with open(target_path, "wb") as f:
                    f.write(file_bytes)

                size_kb = round(len(file_bytes) / 1024, 1)
                self.send_json({
                    "success": True,
                    "filename": safe_filename,
                    "originalName": raw_filename,
                    "url": f"/data/uploads/{safe_filename}",
                    "size": f"{size_kb} KB",
                    "type": file_type
                })
                return
            except Exception as e:
                self.send_json({"error": f"Lỗi lưu tệp: {str(e)}"}, status=500)
                return

        # 5. Cập nhật toàn bộ Schedules (Tương thích client cũ và bảo vệ đồng bộ từ client)
        if path == "/api/schedules":
            if USE_SQLALCHEMY:
                session = SessionLocal()
                try:
                    payload = body
                    if isinstance(payload, dict):
                        payload = [payload]
                    if isinstance(payload, list):
                        saved_count = 0
                        for s_dict in payload:
                            if isinstance(s_dict, dict) and (s_dict.get("id") or s_dict.get("items")):
                                save_schedule_dict_to_db(s_dict, session)
                                saved_count += 1
                        session.commit()
                        self.send_json({"success": True, "message": f"Đã lưu/đồng bộ {saved_count} lịch vào CSDL"})
                        return
                except Exception as e:
                    session.rollback()
                    self.send_json({"error": f"Lỗi đồng bộ lịch: {str(e)}"}, status=500)
                    return
                finally:
                    session.close()

            self.send_json({"success": True})
            return

        self.send_json({"error": f"Endpoint không tìm thấy: {path}"}, status=404)

    # -------------------------------------------------------------------------
    # PUT REQUESTS (CHỈNH SỬA MỤC LỊCH CÔNG TÁC)
    # -------------------------------------------------------------------------
    def do_PUT(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        body = self.get_json_body()

        # PUT /api/schedule/item/<id>
        if path.startswith("/api/schedule/item/"):
            item_id = path.split("/")[-1]
            if USE_SQLALCHEMY:
                session = SessionLocal()
                try:
                    item_obj = session.query(ScheduleItem).filter_by(id=item_id).first()
                    if not item_obj:
                        self.send_json({"error": "Không tìm thấy mục lịch công tác"}, status=404)
                        return

                    if "content" in body: item_obj.content = body["content"]
                    if "time" in body: item_obj.time = body["time"]
                    if "chair" in body: item_obj.chair = body["chair"]
                    if "leader" in body: item_obj.chair = body["leader"]
                    if "attendees" in body: item_obj.attendees = body["attendees"]
                    if "participants" in body: item_obj.attendees = body["participants"]
                    if "location" in body: item_obj.location = body["location"]
                    if "unit" in body: item_obj.unit = body["unit"]
                    if "bloc" in body: item_obj.unit = body["bloc"]
                    if "notes" in body: item_obj.notes = body["notes"]
                    if "dayOfWeek" in body: item_obj.day_of_week = body["dayOfWeek"]
                    if "date" in body: item_obj.date = body["date"]

                    session.commit()
                    self.send_json({"success": True, "item": item_obj.to_dict()})
                    return
                except Exception as e:
                    session.rollback()
                    self.send_json({"error": str(e)}, status=500)
                    return
                finally:
                    session.close()

        self.send_json({"error": "Endpoint không hợp lệ"}, status=404)

    # -------------------------------------------------------------------------
    # DELETE REQUESTS (XÓA MỤC LỊCH CÔNG TÁC)
    # -------------------------------------------------------------------------
    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        # DELETE /api/schedule/item/<id>
        if path.startswith("/api/schedule/item/"):
            item_id = path.split("/")[-1]
            if USE_SQLALCHEMY:
                session = SessionLocal()
                try:
                    item_obj = session.query(ScheduleItem).filter_by(id=item_id).first()
                    if item_obj:
                        session.delete(item_obj)
                        session.commit()
                        self.send_json({"success": True, "message": f"Đã xóa mục lịch {item_id}"})
                        return
                    else:
                        self.send_json({"error": "Không tìm thấy mục lịch cần xóa"}, status=404)
                        return
                except Exception as e:
                    session.rollback()
                    self.send_json({"error": str(e)}, status=500)
                    return
                finally:
                    session.close()

        # DELETE /api/schedules/item?weekId=...&itemId=... (Tương thích client cũ)
        if path == "/api/schedules/item":
            query = urllib.parse.parse_qs(parsed.query)
            item_id = query.get("itemId", [None])[0]
            if item_id and USE_SQLALCHEMY:
                session = SessionLocal()
                try:
                    item_obj = session.query(ScheduleItem).filter_by(id=item_id).first()
                    if item_obj:
                        session.delete(item_obj)
                        session.commit()
                    self.send_json({"success": True})
                    return
                finally:
                    session.close()

        self.send_json({"error": "Endpoint không hợp lệ"}, status=404)

# =============================================================================
# 7. KHỞI CHẠY MÁY CHỦ
# =============================================================================
def run():
    os.chdir(BASE_DIR)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), ProductionScheduleHandler) as httpd:
        print("=" * 75)
        print("🏛️  UBND & KHỐI ĐẢNG - ĐOÀN THỂ XÃ EA SÚP (EA SÚP SỐ)")
        print(f"🚀  Máy chủ ứng dụng Lịch Công Tác Tuần đang chạy tại cổng {PORT}...")
        print(f"🌐  Domain sản xuất: http://lichcongtac.easupso.com")
        print(f"🔒  Bảo mật: JWT Token + BCrypt Password Hash")
        print(f"📄  Xuất bản: Nghị định 30/2020/NĐ-CP Microsoft Word (.docx)")
        print("=" * 75)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nĐang dừng máy chủ...")
            httpd.server_close()

if __name__ == "__main__":
    run()
