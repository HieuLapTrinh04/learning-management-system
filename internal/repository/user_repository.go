package repository

import (
	"context"

	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"gorm.io/gorm"
)

type UserRepository interface {
	Create(ctx context.Context, user *models.User) error
	GetByEmail(ctx context.Context, email string) (*models.User, error)
	GetByID(ctx context.Context, id uint) (*models.User, error)
	GetAllUsers(ctx context.Context, role, status string) ([]models.User, error)
	Update(ctx context.Context, user *models.User) error
	Delete(ctx context.Context, id uint) error
	GetLeaderboard(ctx context.Context, limit int) ([]models.User, error)
}

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) tenantDB(ctx context.Context) *gorm.DB {
	tenantID, ok := ctx.Value("tenantID").(uint)
	if ok && tenantID > 0 {
		return r.db.WithContext(ctx).Where("tenant_id = ?", tenantID)
	}
	return r.db
}

func (r *userRepository) Create(ctx context.Context, user *models.User) error {
	return r.db.WithContext(ctx).Create(user).Error // Create uses the struct's TenantID
}

func (r *userRepository) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	var user models.User
	err := r.tenantDB(ctx).Where("email = ? AND is_active = ?", email, true).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) GetByID(ctx context.Context, id uint) (*models.User, error) {
	var user models.User
	err := r.tenantDB(ctx).First(&user, id).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) GetAllUsers(ctx context.Context, role, status string) ([]models.User, error) {
	var users []models.User
	query := r.tenantDB(ctx)

	if role != "" && role != "all" {
		query = query.Where("role = ?", role)
	}

	if status != "" && status != "all" {
		if status == "active" {
			query = query.Where("is_active = ?", true)
		} else if status == "inactive" {
			query = query.Where("is_active = ?", false)
		}
	}

	err := query.Order("created_at desc").Find(&users).Error
	return users, err
}

func (r *userRepository) Update(ctx context.Context, user *models.User) error {
	return r.db.WithContext(ctx).Save(user).Error
}

func (r *userRepository) Delete(ctx context.Context, id uint) error {
	return r.tenantDB(ctx).Unscoped().Delete(&models.User{}, id).Error
}

func (r *userRepository) GetLeaderboard(ctx context.Context, limit int) ([]models.User, error) {
	var users []models.User
	err := r.tenantDB(ctx).Where("role = ?", "student").Order("points desc, current_streak desc").Limit(limit).Find(&users).Error
	return users, err
}
