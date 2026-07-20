package usecase

import (
	"context"
	"errors"
	"fmt"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/HieuLapTrinh04/learning-management-system/internal/apperrors"
	"github.com/HieuLapTrinh04/learning-management-system/internal/config"
	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"github.com/HieuLapTrinh04/learning-management-system/internal/repository"
	"github.com/HieuLapTrinh04/learning-management-system/internal/utils"
	"github.com/chromedp/cdproto/page"
	"github.com/chromedp/chromedp"
	"gorm.io/gorm"
)

type IPNResponse struct {
	RspCode string `json:"RspCode"`
	Message string `json:"Message"`
}

type PaymentUseCase interface {
	CreateCheckoutUrl(ctx context.Context, studentID uint, courseIDs []uint, clientIP string) (string, error)
	ProcessIPN(ctx context.Context, params url.Values) (IPNResponse, error)
	GetPaymentHistory(ctx context.Context, studentID uint) ([]models.Order, error)
	GenerateInvoicePDF(ctx context.Context, orderID uint, studentID uint) ([]byte, error)
	ListAllTransactions(ctx context.Context, page, limit int, status, search string) ([]models.Order, int64, error)
	ListTeacherTransactions(ctx context.Context, teacherID uint, page, limit int) ([]models.OrderItem, int64, error)
	RefundOrder(ctx context.Context, orderID uint) error
	ProcessMockPayment(ctx context.Context, studentID uint, txnRef string) error

	// Withdrawal
	GetTeacherBalance(ctx context.Context, teacherID uint) (float64, float64, float64, error)
	RequestWithdrawal(ctx context.Context, req *models.Withdrawal) error
	GetTeacherWithdrawals(ctx context.Context, teacherID uint) ([]models.Withdrawal, error)
	GetAdminWithdrawals(ctx context.Context, status string) ([]models.Withdrawal, error)
	ProcessWithdrawal(ctx context.Context, id uint, status, adminNote string) error
}

type paymentUseCase struct {
	paymentRepo         repository.PaymentRepository
	courseRepo          repository.CourseRepository
	enrollmentRepo      repository.EnrollmentRepository
	userRepo            repository.UserRepository
	notificationUseCase NotificationUseCase
	emailSvc            utils.EmailService
	auditSvc            AuditLogUseCase
	cfg                 *config.Config
}

func NewPaymentUseCase(
	paymentRepo repository.PaymentRepository,
	courseRepo repository.CourseRepository,
	enrollmentRepo repository.EnrollmentRepository,
	userRepo repository.UserRepository,
	notificationUseCase NotificationUseCase,
	emailSvc utils.EmailService,
	auditSvc AuditLogUseCase,
	cfg *config.Config,
) PaymentUseCase {
	return &paymentUseCase{
		paymentRepo:         paymentRepo,
		courseRepo:          courseRepo,
		enrollmentRepo:      enrollmentRepo,
		userRepo:            userRepo,
		notificationUseCase: notificationUseCase,
		emailSvc:            emailSvc,
		auditSvc:            auditSvc,
		cfg:                 cfg,
	}
}

