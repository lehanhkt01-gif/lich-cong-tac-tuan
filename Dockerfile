FROM python:3.12-alpine

WORKDIR /app

COPY . /app

RUN mkdir -p /app/data /app/data/uploads

ENV TZ=Asia/Ho_Chi_Minh
ENV PORT=80

EXPOSE 80

CMD ["python", "server.py"]
