package usecase

import (
	"context"

	"github.com/HieuLapTrinh04/learning-management-system/internal/apperrors"
	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"github.com/HieuLapTrinh04/learning-management-system/internal/repository"
)

type LearningPathUseCase interface {
	ListAll(ctx context.Context) ([]models.LearningPath, error)
	GetByID(ctx context.Context, id uint) (*models.LearningPath, error)
	Create(ctx context.Context, path *models.LearningPath) error
	Update(ctx context.Context, path *models.LearningPath) error
	Delete(ctx context.Context, id uint) error
	AddCourseToPath(ctx context.Context, pathID uint, courseID uint, sequence int) error
	RemoveCourseFromPath(ctx context.Context, pathID uint, courseID uint) error
}

type learningPathUseCase struct {
	pathRepo repository.LearningPathRepository
}

func NewLearningPathUseCase(pathRepo repository.LearningPathRepository) LearningPathUseCase {
	return &learningPathUseCase{pathRepo: pathRepo}
}

func (u *learningPathUseCase) ListAll(ctx context.Context) ([]models.LearningPath, error) {
	paths, err := u.pathRepo.ListAll(ctx)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "Failed to list learning paths", err)
	}
	return paths, nil
}

func (u *learningPathUseCase) GetByID(ctx context.Context, id uint) (*models.LearningPath, error) {
	path, err := u.pathRepo.GetByID(ctx, id)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeNotFound, "Learning path not found", err)
	}
	return path, nil
}

func (u *learningPathUseCase) Create(ctx context.Context, path *models.LearningPath) error {
	if path.Title == "" {
		return apperrors.NewAppError(apperrors.TypeValidation, "Title cannot be empty", nil)
	}
	err := u.pathRepo.Create(ctx, path)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeInternal, "Failed to create learning path", err)
	}
	return nil
}

func (u *learningPathUseCase) Update(ctx context.Context, path *models.LearningPath) error {
	existingPath, err := u.pathRepo.GetByID(ctx, path.ID)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeNotFound, "Learning path not found", err)
	}

	existingPath.Title = path.Title
	existingPath.Description = path.Description
	if path.ThumbnailURL != "" {
		existingPath.ThumbnailURL = path.ThumbnailURL
	}

	err = u.pathRepo.Update(ctx, existingPath)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeInternal, "Failed to update learning path", err)
	}
	return nil
}

func (u *learningPathUseCase) Delete(ctx context.Context, id uint) error {
	_, err := u.pathRepo.GetByID(ctx, id)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeNotFound, "Learning path not found", err)
	}
	err = u.pathRepo.Delete(ctx, id)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeInternal, "Failed to delete learning path", err)
	}
	return nil
}

func (u *learningPathUseCase) AddCourseToPath(ctx context.Context, pathID uint, courseID uint, sequence int) error {
	pathCourse := &models.LearningPathCourse{
		LearningPathID: pathID,
		CourseID:       courseID,
		SequenceOrder:  sequence,
	}
	err := u.pathRepo.AddCourse(ctx, pathCourse)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeInternal, "Failed to add course to learning path", err)
	}
	return nil
}

func (u *learningPathUseCase) RemoveCourseFromPath(ctx context.Context, pathID uint, courseID uint) error {
	err := u.pathRepo.RemoveCourse(ctx, pathID, courseID)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeInternal, "Failed to remove course from learning path", err)
	}
	return nil
}