func (u *paymentUseCase) CreateCheckoutUrl(ctx context.Context, studentID uint, courseIDs []uint, clientIP string) (string, error) {
	if len(courseIDs) == 0 {
		return "", apperrors.NewAppError(apperrors.TypeValidation, "course_ids cannot be empty", nil)
	}

	var courses []models.Course
	var totalAmount float64

	// 1. Verify course validation & check current enrollments
	for _, cid := range courseIDs {
		course, err := u.courseRepo.GetByID(ctx, cid)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return "", apperrors.NewAppError(apperrors.TypeNotFound, fmt.Sprintf("course %d not found", cid), err)
			}
			return "", apperrors.NewAppError(apperrors.TypeInternal, "database error searching course", err)
		}

		if course.Status != "published" {
			return "", apperrors.NewAppError(apperrors.TypeForbidden, fmt.Sprintf("cannot purchase: course %d is not published", cid), nil)
		}

		// Prevent buying courses student is already enrolled in
		existing, err := u.enrollmentRepo.GetByStudentAndCourse(ctx, studentID, cid)
		if err == nil && existing != nil {
			return "", apperrors.NewAppError(apperrors.TypeConflict, fmt.Sprintf("you are already enrolled in course: %s", course.Title), nil)
		}

		courses = append(courses, *course)
		totalAmount += course.Price
	}

	if totalAmount <= 0 {
		return "", apperrors.NewAppError(apperrors.TypeValidation, "total amount must be greater than zero", nil)
	}

	// 2. Generate transaction reference
	txnRef := fmt.Sprintf("LMS%dTXN%d", studentID, time.Now().UnixNano()/1e6)

	// 3. Construct models & save using transaction block
	order := &models.Order{
		StudentID:   studentID,
		TotalAmount: totalAmount,
		Status:      "pending",
		TxnRef:      txnRef,
	}

	var orderItems []models.OrderItem
	for _, c := range courses {
		orderItems = append(orderItems, models.OrderItem{
			CourseID:       c.ID,
			Price:          c.Price,
			FinalPrice:     c.Price, // No discounts in direct checkout currently
			TeacherRevenue: c.Price * 0.7,
		})
	}

	err := u.paymentRepo.CreateOrderWithItems(ctx, order, orderItems)
	if err != nil {
		return "", apperrors.NewAppError(apperrors.TypeInternal, "failed to create payment order ledger logs", err)
	}

	// 4. Formulate sandbox parameters & sign redirection link
	loc := time.FixedZone("GMT+7", 7*60*60)
	nowInVN := time.Now().In(loc)

	vnpayParams := url.Values{}
	vnpayParams.Set("vnp_Version", "2.1.0")
	vnpayParams.Set("vnp_Command", "pay")
	vnpayParams.Set("vnp_TmnCode", strings.TrimSpace(u.cfg.VNPayTmnCode))
	vnpayParams.Set("vnp_Amount", fmt.Sprintf("%d", int64(totalAmount*100)))
	vnpayParams.Set("vnp_CreateDate", nowInVN.Format("20060102150405"))
	vnpayParams.Set("vnp_CurrCode", "VND")
	vnpayParams.Set("vnp_IpAddr", clientIP)
	vnpayParams.Set("vnp_Locale", "vn")
	vnpayParams.Set("vnp_OrderInfo", fmt.Sprintf("Thanh toan don hang %s", txnRef))
	vnpayParams.Set("vnp_OrderType", "other")
	vnpayParams.Set("vnp_ReturnUrl", u.cfg.VNPayReturnURL)
	vnpayParams.Set("vnp_TxnRef", txnRef)

	checkoutUrl := utils.BuildVNPayURL(u.cfg.VNPayURL, u.cfg.VNPayHashSecret, vnpayParams)
	return checkoutUrl, nil
}

