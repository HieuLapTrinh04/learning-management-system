package repository

import (
	"context"
	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"gorm.io/gorm"
)

type SectionRepository interface {
	Create(ctx context.Context, section *models.Section) error
	Update(ctx context.Context, section *models.Section) error
	Delete(ctx context.Context, id uint) error
	GetByID(ctx context.Context, id uint) (*models.Section, error)
	GetByCourseAndID(ctx context.Context, courseID uint, id uint) (*models.Section, error)
}

type sectionRepository struct {
	db *gorm.DB
}

func NewSectionRepository(db *gorm.DB) SectionRepository {
	return &sectionRepository{db: db}
}

func (r *sectionRepository) Create(ctx context.Context, section *models.Section) error {
	return r.db.WithContext(ctx).Create(section).Error
}

func (r *sectionRepository) Update(ctx context.Context, section *models.Section) error {
	return r.db.WithContext(ctx).Save(section).Error
}

func (r *sectionRepository) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&models.Section{}, id).Error
}

func (r *sectionRepository) GetByID(ctx context.Context, id uint) (*models.Section, error) {
	var section models.Section
	err := r.db.WithContext(ctx).First(&section, id).Error
	if err != nil {
		return nil, err
	}
	return &section, nil
}

func (r *sectionRepository) GetByCourseAndID(ctx context.Context, courseID uint, id uint) (*models.Section, error) {
	var section models.Section
	err := r.db.WithContext(ctx).Where("course_id = ? AND id = ?", courseID, id).First(&section).Error
	if err != nil {
		return nil, err
	}
	return &section, nil
}
