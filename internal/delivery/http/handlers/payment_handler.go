package handlers

import (
	"github.com/HieuLapTrinh04/learning-management-system/pkg/logger"

	"bytes"
	"encoding/csv"
	"fmt"
	"net/url"
	"strconv"
	"strings"

	"github.com/HieuLapTrinh04/learning-management-system/internal/usecase"
	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"github.com/gofiber/fiber/v2"
)

type PaymentHandler struct {
	useCase usecase.PaymentUseCase
}

func NewPaymentHandler(useCase usecase.PaymentUseCase) *PaymentHandler {
	return &PaymentHandler{useCase: useCase}
}

func (h *PaymentHandler) getStudentID(c *fiber.Ctx) (uint, error) {
	val := c.Locals("user_id")
	userID, ok := val.(uint)
	if !ok {
		return 0, fiber.NewError(fiber.StatusUnauthorized, "invalid authorization token session")
	}
	return userID, nil
}

type CheckoutRequest struct {
	CourseIDs []uint `json:"course_ids" xml:"course_ids" form:"course_ids"`
}

func (h *PaymentHandler) Checkout(c *fiber.Ctx) error {
	studentID, err := h.getStudentID(c)
	if err != nil {
		return err
	}

	var req CheckoutRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body format")
	}

	clientIP := c.IP()
	if clientIP == "" || clientIP == "::1" {
		clientIP = "127.0.0.1"
	}

	checkoutUrl, err := h.useCase.CreateCheckoutUrl(c.Context(), studentID, req.CourseIDs, clientIP)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success":     true,
		"payment_url": checkoutUrl,
		"message":     "checkout session created successfully",
	})
}

func (h *PaymentHandler) HandleReturn(c *fiber.Ctx) error {
	queryParams := url.Values{}
	c.Request().URI().QueryArgs().VisitAll(func(key, val []byte) {
		queryParams.Set(string(key), string(val))
	})

	responseCode := queryParams.Get("vnp_ResponseCode")
	txnRef := queryParams.Get("vnp_TxnRef")
	amountStr := queryParams.Get("vnp_Amount")

	isSuccess := responseCode == "00"
	var statusMsg string
	if isSuccess {
		statusMsg = "Giao dịch đã được thanh toán thành công!"
	} else {
		statusMsg = fmt.Sprintf("Giao dịch thất bại hoặc đã bị hủy. Mã lỗi: %s", responseCode)
	}

	htmlContent := fmt.Sprintf(`<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Kết quả thanh toán - LMS</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Outfit', sans-serif;
            background: radial-gradient(circle at top right, #1a1e36, #0e1118);
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
            box-sizing: border-box;
        }
        .card {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 24px;
            padding: 40px;
            width: 100%%;
            max-width: 480px;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            animation: fadeIn 0.6s ease-out;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .icon {
            font-size: 64px;
            margin-bottom: 24px;
            display: inline-block;
            line-height: 1;
        }
        .success-icon {
            color: #10B981;
            text-shadow: 0 0 20px rgba(16, 185, 129, 0.4);
        }
        .error-icon {
            color: #EF4444;
            text-shadow: 0 0 20px rgba(239, 68, 68, 0.4);
        }
        h1 {
            font-weight: 800;
            font-size: 28px;
            margin: 0 0 12px 0;
            letter-spacing: -0.5px;
        }
        .message {
            font-size: 16px;
            color: #94A3B8;
            margin-bottom: 32px;
            line-height: 1.5;
        }
        .details {
            background: rgba(255, 255, 255, 0.02);
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 32px;
            text-align: left;
            border: 1px solid rgba(255, 255, 255, 0.04);
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            font-size: 14px;
        }
        .detail-row:last-child {
            margin-bottom: 0;
        }
        .label {
            color: #64748B;
        }
        .value {
            font-weight: 600;
            color: #F8FAFC;
        }
        .btn {
            display: inline-block;
            width: 100%%;
            padding: 16px;
            border-radius: 14px;
            font-weight: 600;
            font-size: 16px;
            text-decoration: none;
            transition: all 0.3s ease;
            box-sizing: border-box;
        }
        .btn-primary {
            background: linear-gradient(135deg, #3B82F6, #1D4ED8);
            color: #ffffff;
            box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3);
        }
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="icon %s">%s</div>
        <h1>%s</h1>
        <p class="message">%s</p>
        
        <div class="details">
            <div class="detail-row">
                <span class="label">Mã giao dịch:</span>
                <span class="value">%s</span>
            </div>
            <div class="detail-row">
                <span class="label">Số tiền:</span>
                <span class="value">%s VND</span>
            </div>
        </div>
        <a href="/student/payments" class="btn btn-primary">Xem lịch sử giao dịch</a>
    </div>
</body>
</html>`,
		mapIconClass(isSuccess),
		mapIconEmoji(isSuccess),
		mapTitle(isSuccess),
		statusMsg,
		txnRef,
		formatAmount(amountStr),
	)

	c.Set(fiber.HeaderContentType, fiber.MIMETextHTMLCharsetUTF8)
	return c.SendString(htmlContent)
}

