package usecase

import (
	"context"
	"encoding/json"
	"time"

	"github.com/HieuLapTrinh04/learning-management-system/internal/apperrors"
	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"github.com/HieuLapTrinh04/learning-management-system/internal/repository"
	"github.com/redis/go-redis/v9"
)

type NotificationUseCase interface {
	SendNotification(ctx context.Context, userID uint, title, message string) error
	GetNotifications(ctx context.Context, userID uint) ([]models.Notification, error)
	MarkAsRead(ctx context.Context, userID, notificationID uint) error
	MarkAllAsRead(ctx context.Context, userID uint) error
}

type notificationUseCase struct {
	repo        repository.NotificationRepository
	redisClient *redis.Client
}

func NewNotificationUseCase(repo repository.NotificationRepository, redisClient *redis.Client) NotificationUseCase {
	return &notificationUseCase{
		repo:        repo,
		redisClient: redisClient,
	}
}

func (u *notificationUseCase) SendNotification(ctx context.Context, userID uint, title, message string) error {
	notification := &models.Notification{
		UserID:    userID,
		Title:     title,
		Message:   message,
		IsRead:    false,
		CreatedAt: time.Now(),
	}

	// 1. Save in MySQL GORM
	err := u.repo.Create(ctx, notification)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeInternal, "failed to save notification alert log", err)
	}

	// 2. Serialize and Publish to Redis Channel
	payload, err := json.Marshal(notification)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeInternal, "failed to marshal notification payload", err)
	}

	err = u.redisClient.Publish(ctx, "lms_notifications", payload).Err()
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeInternal, "failed to broadcast notification to redis channel", err)
	}

	return nil
}

func (u *notificationUseCase) GetNotifications(ctx context.Context, userID uint) ([]models.Notification, error) {
	notifications, err := u.repo.ListByUserID(ctx, userID)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "failed to load notifications list", err)
	}
	return notifications, nil
}

func (u *notificationUseCase) MarkAsRead(ctx context.Context, userID, notificationID uint) error {
	notification, err := u.repo.GetByID(ctx, notificationID)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeNotFound, "notification alert not found", err)
	}

	if notification.UserID != userID {
		return apperrors.NewAppError(apperrors.TypeForbidden, "access denied: notification target user mismatch", nil)
	}

	notification.IsRead = true
	err = u.repo.Update(ctx, notification)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeInternal, "failed to mark notification as read", err)
	}
	return nil
}

func (u *notificationUseCase) MarkAllAsRead(ctx context.Context, userID uint) error {
	err := u.repo.MarkAllAsRead(ctx, userID)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeInternal, "failed to mark all notifications as read", err)
	}
	return nil
}
