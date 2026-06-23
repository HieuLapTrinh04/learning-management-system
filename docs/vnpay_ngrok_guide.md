# Hướng dẫn chi tiết: Tích hợp và kiểm thử VNPay IPN Callback ở Local bằng Ngrok

Trong quá trình phát triển cổng thanh toán **VNPay** tại máy cá nhân (Localhost), việc kiểm thử luồng **IPN (Instant Payment Notification)** là bắt buộc. IPN là cơ chế VNPay gọi bất đồng bộ tới Server của bạn để cập nhật trạng thái đơn hàng (đã thanh toán hoặc thất bại) ngay cả khi người dùng tắt trình duyệt.

Vì VNPay là hệ thống bên ngoài, máy chủ của họ không thể gọi trực tiếp tới `http://localhost:8080`. Tài liệu này hướng dẫn cách sử dụng **ngrok** để tạo ra một đường ống (tunnel) công khai giúp VNPay gửi dữ liệu về máy của bạn một cách an toàn.

---

## Quy trình hoạt động của VNPay IPN với Ngrok

```
[ Khách hàng ] ──(1) Thanh toán──► [ VNPay Sandbox ]
                                          │
                                   (2) Gọi Callback (IPN)
                                          │
                                          ▼
                               [ HTTPS Ngrok Public URL ]
                             (https://xxxx.ngrok-free.app)
                                          │
                                     (Tạo Tunnel)
                                          │
                                          ▼
                               [ Localhost API Server ]
                               (http://localhost:8080)
```

---

## Hướng dẫn cài đặt và cấu hình từng bước

### Bước 1: Cài đặt ngrok
1. Truy cập vào trang chủ [ngrok.com](https://ngrok.com/) và đăng ký một tài khoản miễn phí.
2. Tải xuống bộ cài ngrok cho hệ điều hành của bạn (Windows/macOS/Linux).
3. Giải nén và cấu hình xác thực (Authtoken) bằng dòng lệnh được cung cấp trong dashboard của ngrok:
   ```bash
   ngrok config add-authtoken <YOUR_AUTHTOKEN>
   ```

### Bước 2: Kích hoạt Tunnel kết nối tới Go Fiber Server
Khởi chạy ngrok để lắng nghe cổng `8080` (Cổng chạy của Go Fiber backend):
```bash
ngrok http 8080
```
Màn hình terminal sẽ xuất hiện giao diện như sau:
```text
Session Status                online
Account                       Your Name (User ID)
Version                       3.x.x
Forwarding                    https://a1b2-34-56-78-90.ngrok-free.app -> http://localhost:8080
```
> [!IMPORTANT]
> Copy đường dẫn **Forwarding** dạng HTTPS (Ví dụ: `https://a1b2-34-56-78-90.ngrok-free.app`). Giữ terminal chạy ngrok mở liên tục trong suốt quá trình test. Mỗi lần chạy lại ngrok, URL này sẽ thay đổi (trừ khi dùng gói trả phí).

### Bước 3: Cập nhật file cấu hình hệ thống (`config.env`)
Mở file `config.env` ở thư mục gốc của project LMS và thay đổi giá trị cấu hình của VNPay. Hãy cập nhật URL trả về (`VNP_RETURN_URL`) bằng URL ngrok của bạn:

```env
# URL VNPay gọi về client để hiển thị giao diện kết quả cho người học (Redirect URL)
VNP_RETURN_URL=http://localhost:3000/payment/callback

# URL VNPay IPN gọi về Backend để lưu DB cập nhật đơn hàng (Cấu hình trên Portal của VNPay hoặc sử dụng URL này trong code gửi thanh toán)
# Địa chỉ API nhận IPN trong code Go sẽ là:
# https://a1b2-34-56-78-90.ngrok-free.app/api/v1/payments/vnpay-ipn
```

### Bước 4: Viết Controller xử lý IPN trong Golang (Mẫu tham khảo)
Dưới đây là cách kiểm tra chữ ký số từ VNPay gửi về trước khi cập nhật dữ liệu:

```go
func (h *PaymentHandler) HandleVNPayIPN(c *fiber.Ctx) error {
    // 1. Lấy tất cả query parameters VNPay gửi về
    queryParams := c.Queries()
    
    // 2. Trích xuất chữ ký số (vnp_SecureHash)
    secureHash := queryParams["vnp_SecureHash"]
    delete(queryParams, "vnp_SecureHash") // Xóa hash khỏi danh sách tham số để tính toán lại hash
    delete(queryParams, "vnp_SecureHashType")
    
    // 3. Sắp xếp các tham số theo thứ tự alphabet và tạo chuỗi hash raw
    // 4. Sử dụng mã vnp_HashSecret trong config.env để tính toán HMAC-SHA512
    calculatedHash := utils.CalculateHMACSHA512(queryParams, h.cfg.VNPayHashSecret)
    
    // 5. So sánh hai chữ ký số
    if secureHash != calculatedHash {
        return c.Status(fiber.StatusOK).JSON(fiber.Map{
            "RspCode": "97",
            "Message": "Invalid signature",
        })
    }
    
    // 6. Kiểm tra trạng thái đơn hàng trong DB
    txnRef := queryParams["vnp_TxnRef"]
    order, err := h.orderRepo.GetByTxnRef(txnRef)
    if err != nil {
        return c.Status(fiber.StatusOK).JSON(fiber.Map{
            "RspCode": "01",
            "Message": "Order not found",
        })
    }
    
    // Kiểm tra số tiền thanh toán khớp với DB
    amountSent, _ := strconv.ParseFloat(queryParams["vnp_Amount"], 64)
    if order.TotalAmount * 100 != amountSent { // VNPay nhân số tiền với 100
        return c.Status(fiber.StatusOK).JSON(fiber.Map{
            "RspCode": "04",
            "Message": "Invalid amount",
        })
    }
    
    // 7. Cập nhật DB
    if queryParams["vnp_ResponseCode"] == "00" {
        order.Status = "paid"
        h.orderRepo.Update(order)
        
        // Tạo bản ghi Enrollment cho học viên tại đây...
    } else {
        order.Status = "failed"
        h.orderRepo.Update(order)
    }
    
    // Trả về response đúng định dạng VNPay yêu cầu để xác nhận nhận IPN thành công
    return c.Status(fiber.StatusOK).JSON(fiber.Map{
        "RspCode": "00",
        "Message": "Confirm Success",
    })
}
```

### Bước 5: Thực hiện Test luồng
1. Chạy các container MySQL, Redis: `docker-compose up -d`
2. Chạy backend Go: `go run cmd/api/main.go`
3. Thực hiện tạo đơn hàng thanh toán qua API. Server sẽ trả về một link thanh toán VNPay Sandbox.
4. Mở link thanh toán này trên trình duyệt, điền thông tin thẻ ATM thử nghiệm của VNPay (thường là thẻ test của ngân hàng NCB cung cấp trên trang sandbox).
5. Sau khi thanh toán thành công, bạn sẽ thấy VNPay gửi 1 request GET tới log của `ngrok` terminal và console backend của bạn sẽ nhận được request IPN. Trạng thái đơn hàng trong MySQL lúc này sẽ tự động chuyển từ `pending` sang `paid` và tạo quyền học tập cho sinh viên.
