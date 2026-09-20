FROM python:3.12-slim

WORKDIR /app

# Thiết lập múi giờ Việt Nam và môi trường không đệm
ENV TZ=Asia/Ho_Chi_Minh \
    DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=5000

# Cài đặt tzdata để đồng bộ múi giờ
RUN apt-get update && apt-get install -y --no-install-recommends \
    tzdata \
    curl \
    && ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone \
    && rm -rf /var/lib/apt/lists/*

# Cài đặt các thư viện Python
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Sao chép toàn bộ mã nguồn vào container
COPY . /app

# Tạo thư mục dữ liệu và tệp tải lên
RUN mkdir -p /app/data /app/data/uploads /app/data/backups

EXPOSE 5000

CMD ["python", "server.py"]
