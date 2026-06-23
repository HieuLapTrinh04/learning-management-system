package repository

import (
	"context"
	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"gorm.io/gorm"
)

type CartRepository interface {
	GetCartItems(ctx context.Context, studentID uint) ([]models.CartItem, error)
	AddCartItem(ctx context.Context, item *models.CartItem) error
	RemoveCartItem(ctx context.Context, studentID, courseID uint) error
	ClearCart(ctx context.Context, studentID uint) error
	GetCouponByCode(ctx context.Context, code string) (*models.Coupon, error)
}

type cartRepository struct {
	db *gorm.DB
}

func NewCartRepository(db *gorm.DB) CartRepository {
	return &cartRepository{db: db}
}

func (r *cartRepository) GetCartItems(ctx context.Context, studentID uint) ([]models.CartItem, error) {
	var items []models.CartItem
	err := r.db.WithContext(ctx).Preload("Course.Teacher").Where("student_id = ?", studentID).Order("created_at desc").Find(&items).Error
	return items, err
}

func (r *cartRepository) AddCartItem(ctx context.Context, item *models.CartItem) error {
	return r.db.WithContext(ctx).Create(item).Error
}

func (r *cartRepository) RemoveCartItem(ctx context.Context, studentID, courseID uint) error {
	return r.db.WithContext(ctx).Where("student_id = ? AND course_id = ?", studentID, courseID).Delete(&models.CartItem{}).Error
}

func (r *cartRepository) ClearCart(ctx context.Context, studentID uint) error {
	return r.db.WithContext(ctx).Where("student_id = ?", studentID).Delete(&models.CartItem{}).Error
}

func (r *cartRepository) GetCouponByCode(ctx context.Context, code string) (*models.Coupon, error) {
	var coupon models.Coupon
	err := r.db.WithContext(ctx).Where("code = ? AND is_active = 1", code).First(&coupon).Error
	if err != nil {
		return nil, err
	}
	return &coupon, nil
}
