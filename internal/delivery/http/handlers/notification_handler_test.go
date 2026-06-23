package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
)

// --- MOCK NOTIFICATION USECASE ---

type MockNotificationUseCase2 struct {
	MockSendNotification func(ctx context.Context, userID uint, title, message string) error
	MockGetNotifications func(ctx context.Context, userID uint) ([]models.Notification, error)
	MockMarkAsRead       func(ctx context.Context, userID, notificationID uint) error
	MockMarkAllAsRead    func(ctx context.Context, userID uint) error
}

func (m *MockNotificationUseCase2) SendNotification(ctx context.Context, userID uint, title, message string) error {
	return m.MockSendNotification(ctx, userID, title, message)
}
func (m *MockNotificationUseCase2) GetNotifications(ctx context.Context, userID uint) ([]models.Notification, error) {
	return m.MockGetNotifications(ctx, userID)
}
func (m *MockNotificationUseCase2) MarkAsRead(ctx context.Context, userID, notificationID uint) error {
	return m.MockMarkAsRead(ctx, userID, notificationID)
}
func (m *MockNotificationUseCase2) MarkAllAsRead(ctx context.Context, userID uint) error {
	return m.MockMarkAllAsRead(ctx, userID)
}

// --- TEST CASES ---

func TestNotificationHandler_List_Success(t *testing.T) {
	mockUC := &MockNotificationUseCase2{}
	mockUC.MockGetNotifications = func(ctx context.Context, userID uint) ([]models.Notification, error) {
		assert.Equal(t, uint(99), userID)
		return []models.Notification{
			{ID: 1, UserID: userID, Title: "Enroll success", Message: "Msg", IsRead: false},
		}, nil
	}

	app := fiber.New()
	handler := NewNotificationHandler(mockUC, nil)

	injectStudentContext := func(c *fiber.Ctx) error {
		c.Locals("user_id", uint(99))
		return c.Next()
	}

	app.Get("/api/v1/notifications", injectStudentContext, handler.List)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/notifications", nil)
	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	var body map[string]interface{}
	_ = json.NewDecoder(resp.Body).Decode(&body)
	assert.True(t, body["success"].(bool))
}

func TestNotificationHandler_MarkAsRead_Success(t *testing.T) {
	mockUC := &MockNotificationUseCase2{}
	mockUC.MockMarkAsRead = func(ctx context.Context, userID, notificationID uint) error {
		assert.Equal(t, uint(99), userID)
		assert.Equal(t, uint(5), notificationID)
		return nil
	}

	app := fiber.New()
	handler := NewNotificationHandler(mockUC, nil)

	injectStudentContext := func(c *fiber.Ctx) error {
		c.Locals("user_id", uint(99))
		return c.Next()
	}

	app.Put("/api/v1/notifications/:id/read", injectStudentContext, handler.MarkAsRead)

	req := httptest.NewRequest(http.MethodPut, "/api/v1/notifications/5/read", nil)
	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	var body map[string]interface{}
	_ = json.NewDecoder(resp.Body).Decode(&body)
	assert.True(t, body["success"].(bool))
}
