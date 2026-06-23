package repository

import (
	"context"
	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"gorm.io/gorm"
)

type NotificationRepository interface {
	Create(ctx context.Context, notification *models.Notification) error
	ListByUserID(ctx context.Context, userID uint) ([]models.Notification, error)
	GetByID(ctx context.Context, id uint) (*models.Notification, error)
	Update(ctx context.Context, notification *models.Notification) error
	MarkAllAsRead(ctx context.Context, userID uint) error
}

type notificationRepository struct {
	db *gorm.DB
}

func NewNotificationRepository(db *gorm.DB) NotificationRepository {
	return &notificationRepository{db: db}
}

func (r *notificationRepository) Create(ctx context.Context, notification *models.Notification) error {
	return r.db.WithContext(ctx).Create(notification).Error
}

func (r *notificationRepository) ListByUserID(ctx context.Context, userID uint) ([]models.Notification, error) {
	var notifications []models.Notification
	err := r.db.WithContext(ctx).Where("user_id = ?", userID).Order("created_at desc").Find(&notifications).Error
	return notifications, err
}

func (r *notificationRepository) GetByID(ctx context.Context, id uint) (*models.Notification, error) {
	var notification models.Notification
	err := r.db.WithContext(ctx).First(&notification, id).Error
	if err != nil {
		return nil, err
	}
	return &notification, nil
}

func (r *notificationRepository) Update(ctx context.Context, notification *models.Notification) error {
	return r.db.WithContext(ctx).Save(notification).Error
}

func (r *notificationRepository) MarkAllAsRead(ctx context.Context, userID uint) error {
	return r.db.WithContext(ctx).Model(&models.Notification{}).
		Where("user_id = ? AND is_read = ?", userID, false).
		Update("is_read", true).Error
}
