package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/HieuLapTrinh04/learning-management-system/internal/config"
	"github.com/HieuLapTrinh04/learning-management-system/internal/middleware"
	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
)

// --- MOCK AUTH USECASE ---

type MockAuthUseCase struct {
	MockRegister       func(ctx context.Context, name, email, password, role string) error
	MockLogin          func(ctx context.Context, email, password string) (string, string, error)
	MockLogout         func(ctx context.Context, refreshToken string) error
	MockRefreshToken   func(ctx context.Context, oldRefreshToken string) (string, string, error)
	MockVerifyEmail    func(ctx context.Context, token string) error
	MockForgotPassword func(ctx context.Context, email string) error
	MockResetPassword  func(ctx context.Context, token, newPassword string) error
}

func (m *MockAuthUseCase) Register(ctx context.Context, name, email, password, role string) error {
	return m.MockRegister(ctx, name, email, password, role)
}
func (m *MockAuthUseCase) Login(ctx context.Context, email, password string) (string, string, error) {
	return m.MockLogin(ctx, email, password)
}
func (m *MockAuthUseCase) Logout(ctx context.Context, refreshToken string) error {
	return m.MockLogout(ctx, refreshToken)
}
func (m *MockAuthUseCase) RefreshToken(ctx context.Context, oldRefreshToken string) (string, string, error) {
	return m.MockRefreshToken(ctx, oldRefreshToken)
}
func (m *MockAuthUseCase) VerifyEmail(ctx context.Context, token string) error {
	return m.MockVerifyEmail(ctx, token)
}
func (m *MockAuthUseCase) ForgotPassword(ctx context.Context, email string) error {
	return m.MockForgotPassword(ctx, email)
}
func (m *MockAuthUseCase) ResetPassword(ctx context.Context, token, newPassword string) error {
	return m.MockResetPassword(ctx, token, newPassword)
}

// --- TEST CASES ---

func TestAuthHandler_Register_Success(t *testing.T) {
	mockUC := &MockAuthUseCase{}
	cfg := &config.Config{}

	mockUC.MockRegister = func(ctx context.Context, name, email, password, role string) error {
		assert.Equal(t, "Alice", name)
		assert.Equal(t, "alice@lms.edu.vn", email)
		return nil
	}

	app := fiber.New(fiber.Config{
		ErrorHandler: middleware.GlobalErrorHandler,
	})
	handler := NewAuthHandler(mockUC, cfg)
	app.Post("/api/v1/auth/register", handler.Register)

	reqBody := `{"name": "Alice", "email": "alice@lms.edu.vn", "password": "securepass123", "role": "student"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", strings.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")

	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, http.StatusCreated, resp.StatusCode)

	var body map[string]interface{}
	_ = json.NewDecoder(resp.Body).Decode(&body)
	assert.True(t, body["success"].(bool))
}

func TestAuthHandler_Register_ValidationError(t *testing.T) {
	mockUC := &MockAuthUseCase{}
	cfg := &config.Config{}

	app := fiber.New(fiber.Config{
		ErrorHandler: middleware.GlobalErrorHandler,
	})
	handler := NewAuthHandler(mockUC, cfg)
	app.Post("/api/v1/auth/register", handler.Register)

	// Password too short (< 8 chars)
	reqBody := `{"name": "Alice", "email": "alice@lms.edu.vn", "password": "short", "role": "student"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", strings.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")

	resp, err := app.Test(req)
	assert.NoError(t, err)
	// Fiber validation returns unprocessable entity (422) via GlobalErrorHandler
	assert.Equal(t, http.StatusUnprocessableEntity, resp.StatusCode)
}

func TestAuthHandler_Login_Success(t *testing.T) {
	mockUC := &MockAuthUseCase{}
	cfg := &config.Config{
		JWTRefreshExpiryDays: 7,
	}

	mockUC.MockLogin = func(ctx context.Context, email, password string) (string, string, error) {
		return "mock_access_token", "mock_refresh_token", nil
	}

	app := fiber.New(fiber.Config{
		ErrorHandler: middleware.GlobalErrorHandler,
	})
	handler := NewAuthHandler(mockUC, cfg)
	app.Post("/api/v1/auth/login", handler.Login)

	reqBody := `{"email": "alice@lms.edu.vn", "password": "securepass123"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", strings.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")

	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	var body map[string]interface{}
	_ = json.NewDecoder(resp.Body).Decode(&body)
	assert.True(t, body["success"].(bool))
	
	// Access token in body
	data := body["data"].(map[string]interface{})
	assert.Equal(t, "mock_access_token", data["access_token"])
}
