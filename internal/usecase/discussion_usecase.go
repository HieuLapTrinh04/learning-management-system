package usecase

import (
	"context"
	"github.com/HieuLapTrinh04/learning-management-system/internal/apperrors"
	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"github.com/HieuLapTrinh04/learning-management-system/internal/repository"
)

type DiscussionUseCase interface {
	CreateDiscussion(ctx context.Context, tenantID uint, lessonID uint, userID uint, content string, parentID *uint) (*models.Discussion, error)
	GetDiscussionsByLesson(ctx context.Context, lessonID uint) ([]models.Discussion, error)
	DeleteDiscussion(ctx context.Context, id uint, userID uint) error
}

type discussionUseCase struct {
	discussionRepo repository.DiscussionRepository
	lessonRepo     repository.LessonRepository
}

func NewDiscussionUseCase(dRepo repository.DiscussionRepository, lRepo repository.LessonRepository) DiscussionUseCase {
	return &discussionUseCase{
		discussionRepo: dRepo,
		lessonRepo:     lRepo,
	}
}

func (u *discussionUseCase) CreateDiscussion(ctx context.Context, tenantID uint, lessonID uint, userID uint, content string, parentID *uint) (*models.Discussion, error) {
	if content == "" {
		return nil, apperrors.NewAppError(apperrors.TypeValidation, "nội dung thảo luận không được để trống", nil)
	}

	_, err := u.lessonRepo.GetByID(ctx, lessonID)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeNotFound, "không tìm thấy bài giảng", err)
	}

	if parentID != nil {
		_, err := u.discussionRepo.GetByID(ctx, *parentID)
		if err != nil {
			return nil, apperrors.NewAppError(apperrors.TypeNotFound, "không tìm thấy bình luận gốc", err)
		}
	}

	discussion := &models.Discussion{
		TenantID: tenantID,
		LessonID: lessonID,
		UserID:   userID,
		ParentID: parentID,
		Content:  content,
	}

	err = u.discussionRepo.Create(ctx, discussion)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "không thể tạo thảo luận", err)
	}

	return discussion, nil
}

func (u *discussionUseCase) GetDiscussionsByLesson(ctx context.Context, lessonID uint) ([]models.Discussion, error) {
	discussions, err := u.discussionRepo.GetByLessonID(ctx, lessonID)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "không thể lấy danh sách thảo luận", err)
	}
	return discussions, nil
}

func (u *discussionUseCase) DeleteDiscussion(ctx context.Context, id uint, userID uint) error {
	discussion, err := u.discussionRepo.GetByID(ctx, id)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeNotFound, "không tìm thấy thảo luận", err)
	}

	if discussion.UserID != userID {
		// Could allow admins/teachers to delete, but for now strict ownership
		return apperrors.NewAppError(apperrors.TypeForbidden, "bạn không có quyền xóa thảo luận này", nil)
	}

	err = u.discussionRepo.Delete(ctx, id)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeInternal, "không thể xóa thảo luận", err)
	}

	return nil
}
