package repository

import (
	"context"
	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"gorm.io/gorm"
)

type CouponRepository interface {
	CreateCoupon(ctx context.Context, coupon *models.Coupon) error
	GetCouponByID(ctx context.Context, id uint) (*models.Coupon, error)
	GetCouponByCode(ctx context.Context, code string) (*models.Coupon, error)
	ListCoupons(ctx context.Context, page, limit int, search string) ([]models.Coupon, int64, error)
	ListTeacherCoupons(ctx context.Context, teacherID uint, page, limit int, search string) ([]models.Coupon, int64, error)
	UpdateCoupon(ctx context.Context, coupon *models.Coupon) error
	CountUserCouponUsage(ctx context.Context, userID, couponID uint) (int64, error)
}

type couponRepository struct {
	db *gorm.DB
}

func NewCouponRepository(db *gorm.DB) CouponRepository {
	return &couponRepository{db: db}
}

func (r *couponRepository) CreateCoupon(ctx context.Context, coupon *models.Coupon) error {
	return r.db.WithContext(ctx).Create(coupon).Error
}

func (r *couponRepository) GetCouponByID(ctx context.Context, id uint) (*models.Coupon, error) {
	var coupon models.Coupon
	err := r.db.WithContext(ctx).Preload("Course").First(&coupon, id).Error
	if err != nil {
		return nil, err
	}
	return &coupon, nil
}

func (r *couponRepository) GetCouponByCode(ctx context.Context, code string) (*models.Coupon, error) {
	var coupon models.Coupon
	err := r.db.WithContext(ctx).Preload("Course").Where("code = ?", code).First(&coupon).Error
	if err != nil {
		return nil, err
	}
	return &coupon, nil
}

func (r *couponRepository) ListCoupons(ctx context.Context, page, limit int, search string) ([]models.Coupon, int64, error) {
	var coupons []models.Coupon
	var count int64

	query := r.db.WithContext(ctx).Model(&models.Coupon{}).Preload("Course")

	if search != "" {
		searchPattern := "%" + search + "%"
		query = query.Where("code LIKE ?", searchPattern)
	}

	err := query.Count(&count).Error
	if err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	err = query.Order("created_at desc").Offset(offset).Limit(limit).Find(&coupons).Error
	if err != nil {
		return nil, 0, err
	}

	return coupons, count, nil
}

func (r *couponRepository) ListTeacherCoupons(ctx context.Context, teacherID uint, page, limit int, search string) ([]models.Coupon, int64, error) {
	var coupons []models.Coupon
	var count int64

	query := r.db.WithContext(ctx).Model(&models.Coupon{}).Preload("Course").Where("teacher_id = ?", teacherID)

	if search != "" {
		searchPattern := "%" + search + "%"
		query = query.Where("code LIKE ?", searchPattern)
	}

	err := query.Count(&count).Error
	if err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	err = query.Order("created_at desc").Offset(offset).Limit(limit).Find(&coupons).Error
	if err != nil {
		return nil, 0, err
	}

	return coupons, count, nil
}

func (r *couponRepository) UpdateCoupon(ctx context.Context, coupon *models.Coupon) error {
	return r.db.WithContext(ctx).Omit("Course", "CreatedAt").Save(coupon).Error
}

func (r *couponRepository) CountUserCouponUsage(ctx context.Context, userID, couponID uint) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.CouponUsage{}).
		Where("user_id = ? AND coupon_id = ?", userID, couponID).
		Count(&count).Error
	return count, err
}
