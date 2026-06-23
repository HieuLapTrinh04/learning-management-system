package repository

import (
	"context"
	"time"

	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"gorm.io/gorm"
)

type AuditLogRepository interface {
	Create(ctx context.Context, log *models.AuditLog) error
	ListLogs(ctx context.Context, page, limit int, action, entity, search string) ([]models.AuditLog, int64, error)
	DeleteOldLogs(ctx context.Context, cutoff time.Time) error
}

type auditLogRepository struct {
	db *gorm.DB
}

func NewAuditLogRepository(db *gorm.DB) AuditLogRepository {
	return &auditLogRepository{db: db}
}

func (r *auditLogRepository) Create(ctx context.Context, log *models.AuditLog) error {
	return r.db.WithContext(ctx).Create(log).Error
}

func (r *auditLogRepository) ListLogs(ctx context.Context, page, limit int, action, entity, search string) ([]models.AuditLog, int64, error) {
	var logs []models.AuditLog
	var total int64

	query := r.db.WithContext(ctx).Model(&models.AuditLog{}).Preload("User")

	if action != "" {
		query = query.Where("action = ?", action)
	}
	if entity != "" {
		query = query.Where("entity = ?", entity)
	}
	if search != "" {
		// Basic search on details or user's name
		query = query.Joins("LEFT JOIN users ON users.id = audit_logs.user_id").
			Where("audit_logs.details LIKE ? OR users.name LIKE ?", "%"+search+"%", "%"+search+"%")
	}

	err := query.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	err = query.Order("created_at desc").Offset(offset).Limit(limit).Find(&logs).Error
	if err != nil {
		return nil, 0, err
	}

	return logs, total, nil
}

func (r *auditLogRepository) DeleteOldLogs(ctx context.Context, cutoff time.Time) error {
	return r.db.WithContext(ctx).Where("created_at < ?", cutoff).Delete(&models.AuditLog{}).Error
}
