package repository

import (
	"context"
	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"gorm.io/gorm"
)

type EnrollmentRepository interface {
	Create(ctx context.Context, enrollment *models.Enrollment) error
	GetByID(ctx context.Context, id uint) (*models.Enrollment, error)
	GetByStudentAndCourse(ctx context.Context, studentID, courseID uint) (*models.Enrollment, error)
	ListByStudent(ctx context.Context, studentID uint) ([]models.Enrollment, error)
	Update(ctx context.Context, enrollment *models.Enrollment) error
	
	// Progress actions
	GetLessonProgress(ctx context.Context, enrollmentID, lessonID uint) (*models.LessonProgress, error)
	CreateLessonProgress(ctx context.Context, progress *models.LessonProgress) error
	UpdateLessonProgress(ctx context.Context, progress *models.LessonProgress) error
	CountLessonsInCourse(ctx context.Context, courseID uint) (int64, error)
	CountCompletedLessons(ctx context.Context, enrollmentID uint) (int64, error)
	GetEnrollmentsByCourse(ctx context.Context, courseID uint) ([]models.Enrollment, error)
}

type enrollmentRepository struct {
	db *gorm.DB
}

func NewEnrollmentRepository(db *gorm.DB) EnrollmentRepository {
	return &enrollmentRepository{db: db}
}

func (r *enrollmentRepository) Create(ctx context.Context, enrollment *models.Enrollment) error {
	return r.db.WithContext(ctx).Create(enrollment).Error
}

func (r *enrollmentRepository) GetByID(ctx context.Context, id uint) (*models.Enrollment, error) {
	var enrollment models.Enrollment
	err := r.db.WithContext(ctx).Preload("Course").Preload("Student").First(&enrollment, id).Error
	if err != nil {
		return nil, err
	}
	return &enrollment, nil
}

func (r *enrollmentRepository) GetByStudentAndCourse(ctx context.Context, studentID, courseID uint) (*models.Enrollment, error) {
	var enrollment models.Enrollment
	err := r.db.WithContext(ctx).Where("student_id = ? AND course_id = ?", studentID, courseID).First(&enrollment).Error
	if err != nil {
		return nil, err
	}
	return &enrollment, nil
}

func (r *enrollmentRepository) ListByStudent(ctx context.Context, studentID uint) ([]models.Enrollment, error) {
	var enrollments []models.Enrollment
	err := r.db.WithContext(ctx).Preload("Course").
		Preload("Course.Teacher").
		Preload("Course.Category").
		Preload("LessonProgresses").
		Preload("Certificate").
		Where("student_id = ?", studentID).
		Find(&enrollments).Error
	return enrollments, err
}

func (r *enrollmentRepository) Update(ctx context.Context, enrollment *models.Enrollment) error {
	return r.db.WithContext(ctx).Save(enrollment).Error
}

func (r *enrollmentRepository) GetLessonProgress(ctx context.Context, enrollmentID, lessonID uint) (*models.LessonProgress, error) {
	var progress models.LessonProgress
	err := r.db.WithContext(ctx).Where("enrollment_id = ? AND lesson_id = ?", enrollmentID, lessonID).First(&progress).Error
	if err != nil {
		return nil, err
	}
	return &progress, nil
}

func (r *enrollmentRepository) CreateLessonProgress(ctx context.Context, progress *models.LessonProgress) error {
	return r.db.WithContext(ctx).Create(progress).Error
}

func (r *enrollmentRepository) UpdateLessonProgress(ctx context.Context, progress *models.LessonProgress) error {
	return r.db.WithContext(ctx).Save(progress).Error
}

func (r *enrollmentRepository) CountLessonsInCourse(ctx context.Context, courseID uint) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.Lesson{}).
		Joins("JOIN sections ON sections.id = lessons.section_id").
		Where("sections.course_id = ?", courseID).
		Count(&count).Error
	return count, err
}

func (r *enrollmentRepository) CountCompletedLessons(ctx context.Context, enrollmentID uint) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.LessonProgress{}).
		Where("enrollment_id = ? AND is_completed = ?", enrollmentID, true).
		Count(&count).Error
	return count, err
}

func (r *enrollmentRepository) GetEnrollmentsByCourse(ctx context.Context, courseID uint) ([]models.Enrollment, error) {
	var enrollments []models.Enrollment
	err := r.db.WithContext(ctx).Preload("Student").Where("course_id = ?", courseID).Order("enrolled_at desc").Find(&enrollments).Error
	return enrollments, err
}
