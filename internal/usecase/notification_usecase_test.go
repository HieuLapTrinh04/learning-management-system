package usecase

import (
	"context"
	"testing"

	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
)

// --- MOCK NOTIFICATION REPOSITORY ---

type MockNotificationRepository struct {
	MockCreate        func(n *models.Notification) error
	MockGetByID       func(id uint) (*models.Notification, error)
	MockListByUserID  func(userID uint) ([]models.Notification, error)
	MockUpdate        func(n *models.Notification) error
	MockMarkAllAsRead func(userID uint) error
}

func (m *MockNotificationRepository) Create(ctx context.Context, n *models.Notification) error {
	return m.MockCreate(n)
}
func (m *MockNotificationRepository) GetByID(ctx context.Context, id uint) (*models.Notification, error) {
	return m.MockGetByID(id)
}
func (m *MockNotificationRepository) ListByUserID(ctx context.Context, userID uint) ([]models.Notification, error) {
	return m.MockListByUserID(userID)
}
func (m *MockNotificationRepository) Update(ctx context.Context, n *models.Notification) error {
	return m.MockUpdate(n)
}
func (m *MockNotificationRepository) MarkAllAsRead(ctx context.Context, userID uint) error {
	return m.MockMarkAllAsRead(userID)
}

// --- TEST CASES ---

func TestNotificationUseCase_SendNotification_Success(t *testing.T) {
	repo := &MockNotificationRepository{}

	repo.MockCreate = func(n *models.Notification) error {
		assert.Equal(t, uint(99), n.UserID)
		assert.Equal(t, "Quiz Completed", n.Title)
		assert.Equal(t, "Score is 100", n.Message)
		return nil
	}

	rdb := redis.NewClient(&redis.Options{Addr: "localhost:6379"})

	uc := NewNotificationUseCase(repo, rdb)

	// We run SendNotification. Since it tries to publish to Redis, if Redis isn't running
	// it might fail. But u.redisClient.Publish returns error.
	// We can check if there's no DB error.
	err := uc.SendNotification(context.Background(), 99, "Quiz Completed", "Score is 100")

	// If redis is running, err is nil. If not, it will be redis connection error.
	if err != nil {
		assert.Contains(t, err.Error(), "broadcast")
	}
}

func TestNotificationUseCase_MarkAsRead_Success(t *testing.T) {
	repo := &MockNotificationRepository{}

	repo.MockGetByID = func(id uint) (*models.Notification, error) {
		return &models.Notification{
			ID:     id,
			UserID: 99,
			IsRead: false,
		}, nil
	}

	repo.MockUpdate = func(n *models.Notification) error {
		assert.True(t, n.IsRead)
		return nil
	}

	uc := NewNotificationUseCase(repo, nil)
	err := uc.MarkAsRead(context.Background(), 99, 1)

	assert.NoError(t, err)
}

func TestNotificationUseCase_MarkAsRead_Forbidden(t *testing.T) {
	repo := &MockNotificationRepository{}

	repo.MockGetByID = func(id uint) (*models.Notification, error) {
		return &models.Notification{
			ID:     id,
			UserID: 10, // Owned by User #10
		}, nil
	}

	uc := NewNotificationUseCase(repo, nil)
	// Try marking read using User #99 (denied)
	err := uc.MarkAsRead(context.Background(), 99, 1)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "access denied")
}
