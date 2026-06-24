# 🎓 Lumina Academy — Learning Management System

<div align="center">

![Go](https://img.shields.io/badge/Go-1.22+-00ADD8?style=for-the-badge&logo=go&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7.0-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)

**Nền tảng học tập trực tuyến (LMS) hiện đại, đa tenant, hỗ trợ thanh toán VNPay, tích hợp AI chấm bài và hệ thống gamification.**

[📖 Tài liệu API](#api) • [🚀 Khởi chạy nhanh](#quick-start) • [🐳 Docker Deploy](#docker)

</div>

---

## ✨ Tính năng nổi bật

### 👩‍🏫 Dành cho Giảng viên
- **Course Builder** — Tạo khóa học với Sections, Lessons, Video (Cloudinary), tài liệu đính kèm
- **Quiz & Assignment** — Tạo bài kiểm tra trắc nghiệm và bài tập nộp file
- **Course Analytics** — Thống kê doanh thu, số lượng học viên, đánh giá
- **Payout System** — Yêu cầu rút tiền doanh thu (tỷ lệ 70/30)

### 🎓 Dành cho Học viên
- **Video Learning** — Xem bài giảng với tracking tiến độ học tập
- **Quiz Engine** — Làm bài trắc nghiệm với chấm điểm tức thời
- **Certificate** — Nhận chứng chỉ PDF tự động khi hoàn thành khóa học
- **Gamification** — Hệ thống điểm thưởng, streak học tập, leaderboard
- **VNPay Payment** — Thanh toán nội địa qua VNPay (hỗ trợ coupon)

### 🔧 Dành cho Admin
- **Multi-tenant** — Quản lý nhiều trường/tổ chức độc lập trên cùng hệ thống
- **User Management** — Quản lý tài khoản, phân quyền, kích hoạt/vô hiệu hóa
- **Course Approval** — Duyệt khóa học trước khi công khai
- **Revenue Reports** — Báo cáo doanh thu, thống kê giao dịch
- **Audit Logs** — Nhật ký toàn bộ hoạt động hệ thống
- **Real-time Notifications** — Thông báo WebSocket

---

## 🏗 Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────┐
│                    NGINX (Gateway)                   │
│              SSL Termination + Load Balancer         │
└──────────────┬──────────────────────┬───────────────┘
               │                      │
    ┌──────────▼──────┐    ┌──────────▼──────────┐
    │  React Frontend  │    │   Go Fiber Backend   │
    │   (Vite + RTK)   │    │   REST API + WebSocket│
    └──────────────────┘    └──────────┬────────────┘
                                       │
                         ┌─────────────┼──────────────┐
                         │             │              │
                  ┌──────▼──┐  ┌───────▼──┐  ┌───────▼──┐
                  │ MySQL 8 │  │ Redis 7  │  │Cloudinary│
                  │(Primary)│  │(Sessions)│  │(Storage) │
                  └─────────┘  └──────────┘  └──────────┘
```

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Go 1.22, Fiber v2, GORM v2 |
| **Frontend** | React 18, Redux Toolkit, Vite, TailwindCSS |
| **Database** | MySQL 8.0 (GORM AutoMigrate) |
| **Cache/Session** | Redis 7.0 |
| **Auth** | JWT (Access + Refresh Token Rotation) |
| **Storage** | Cloudinary (Images, Videos, Files) |
| **Email** | Resend API |
| **Payment** | VNPay (Sandbox + Production) |
| **PDF** | chromedp (Headless Chrome) |
| **WebSocket** | Fiber WebSocket (Real-time notifications) |
| **Infra** | Docker Compose, Nginx, Let's Encrypt SSL |
| **CI/CD** | GitHub Actions → Auto deploy to VPS |
| **Monitoring** | Prometheus + Grafana |

---

## 🚀 Khởi chạy nhanh (Local Development) {#quick-start}

### Yêu cầu
- Go 1.22+
- Node.js 20+
- Docker & Docker Compose
- MySQL 8.0 + Redis 7.0 (hoặc chạy qua Docker)

### 1. Clone và cài đặt

```bash
git clone https://github.com/HieuLapTrinh04/learning-management-system.git
cd learning-management-system
```

### 2. Cấu hình môi trường

```bash
cp .env.example .env
# Chỉnh sửa .env với thông tin của bạn (DB, Redis, JWT, Cloudinary, VNPay, Resend)
```

### 3. Chạy Backend

```bash
go mod download
go run cmd/api/main.go
# → Server chạy tại http://localhost:8080
```

### 4. Chạy Frontend

```bash
cd frontend
npm install
npm run dev
# → App chạy tại http://localhost:5173
```

### Tài khoản test mặc định

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@lms.edu.vn | securepassword123 |
| Teacher | teacher@lms.edu.vn | securepassword123 |
| Student | student@lms.edu.vn | securepassword123 |

---

## 🐳 Docker Deploy (Production) {#docker}

```bash
# 1. Cấu hình production env
cp .env.production.example .env.production
nano .env.production

# 2. Build và khởi chạy
docker compose --env-file .env.production up --build -d

# 3. Kiểm tra trạng thái
docker compose ps
```

Xem hướng dẫn deploy đầy đủ tại [DEPLOYMENT.md](DEPLOYMENT.md).

---

## 📁 Cấu trúc project

```
learning-management-system/
├── cmd/api/           # Entry point
├── internal/
│   ├── config/        # App configuration
│   ├── delivery/      # HTTP Handlers, Routes
│   ├── middleware/     # Auth, Tenant, CORS
│   ├── models/        # GORM models (20+ entities)
│   ├── repository/    # Data access layer
│   └── usecase/       # Business logic layer
├── pkg/
│   ├── db/            # MySQL connection + migrations
│   └── logger/        # Zap structured logger
├── frontend/          # React app (Vite)
├── nginx/             # Nginx config + SSL certs
├── scripts/           # Deploy, backup, rollback scripts
├── docker-compose.yml
└── Dockerfile
```

---

## 🔐 Bảo mật

- **JWT Rotation** — Access token (15 phút) + Refresh token (7 ngày), rotate mỗi lần refresh
- **Bcrypt** — Mã hóa mật khẩu với cost factor 12
- **Multi-tenant Isolation** — Mỗi tenant có dữ liệu hoàn toàn độc lập
- **HTTPS** — SSL/TLS qua Nginx + Let's Encrypt
- **Rate Limiting** — Tích hợp sẵn trong Fiber middleware

---

## 📊 CI/CD Pipeline

```
git push main
     │
     ▼
GitHub Actions
     │
     ├─ 1. Run Go unit tests
     ├─ 2. Build React app
     ├─ 3. Build Docker images → push GHCR
     └─ 4. SSH deploy to VPS → zero-downtime restart
```

---

## 👨‍💻 Tác giả

**Nguyễn Bùi Minh Hiếu** — [@HieuLapTrinh04](https://github.com/HieuLapTrinh04)

---

## 📄 License

MIT License — Xem [LICENSE](LICENSE) để biết thêm chi tiết.
