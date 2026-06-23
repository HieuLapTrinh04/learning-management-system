package repository

import (
	"context"

	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"gorm.io/gorm"
)

type GamificationRepository interface {
	AwardPoints(ctx context.Context, userID uint, points uint) error
	AwardBadge(ctx context.Context, userID uint, badgeID uint) error
	GetUserBadges(ctx context.Context, userID uint) ([]models.UserBadge, error)
	GetBadgeByCondition(ctx context.Context, condition string) (*models.Badge, error)
	HasBadge(ctx context.Context, userID uint, badgeID uint) (bool, error)
}

type gamificationRepository struct {
	db *gorm.DB
}

func NewGamificationRepository(db *gorm.DB) GamificationRepository {
	return &gamificationRepository{db: db}
}

func (r *gamificationRepository) tenantDB(ctx context.Context) *gorm.DB {
	tenantID, ok := ctx.Value("tenantID").(uint)
	if ok && tenantID > 0 {
		return r.db.WithContext(ctx).Where("tenant_id = ?", tenantID)
	}
	return r.db
}

func (r *gamificationRepository) AwardPoints(ctx context.Context, userID uint, points uint) error {
	return r.db.WithContext(ctx).Model(&models.User{}).Where("id = ?", userID).UpdateColumn("points", gorm.Expr("points + ?", points)).Error
}

func (r *gamificationRepository) AwardBadge(ctx context.Context, userID uint, badgeID uint) error {
	ub := &models.UserBadge{
		UserID:  userID,
		BadgeID: badgeID,
	}
	return r.tenantDB(ctx).Create(ub).Error
}

func (r *gamificationRepository) GetUserBadges(ctx context.Context, userID uint) ([]models.UserBadge, error) {
	var badges []models.UserBadge
	err := r.tenantDB(ctx).
		Preload("Badge").
		Where("user_id = ?", userID).
		Find(&badges).Error
	return badges, err
}

func (r *gamificationRepository) GetBadgeByCondition(ctx context.Context, condition string) (*models.Badge, error) {
	var badge models.Badge
	err := r.tenantDB(ctx).Where("condition = ?", condition).First(&badge).Error
	if err != nil {
		return nil, err
	}
	return &badge, nil
}

func (r *gamificationRepository) HasBadge(ctx context.Context, userID uint, badgeID uint) (bool, error) {
	var count int64
	err := r.tenantDB(ctx).Model(&models.UserBadge{}).Where("user_id = ? AND badge_id = ?", userID, badgeID).Count(&count).Error
	return count > 0, err
}
