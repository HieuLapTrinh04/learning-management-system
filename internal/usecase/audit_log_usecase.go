package usecase

import (
	"github.com/HieuLapTrinh04/learning-management-system/pkg/logger"

	"context"
	"time"

	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"github.com/HieuLapTrinh04/learning-management-system/internal/repository"
)

type AuditLogUseCase interface {
	LogEvent(ctx context.Context, userID *uint, action, entity string, entityID *uint, details, ip string)
	GetLogs(ctx context.Context, page, limit int, action, entity, search string) ([]models.AuditLog, int64, error)
	RunRetentionCron(days int)
}

type auditLogUseCase struct {
	auditRepo repository.AuditLogRepository
}

func NewAuditLogUseCase(auditRepo repository.AuditLogRepository) AuditLogUseCase {
	return &auditLogUseCase{auditRepo: auditRepo}
}

// LogEvent is typically called asynchronously so we don't return an error to block the main flow.
func (u *auditLogUseCase) LogEvent(ctx context.Context, userID *uint, action, entity string, entityID *uint, details, ip string) {
	logEntry := &models.AuditLog{
		UserID:    userID,
		Action:    action,
		Entity:    entity,
		EntityID:  entityID,
		Details:   details,
		IPAddress: ip,
		CreatedAt: time.Now(),
	}

	err := u.auditRepo.Create(ctx, logEntry)
	if err != nil {
		logger.Log.Sugar().Infof("Failed to create audit log: %v", err)
	}
}

func (u *auditLogUseCase) GetLogs(ctx context.Context, page, limit int, action, entity, search string) ([]models.AuditLog, int64, error) {
	return u.auditRepo.ListLogs(ctx, page, limit, action, entity, search)
}

// RunRetentionCron runs periodically to clean up old logs.
func (u *auditLogUseCase) RunRetentionCron(days int) {
	ticker := time.NewTicker(24 * time.Hour)
	go func() {
		for range ticker.C {
			cutoff := time.Now().AddDate(0, 0, -days)
			err := u.auditRepo.DeleteOldLogs(context.Background(), cutoff)
			if err != nil {
				logger.Log.Sugar().Infof("Failed to clean up old audit logs: %v", err)
			} else {
				logger.Log.Sugar().Infof("Audit logs older than %d days cleaned up.", days)
			}
		}
	}()
}
