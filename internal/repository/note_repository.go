package repository

import (
	"context"

	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"gorm.io/gorm"
)

type NoteRepository interface {
	Create(ctx context.Context, note *models.Note) error
	GetByID(ctx context.Context, id uint) (*models.Note, error)
	ListByLessonAndUser(ctx context.Context, lessonID, userID uint) ([]models.Note, error)
	Update(ctx context.Context, note *models.Note) error
	Delete(ctx context.Context, id uint) error
}

type noteRepository struct {
	db *gorm.DB
}

func NewNoteRepository(db *gorm.DB) NoteRepository {
	return &noteRepository{db: db}
}

func (r *noteRepository) tenantDB(ctx context.Context) *gorm.DB {
	tenantID, ok := ctx.Value("tenantID").(uint)
	if ok && tenantID > 0 {
		return r.db.WithContext(ctx).Where("tenant_id = ?", tenantID)
	}
	return r.db
}

func (r *noteRepository) Create(ctx context.Context, note *models.Note) error {
	tenantID, ok := ctx.Value("tenantID").(uint)
	if ok && tenantID > 0 {
		note.TenantID = tenantID
	}
	return r.tenantDB(ctx).Create(note).Error
}

func (r *noteRepository) GetByID(ctx context.Context, id uint) (*models.Note, error) {
	var note models.Note
	err := r.tenantDB(ctx).First(&note, id).Error
	if err != nil {
		return nil, err
	}
	return &note, nil
}

func (r *noteRepository) ListByLessonAndUser(ctx context.Context, lessonID, userID uint) ([]models.Note, error) {
	var notes []models.Note
	err := r.tenantDB(ctx).
		Where("lesson_id = ? AND user_id = ?", lessonID, userID).
		Order("video_timestamp ASC").
		Find(&notes).Error
	return notes, err
}

func (r *noteRepository) Update(ctx context.Context, note *models.Note) error {
	return r.tenantDB(ctx).Save(note).Error
}

func (r *noteRepository) Delete(ctx context.Context, id uint) error {
	return r.tenantDB(ctx).Delete(&models.Note{}, id).Error
}
