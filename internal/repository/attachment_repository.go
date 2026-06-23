package repository

import (
	"context"
	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"gorm.io/gorm"
)

type AttachmentRepository interface {
	Create(ctx context.Context, attachment *models.Attachment) error
	GetByLessonID(ctx context.Context, lessonID uint) ([]models.Attachment, error)
	Delete(ctx context.Context, id uint) error
	GetByID(ctx context.Context, id uint) (*models.Attachment, error)
}

type attachmentRepository struct {
	db *gorm.DB
}

func NewAttachmentRepository(db *gorm.DB) AttachmentRepository {
	return &attachmentRepository{db: db}
}

func (r *attachmentRepository) Create(ctx context.Context, attachment *models.Attachment) error {
	return r.db.WithContext(ctx).Create(attachment).Error
}

func (r *attachmentRepository) GetByLessonID(ctx context.Context, lessonID uint) ([]models.Attachment, error) {
	var attachments []models.Attachment
	err := r.db.WithContext(ctx).
		Where("lesson_id = ?", lessonID).
		Order("created_at desc").
		Find(&attachments).Error
	return attachments, err
}

func (r *attachmentRepository) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&models.Attachment{}, id).Error
}

func (r *attachmentRepository) GetByID(ctx context.Context, id uint) (*models.Attachment, error) {
	var attachment models.Attachment
	err := r.db.WithContext(ctx).First(&attachment, id).Error
	if err != nil {
		return nil, err
	}
	return &attachment, nil
}
