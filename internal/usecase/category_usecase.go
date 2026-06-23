package usecase

import (
	"context"
	"errors"
	"fmt"

	"github.com/HieuLapTrinh04/learning-management-system/internal/apperrors"
	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"github.com/HieuLapTrinh04/learning-management-system/internal/repository"
	"github.com/HieuLapTrinh04/learning-management-system/internal/utils"
	"gorm.io/gorm"
)

type CategoryUseCase interface {
	Create(ctx context.Context, name, description string) (*models.Category, error)
	Update(ctx context.Context, id uint, name, description string) (*models.Category, error)
	Delete(ctx context.Context, id uint) error
	GetByID(ctx context.Context, id uint) (*models.Category, error)
	List(ctx context.Context) ([]models.Category, error)
}

type categoryUseCase struct {
	categoryRepo repository.CategoryRepository
}

func NewCategoryUseCase(categoryRepo repository.CategoryRepository) CategoryUseCase {
	return &categoryUseCase{categoryRepo: categoryRepo}
}

func (u *categoryUseCase) Create(ctx context.Context, name, description string) (*models.Category, error) {
	// Check if category name already exists
	existing, err := u.categoryRepo.GetByName(ctx, name)
	if err == nil && existing != nil {
		return nil, apperrors.NewAppError(apperrors.TypeConflict, "category name already exists", nil)
	}

	slug := utils.GenerateSlug(name)
	category := &models.Category{
		Name:        name,
		Slug:        slug,
		Description: description,
	}

	err = u.categoryRepo.Create(ctx, category)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "failed to create category in database", err)
	}

	return category, nil
}

func (u *categoryUseCase) Update(ctx context.Context, id uint, name, description string) (*models.Category, error) {
	category, err := u.categoryRepo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperrors.NewAppError(apperrors.TypeNotFound, "category not found", err)
		}
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "database error searching category", err)
	}

	// Check if name is changing and if new name is already taken
	if name != category.Name {
		existing, err := u.categoryRepo.GetByName(ctx, name)
		if err == nil && existing != nil {
			return nil, apperrors.NewAppError(apperrors.TypeConflict, "category name already exists", nil)
		}
		category.Name = name
		category.Slug = utils.GenerateSlug(name)
	}

	category.Description = description

	err = u.categoryRepo.Update(ctx, category)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "failed to update category in database", err)
	}

	return category, nil
}

func (u *categoryUseCase) Delete(ctx context.Context, id uint) error {
	_, err := u.categoryRepo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return apperrors.NewAppError(apperrors.TypeNotFound, "category not found", err)
		}
		return apperrors.NewAppError(apperrors.TypeInternal, "database error searching category", err)
	}

	// Prevent deletion if there are courses belonging to this category
	count, err := u.categoryRepo.CountCourses(ctx, id)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeInternal, "failed to verify course references", err)
	}

	if count > 0 {
		return apperrors.NewAppError(apperrors.TypeConflict, fmt.Sprintf("cannot delete category: %d course(s) are associated with it", count), nil)
	}

	err = u.categoryRepo.Delete(ctx, id)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeInternal, "failed to delete category in database", err)
	}

	return nil
}

func (u *categoryUseCase) GetByID(ctx context.Context, id uint) (*models.Category, error) {
	category, err := u.categoryRepo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperrors.NewAppError(apperrors.TypeNotFound, "category not found", err)
		}
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "database error fetching category", err)
	}
	return category, nil
}

func (u *categoryUseCase) List(ctx context.Context) ([]models.Category, error) {
	categories, err := u.categoryRepo.List(ctx)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "failed to list categories in database", err)
	}
	return categories, nil
}