func (u *paymentUseCase) ProcessIPN(ctx context.Context, params url.Values) (IPNResponse, error) {
	// 1. Signature check
	if !utils.VerifyVNPayHash(u.cfg.VNPayHashSecret, params) {
		return IPNResponse{RspCode: "97", Message: "Invalid signature"}, nil
	}

	// 2. Fetch TxnRef & retrieve order
	txnRef := params.Get("vnp_TxnRef")
	order, err := u.paymentRepo.GetOrderByTxnRef(ctx, txnRef)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return IPNResponse{RspCode: "01", Message: "Order not found"}, nil
		}
		return IPNResponse{RspCode: "99", Message: "Database error retrieving order"}, err
	}

	// 3. Amount checking (adjusted for scale * 100)
	vnpAmountStr := params.Get("vnp_Amount")
	vnpAmountInt, err := strconv.ParseInt(vnpAmountStr, 10, 64)
	if err != nil {
		return IPNResponse{RspCode: "04", Message: "Invalid amount format"}, nil
	}

	orderAmountInt := int64(order.TotalAmount * 100)
	if orderAmountInt != vnpAmountInt {
		return IPNResponse{RspCode: "04", Message: "Amount mismatch"}, nil
	}

	// 4. State Safety: Ensure status is still pending
	if order.Status != "pending" {
		return IPNResponse{RspCode: "02", Message: "Order already confirmed"}, nil
	}

	// 5. Handle settlement status
	responseCode := params.Get("vnp_ResponseCode")
	var enrollments []models.Enrollment
	var targetStatus string

	if responseCode == "00" {
		targetStatus = "paid"
		for _, item := range order.OrderItems {
			enrollments = append(enrollments, models.Enrollment{
				StudentID:          order.StudentID,
				CourseID:           item.CourseID,
				ProgressPercentage: 0,
				EnrolledAt:         time.Now(),
			})

			// Preload/Query course details to send proper course title in notification
			courseTitle := fmt.Sprintf("Mã khóa học #%d", item.CourseID)
			if c, errCourse := u.courseRepo.GetByID(ctx, item.CourseID); errCourse == nil && c != nil {
				courseTitle = c.Title
			}
			_ = u.notificationUseCase.SendNotification(ctx, order.StudentID, "Đăng ký khóa học thành công", fmt.Sprintf("Bạn đã đăng ký thành công khóa học: %s", courseTitle))

			// Send enrollment success email
			student, err := u.userRepo.GetByID(ctx, order.StudentID)
			if err == nil && student != nil {
				amountStr := fmt.Sprintf("%d", int64(order.TotalAmount))
				go func(toEmail, toName, cName, amt string) {
					_ = u.emailSvc.SendCoursePurchaseEmail(toEmail, toName, cName, amt)
				}(student.Email, student.Name, courseTitle, amountStr)
			}
		}

		// Send Payment Success notification
		_ = u.notificationUseCase.SendNotification(ctx, order.StudentID, "Thanh toán thành công", fmt.Sprintf("Đơn hàng %s của bạn đã được thanh toán thành công!", order.TxnRef))
	} else {
		targetStatus = "failed"
	}

	err = u.paymentRepo.SettleOrder(ctx, order.ID, targetStatus, enrollments)
	if err != nil {
		return IPNResponse{RspCode: "99", Message: "Failed to settle database records"}, err
	}

	// Generate final success notification
	if targetStatus == "paid" {
		go u.auditSvc.LogEvent(ctx, &order.StudentID, "PAYMENT_SUCCESS", "Order", &order.ID, fmt.Sprintf("Payment completed for order #%s", order.TxnRef), "")
	} else {
		go u.auditSvc.LogEvent(ctx, &order.StudentID, "PAYMENT_FAILED", "Order", &order.ID, fmt.Sprintf("Payment failed for order #%s", order.TxnRef), "")
	}

	return IPNResponse{RspCode: "00", Message: "Confirm success"}, nil
}

func (u *paymentUseCase) GetPaymentHistory(ctx context.Context, studentID uint) ([]models.Order, error) {
	orders, err := u.paymentRepo.ListOrdersByStudentID(ctx, studentID)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "failed to fetch payment history", err)
	}
	return orders, nil
}

