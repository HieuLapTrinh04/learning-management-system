package usecase

import (
	"context"
	"net/url"
	"testing"

	"github.com/HieuLapTrinh04/learning-management-system/internal/config"
	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"github.com/stretchr/testify/assert"
	"gorm.io/gorm"
)

// --- MOCK PAYMENT REPOSITORY ---

type MockPaymentRepository struct {
	MockCreateOrder           func(order *models.Order) error
	MockCreateOrderItems      func(items []models.OrderItem) error
	MockGetOrderByTxnRef      func(txnRef string) (*models.Order, error)
	MockGetOrderByID          func(id uint) (*models.Order, error)
	MockGetOrderByIDWithItems func(id uint) (*models.Order, error)
	MockUpdateOrder           func(order *models.Order) error
	MockListOrderItems        func(orderID uint) ([]models.OrderItem, error)
	MockCreateOrderWithItems  func(order *models.Order, items []models.OrderItem) error
	MockSettleOrder           func(orderID uint, status string, enrollments []models.Enrollment) error
	MockListOrdersByStudentID func(studentID uint) ([]models.Order, error)
	MockListAllTransactions   func(page, limit int, status, search string) ([]models.Order, int64, error)
	MockRefundOrder           func(orderID uint) error
}

func (m *MockPaymentRepository) CreateOrder(ctx context.Context, o *models.Order) error {
	if m.MockCreateOrder != nil {
		return m.MockCreateOrder(o)
	}
	return nil
}
func (m *MockPaymentRepository) CreateOrderItems(ctx context.Context, i []models.OrderItem) error {
	if m.MockCreateOrderItems != nil {
		return m.MockCreateOrderItems(i)
	}
	return nil
}
func (m *MockPaymentRepository) GetOrderByTxnRef(ctx context.Context, t string) (*models.Order, error) {
	return m.MockGetOrderByTxnRef(t)
}
func (m *MockPaymentRepository) GetOrderByID(ctx context.Context, id uint) (*models.Order, error) {
	if m.MockGetOrderByID != nil {
		return m.MockGetOrderByID(id)
	}
	return nil, nil
}
func (m *MockPaymentRepository) UpdateOrder(ctx context.Context, o *models.Order) error {
	if m.MockUpdateOrder != nil {
		return m.MockUpdateOrder(o)
	}
	return nil
}
func (m *MockPaymentRepository) ListOrderItems(ctx context.Context, id uint) ([]models.OrderItem, error) {
	if m.MockListOrderItems != nil {
		return m.MockListOrderItems(id)
	}
	return nil, nil
}
func (m *MockPaymentRepository) CreateOrderWithItems(ctx context.Context, o *models.Order, items []models.OrderItem) error {
	return m.MockCreateOrderWithItems(o, items)
}
func (m *MockPaymentRepository) SettleOrder(ctx context.Context, id uint, status string, e []models.Enrollment) error {
	return m.MockSettleOrder(id, status, e)
}
func (m *MockPaymentRepository) ListOrdersByStudentID(ctx context.Context, s uint) ([]models.Order, error) {
	return m.MockListOrdersByStudentID(s)
}
func (m *MockPaymentRepository) GetOrderByIDWithItems(ctx context.Context, id uint) (*models.Order, error) {
	if m.MockGetOrderByIDWithItems != nil {
		return m.MockGetOrderByIDWithItems(id)
	}
	return nil, nil
}
func (m *MockPaymentRepository) ListAllTransactions(ctx context.Context, page, limit int, status, search string) ([]models.Order, int64, error) {
	if m.MockListAllTransactions != nil {
		return m.MockListAllTransactions(page, limit, status, search)
	}
	return nil, 0, nil
}
func (m *MockPaymentRepository) RefundOrder(ctx context.Context, orderID uint) error {
	if m.MockRefundOrder != nil {
		return m.MockRefundOrder(orderID)
	}
	return nil
}

func (m *MockPaymentRepository) GetTeacherBalance(ctx context.Context, teacherID uint) (float64, float64, error) {
	return 0, 0, nil
}
func (m *MockPaymentRepository) CreateWithdrawal(ctx context.Context, withdrawal *models.Withdrawal) error {
	return nil
}
func (m *MockPaymentRepository) ListTeacherWithdrawals(ctx context.Context, teacherID uint) ([]models.Withdrawal, error) {
	return nil, nil
}
func (m *MockPaymentRepository) ListAdminWithdrawals(ctx context.Context, status string) ([]models.Withdrawal, error) {
	return nil, nil
}
func (m *MockPaymentRepository) UpdateWithdrawalStatus(ctx context.Context, id uint, status, adminNote string) error {
	return nil
}
func (m *MockPaymentRepository) ListTeacherTransactions(ctx context.Context, teacherID uint, page, limit int) ([]models.OrderItem, int64, error) {
	return nil, 0, nil
}

// --- TEST CASES ---

func TestPaymentUseCase_CreateCheckoutUrl_Success(t *testing.T) {
	paymentRepo := &MockPaymentRepository{}
	courseRepo := &MockCourseRepository{}
	enrollmentRepo := &MockEnrollmentRepository{}
	notificationUC := &MockNotificationUseCase{}
	cfg := &config.Config{
		VNPayTmnCode:    "TMNCODE",
		VNPayHashSecret: "SECRET",
		VNPayURL:        "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
		VNPayReturnURL:  "http://localhost/payment/callback",
	}

	courseRepo.MockGetByID = func(id uint) (*models.Course, error) {
		return &models.Course{
			ID:     id,
			Title:  "Paid Course",
			Price:  100000,
			Status: "published",
		}, nil
	}

	enrollmentRepo.MockGetByStudentAndCourse = func(s, c uint) (*models.Enrollment, error) {
		return nil, gorm.ErrRecordNotFound
	}

	paymentRepo.MockCreateOrderWithItems = func(o *models.Order, items []models.OrderItem) error {
		assert.Equal(t, uint(9), o.StudentID)
		assert.Equal(t, 100000.0, o.TotalAmount)
		assert.Equal(t, "pending", o.Status)
		return nil
	}

	uc := NewPaymentUseCase(paymentRepo, courseRepo, enrollmentRepo, nil, notificationUC, &MockEmailService{}, &MockAuditLogUseCase{}, cfg)
	checkoutUrl, err := uc.CreateCheckoutUrl(context.Background(), 9, []uint{1}, "127.0.0.1")

	assert.NoError(t, err)
	assert.NotEmpty(t, checkoutUrl)
	assert.Contains(t, checkoutUrl, "vnp_TmnCode=TMNCODE")
}

func TestPaymentUseCase_ProcessIPN_InvalidSignature(t *testing.T) {
	paymentRepo := &MockPaymentRepository{}
	courseRepo := &MockCourseRepository{}
	enrollmentRepo := &MockEnrollmentRepository{}
	notificationUC := &MockNotificationUseCase{}
	cfg := &config.Config{
		VNPayHashSecret: "SECRET",
	}

	uc := NewPaymentUseCase(paymentRepo, courseRepo, enrollmentRepo, nil, notificationUC, &MockEmailService{}, &MockAuditLogUseCase{}, cfg)

	// Create mock query params without signature hash
	params := url.Values{}
	params.Set("vnp_TxnRef", "TXN12345")
	params.Set("vnp_Amount", "10000000") // 100,000 VND
	params.Set("vnp_ResponseCode", "00")
	params.Set("vnp_SecureHash", "wronghash")

	resp, err := uc.ProcessIPN(context.Background(), params)
	assert.NoError(t, err)
	assert.Equal(t, "97", resp.RspCode) // 97 is Signature mismatch code in VNPay standard
}