func (h *PaymentHandler) HandleIPN(c *fiber.Ctx) error {
	queryParams := url.Values{}
	c.Request().URI().QueryArgs().VisitAll(func(key, val []byte) {
		queryParams.Set(string(key), string(val))
	})

	resp, err := h.useCase.ProcessIPN(c.Context(), queryParams)
	if err != nil {
		logger.Log.Sugar().Infof("IPN processing error: %v", err)
	}

	return c.Status(fiber.StatusOK).JSON(resp)
}

func mapIconClass(s bool) string {
	if s {
		return "success-icon"
	}
	return "error-icon"
}

func mapIconEmoji(s bool) string {
	if s {
		return "✓"
	}
	return "✗"
}

func mapTitle(s bool) string {
	if s {
		return "Thanh toán thành công"
	}
	return "Thanh toán thất bại"
}

func formatAmount(amountStr string) string {
	val, err := strconv.ParseInt(amountStr, 10, 64)
	if err != nil {
		return amountStr
	}
	amountVND := val / 100

	s := strconv.FormatInt(amountVND, 10)
	var result []string
	for len(s) > 3 {
		result = append([]string{s[len(s)-3:]}, result...)
		s = s[:len(s)-3]
	}
	if len(s) > 0 {
		result = append([]string{s}, result...)
	}
	return strings.Join(result, ",")
}

func (h *PaymentHandler) GetPaymentHistory(c *fiber.Ctx) error {
	studentID, err := h.getStudentID(c)
	if err != nil {
		return err
	}

	orders, err := h.useCase.GetPaymentHistory(c.Context(), studentID)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"orders":  orders,
	})
}

func (h *PaymentHandler) DownloadInvoice(c *fiber.Ctx) error {
	studentID, err := h.getStudentID(c)
	if err != nil {
		return err
	}

	orderIDStr := c.Params("id")
	orderID, err := strconv.ParseUint(orderIDStr, 10, 32)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid order ID format")
	}

	pdfBytes, err := h.useCase.GenerateInvoicePDF(c.Context(), uint(orderID), studentID)
	if err != nil {
		return err
	}

	c.Set(fiber.HeaderContentType, "application/pdf")
	c.Set(fiber.HeaderContentDisposition, fmt.Sprintf("attachment; filename=invoice_%d.pdf", orderID))
	return c.Send(pdfBytes)
}

func (h *PaymentHandler) AdminListTransactions(c *fiber.Ctx) error {
	page, err := strconv.Atoi(c.Query("page", "1"))
	if err != nil || page < 1 {
		page = 1
	}

	limit, err := strconv.Atoi(c.Query("limit", "10"))
	if err != nil || limit < 1 {
		limit = 10
	}

	status := c.Query("status", "")
	search := c.Query("search", "")

	orders, total, err := h.useCase.ListAllTransactions(c.Context(), page, limit, status, search)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success":      true,
		"transactions": orders,
		"total":        total,
		"page":         page,
		"limit":        limit,
	})
}

func (h *PaymentHandler) ListTeacherTransactions(c *fiber.Ctx) error {
	teacherIDVal := c.Locals("user_id")
	teacherID, ok := teacherIDVal.(uint)
	if !ok {
		return fiber.NewError(fiber.StatusUnauthorized, "invalid teacher session")
	}

	page, err := strconv.Atoi(c.Query("page", "1"))
	if err != nil || page < 1 {
		page = 1
	}

	limit, err := strconv.Atoi(c.Query("limit", "10"))
	if err != nil || limit < 1 {
		limit = 10
	}

	items, total, err := h.useCase.ListTeacherTransactions(c.Context(), teacherID, page, limit)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success":      true,
		"transactions": items,
		"total":        total,
		"page":         page,
		"limit":        limit,
	})
}

func (h *PaymentHandler) AdminRefundOrder(c *fiber.Ctx) error {
	orderIDStr := c.Params("id")
	orderID, err := strconv.ParseUint(orderIDStr, 10, 32)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid order ID format")
	}

	err = h.useCase.RefundOrder(c.Context(), uint(orderID))
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "Giao dịch đã được hoàn tiền và thu hồi đăng ký thành công",
	})
}

