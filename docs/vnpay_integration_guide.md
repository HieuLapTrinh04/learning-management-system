# Cẩm nang Tích hợp và Triển khai Phân hệ Thanh toán VNPay

Tài liệu này cung cấp hướng dẫn chi tiết về mặt kiến trúc, thiết kế cơ sở dữ liệu, đặc tả API, hướng dẫn kiểm thử Sandbox và cẩm nang triển khai Production cho phân hệ thanh toán **VNPay** trong hệ thống **Online LMS Platform**.

---

## 1. Thiết Kế Cơ Sở Dữ Liệu (Database Design)

Phân hệ sử dụng các bảng quan hệ được thiết kế dưới định dạng chuẩn 3NF:

```
                  ┌──────────────────────┐
                  │        users         │
                  └──────────┬───────────┘
                             │ (1)
                             │
                             │ (N)
                  ┌──────────▼───────────┐
                  │        orders        │
                  └──────────┬───────────┘
                             │ (1)
                             │
                             │ (N)
                  ┌──────────▼───────────┐
                  │     order_items      │
                  └──────────────────────┘
```

### Bảng 1: `orders` (Quản lý hóa đơn)
Lưu trữ thông tin tổng hợp về hóa đơn giao dịch của sinh viên.
- `id` (BIGINT UNSIGNED, Primary Key, Auto Increment): Mã định danh duy nhất.
- `student_id` (BIGINT UNSIGNED, Foreign Key -> `users.id`): Sinh viên thực hiện giao dịch.
- `total_amount` (DECIMAL(10,2), Not Null): Tổng số tiền thanh toán (VND).
- `status` (VARCHAR(20), Default 'pending'): Trạng thái đơn hàng: `pending` (Chờ xử lý), `paid` (Đã thanh toán), `failed` (Thất bại), `refunded` (Đã hoàn tiền).
- `txn_ref` (VARCHAR(100), Unique Index, Not Null): Mã số tham chiếu giao dịch gửi sang VNPay.
- `created_at` (TIMESTAMP): Thời gian khởi tạo đơn hàng.
- `paid_at` (TIMESTAMP, Null): Thời điểm giao dịch thành công.

### Bảng 2: `order_items` (Chi tiết hóa đơn)
Lưu danh sách khóa học thuộc hóa đơn tại thời điểm mua (để bảo lưu giá bán lịch sử).
- `id` (BIGINT UNSIGNED, Primary Key): Mã định danh duy nhất.
- `order_id` (BIGINT UNSIGNED, Foreign Key -> `orders.id` ON DELETE CASCADE): Liên kết tới hóa đơn mẹ.
- `course_id` (BIGINT UNSIGNED, Foreign Key -> `courses.id` ON DELETE RESTRICT): Khóa học được mua.
- `price` (DECIMAL(10,2)): Đơn giá khóa học tại thời điểm mua.

---

## 2. Đặc Tả Giao Diện Lập Trình Ứng Dụng (APIs)

Tất cả các API được bảo mật qua lớp token JWT Bearer ngoại trừ các callback của cổng thanh toán.

### 2.1. Sinh liên kết Checkout (Student)
*   **Endpoint**: `POST /api/v1/student/payments/checkout`
*   **Quyền hạn**: Student
*   **Request Body**:
    ```json
    {
      "course_ids": [1, 2]
    }
    ```
*   **Response** (`200 OK`):
    ```json
    {
      "success": true,
      "payment_url": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=49900000&...",
      "message": "checkout session created successfully"
    }
    ```

### 2.2. Nhận phản hồi IPN Callback (VNPay Server)
*   **Endpoint**: `GET /api/v1/payments/vnpay-ipn`
*   **Quyền hạn**: Public (Được bảo mật bằng chữ ký SHA-512)
*   **Response** (`200 OK`):
    ```json
    {
      "RspCode": "00",
      "Message": "Confirm success"
    }
    ```

### 2.3. Tải hóa đơn PDF (Student)
*   **Endpoint**: `GET /api/v1/student/payments/orders/:id/invoice`
*   **Quyền hạn**: Student (Chỉ tải được hóa đơn của chính mình)
*   **Response**: Trả về trực tiếp nhị phân PDF (`application/pdf`) dưới dạng tệp tải về.

### 2.4. Tra cứu danh sách giao dịch (Admin)
*   **Endpoint**: `GET /api/v1/admin/payments/transactions`
*   **Quyền hạn**: Admin
*   **Query Params**: `page` (mặc định 1), `limit` (mặc định 10), `status` (pending/paid/failed/refunded), `search` (mã giao dịch).
*   **Response**: Trả về mảng JSON chứa các giao dịch cùng thông tin khóa học và phân trang.

### 2.5. Hoàn tiền đơn hàng (Admin)
*   **Endpoint**: `POST /api/v1/admin/payments/orders/:id/refund`
*   **Quyền hạn**: Admin
*   **Response** (`200 OK`):
    ```json
    {
      "success": true,
      "message": "Giao dịch đã được hoàn tiền và thu hồi đăng ký thành công"
    }
    ```

---

## 3. Xử Lý Lỗi và An Toàn Dữ Liệu (Error Handling & Race Conditions)

