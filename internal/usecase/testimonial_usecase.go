package usecase

import (
	"context"

	"github.com/HieuLapTrinh04/learning-management-system/internal/apperrors"
	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"github.com/HieuLapTrinh04/learning-management-system/internal/repository"
)

type TestimonialUseCase interface {
	GetAllAdmin(ctx context.Context) ([]models.Testimonial, error)
	GetActivePublic(ctx context.Context) ([]models.Testimonial, error)
	Create(ctx context.Context, input models.Testimonial) (*models.Testimonial, error)
	Update(ctx context.Context, id uint, input models.Testimonial) (*models.Testimonial, error)
	Delete(ctx context.Context, id uint) error
}

type testimonialUseCase struct {
	repo repository.TestimonialRepository
}

func NewTestimonialUseCase(repo repository.TestimonialRepository) TestimonialUseCase {
	return &testimonialUseCase{repo: repo}
}

func (u *testimonialUseCase) GetAllAdmin(ctx context.Context) ([]models.Testimonial, error) {
	return u.repo.GetAllAdmin(ctx)
}

func (u *testimonialUseCase) GetActivePublic(ctx context.Context) ([]models.Testimonial, error) {
	return u.repo.GetActivePublic(ctx)
}

func (u *testimonialUseCase) Create(ctx context.Context, input models.Testimonial) (*models.Testimonial, error) {
	if input.Name == "" || input.Content == "" {
		return nil, apperrors.NewAppError(apperrors.TypeValidation, "name and content are required", nil)
	}

	err := u.repo.Create(ctx, &input)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "failed to create testimonial", err)
	}
	return &input, nil
}

func (u *testimonialUseCase) Update(ctx context.Context, id uint, input models.Testimonial) (*models.Testimonial, error) {
	existing, err := u.repo.GetByID(ctx, id)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeNotFound, "testimonial not found", err)
	}

	existing.Name = input.Name
	existing.Role = input.Role
	existing.AvatarURL = input.AvatarURL
	existing.Content = input.Content
	existing.Rating = input.Rating
	existing.IsActive = input.IsActive
	existing.SortOrder = input.SortOrder

	err = u.repo.Update(ctx, existing)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "failed to update testimonial", err)
	}
	return existing, nil
}

func (u *testimonialUseCase) Delete(ctx context.Context, id uint) error {
	_, err := u.repo.GetByID(ctx, id)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeNotFound, "testimonial not found", err)
	}

	err = u.repo.Delete(ctx, id)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeInternal, "failed to delete testimonial", err)
	}
	return nil
}
