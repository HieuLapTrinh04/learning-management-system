package repository

import (
	"context"
	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"gorm.io/gorm"
)

type CourseRepository interface {
	Create(ctx context.Context, course *models.Course) error
	Update(ctx context.Context, course *models.Course) error
	Delete(ctx context.Context, id uint) error
	GetByID(ctx context.Context, id uint) (*models.Course, error)
	GetBySlug(ctx context.Context, slug string) (*models.Course, error)
	GetDetails(ctx context.Context, idOrSlug string) (*models.Course, error)
	Search(ctx context.Context, categorySlug string, searchKeyword string, priceType string, page int, limit int) ([]models.Course, int64, error)
	GetByTeacherID(ctx context.Context, teacherID uint) ([]models.Course, error)
	GetAdminCourses(ctx context.Context, status string) ([]models.Course, error)
}

type courseRepository struct {
	db *gorm.DB
}

func NewCourseRepository(db *gorm.DB) CourseRepository {
	return &courseRepository{db: db}
}

func (r *courseRepository) Create(ctx context.Context, course *models.Course) error {
	return r.db.WithContext(ctx).Create(course).Error
}

func (r *courseRepository) Update(ctx context.Context, course *models.Course) error {
	return r.db.WithContext(ctx).Save(course).Error
}

func (r *courseRepository) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&models.Course{}, id).Error
}

func (r *courseRepository) GetByID(ctx context.Context, id uint) (*models.Course, error) {
	var course models.Course
	err := r.db.WithContext(ctx).Preload("Teacher").Preload("Category").First(&course, id).Error
	if err != nil {
		return nil, err
	}
	return &course, nil
}

func (r *courseRepository) GetBySlug(ctx context.Context, slug string) (*models.Course, error) {
	var course models.Course
	err := r.db.WithContext(ctx).Where("slug = ?", slug).First(&course).Error
	if err != nil {
		return nil, err
	}
	return &course, nil
}

func (r *courseRepository) GetDetails(ctx context.Context, idOrSlug string) (*models.Course, error) {
	var course models.Course
	// Fetch and preload nested sections, lessons, quizzes, questions, answers, and assignments
	err := r.db.WithContext(ctx).Preload("Teacher").
		Preload("Category").
		Preload("Sections", func(db *gorm.DB) *gorm.DB {
			return db.Order("sections.sort_order ASC")
		}).
		Preload("Sections.Lessons", func(db *gorm.DB) *gorm.DB {
			return db.Order("lessons.sort_order ASC")
		}).
		Preload("Sections.Quizzes").
		Preload("Sections.Quizzes.Questions").
		Preload("Sections.Quizzes.Questions.Answers").
		Preload("Sections.Assignments").
		Where("id = ? OR slug = ?", idOrSlug, idOrSlug).
		First(&course).Error

	if err != nil {
		return nil, err
	}
	return &course, nil
}

func (r *courseRepository) Search(ctx context.Context, categorySlug string, searchKeyword string, priceType string, page int, limit int) ([]models.Course, int64, error) {
	var courses []models.Course
	var total int64

	query := r.db.WithContext(ctx).Model(&models.Course{}).Where("status = ?", "published")

	// Filter by category slug if provided
	if categorySlug != "" {
		query = query.Joins("JOIN categories ON categories.id = courses.category_id").
			Where("categories.slug = ?", categorySlug)
	}

	// Filter by search keyword
	if searchKeyword != "" {
		keyword := "%" + searchKeyword + "%"
		query = query.Where("courses.title LIKE ? OR courses.subtitle LIKE ?", keyword, keyword)
	}

	// Filter by price type
	if priceType == "free" {
		query = query.Where("courses.price = 0")
	} else if priceType == "paid" {
		query = query.Where("courses.price > 0")
	}

	// Count total matching items
	err := query.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	// Paginate results
	offset := (page - 1) * limit
	err = query.Preload("Teacher").
		Preload("Category").
		Limit(limit).
		Offset(offset).
		Order("courses.created_at desc").
		Find(&courses).Error

	return courses, total, err
}

func (r *courseRepository) GetByTeacherID(ctx context.Context, teacherID uint) ([]models.Course, error) {
	var courses []models.Course
	err := r.db.WithContext(ctx).Preload("Teacher").Preload("Category").Where("teacher_id = ?", teacherID).Order("created_at desc").Find(&courses).Error
	return courses, err
}

func (r *courseRepository) GetAdminCourses(ctx context.Context, status string) ([]models.Course, error) {
	var courses []models.Course
	query := r.db.WithContext(ctx).Preload("Teacher").Preload("Category")
	if status != "" {
		query = query.Where("status = ?", status)
	}
	err := query.Order("created_at desc").Find(&courses).Error
	return courses, err
}