func (u *paymentUseCase) GenerateInvoicePDF(ctx context.Context, orderID uint, studentID uint) ([]byte, error) {
	order, err := u.paymentRepo.GetOrderByIDWithItems(ctx, orderID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperrors.NewAppError(apperrors.TypeNotFound, "order not found", err)
		}
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "failed to query order details", err)
	}

	// Verify ownership: only student who owns the order (or we can allow admins, but here studentID must match)
	// We can check if studentID matches order.StudentID.
	if order.StudentID != studentID {
		return nil, apperrors.NewAppError(apperrors.TypeForbidden, "you do not have access to this invoice", nil)
	}

	createdDateFormatted := order.CreatedAt.Format("02/01/2006 15:04:05")
	var paidDateFormatted string = "Chưa thanh toán"
	if order.PaidAt != nil {
		paidDateFormatted = order.PaidAt.Format("02/01/2006 15:04:05")
	}

	var itemRows strings.Builder
	for idx, item := range order.OrderItems {
		itemRows.WriteString(fmt.Sprintf(`
			<tr class="border-b border-slate-100 hover:bg-slate-50/50">
				<td class="p-4 text-slate-800 font-semibold">%d</td>
				<td class="p-4 text-slate-700">%s</td>
				<td class="p-4 text-slate-500 font-mono">1</td>
				<td class="p-4 text-right text-slate-800 font-mono">%s đ</td>
			</tr>
		`, idx+1, item.Course.Title, fmt.Sprintf("%.0f", item.Price)))
	}

	statusText := "Chờ thanh toán"
	statusColor := "text-amber-500 bg-amber-50"
	if order.Status == "paid" {
		statusText = "Đã thanh toán"
		statusColor = "text-emerald-600 bg-emerald-50"
	} else if order.Status == "failed" {
		statusText = "Thất bại"
		statusColor = "text-red-650 bg-red-50"
	} else if order.Status == "refunded" {
		statusText = "Đã hoàn tiền"
		statusColor = "text-slate-600 bg-slate-100"
	}

	htmlTemplate := fmt.Sprintf(`<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;850&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Outfit', sans-serif; }
    </style>
</head>
<body class="bg-white p-0 m-0 w-[794px] h-[1123px] flex flex-col justify-between">
    <div class="p-12 flex-1">
        <!-- Header -->
        <div class="flex justify-between items-start border-b-2 border-slate-100 pb-8 mb-8">
            <div>
                <div class="flex items-center gap-2.5 mb-3">
                    <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center font-bold text-slate-950 text-lg">L</div>
                    <span class="font-bold text-lg text-slate-900 tracking-tight">Online LMS Platform</span>
                </div>
                <p class="text-xs text-slate-400">123 Đường Điện Biên Phủ, Quận Bình Thạnh<br>Thành phố Hồ Chí Minh, Việt Nam</p>
            </div>
            <div class="text-right">
                <h1 class="text-3xl font-black text-slate-900 tracking-tight mb-2">HÓA ĐƠN</h1>
                <span class="inline-block px-3 py-1 rounded-full text-xs font-bold %s">%s</span>
            </div>
        </div>

        <!-- Meta info -->
        <div class="grid grid-cols-2 gap-8 mb-10 text-xs">
            <div>
                <p class="font-bold text-[#A88B58] uppercase tracking-wider mb-2">Thông tin hóa đơn</p>
                <div class="space-y-1.5 text-slate-650">
                    <p><span class="font-semibold text-slate-800">Mã giao dịch:</span> %s</p>
                    <p><span class="font-semibold text-slate-800">Ngày lập hóa đơn:</span> %s</p>
                    <p><span class="font-semibold text-slate-800">Ngày thanh toán:</span> %s</p>
                </div>
            </div>
            <div class="text-right">
                <p class="font-bold text-[#A88B58] uppercase tracking-wider mb-2 text-right">Khách hàng</p>
                <div class="space-y-1.5 text-slate-650">
                    <p class="font-bold text-slate-800">Học viên #%d</p>
                    <p class="text-slate-400">Nền tảng đào tạo trực tuyến</p>
                </div>
            </div>
        </div>

        <!-- Table -->
        <div class="border border-slate-100 rounded-xl overflow-hidden mb-8">
            <table class="w-full text-left text-xs border-collapse">
                <thead>
                    <tr class="bg-slate-50 border-b border-slate-100 font-bold text-slate-550 uppercase tracking-wider">
                        <th class="p-4 w-12">#</th>
                        <th class="p-4">Tên khóa học</th>
                        <th class="p-4 w-16">SL</th>
                        <th class="p-4 w-32 text-right">Đơn giá</th>
                    </tr>
                </thead>
                <tbody>
                    %s
                </tbody>
            </table>
        </div>

        <!-- Total sum -->
        <div class="flex justify-end mb-12">
            <div class="w-64 border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-3">
                <div class="flex justify-between text-xs text-slate-500">
                    <span>Tạm tính:</span>
                    <span class="font-mono">%s đ</span>
                </div>
                <div class="flex justify-between text-xs text-slate-500">
                    <span>Thuế (0%%):</span>
                    <span class="font-mono">0 đ</span>
                </div>
                <div class="h-[1px] bg-slate-100"></div>
                <div class="flex justify-between items-center">
                    <span class="text-xs font-bold text-slate-800">Tổng cộng:</span>
                    <span class="text-base font-black text-amber-600 font-mono">%s đ</span>
                </div>
            </div>
        </div>
    </div>

    <!-- Footer signature -->
    <div class="p-12 border-t border-slate-100 flex justify-between items-end text-xs text-slate-400">
        <div>
            <p class="font-bold text-slate-800 mb-1">Cảm ơn bạn đã đồng hành cùng LMS!</p>
            <p>Hóa đơn điện tử tự động. Bản quyền thuộc Online LMS.</p>
        </div>
        <div class="text-center w-40">
            <p class="italic text-slate-800 font-bold mb-2">Hieu Lap Trinh</p>
            <div class="h-[1px] bg-slate-200 w-32 mx-auto"></div>
            <p class="text-[10px] uppercase tracking-wider text-slate-400 mt-1">Đại diện nền tảng</p>
        </div>
    </div>
</body>
</html>`, statusColor, statusText, order.TxnRef, createdDateFormatted, paidDateFormatted, order.StudentID, itemRows.String(), fmt.Sprintf("%.0f", order.TotalAmount), fmt.Sprintf("%.0f", order.TotalAmount))

	pdfBuf, err := u.renderHTMLToPDF(htmlTemplate)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "failed to render invoice PDF using chromedp", err)
	}

	return pdfBuf, nil
}

