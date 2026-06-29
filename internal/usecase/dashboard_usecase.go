package usecase

import (
	"github.com/HieuLapTrinh04/learning-management-system/pkg/logger"

	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/HieuLapTrinh04/learning-management-system/internal/apperrors"
	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"github.com/HieuLapTrinh04/learning-management-system/internal/repository"
	"github.com/redis/go-redis/v9"
)

type DashboardUseCase interface {
	GetAdminStats(ctx context.Context, tenantID uint) (*models.AdminStats, error)
	GetTeacherStats(ctx context.Context, teacherID uint) (*models.TeacherStats, error)
	GetStudentStats(ctx context.Context, studentID uint) (*models.StudentStats, error)
}

type dashboardUseCase struct {
	repo        repository.DashboardRepository
	redisClient *redis.Client
}

func NewDashboardUseCase(repo repository.DashboardRepository, redisClient *redis.Client) DashboardUseCase {
	return &dashboardUseCase{
		repo:        repo,
		redisClient: redisClient,
	}
}

func (u *dashboardUseCase) GetAdminStats(ctx context.Context, tenantID uint) (*models.AdminStats, error) {
	cacheKey := fmt.Sprintf("lms_analytics:admin:tenant:%d", tenantID)

	// 1. Try reading from Redis Cache
	cachedVal, err := u.redisClient.Get(ctx, cacheKey).Result()
	if err == nil {
		var stats models.AdminStats
		if jsonErr := json.Unmarshal([]byte(cachedVal), &stats); jsonErr == nil {
			logger.Log.Sugar().Infoln("Admin dashboard analytics retrieved from Redis cache")
			return &stats, nil
		}
	}

	// 2. Fetch fresh stats from MySQL database
	stats, err := u.repo.GetAdminStats(ctx, tenantID)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "failed to query admin statistics from database", err)
	}

	// 3. Serialize and save to Redis with 5 minutes TTL
	payload, jsonErr := json.Marshal(stats)
	if jsonErr == nil {
		u.redisClient.Set(ctx, cacheKey, payload, 5*time.Minute)
	}

	return stats, nil
}

func (u *dashboardUseCase) GetTeacherStats(ctx context.Context, teacherID uint) (*models.TeacherStats, error) {
	cacheKey := fmt.Sprintf("lms_analytics:teacher:%d", teacherID)

	// 1. Try reading from Redis Cache
	cachedVal, err := u.redisClient.Get(ctx, cacheKey).Result()
	if err == nil {
		var stats models.TeacherStats
		if jsonErr := json.Unmarshal([]byte(cachedVal), &stats); jsonErr == nil {
			logger.Log.Sugar().Infof("Teacher %d dashboard analytics retrieved from Redis cache", teacherID)
			return &stats, nil
		}
	}

	// 2. Fetch fresh stats from MySQL database
	stats, err := u.repo.GetTeacherStats(ctx, teacherID)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "failed to query teacher statistics from database", err)
	}

	// 3. Serialize and save to Redis with 5 minutes TTL
	payload, jsonErr := json.Marshal(stats)
	if jsonErr == nil {
		u.redisClient.Set(ctx, cacheKey, payload, 5*time.Minute)
	}

	return stats, nil
}

func (u *dashboardUseCase) GetStudentStats(ctx context.Context, studentID uint) (*models.StudentStats, error) {
	cacheKey := fmt.Sprintf("lms_analytics:student:%d", studentID)

	// 1. Try reading from Redis Cache
	cachedVal, err := u.redisClient.Get(ctx, cacheKey).Result()
	if err == nil {
		var stats models.StudentStats
		if jsonErr := json.Unmarshal([]byte(cachedVal), &stats); jsonErr == nil {
			logger.Log.Sugar().Infof("Student %d dashboard analytics retrieved from Redis cache", studentID)
			return &stats, nil
		}
	}

	// 2. Fetch fresh stats from MySQL database
	stats, err := u.repo.GetStudentStats(ctx, studentID)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "failed to query student statistics from database: " + err.Error(), err)
	}

	// 3. Serialize and save to Redis with 5 minutes TTL
	payload, jsonErr := json.Marshal(stats)
	if jsonErr == nil {
		u.redisClient.Set(ctx, cacheKey, payload, 5*time.Minute)
	}

	return stats, nil
}
