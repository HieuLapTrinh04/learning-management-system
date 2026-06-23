package usecase

import (
	"context"
	"github.com/HieuLapTrinh04/learning-management-system/internal/apperrors"
	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"github.com/HieuLapTrinh04/learning-management-system/internal/repository"
)

type AttachmentUseCase interface {
	CreateAttachment(ctx context.Context, tenantID uint, lessonID uint, fileName string, fileURL string, fileSize int64) (*models.Attachment, error)
	GetAttachmentsByLesson(ctx context.Context, lessonID uint) ([]models.Attachment, error)
	DeleteAttachment(ctx context.Context, id uint) error
}

type attachmentUseCase struct {
	attachmentRepo repository.AttachmentRepository
	lessonRepo     repository.LessonRepository
}

func NewAttachmentUseCase(aRepo repository.AttachmentRepository, lRepo repository.LessonRepository) AttachmentUseCase {
	return &attachmentUseCase{
		attachmentRepo: aRepo,
		lessonRepo:     lRepo,
	}
}

func (u *attachmentUseCase) CreateAttachment(ctx context.Context, tenantID uint, lessonID uint, fileName string, fileURL string, fileSize int64) (*models.Attachment, error) {
	if fileName == "" || fileURL == "" {
		return nil, apperrors.NewAppError(apperrors.TypeValidation, "thông tin file đính kèm không hợp lệ", nil)
	}

	_, err := u.lessonRepo.GetByID(ctx, lessonID)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeNotFound, "không tìm thấy bài giảng", err)
	}

	attachment := &models.Attachment{
		TenantID: tenantID,
		LessonID: lessonID,
		FileName: fileName,
		FileURL:  fileURL,
		FileSize: fileSize,
	}

	err = u.attachmentRepo.Create(ctx, attachment)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "không thể thêm file đính kèm", err)
	}

	return attachment, nil
}

func (u *attachmentUseCase) GetAttachmentsByLesson(ctx context.Context, lessonID uint) ([]models.Attachment, error) {
	attachments, err := u.attachmentRepo.GetByLessonID(ctx, lessonID)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "không thể lấy danh sách file đính kèm", err)
	}
	return attachments, nil
}

func (u *attachmentUseCase) DeleteAttachment(ctx context.Context, id uint) error {
	_, err := u.attachmentRepo.GetByID(ctx, id)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeNotFound, "không tìm thấy file đính kèm", err)
	}

	err = u.attachmentRepo.Delete(ctx, id)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeInternal, "không thể xóa file đính kèm", err)
	}

	return nil
}