func (u *paymentUseCase) ListAllTransactions(ctx context.Context, page, limit int, status, search string) ([]models.Order, int64, error) {
	orders, total, err := u.paymentRepo.ListAllTransactions(ctx, page, limit, status, search)
	if err != nil {
		return nil, 0, apperrors.NewAppError(apperrors.TypeInternal, "failed to query transaction orders ledger logs", err)
	}
	return orders, total, nil
}

func (u *paymentUseCase) ListTeacherTransactions(ctx context.Context, teacherID uint, page, limit int) ([]models.OrderItem, int64, error) {
	items, total, err := u.paymentRepo.ListTeacherTransactions(ctx, teacherID, page, limit)
	if err != nil {
		return nil, 0, apperrors.NewAppError(apperrors.TypeInternal, "failed to fetch teacher transactions", err)
	}
	return items, total, nil
}

func (u *paymentUseCase) RefundOrder(ctx context.Context, orderID uint) error {
	order, err := u.paymentRepo.GetOrderByID(ctx, orderID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return apperrors.NewAppError(apperrors.TypeNotFound, "order not found", err)
		}
		return apperrors.NewAppError(apperrors.TypeInternal, "database error querying order for refund", err)
	}

	err = u.paymentRepo.RefundOrder(ctx, orderID)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeInternal, err.Error(), err)
	}

	// Send Refund Success notification
	_ = u.notificationUseCase.SendNotification(ctx, order.StudentID, "Giao dịch hoàn tiền thành công", fmt.Sprintf("Giao dịch %s của bạn đã được hoàn tiền thành công bởi hệ thống. Quyền truy cập các khóa học liên quan đã bị thu hồi.", order.TxnRef))

	return nil
}

func (u *paymentUseCase) ProcessMockPayment(ctx context.Context, studentID uint, txnRef string) error {
	order, err := u.paymentRepo.GetOrderByTxnRef(ctx, txnRef)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return apperrors.NewAppError(apperrors.TypeNotFound, "order not found", err)
		}
		return apperrors.NewAppError(apperrors.TypeInternal, "database error retrieving order", err)
	}

	if order.StudentID != studentID {
		return apperrors.NewAppError(apperrors.TypeForbidden, "you do not have permission to access this order", nil)
	}

	if order.Status != "pending" {
		return apperrors.NewAppError(apperrors.TypeConflict, "order already confirmed or processed", nil)
	}

	var enrollments []models.Enrollment
	targetStatus := "paid"

	for _, item := range order.OrderItems {
		enrollments = append(enrollments, models.Enrollment{
			StudentID:          order.StudentID,
			CourseID:           item.CourseID,
			ProgressPercentage: 0,
			EnrolledAt:         time.Now(),
		})

		courseTitle := fmt.Sprintf("Mã khóa học #%d", item.CourseID)
		if c, errCourse := u.courseRepo.GetByID(ctx, item.CourseID); errCourse == nil && c != nil {
			courseTitle = c.Title
		}
		_ = u.notificationUseCase.SendNotification(ctx, order.StudentID, "Đăng ký khóa học thành công", fmt.Sprintf("Bạn đã đăng ký thành công khóa học: %s", courseTitle))
	}

	// Send Payment Success notification
	_ = u.notificationUseCase.SendNotification(ctx, order.StudentID, "Thanh toán thành công (Simulated)", fmt.Sprintf("Đơn hàng %s của bạn đã được thanh toán thành công!", order.TxnRef))

	err = u.paymentRepo.SettleOrder(ctx, order.ID, targetStatus, enrollments)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeInternal, "failed to settle mock database records", err)
	}

	return nil
}