### 3.1. Các mã phản hồi IPN chuẩn hóa
Hệ thống tuân thủ chặt chẽ tài liệu kỹ thuật VNPay khi trả về mã lỗi:
- `00`: Xác nhận IPN thành công và xử lý đơn hàng thành công.
- `01`: Không tìm thấy đơn hàng trong cơ sở dữ liệu.
- `02`: Đơn hàng đã được xác nhận trước đó (tránh duplicate logic).
- `04`: Số tiền thanh toán không khớp với hóa đơn khởi tạo.
- `97`: Chữ ký số kiểm tra không trùng khớp (nguy cơ giả mạo dữ liệu).
- `99`: Lỗi hệ thống nội bộ trong quá trình ghi cơ sở dữ liệu.

### 3.2. Ngăn ngừa Race Conditions (Duplicate Payments)
Nhằm tránh trường hợp VNPay gửi nhiều request IPN đồng thời hoặc người dùng nhấn reload trang kết quả liên tục gây ra tình trạng tạo trùng lặp lượt ghi danh (`enrollments`), hệ thống áp dụng kỹ thuật khóa dòng dữ liệu:
1. Khi tiếp nhận xử lý IPN, hệ thống mở một Database Transaction.
2. Thực hiện khóa dòng hóa đơn bằng cơ chế:
   ```go
   tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&order, orderID)
   ```
   Điều này buộc các luồng xử lý khác phải xếp hàng chờ cho đến khi Transaction hiện tại hoàn tất.
3. Kiểm tra trạng thái hóa đơn dưới ổ khóa: Nếu `status` khác `pending`, lập tức trả về mã phản hồi `02` (Order already confirmed), hủy xử lý tiếp theo.

---

## 4. Hướng Dẫn Kiểm Thử Sandbox (Sandbox Testing Guide)

Môi trường phát triển của VNPay cung cấp ngân hàng thử nghiệm để mô phỏng luồng thanh toán thực tế.

### 4.1. Thông tin thẻ ATM kiểm thử (Ngân hàng NCB)
Khi được chuyển hướng sang cổng thanh toán VNPay Sandbox, vui lòng chọn ngân hàng **NCB** và nhập thông tin sau:
- **Số thẻ**: `9704198526191432198`
- **Tên chủ thẻ**: `NGUYEN VAN A`
- **Ngày phát hành**: `07/15`
- **Mã xác thực OTP**: `123456`

### 4.2. Giả lập thử nghiệm IPN cục bộ với Ngrok
Để VNPay có thể gọi callback về máy phát triển local:
1. Chạy ngrok trỏ tới cổng 8080: `ngrok http 8080`
2. Sao chép địa chỉ HTTPS ngrok cung cấp (ví dụ: `https://abcd.ngrok-free.app`).
3. Cập nhật `VNP_RETURN_URL` trong file cấu hình bằng địa chỉ URL ngrok trỏ tới handler IPN.

---

## 5. Cẩm Nang Triển Khai Production (Production Deployment Guide)

Khi đưa hệ thống ra vận hành thực tế (Production), cần tuân thủ các quy tắc bảo mật sau:

### 5.1. Quản lý Khóa bí mật (Credential Protection)
Tuyệt đối không được hardcode các tham số bí mật của VNPay vào mã nguồn. Tất cả các giá trị phải được cấu hình thông qua biến môi trường trong file `.env.production`:
```env
VNP_TMN_CODE=MÃ_TMN_ĐƯỢC_VNPAY_CẤP
VNP_HASH_SECRET=MÃ_BÍ_MẬT_KÝ_SỐ_ĐƯỢC_VNPAY_CẤP
VNP_URL=https://pay.vnpayment.vn/vpcpay.html # URL Production thực tế
VNP_RETURN_URL=https://lms.edu.vn/payment/callback
```

### 5.2. Cấu hình Nginx HTTPS & TLS 1.3
Buộc tất cả lưu lượng giao dịch đi qua kênh mã hóa an toàn HTTPS sử dụng TLS 1.3 để ngăn chặn các cuộc tấn công nghe lén (Man-in-the-middle).
```nginx
server {
    listen 443 ssl http2;
    server_name lms.edu.vn;

    ssl_certificate /etc/nginx/certs/lms_cert.crt;
    ssl_certificate_key /etc/nginx/certs/lms_key.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';

    location /api/v1/payments/ {
        proxy_pass http://backend:8080;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

### 5.3. Chiến lược Sao lưu dữ liệu giao dịch (Backup Strategy)
Cơ sở dữ liệu giao dịch tài chính yêu cầu chế độ sao lưu nghiêm ngặt. Thiết lập một cron job trên hệ điều hành máy chủ chạy hàng ngày lúc 00:00 để sao lưu:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/lms/payments"
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d)
# Xuất riêng dữ liệu các bảng liên quan đến tài chính
docker exec lms_db_prod mysqldump -u root -p'password' lms_production orders order_items > $BACKUP_DIR/payments_$DATE.sql
# Nén dữ liệu
gzip $BACKUP_DIR/payments_$DATE.sql
# Xóa các bản backup cũ hơn 90 ngày
find $BACKUP_DIR -type f -mtime +90 -name "*.gz" -delete
```
