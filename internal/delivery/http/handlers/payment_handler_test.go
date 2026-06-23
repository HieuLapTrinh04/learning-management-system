package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"github.com/HieuLapTrinh04/learning-management-system/internal/usecase"
	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
)

// --- MOCK USECASE ---

type MockPaymentUseCase struct {
	MockCreateCheckoutUrl func(ctx context.Context, studentID uint, courseIDs []uint, clientIP string) (string, error)
	MockProcessIPN        func(ctx context.Context, queryParams url.Values) (usecase.IPNResponse, error)
	MockGetPaymentHistory func(ctx context.Context, studentID uint) ([]models.Order, error)
	MockGenerateInvoicePDF func(ctx context.Context, orderID uint, studentID uint) ([]byte, error)
	MockListAllTransactions   func(ctx context.Context, page, limit int, status, search string) ([]models.Order, int64, error)
	MockRefundOrder           func(ctx context.Context, orderID uint) error
	MockProcessMockPayment    func(ctx context.Context, studentID uint, txnRef string) error
}

func (m *MockPaymentUseCase) CreateCheckoutUrl(ctx context.Context, studentID uint, courseIDs []uint, clientIP string) (string, error) {
	return m.MockCreateCheckoutUrl(ctx, studentID, courseIDs, clientIP)
}

func (m *MockPaymentUseCase) ProcessIPN(ctx context.Context, queryParams url.Values) (usecase.IPNResponse, error) {
	return m.MockProcessIPN(ctx, queryParams)
}

func (m *MockPaymentUseCase) GetPaymentHistory(ctx context.Context, studentID uint) ([]models.Order, error) {
	if m.MockGetPaymentHistory != nil {
		return m.MockGetPaymentHistory(ctx, studentID)
	}
	return nil, nil
}

func (m *MockPaymentUseCase) GenerateInvoicePDF(ctx context.Context, orderID uint, studentID uint) ([]byte, error) {
	if m.MockGenerateInvoicePDF != nil {
		return m.MockGenerateInvoicePDF(ctx, orderID, studentID)
	}
	return nil, nil
}

func (m *MockPaymentUseCase) ListAllTransactions(ctx context.Context, page, limit int, status, search string) ([]models.Order, int64, error) {
	if m.MockListAllTransactions != nil {
		return m.MockListAllTransactions(ctx, page, limit, status, search)
	}
	return nil, 0, nil
}

func (m *MockPaymentUseCase) RefundOrder(ctx context.Context, orderID uint) error {
	if m.MockRefundOrder != nil {
		return m.MockRefundOrder(ctx, orderID)
	}
	return nil
}

func (m *MockPaymentUseCase) ProcessMockPayment(ctx context.Context, studentID uint, txnRef string) error {
	if m.MockProcessMockPayment != nil {
		return m.MockProcessMockPayment(ctx, studentID, txnRef)
	}
	return nil
}

// --- TEST CASES ---

func TestPaymentHandler_HandleIPN(t *testing.T) {
	// 1. Setup mock Usecase
	mockUseCase := &MockPaymentUseCase{}
	
	mockUseCase.MockProcessIPN = func(ctx context.Context, queryParams url.Values) (usecase.IPNResponse, error) {
		assert.Equal(t, "00", queryParams.Get("vnp_ResponseCode"))
		assert.Equal(t, "TXN9999", queryParams.Get("vnp_TxnRef"))
		
		return usecase.IPNResponse{
			RspCode: "00",
			Message: "Confirm Success",
		}, nil
	}

	// 2. Setup Fiber & Handler
	app := fiber.New()
	handler := NewPaymentHandler(mockUseCase)

	app.Get("/api/v1/payments/vnpay-ipn", handler.HandleIPN)

	// 3. Perform simulated callback request
	req := httptest.NewRequest(http.MethodGet, "/api/v1/payments/vnpay-ipn?vnp_ResponseCode=00&vnp_TxnRef=TXN9999&vnp_SecureHash=mockhash", nil)
	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	// Decode response body
	var body map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&body)
	assert.NoError(t, err)
	assert.Equal(t, "00", body["RspCode"])
	assert.Equal(t, "Confirm Success", body["Message"])
}

func TestPaymentHandler_Checkout(t *testing.T) {
	mockUseCase := &MockPaymentUseCase{}
	mockUseCase.MockCreateCheckoutUrl = func(ctx context.Context, studentID uint, courseIDs []uint, clientIP string) (string, error) {
		assert.Equal(t, uint(100), studentID)
		assert.Equal(t, []uint{1, 2}, courseIDs)
		return "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=100000", nil
	}

	app := fiber.New()
	handler := NewPaymentHandler(mockUseCase)

	// We apply a mock middleware to inject local student_id context
	injectStudentContext := func(c *fiber.Ctx) error {
		c.Locals("user_id", uint(100))
		return c.Next()
	}

	app.Post("/api/v1/student/payments/checkout", injectStudentContext, handler.Checkout)

	// Perform simulated checkout post request
	reqBody := `{"course_ids": [1, 2]}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/student/payments/checkout", strings.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")

	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	var body map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&body)
	assert.NoError(t, err)
	assert.True(t, body["success"].(bool))
	assert.Equal(t, "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=100000", body["payment_url"])
}
