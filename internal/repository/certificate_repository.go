package repository

import (
	"context"
	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"gorm.io/gorm"
)

type CertificateRepository interface {
	Create(ctx context.Context, cert *models.Certificate) error
	GetByID(ctx context.Context, id uint) (*models.Certificate, error)
	GetByCode(ctx context.Context, code string) (*models.Certificate, error)
	GetByEnrollmentID(ctx context.Context, enrollmentID uint) (*models.Certificate, error)
	GetCourseQuizzes(ctx context.Context, courseID uint) ([]models.Quiz, error)
	HasPassedQuiz(ctx context.Context, studentID, quizID uint) (bool, error)
	GetCourseAssignments(ctx context.Context, courseID uint) ([]models.Assignment, error)
	HasSubmittedAssignment(ctx context.Context, studentID, assignmentID uint) (bool, error)
	ListCertificatesByStudentID(ctx context.Context, studentID uint) ([]models.Certificate, error)
}

type certificateRepository struct {
	db *gorm.DB
}

func NewCertificateRepository(db *gorm.DB) CertificateRepository {
	return &certificateRepository{db: db}
}

func (r *certificateRepository) Create(ctx context.Context, cert *models.Certificate) error {
	return r.db.WithContext(ctx).Create(cert).Error
}

func (r *certificateRepository) GetByID(ctx context.Context, id uint) (*models.Certificate, error) {
	var cert models.Certificate
	err := r.db.WithContext(ctx).Preload("Enrollment").
		Preload("Enrollment.Student").
		Preload("Enrollment.Course").
		First(&cert, id).Error
	if err != nil {
		return nil, err
	}
	return &cert, nil
}

func (r *certificateRepository) GetByCode(ctx context.Context, code string) (*models.Certificate, error) {
	var cert models.Certificate
	err := r.db.WithContext(ctx).Preload("Enrollment").
		Preload("Enrollment.Student").
		Preload("Enrollment.Course").
		Where("certificate_code = ?", code).
		First(&cert).Error
	if err != nil {
		return nil, err
	}
	return &cert, nil
}

func (r *certificateRepository) GetByEnrollmentID(ctx context.Context, enrollmentID uint) (*models.Certificate, error) {
	var cert models.Certificate
	err := r.db.WithContext(ctx).Preload("Enrollment").
		Preload("Enrollment.Student").
		Preload("Enrollment.Course").
		Where("enrollment_id = ?", enrollmentID).
		First(&cert).Error
	if err != nil {
		return nil, err
	}
	return &cert, nil
}

func (r *certificateRepository) GetCourseQuizzes(ctx context.Context, courseID uint) ([]models.Quiz, error) {
	var quizzes []models.Quiz
	err := r.db.WithContext(ctx).Joins("JOIN sections ON sections.id = quizzes.section_id").
		Where("sections.course_id = ?", courseID).
		Find(&quizzes).Error
	return quizzes, err
}

func (r *certificateRepository) HasPassedQuiz(ctx context.Context, studentID, quizID uint) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.QuizAttempt{}).
		Where("student_id = ? AND quiz_id = ? AND is_passed = ?", studentID, quizID, true).
		Count(&count).Error
	return count > 0, err
}

func (r *certificateRepository) GetCourseAssignments(ctx context.Context, courseID uint) ([]models.Assignment, error) {
	var assignments []models.Assignment
	err := r.db.WithContext(ctx).Joins("JOIN sections ON sections.id = assignments.section_id").
		Where("sections.course_id = ?", courseID).
		Find(&assignments).Error
	return assignments, err
}

func (r *certificateRepository) HasSubmittedAssignment(ctx context.Context, studentID, assignmentID uint) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.Submission{}).
		Where("student_id = ? AND assignment_id = ?", studentID, assignmentID).
		Count(&count).Error
	return count > 0, err
}

func (r *certificateRepository) ListCertificatesByStudentID(ctx context.Context, studentID uint) ([]models.Certificate, error) {
	var certs []models.Certificate
	err := r.db.WithContext(ctx).Preload("Enrollment.Course").
		Joins("JOIN enrollments ON enrollments.id = certificates.enrollment_id").
		Where("enrollments.student_id = ?", studentID).
		Find(&certs).Error
	return certs, err
}