func (h *PaymentHandler) AdminExportTransactions(c *fiber.Ctx) error {
	status := c.Query("status", "")
	search := c.Query("search", "")

	// Fetch all transactions matching filters (using a very high limit)
	orders, _, err := h.useCase.ListAllTransactions(c.Context(), 1, 1000000, status, search)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Lỗi khi lấy dữ liệu xuất báo cáo")
	}

	c.Set("Content-Type", "text/csv; charset=utf-8")
	c.Set("Content-Disposition", "attachment; filename=transactions_report.csv")

	// Use c.Response().BodyWriter() to write stream, or just return a buffer
	var buf bytes.Buffer
	// Write UTF-8 BOM
	buf.Write([]byte{0xEF, 0xBB, 0xBF})

	writer := csv.NewWriter(&buf)
	writer.Comma = ';' // Sử dụng dấu chấm phẩy cho máy dùng Region Tiếng Việt
	writer.UseCRLF = true // Excel thích dùng \r\n
	
	// CSV Header
	writer.Write([]string{"Mã Giao Dịch", "Ngày Tạo", "Tên Học Viên", "Tổng Tiền (VND)", "Trạng Thái", "Khuyến Mãi"})

	for _, order := range orders {
		dateStr := order.CreatedAt.Format("2006-01-02 15:04:05")
		
		statusStr := "Chờ xử lý"
		switch order.Status {
		case "paid":
			statusStr = "Đã thanh toán"
		case "failed":
			statusStr = "Thất bại"
		case "refunded":
			statusStr = "Đã hoàn tiền"
		}

		couponStr := order.CouponCode
		if couponStr == "" {
			couponStr = "Không"
		}
		
		studentName := fmt.Sprintf("ID: %d", order.StudentID)
		if order.Student != nil {
			studentName = order.Student.Name
		}

		writer.Write([]string{
			order.TxnRef,
			dateStr,
			studentName,
			fmt.Sprintf("%.0f", order.TotalAmount),
			statusStr,
			couponStr,
		})
	}
	
	writer.Flush()
	
	return c.Send(buf.Bytes())
}

// -------------------------------------------------------------
// Withdrawal Handlers
// -------------------------------------------------------------

func (h *PaymentHandler) GetTeacherBalance(c *fiber.Ctx) error {
	val := c.Locals("user_id")
	teacherID, ok := val.(uint)
	if !ok {
		return fiber.NewError(fiber.StatusUnauthorized, "invalid authorization token")
	}

	totalRevenue, totalWithdrawn, available, err := h.useCase.GetTeacherBalance(c.Context(), teacherID)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Không thể lấy thông tin thu nhập")
	}

	return c.JSON(fiber.Map{
		"total_revenue":   totalRevenue,
		"total_withdrawn": totalWithdrawn,
		"available":       available,
	})
}

func (h *PaymentHandler) RequestWithdrawal(c *fiber.Ctx) error {
	val := c.Locals("user_id")
	teacherID, ok := val.(uint)
	if !ok {
		return fiber.NewError(fiber.StatusUnauthorized, "invalid authorization token")
	}
	valTenant := c.Locals("token_tenant_id")
	tenantID, _ := valTenant.(uint)

	var req models.Withdrawal
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Dữ liệu không hợp lệ")
	}

	req.TeacherID = teacherID
	req.TenantID = tenantID

	if err := h.useCase.RequestWithdrawal(c.Context(), &req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(req)
}

func (h *PaymentHandler) GetTeacherWithdrawals(c *fiber.Ctx) error {
	val := c.Locals("user_id")
	teacherID, ok := val.(uint)
	if !ok {
		return fiber.NewError(fiber.StatusUnauthorized, "invalid authorization token")
	}
	list, err := h.useCase.GetTeacherWithdrawals(c.Context(), teacherID)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Lỗi lấy danh sách rút tiền")
	}
	return c.JSON(list)
}

func (h *PaymentHandler) GetAdminWithdrawals(c *fiber.Ctx) error {
	status := c.Query("status", "")
	list, err := h.useCase.GetAdminWithdrawals(c.Context(), status)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Lỗi lấy danh sách rút tiền")
	}
	return c.JSON(list)
}

func (h *PaymentHandler) UpdateWithdrawalStatus(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ID không hợp lệ")
	}

	var req struct {
		Status    string `json:"status"`
		AdminNote string `json:"admin_note"`
	}
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Dữ liệu không hợp lệ")
	}

	if err := h.useCase.ProcessWithdrawal(c.Context(), uint(id), req.Status, req.AdminNote); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "Cập nhật thành công"})
}

type MockSuccessRequest struct {
	TxnRef string `json:"txn_ref"`
}

func (h *PaymentHandler) MockSuccess(c *fiber.Ctx) error {
	studentID, err := h.getStudentID(c)
	if err != nil {
		return err
	}

	var req MockSuccessRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body format")
	}

	if req.TxnRef == "" {
		return fiber.NewError(fiber.StatusBadRequest, "txn_ref is required")
	}

	err = h.useCase.ProcessMockPayment(c.Context(), studentID, req.TxnRef)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "Thanh toán giả lập thành công, khóa học đã được kích hoạt",
	})
}