func (u *paymentUseCase) renderHTMLToPDF(htmlContent string) ([]byte, error) {
	opts := append(chromedp.DefaultExecAllocatorOptions[:],
		chromedp.NoSandbox,
		chromedp.Headless,
		chromedp.DisableGPU,
	)

	allocCtx, allocCancel := chromedp.NewExecAllocator(context.Background(), opts...)
	defer allocCancel()

	ctx, cancel := chromedp.NewContext(allocCtx)
	defer cancel()

	ctx, cancel = context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	var buf []byte
	err := chromedp.Run(ctx,
		chromedp.Navigate("data:text/html,charset=utf-8,"+url.PathEscape(htmlContent)),
		chromedp.ActionFunc(func(ctx context.Context) error {
			var err error
			buf, _, err = page.PrintToPDF().
				WithPrintBackground(true).
				WithLandscape(false).
				WithPaperWidth(8.27).
				WithPaperHeight(11.69).
				WithMarginTop(0).
				WithMarginBottom(0).
				WithMarginLeft(0).
				WithMarginRight(0).
				Do(ctx)
			return err
		}),
	)
	if err != nil {
		return nil, err
	}

	return buf, nil
}

// ------------------------------------------------------------------
// Withdrawal Methods
// ------------------------------------------------------------------

func (u *paymentUseCase) GetTeacherBalance(ctx context.Context, teacherID uint) (float64, float64, float64, error) {
	totalRevenue, totalWithdrawn, err := u.paymentRepo.GetTeacherBalance(ctx, teacherID)
	if err != nil {
		return 0, 0, 0, err
	}
	available := totalRevenue - totalWithdrawn
	if available < 0 {
		available = 0
	}
	return totalRevenue, totalWithdrawn, available, nil
}

func (u *paymentUseCase) RequestWithdrawal(ctx context.Context, req *models.Withdrawal) error {
	if req.Amount < 100000 {
		return errors.New("Số tiền rút tối thiểu là 100,000đ")
	}

	_, _, available, err := u.GetTeacherBalance(ctx, req.TeacherID)
	if err != nil {
		return err
	}

	if req.Amount > available {
		return errors.New("Số dư không đủ để thực hiện yêu cầu")
	}

	req.Status = "pending"
	req.CreatedAt = time.Now()
	req.UpdatedAt = time.Now()

	err = u.paymentRepo.CreateWithdrawal(ctx, req)
	if err == nil {
		u.auditSvc.LogEvent(ctx, &req.TeacherID, "withdraw_request", "withdrawal", &req.ID, fmt.Sprintf("Yêu cầu rút %.0fđ", req.Amount), "")
	}
	return err
}

func (u *paymentUseCase) GetTeacherWithdrawals(ctx context.Context, teacherID uint) ([]models.Withdrawal, error) {
	return u.paymentRepo.ListTeacherWithdrawals(ctx, teacherID)
}

func (u *paymentUseCase) GetAdminWithdrawals(ctx context.Context, status string) ([]models.Withdrawal, error) {
	return u.paymentRepo.ListAdminWithdrawals(ctx, status)
}

func (u *paymentUseCase) ProcessWithdrawal(ctx context.Context, id uint, status, adminNote string) error {
	if status != "approved" && status != "rejected" && status != "paid" {
		return errors.New("Trạng thái không hợp lệ")
	}
	return u.paymentRepo.UpdateWithdrawalStatus(ctx, id, status, adminNote)
}
