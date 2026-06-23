package repository

import (
	"context"
	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"gorm.io/gorm"
)

type CategoryRepository interface {
	Create(ctx context.Context, category *models.Category) error
	Update(ctx context.Context, category *models.Category) error
	Delete(ctx context.Context, id uint) error
	GetByID(ctx context.Context, id uint) (*models.Category, error)
	GetBySlug(ctx context.Context, slug string) (*models.Category, error)
	GetByName(ctx context.Context, name string) (*models.Category, error)
	List(ctx context.Context) ([]models.Category, error)
	CountCourses(ctx context.Context, categoryID uint) (int64, error)
}

type categoryRepository struct {
	db *gorm.DB
}

func NewCategoryRepository(db *gorm.DB) CategoryRepository {
	return &categoryRepository{db: db}
}

func (r *categoryRepository) Create(ctx context.Context, category *models.Category) error {
	return r.db.WithContext(ctx).Create(category).Error
}

func (r *categoryRepository) Update(ctx context.Context, category *models.Category) error {
	return r.db.WithContext(ctx).Save(category).Error
}

func (r *categoryRepository) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&models.Category{}, id).Error
}

func (r *categoryRepository) GetByID(ctx context.Context, id uint) (*models.Category, error) {
	var category models.Category
	err := r.db.WithContext(ctx).First(&category, id).Error
	if err != nil {
		return nil, err
	}
	return &category, nil
}

func (r *categoryRepository) GetBySlug(ctx context.Context, slug string) (*models.Category, error) {
	var category models.Category
	err := r.db.WithContext(ctx).Where("slug = ?", slug).First(&category).Error
	if err != nil {
		return nil, err
	}
	return &category, nil
}

func (r *categoryRepository) GetByName(ctx context.Context, name string) (*models.Category, error) {
	var category models.Category
	err := r.db.WithContext(ctx).Where("name = ?", name).First(&category).Error
	if err != nil {
		return nil, err
	}
	return &category, nil
}

func (r *categoryRepository) List(ctx context.Context) ([]models.Category, error) {
	var categories []models.Category
	err := r.db.WithContext(ctx).Order("name asc").Find(&categories).Error
	return categories, err
}

func (r *categoryRepository) CountCourses(ctx context.Context, categoryID uint) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.Course{}).Where("category_id = ?", categoryID).Count(&count).Error
	return count, err
}
