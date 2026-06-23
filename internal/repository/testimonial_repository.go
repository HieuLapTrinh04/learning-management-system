package repository

import (
	"context"

	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"gorm.io/gorm"
)

type TestimonialRepository interface {
	GetAllAdmin(ctx context.Context) ([]models.Testimonial, error)
	GetActivePublic(ctx context.Context) ([]models.Testimonial, error)
	Create(ctx context.Context, testimonial *models.Testimonial) error
	Update(ctx context.Context, testimonial *models.Testimonial) error
	Delete(ctx context.Context, id uint) error
	GetByID(ctx context.Context, id uint) (*models.Testimonial, error)
}

type testimonialRepository struct {
	db *gorm.DB
}

func NewTestimonialRepository(db *gorm.DB) TestimonialRepository {
	return &testimonialRepository{db: db}
}

func (r *testimonialRepository) GetAllAdmin(ctx context.Context) ([]models.Testimonial, error) {
	var testimonials []models.Testimonial
	err := r.db.WithContext(ctx).Order("sort_order ASC, created_at DESC").Find(&testimonials).Error
	return testimonials, err
}

func (r *testimonialRepository) GetActivePublic(ctx context.Context) ([]models.Testimonial, error) {
	var testimonials []models.Testimonial
	err := r.db.WithContext(ctx).Where("is_active = ?", true).Order("sort_order ASC, created_at DESC").Find(&testimonials).Error
	return testimonials, err
}

func (r *testimonialRepository) Create(ctx context.Context, testimonial *models.Testimonial) error {
	return r.db.WithContext(ctx).Create(testimonial).Error
}

func (r *testimonialRepository) Update(ctx context.Context, testimonial *models.Testimonial) error {
	return r.db.WithContext(ctx).Save(testimonial).Error
}

func (r *testimonialRepository) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&models.Testimonial{}, id).Error
}

func (r *testimonialRepository) GetByID(ctx context.Context, id uint) (*models.Testimonial, error) {
	var testimonial models.Testimonial
	err := r.db.WithContext(ctx).First(&testimonial, id).Error
	if err != nil {
		return nil, err
	}
	return &testimonial, nil
}
