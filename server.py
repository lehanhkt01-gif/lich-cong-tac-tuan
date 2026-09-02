#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HỆ THỐNG MÁY CHỦ DỮ LIỆU & ĐIỀU HÀNH LỊCH CÔNG TÁC TUẦN UBND XÃ EA SÚP
Tích hợp: Static File Server + REST API Dữ liệu vĩnh viễn + Bộ Sao lưu & Khôi phục (Backup & Restore Engine)
"""

import http.server
import socketserver
import json
import os
import mimetypes
import urllib.parse
import threading
import shutil
import glob
from datetime import datetime, timedelta

PORT = int(os.environ.get("PORT", 80))
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
BACKUPS_DIR = os.path.join(DATA_DIR, "backups")
UPLOADS_DIR = os.path.join(DATA_DIR, "uploads")

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(BACKUPS_DIR, exist_ok=True)
os.makedirs(UPLOADS_DIR, exist_ok=True)

SCHEDULES_FILE = os.path.join(DATA_DIR, "schedules.json")
CADRES_FILE = os.path.join(DATA_DIR, "cadres.json")
AUDIT_LOGS_FILE = os.path.join(DATA_DIR, "audit_logs.json")
ORGANIZATION_FILE = os.path.join(DATA_DIR, "organization.json")

# Khóa luồng toàn cục (Thread Lock) đảm bảo chống xung đột dữ liệu đồng thời (Race condition)
DATA_LOCK = threading.Lock()

def create_backup_snapshot(source_file, tag="auto"):
    """Tạo bản sao lưu snapshot tự động có dấu thời gian"""
    if not os.path.exists(source_file) or os.path.getsize(source_file) == 0:
        return None
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")[:19]
        base_name = os.path.splitext(os.path.basename(source_file))[0]
        backup_filename = f"{base_name}_{timestamp}_{tag}.json"
        backup_path = os.path.join(BACKUPS_DIR, backup_filename)
        shutil.copy2(source_file, backup_path)

        # Giữ tối đa 50 bản sao lưu gần nhất, xóa bản cũ hơn
        all_backups = sorted(glob.glob(os.path.join(BACKUPS_DIR, f"{base_name}_*.json")), key=os.path.getmtime)
        if len(all_backups) > 50:
            for old_file in all_backups[:-50]:
                try:
                    os.remove(old_file)
                except Exception:
                    pass
        return backup_filename
    except Exception as e:
        print(f"Lỗi tạo bản sao lưu snapshot: {e}")
        return None

def read_json_file(file_path, default=None):
    with DATA_LOCK:
        if not os.path.exists(file_path):
            return default if default is not None else []
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error reading {file_path}: {e}")
            return default if default is not None else []

def write_json_file(file_path, data, backup=True):
    with DATA_LOCK:
        try:
            # Tự động tạo bản sao lưu trước khi ghi đè nếu tệp đang có dữ liệu
            if backup and os.path.exists(file_path) and os.path.getsize(file_path) > 10:
                create_backup_snapshot(file_path, "auto")

            # Ghi nguyên tử (Atomic Write) qua tệp tạm rồi đổi tên để không bao giờ bị hỏng tệp
            tmp_file = f"{file_path}.tmp_{os.getpid()}_{datetime.now().timestamp()}"
            with open(tmp_file, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            os.replace(tmp_file, file_path)
            return True
        except Exception as e:
            print(f"Error writing {file_path}: {e}")
            return False

# Khởi tạo tệp dữ liệu mặc định nếu chưa có
def init_data_files():
    now = datetime.now()
    year, week_no, day = now.isocalendar()
    monday = now - timedelta(days=day - 1)
    sunday = monday + timedelta(days=6)

    if not os.path.exists(SCHEDULES_FILE):
        default_schedules = [
            {
                "id": f"sched_{year}_w{week_no}",
                "year": year,
                "weekNumber": week_no,
                "title": f"Lịch công tác tuần {week_no} năm {year}",
                "startDate": monday.strftime("%Y-%m-%d"),
                "endDate": sunday.strftime("%Y-%m-%d"),
                "status": "published",
                "lastUpdated": now.strftime("%Y-%m-%d %H:%M"),
                "updatedBy": "Hà Tường Vi (Chánh Văn phòng)",
                "approvedBy": "Nguyễn Bá Bân (Chủ tịch UBND xã)",
                "note": "Lịch công tác tuần.",
                "items": []
            }
        ]
        write_json_file(SCHEDULES_FILE, default_schedules, backup=False)

    if not os.path.exists(AUDIT_LOGS_FILE):
        write_json_file(AUDIT_LOGS_FILE, [], backup=False)

init_data_files()

class LichCongTacHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Thiết lập header no-cache cho CSS, JS, JSON và HTML
        path = self.path.split('?')[0]
        if path.endswith(('.css', '.js', '.json', '.html')) or path == '/' or path.startswith('/api/'):
            self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path

        # REST API Routes
        if path == "/api/status":
            self.send_json_response({"status": "ok", "time": datetime.now().isoformat(), "service": "Lich Cong Tac Ea Sup API"})
            return

        if path == "/api/schedules":
            schedules = read_json_file(SCHEDULES_FILE, [])
            now = datetime.now()
            year, week_no, day = now.isocalendar()
            curr_id = f"sched_{year}_w{week_no}"
            if not any(s.get("id") == curr_id or (s.get("year") == year and s.get("weekNumber") == week_no) for s in schedules):
                monday = now - timedelta(days=day - 1)
                sunday = monday + timedelta(days=6)
                curr_sched = {
                    "id": curr_id,
                    "year": year,
                    "weekNumber": week_no,
                    "title": f"Lịch công tác tuần {week_no} năm {year}",
                    "startDate": monday.strftime("%Y-%m-%d"),
                    "endDate": sunday.strftime("%Y-%m-%d"),
                    "status": "published",
                    "lastUpdated": now.strftime("%Y-%m-%d %H:%M"),
                    "updatedBy": "Hà Tường Vi (Chánh Văn phòng)",
                    "approvedBy": "Nguyễn Bá Bân (Chủ tịch UBND xã)",
                    "note": "Lịch công tác tuần.",
                    "items": []
                }
                schedules.insert(0, curr_sched)
                write_json_file(SCHEDULES_FILE, schedules, backup=False)
            self.send_json_response(schedules)
            return

        # API Danh sách điểm sao lưu (Restore Points)
        if path == "/api/backups":
            backup_files = sorted(glob.glob(os.path.join(BACKUPS_DIR, "*.json")), key=os.path.getmtime, reverse=True)
            result = []
            for bf in backup_files:
                try:
                    stat = os.stat(bf)
                    fn = os.path.basename(bf)
                    mtime_str = datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M:%S")
                    
                    item_count = 0
                    week_count = 0
                    with open(bf, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        if isinstance(data, list):
                            week_count = len(data)
                            for s in data:
                                if isinstance(s, dict) and "items" in s and isinstance(s["items"], list):
                                    item_count += len(s["items"])

                    result.append({
                        "filename": fn,
                        "time": mtime_str,
                        "size": f"{round(stat.st_size / 1024, 1)} KB",
                        "weekCount": week_count,
                        "itemCount": item_count
                    })
                except Exception:
                    pass
            self.send_json_response(result)
            return

        # Tải tệp sao lưu trực tiếp
        if path == "/api/backups/export":
            schedules = read_json_file(SCHEDULES_FILE, [])
            json_bytes = json.dumps(schedules, ensure_ascii=False, indent=2).encode('utf-8')
            filename = f"schedules_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Disposition', f'attachment; filename="{filename}"')
            self.send_header('Content-Length', str(len(json_bytes)))
            self.end_headers()
            self.wfile.write(json_bytes)
            return

        if path == "/api/cadres":
            cadres = read_json_file(CADRES_FILE, [])
            self.send_json_response(cadres)
            return

        if path == "/api/audit-logs":
            logs = read_json_file(AUDIT_LOGS_FILE, [])
            self.send_json_response(logs)
            return

        if path == "/api/organization":
            org = read_json_file(ORGANIZATION_FILE, None)
            self.send_json_response(org)
            return

        # Serve static files
        super().do_GET()

    def do_POST(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path

        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)

        try:
            body = json.loads(post_data.decode('utf-8')) if post_data else {}
        except Exception:
            body = {}

        # API Khôi phục từ một bản sao lưu (Restore Backup Snapshot)
        if path == "/api/backups/restore":
            filename = body.get("filename")
            if not filename:
                self.send_json_response({"error": "Thiếu tên tệp khôi phục"}, status=400)
                return
            target_backup = os.path.join(BACKUPS_DIR, os.path.basename(filename))
            if not os.path.exists(target_backup):
                self.send_json_response({"error": "Không tìm thấy bản sao lưu"}, status=404)
                return

            try:
                with open(target_backup, "r", encoding="utf-8") as f:
                    restored_data = json.load(f)
                write_json_file(SCHEDULES_FILE, restored_data, backup=True)
                self.send_json_response({
                    "success": True,
                    "message": f"Khôi phục thành công từ bản sao lưu {filename}",
                    "schedules": restored_data
                })
            except Exception as e:
                self.send_json_response({"error": f"Lỗi khôi phục: {str(e)}"}, status=500)
            return

        # API Tạo bản sao lưu thủ công (Create Snapshot Now)
        if path == "/api/backups/create":
            tag = body.get("tag", "manual")
            fn = create_backup_snapshot(SCHEDULES_FILE, tag)
            self.send_json_response({"success": True, "filename": fn})
            return

        # API Nhập khôi phục từ tệp JSON (Import & Restore from JSON payload)
        if path == "/api/backups/import":
            schedules = body.get("schedules")
            if not schedules or not isinstance(schedules, list):
                self.send_json_response({"error": "Dữ liệu JSON không hợp lệ"}, status=400)
                return
            write_json_file(SCHEDULES_FILE, schedules, backup=True)
            self.send_json_response({"success": True, "message": "Đã nhập và khôi phục dữ liệu thành công!", "schedules": schedules})
            return

        if path == "/api/schedules":
            # Ghi đè toàn bộ hoặc cập nhật 1 lịch tuần
            schedules = read_json_file(SCHEDULES_FILE, [])
            if isinstance(body, list):
                schedules = body
            elif isinstance(body, dict) and "id" in body:
                idx = next((i for i, s in enumerate(schedules) if s.get("id") == body["id"]), -1)
                if idx >= 0:
                    schedules[idx] = body
                else:
                    schedules.insert(0, body)
            write_json_file(SCHEDULES_FILE, schedules, backup=True)
            self.send_json_response({"success": True, "schedules": schedules})
            return

        if path == "/api/schedules/item":
            # Thêm hoặc sửa 1 mục công việc vào tuần tương ứng
            week_id = body.get("weekId")
            item = body.get("item")
            if not week_id or not item:
                self.send_json_response({"error": "Missing weekId or item"}, status=400)
                return

            schedules = read_json_file(SCHEDULES_FILE, [])
            sched = next((s for s in schedules if s.get("id") == week_id), None)
            if not sched:
                if len(schedules) > 0:
                    sched = schedules[0]
                else:
                    self.send_json_response({"error": "Schedule not found"}, status=404)
                    return

            if "items" not in sched or not isinstance(sched["items"], list):
                sched["items"] = []

            item_idx = next((i for i, it in enumerate(sched["items"]) if it.get("id") == item.get("id")), -1)
            if item_idx >= 0 and item.get("id"):
                sched["items"][item_idx] = item
            else:
                if not item.get("id"):
                    item["id"] = f"item_{int(datetime.now().timestamp() * 1000)}"
                sched["items"].append(item)

            sched["lastUpdated"] = datetime.now().strftime("%Y-%m-%d %H:%M")
            write_json_file(SCHEDULES_FILE, schedules, backup=True)
            self.send_json_response({"success": True, "schedule": sched, "item": item})
            return

        if path == "/api/schedules/delete-item":
            week_id = body.get("weekId")
            item_id = body.get("itemId")
            schedules = read_json_file(SCHEDULES_FILE, [])
            sched = next((s for s in schedules if s.get("id") == week_id), None)
            if sched and "items" in sched:
                sched["items"] = [it for it in sched["items"] if it.get("id") != item_id]
                sched["lastUpdated"] = datetime.now().strftime("%Y-%m-%d %H:%M")
                write_json_file(SCHEDULES_FILE, schedules, backup=True)
            self.send_json_response({"success": True, "schedule": sched})
            return

        if path == "/api/audit-logs":
            logs = read_json_file(AUDIT_LOGS_FILE, [])
            if isinstance(body, dict):
                logs.insert(0, body)
            elif isinstance(body, list):
                logs = body
            write_json_file(AUDIT_LOGS_FILE, logs, backup=False)
            self.send_json_response({"success": True})
            return

        if path == "/api/cadres":
            if isinstance(body, list):
                write_json_file(CADRES_FILE, body, backup=False)
            self.send_json_response({"success": True})
            return

        if path == "/api/organization":
            if isinstance(body, dict):
                write_json_file(ORGANIZATION_FILE, body, backup=False)
            self.send_json_response({"success": True})
            return

        self.send_json_response({"error": "Endpoint not found"}, status=404)

    def do_DELETE(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        query = urllib.parse.parse_qs(parsed_url.query)

        if path == "/api/schedules/item":
            week_id = query.get("weekId", [None])[0]
            item_id = query.get("itemId", [None])[0]
            schedules = read_json_file(SCHEDULES_FILE, [])
            sched = next((s for s in schedules if s.get("id") == week_id), None)
            if sched and "items" in sched:
                sched["items"] = [it for it in sched["items"] if it.get("id") != item_id]
                sched["lastUpdated"] = datetime.now().strftime("%Y-%m-%d %H:%M")
                write_json_file(SCHEDULES_FILE, schedules, backup=True)
            self.send_json_response({"success": True, "schedule": sched})
            return

        self.send_json_response({"error": "Endpoint not found"}, status=404)

    def send_json_response(self, data, status=200):
        json_bytes = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(json_bytes)))
        self.end_headers()
        self.wfile.write(json_bytes)

def run():
    os.chdir(BASE_DIR)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), LichCongTacHandler) as httpd:
        print(f"🚀 [Ea Sup Portal] Web & Data Server đang chạy tại cổng {PORT}...")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nĐang dừng máy chủ...")
            httpd.server_close()

if __name__ == "__main__":
    run()
