package usecase

import (
	"context"

	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
)

type MockAuditLogUseCase struct {
	MockLogEvent         func(ctx context.Context, userID *uint, action, entity string, entityID *uint, details, ip string)
	MockGetLogs          func(ctx context.Context, page, limit int, action, entity, search string) ([]models.AuditLog, int64, error)
	MockRunRetentionCron func(days int)
}

func (m *MockAuditLogUseCase) LogEvent(ctx context.Context, userID *uint, action, entity string, entityID *uint, details, ip string) {
	if m.MockLogEvent != nil {
		m.MockLogEvent(ctx, userID, action, entity, entityID, details, ip)
	}
}

func (m *MockAuditLogUseCase) GetLogs(ctx context.Context, page, limit int, action, entity, search string) ([]models.AuditLog, int64, error) {
	if m.MockGetLogs != nil {
		return m.MockGetLogs(ctx, page, limit, action, entity, search)
	}
	return nil, 0, nil
}

func (m *MockAuditLogUseCase) RunRetentionCron(days int) {
	if m.MockRunRetentionCron != nil {
		m.MockRunRetentionCron(days)
	}
}
