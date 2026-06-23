package repository

import (
	"context"

	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"gorm.io/gorm"
)

type LearningPathRepository interface {
	Create(ctx context.Context, path *models.LearningPath) error
	GetByID(ctx context.Context, id uint) (*models.LearningPath, error)
	ListAll(ctx context.Context) ([]models.LearningPath, error)
	Update(ctx context.Context, path *models.LearningPath) error
	Delete(ctx context.Context, id uint) error
	AddCourse(ctx context.Context, pathCourse *models.LearningPathCourse) error
	RemoveCourse(ctx context.Context, pathID uint, courseID uint) error
	UpdateCourseSequence(ctx context.Context, pathID uint, courseID uint, sequence int) error
}

type learningPathRepository struct {
	db *gorm.DB
}

func NewLearningPathRepository(db *gorm.DB) LearningPathRepository {
	return &learningPathRepository{db: db}
}

func (r *learningPathRepository) tenantDB(ctx context.Context) *gorm.DB {
	tenantID, ok := ctx.Value("tenantID").(uint)
	if ok && tenantID > 0 {
		return r.db.WithContext(ctx).Where("tenant_id = ?", tenantID)
	}
	return r.db
}

func (r *learningPathRepository) Create(ctx context.Context, path *models.LearningPath) error {
	return r.tenantDB(ctx).Create(path).Error
}

func (r *learningPathRepository) GetByID(ctx context.Context, id uint) (*models.LearningPath, error) {
	var path models.LearningPath
	err := r.tenantDB(ctx).
		Preload("Courses").
		Preload("Courses.Course").
		First(&path, id).Error
	if err != nil {
		return nil, err
	}
	return &path, nil
}

func (r *learningPathRepository) ListAll(ctx context.Context) ([]models.LearningPath, error) {
	var paths []models.LearningPath
	err := r.tenantDB(ctx).
		Preload("Courses").
		Preload("Courses.Course").
		Find(&paths).Error
	return paths, err
}

func (r *learningPathRepository) Update(ctx context.Context, path *models.LearningPath) error {
	return r.tenantDB(ctx).Save(path).Error
}

func (r *learningPathRepository) Delete(ctx context.Context, id uint) error {
	// Delete mapping first
	r.tenantDB(ctx).Where("learning_path_id = ?", id).Delete(&models.LearningPathCourse{})
	return r.tenantDB(ctx).Delete(&models.LearningPath{}, id).Error
}

func (r *learningPathRepository) AddCourse(ctx context.Context, pathCourse *models.LearningPathCourse) error {
	return r.tenantDB(ctx).Create(pathCourse).Error
}

func (r *learningPathRepository) RemoveCourse(ctx context.Context, pathID uint, courseID uint) error {
	return r.tenantDB(ctx).Where("learning_path_id = ? AND course_id = ?", pathID, courseID).Delete(&models.LearningPathCourse{}).Error
}

func (r *learningPathRepository) UpdateCourseSequence(ctx context.Context, pathID uint, courseID uint, sequence int) error {
	return r.tenantDB(ctx).Model(&models.LearningPathCourse{}).
		Where("learning_path_id = ? AND course_id = ?", pathID, courseID).
		Update("sequence_order", sequence).Error
}
