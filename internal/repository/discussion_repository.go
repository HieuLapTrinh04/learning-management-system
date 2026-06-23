package repository

import (
	"context"
	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"gorm.io/gorm"
)

type DiscussionRepository interface {
	Create(ctx context.Context, discussion *models.Discussion) error
	GetByLessonID(ctx context.Context, lessonID uint) ([]models.Discussion, error)
	Delete(ctx context.Context, id uint) error
	GetByID(ctx context.Context, id uint) (*models.Discussion, error)
}

type discussionRepository struct {
	db *gorm.DB
}

func NewDiscussionRepository(db *gorm.DB) DiscussionRepository {
	return &discussionRepository{db: db}
}

func (r *discussionRepository) Create(ctx context.Context, discussion *models.Discussion) error {
	return r.db.WithContext(ctx).Create(discussion).Error
}

func (r *discussionRepository) GetByLessonID(ctx context.Context, lessonID uint) ([]models.Discussion, error) {
	var discussions []models.Discussion
	err := r.db.WithContext(ctx).
		Preload("User").
		Preload("Replies").
		Preload("Replies.User").
		Where("lesson_id = ? AND parent_id IS NULL", lessonID).
		Order("created_at desc").
		Find(&discussions).Error
	return discussions, err
}

func (r *discussionRepository) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&models.Discussion{}, id).Error
}

func (r *discussionRepository) GetByID(ctx context.Context, id uint) (*models.Discussion, error) {
	var discussion models.Discussion
	err := r.db.WithContext(ctx).First(&discussion, id).Error
	if err != nil {
		return nil, err
	}
	return &discussion, nil
}
