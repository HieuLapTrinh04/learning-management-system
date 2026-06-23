package repository

import (
	"context"
	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"gorm.io/gorm"
)

type AssignmentRepository interface {
	CreateAssignment(ctx context.Context, assignment *models.Assignment) error
	GetByID(ctx context.Context, id uint) (*models.Assignment, error)
	GetBySectionID(ctx context.Context, sectionID uint) ([]models.Assignment, error)
	
	// Submission queries
	CreateSubmission(ctx context.Context, submission *models.Submission) error
	UpdateSubmission(ctx context.Context, submission *models.Submission) error
	GetSubmissionByID(ctx context.Context, id uint) (*models.Submission, error)
	GetSubmissionByStudent(ctx context.Context, studentID, assignmentID uint) (*models.Submission, error)
	ListSubmissionsByAssignment(ctx context.Context, assignmentID uint) ([]models.Submission, error)
	GradeOverdueAssignmentsToZero(ctx context.Context) error
}

type assignmentRepository struct {
	db *gorm.DB
}

func NewAssignmentRepository(db *gorm.DB) AssignmentRepository {
	return &assignmentRepository{db: db}
}

func (r *assignmentRepository) CreateAssignment(ctx context.Context, assignment *models.Assignment) error {
	return r.db.WithContext(ctx).Create(assignment).Error
}

func (r *assignmentRepository) GetByID(ctx context.Context, id uint) (*models.Assignment, error) {
	var assignment models.Assignment
	err := r.db.WithContext(ctx).First(&assignment, id).Error
	if err != nil {
		return nil, err
	}
	return &assignment, nil
}

func (r *assignmentRepository) GetBySectionID(ctx context.Context, sectionID uint) ([]models.Assignment, error) {
	var assignments []models.Assignment
	err := r.db.WithContext(ctx).Where("section_id = ?", sectionID).Order("due_date asc").Find(&assignments).Error
	return assignments, err
}

func (r *assignmentRepository) CreateSubmission(ctx context.Context, submission *models.Submission) error {
	return r.db.WithContext(ctx).Create(submission).Error
}

func (r *assignmentRepository) UpdateSubmission(ctx context.Context, submission *models.Submission) error {
	return r.db.WithContext(ctx).Save(submission).Error
}

func (r *assignmentRepository) GetSubmissionByID(ctx context.Context, id uint) (*models.Submission, error) {
	var submission models.Submission
	err := r.db.WithContext(ctx).Preload("Student").First(&submission, id).Error
	if err != nil {
		return nil, err
	}
	return &submission, nil
}

func (r *assignmentRepository) GetSubmissionByStudent(ctx context.Context, studentID, assignmentID uint) (*models.Submission, error) {
	var submission models.Submission
	err := r.db.WithContext(ctx).Where("student_id = ? AND assignment_id = ?", studentID, assignmentID).First(&submission).Error
	if err != nil {
		return nil, err
	}
	return &submission, nil
}

func (r *assignmentRepository) ListSubmissionsByAssignment(ctx context.Context, assignmentID uint) ([]models.Submission, error) {
	var submissions []models.Submission
	err := r.db.WithContext(ctx).Preload("Student").Where("assignment_id = ?", assignmentID).Order("submitted_at desc").Find(&submissions).Error
	return submissions, err
}

func (r *assignmentRepository) GradeOverdueAssignmentsToZero(ctx context.Context) error {
	query := `
		INSERT INTO submissions (tenant_id, assignment_id, student_id, file_url, submitted_at, score, feedback)
		SELECT a.tenant_id, a.id, e.student_id, '', NOW(), 0, 'Quá hạn nộp bài'
		FROM assignments a
		JOIN sections s ON a.section_id = s.id
		JOIN enrollments e ON s.course_id = e.course_id
		LEFT JOIN submissions sub ON sub.assignment_id = a.id AND sub.student_id = e.student_id
		WHERE a.due_date < NOW() AND sub.id IS NULL
	`
	return r.db.WithContext(ctx).Exec(query).Error
}
