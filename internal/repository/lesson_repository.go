package repository

import (
	"context"
	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"gorm.io/gorm"
)

type LessonRepository interface {
	Create(ctx context.Context, lesson *models.Lesson) error
	Update(ctx context.Context, lesson *models.Lesson) error
	Delete(ctx context.Context, id uint) error
	GetByID(ctx context.Context, id uint) (*models.Lesson, error)
	GetBySectionAndID(ctx context.Context, sectionID uint, id uint) (*models.Lesson, error)
}

type lessonRepository struct {
	db *gorm.DB
}

func NewLessonRepository(db *gorm.DB) LessonRepository {
	return &lessonRepository{db: db}
}

func (r *lessonRepository) Create(ctx context.Context, lesson *models.Lesson) error {
	return r.db.WithContext(ctx).Create(lesson).Error
}

func (r *lessonRepository) Update(ctx context.Context, lesson *models.Lesson) error {
	return r.db.WithContext(ctx).Save(lesson).Error
}

func (r *lessonRepository) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&models.Lesson{}, id).Error
}

func (r *lessonRepository) GetByID(ctx context.Context, id uint) (*models.Lesson, error) {
	var lesson models.Lesson
	err := r.db.WithContext(ctx).First(&lesson, id).Error
	if err != nil {
		return nil, err
	}
	return &lesson, nil
}

func (r *lessonRepository) GetBySectionAndID(ctx context.Context, sectionID uint, id uint) (*models.Lesson, error) {
	var lesson models.Lesson
	err := r.db.WithContext(ctx).Where("section_id = ? AND id = ?", sectionID, id).First(&lesson).Error
	if err != nil {
		return nil, err
	}
	return &lesson, nil
}
