# Cẩm Nang Triển Khai Hệ Thống LMS Lên Production (Production Deployment Manual)

Tài liệu này hướng dẫn chi tiết các bước thiết lập, cấu hình bảo mật SSL/HTTPS, khởi chạy hạ tầng bằng Docker Compose và lên lịch tự động sao lưu dữ liệu cho hệ thống Quản lý Học tập trực tuyến (LMS).

---

## 1. Yêu cầu Hệ thống (System Requirements)
- **Hệ điều hành**: Linux (Ubuntu 22.04 LTS hoặc tương đương được khuyến nghị).
- **Hạ tầng**:
  - Đã cài đặt **Docker Engine v20.10+** và **Docker Compose v2.0+**.
  - Đã mở các cổng (ports) trên tường lửa: **80** (HTTP) và **443** (HTTPS).
  - Tên miền (Domain Name) đã được cấu hình trỏ (A record) về địa chỉ IP Public của máy chủ (ví dụ: `lms.edu.vn`).

---

## 2. Cấu hình biến môi trường Production
Tệp tin [.env.production](file:///c:/Users/buihi/.gemini/antigravity-ide/scratch/learning-management-system/.env.production) chứa cấu hình production mặc định của ứng dụng. Hãy đảm bảo:
1. Thay đổi mật khẩu MySQL và Redis thành các khóa bảo mật mạnh.
2. Cập nhật `JWT_ACCESS_SECRET` và `JWT_REFRESH_SECRET`.
3. Thay thế các thông số Cloudinary (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) bằng tài khoản lưu trữ thật.
4. Cập nhật các thông số VNPay tương ứng với môi trường chạy thật.

---

## 3. Automated CI/CD Deployment (GitHub Actions)

This project uses a fully automated GitOps pipeline to deploy to production.

### Infrastructure Prerequisites

1.  **Target Server**: A Linux VPS (Ubuntu/Debian) with Docker and Docker Compose installed.
2.  **GitHub Container Registry (GHCR)**: Ensure your repository allows packages (Images are pushed to GHCR automatically).

### GitHub Secrets Setup

To enable automated deployment, configure the following secrets in your GitHub repository (`Settings > Secrets and variables > Actions`):

*   `SERVER_HOST`: The IP address or domain name of your production server.
*   `SERVER_USER`: The SSH username (e.g., `root` or `ubuntu`).
*   `SERVER_SSH_KEY`: The private SSH key allowing access to the server.
*   `SERVER_PORT`: The SSH port (usually `22`).
*   *(Optional but recommended)* `GHCR_PAT`: A Personal Access Token with `read:packages` permission if you decide to make the registry private.

### Deployment Workflow

1.  **Staging / Test**: Every push or Pull Request to the `main` branch triggers the `Run Automated Tests` job which runs Unit Tests and Frontend Build verification.
2.  **Production**: When a push is made to `main`, the CI pipeline will automatically:
    *   Build Docker images for Backend and Frontend.
    *   Tag images with the Git commit SHA (e.g., `sha-8f2b3c1`).
    *   Push images to GHCR.
    *   SSH into your production server and execute `./scripts/deploy.sh sha-8f2b3c1`.

### Manual Rollback Procedure

If a critical bug is discovered after deployment, you can perform an instantaneous rollback.

1. SSH into your production server.
2. Navigate to the project directory: `cd /opt/learning-management-system`
3. Execute the rollback script with the stable commit SHA:
   ```bash
   ./scripts/rollback.sh sha-<PREVIOUS_STABLE_COMMIT_SHA>
   ```

*Note: The rollback takes less than 10 seconds because the image is already built and resides in the registry.*

> [!TIP]
> Trong môi trường thử nghiệm ở local, bạn có thể tự tạo chứng chỉ tự ký (Self-signed certificates) để kiểm tra bằng cách chạy lệnh:
> `go run scripts/generate_certs.go`

---

## 4. Khởi chạy Hệ thống bằng Docker Compose

Sau khi đã chuẩn bị đầy đủ chứng chỉ SSL trong thư mục `nginx/certs`, thực hiện các bước sau để xây dựng và kích hoạt container:

```bash
# 1. Xây dựng và khởi chạy toàn bộ dịch vụ ở chế độ chạy ngầm (detached mode)
docker compose --env-file .env.production up --build -d

# 2. Kiểm tra trạng thái hoạt động của các dịch vụ
docker compose ps
```

Các dịch vụ sẽ khởi chạy theo trình tự phụ thuộc:
- `db` (MySQL 8.0) và `redis` (Redis 7.0) khởi chạy trước và thực hiện Health Check.
- Khi DB và Redis báo trạng thái `healthy`, `backend` (Golang Fiber) sẽ khởi chạy và tự động chạy cơ chế auto-migration cơ sở dữ liệu.
- `frontend` (React SPA) và `nginx` (Gateway) sẽ khởi chạy sau cùng để định tuyến traffic.

---

## 5. Chiến lược sao lưu tự động (Backup Strategy)

Kịch bản [/scripts/backup.sh](file:///c:/Users/buihi/.gemini/antigravity-ide/scratch/learning-management-system/scripts/backup.sh) tự động đóng gói 3 thành phần cốt lõi của hệ thống:
1. Cơ sở dữ liệu MySQL (sử dụng lệnh `mysqldump` xuất trực tiếp từ container).
2. Trạng thái Cache/Session Redis (sử dụng snapshot `dump.rdb` trong Redis).
3. Tài liệu bài tập và chứng chỉ đã tải lên của học viên (thư mục `uploads`).

### Bước 5.1: Đặt quyền thực thi cho kịch bản backup
```bash
chmod +x scripts/backup.sh
```

### Bước 5.2: Thiết lập Cron Job sao lưu hàng ngày lúc 2 giờ sáng
Thêm lệnh sau vào bảng lập lịch Cron của máy chủ Linux:

```bash
# 1. Mở trình soạn thảo crontab
crontab -e

# 2. Thêm dòng sau vào cuối tệp tin và lưu lại (sao lưu vào 2:00 AM hàng ngày)
0 2 * * * /bin/bash /path/to/learning-management-system/scripts/backup.sh >> /var/log/lms_backup.log 2>&1
```

Mỗi lần chạy thành công, kịch bản sẽ tạo ra một tệp tin nén tại thư mục `/var/backups/lms/lms_backup_YYYYMMDD_HHMMSS.tar.gz` và tự động xóa các bản sao lưu cũ hơn 30 ngày.

---

## 6. Quy trình Khôi phục dữ liệu (Data Restoration)

Khi xảy ra sự cố phần cứng hoặc mất mát dữ liệu, thực hiện khôi phục hệ thống từ bản sao lưu gần nhất theo các bước sau:

Thay vì thao tác thủ công từng bước tốn thời gian, dự án đã cung cấp sẵn script tự động khôi phục hoàn toàn Database, Cache và Uploads.

```bash
# 1. Tìm bản sao lưu gần nhất
ls -lh /var/backups/lms

# 2. Chạy kịch bản khôi phục (Restore script)
chmod +x scripts/restore.sh
./scripts/restore.sh /var/backups/lms/lms_backup_YYYYMMDD_HHMMSS.tar.gz
```

Kịch bản này sẽ tự động giải nén, bơm dữ liệu SQL vào container MySQL, copy file RDB vào Redis và nạp lại thư mục Uploads vào Backend. Sau khi có thông báo thành công, toàn bộ ứng dụng của bạn đã trở về trạng thái ổn định!
